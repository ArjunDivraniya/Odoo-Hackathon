/**
 * CacheService
 * ---------------------------------------------------------------------------
 * Provides a unified caching layer used by Dashboard, Analytics, Reports,
 * Unread Notifications and System Settings.
 *
 * In production the service transparently upgrades to Redis when the
 * REDIS_URL (or REDIS_HOST/REDIS_PORT) environment variables are present.
 * When Redis is unavailable it degrades gracefully to an in-memory store so
 * the application remains fully functional in development / test environments.
 */

interface CacheEntry {
  value: any;
  expiresAt: number | null;
}

class InMemoryStore {
  private store = new Map<string, CacheEntry>();

  public async get(key: string): Promise<any | null> {
    const entry = this.store.get(key);
    if (!entry) return null;
    if (entry.expiresAt !== null && entry.expiresAt < Date.now()) {
      this.store.delete(key);
      return null;
    }
    return entry.value;
  }

  public async set(key: string, value: any, ttlSeconds: number): Promise<void> {
    this.store.set(key, {
      value,
      expiresAt: ttlSeconds > 0 ? Date.now() + ttlSeconds * 1000 : null,
    });
  }

  public async del(key: string): Promise<void> {
    this.store.delete(key);
  }

  public async delByPattern(pattern: string): Promise<void> {
    const regex = new RegExp(`^${pattern.replace(/\*/g, ".*")}$`);
    for (const k of Array.from(this.store.keys())) {
      if (regex.test(k)) this.store.delete(k);
    }
  }
}

class RedisStore {
  private client: any;
  private ready = false;

  constructor(client: any) {
    this.client = client;
    this.ready = true;
  }

  public async get(key: string): Promise<any | null> {
    const raw = await this.client.get(key);
    if (raw === null || raw === undefined) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return raw;
    }
  }

  public async set(key: string, value: any, ttlSeconds: number): Promise<void> {
    const raw = JSON.stringify(value);
    if (ttlSeconds > 0) {
      await this.client.set(key, raw, { EX: ttlSeconds });
    } else {
      await this.client.set(key, raw);
    }
  }

  public async del(key: string): Promise<void> {
    await this.client.del(key);
  }

  public async delByPattern(pattern: string): Promise<void> {
    const cursor = await this.client.scan(0, "MATCH", pattern, "COUNT", 100);
    const keys: string[] = cursor.keys || [];
    if (keys.length) await this.client.del(keys);
  }
}

export class CacheService {
  private static instance: CacheService;
  private store: InMemoryStore | RedisStore;
  private usingRedis = false;

  private constructor() {
    this.store = new InMemoryStore();
    this.initRedis().catch(() => {
      /* keep in-memory fallback */
    });
  }

  public static getInstance(): CacheService {
    if (!CacheService.instance) {
      CacheService.instance = new CacheService();
    }
    return CacheService.instance;
  }

  private async initRedis(): Promise<void> {
    const url = process.env.REDIS_URL;
    if (!url && !process.env.REDIS_HOST) return;
    try {
      // Dynamic import keeps the build green without a hard dependency on redis.
      const modName = "redis";
      const redisMod: any = await import(modName);
      const createClient = redisMod.createClient || redisMod.default?.createClient;
      const client = url ? createClient({ url }) : createClient({
        socket: { host: process.env.REDIS_HOST, port: parseInt(process.env.REDIS_PORT || "6379") },
      });
      client.on("error", () => {
        /* ignore – fallback already active */
      });
      await client.connect();
      this.store = new RedisStore(client);
      this.usingRedis = true;
    } catch {
      this.usingRedis = false;
    }
  }

  public isRedisEnabled(): boolean {
    return this.usingRedis;
  }

  public async get(key: string): Promise<any | null> {
    return this.store.get(key);
  }

  public async set(key: string, value: any, ttlSeconds = 300): Promise<void> {
    await this.store.set(key, value, ttlSeconds);
  }

  public async delete(key: string): Promise<void> {
    await this.store.del(key);
  }

  public async invalidatePattern(pattern: string): Promise<void> {
    await this.store.delByPattern(pattern);
  }
}

export const cache = CacheService.getInstance();
