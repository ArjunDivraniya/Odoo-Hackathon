/**
 * ExportUtil
 * ---------------------------------------------------------------------------
 * Generates downloadable exports (CSV / EXCEL / PDF / JSON) for reports,
 * activity logs and other list endpoints.
 *
 * CSV is generated natively (zero dependencies). EXCEL and PDF are produced
 * with optional libraries (exceljs, pdfkit) loaded via dynamic import; when
 * those libraries are not installed the utility transparently falls back to a
 * CSV payload so the export endpoint never breaks.
 */

export type ExportType = "CSV" | "EXCEL" | "PDF" | "JSON";

export interface ExportColumn {
  key: string;
  header: string;
  /** optional formatter applied to the raw value */
  format?: (value: any) => string;
}

export interface ExportResult {
  content: Buffer | string;
  contentType: string;
  extension: string;
}

function escapeCsv(value: any): string {
  if (value === null || value === undefined) return "";
  const str = String(value);
  if (str.includes('"') || str.includes(",") || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function toCSV(rows: any[], columns: ExportColumn[]): string {
  const header = columns.map((c) => escapeCsv(c.header)).join(",");
  const body = rows
    .map((row) =>
      columns
        .map((c) => escapeCsv(c.format ? c.format(row[c.key]) : row[c.key]))
        .join(",")
    )
    .join("\n");
  return `${header}\n${body}`;
}

async function toExcel(rows: any[], columns: ExportColumn[], title: string): Promise<Buffer> {
  const modName = "exceljs";
  const exceljs: any = await import(modName);
  const ExcelJS = exceljs.default || exceljs;
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet(title || "Export");
  worksheet.columns = columns.map((c) => ({
    header: c.header,
    key: c.key,
    width: 20,
  }));
  for (const row of rows) {
    const mapped: any = {};
    for (const c of columns) {
      mapped[c.key] = c.format ? c.format(row[c.key]) : row[c.key];
    }
    worksheet.addRow(mapped);
  }
  return (await workbook.xlsx.writeBuffer()) as Buffer;
}

async function toPDF(rows: any[], columns: ExportColumn[], title: string): Promise<Buffer> {
  const modName = "pdfkit";
  const PDFDocumentMod: any = await import(modName);
  const PDFDocument = PDFDocumentMod.default || PDFDocumentMod;
  const doc = new PDFDocument({ margin: 30, size: "A4" });
  const chunks: Buffer[] = [];
  doc.on("data", (chunk: Buffer) => chunks.push(chunk));

  return new Promise<Buffer>((resolve, reject) => {
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    doc.fontSize(16).text(title || "Export", { underline: true });
    doc.moveDown();

    const colWidth = (doc.page.width - 60) / columns.length;
    doc.fontSize(9);
    let y = doc.y;
    columns.forEach((c, i) => {
      doc.text(c.header, 30 + i * colWidth, y, { width: colWidth, continued: false });
    });
    doc.moveDown();

    for (const row of rows) {
      y = doc.y;
      columns.forEach((c, i) => {
        const val = c.format ? c.format(row[c.key]) : row[c.key];
        doc.text(val === null || val === undefined ? "" : String(val), 30 + i * colWidth, y, {
          width: colWidth,
          continued: false,
        });
      });
      doc.moveDown();
    }

    doc.end();
  });
}

export class ExportUtil {
  public static async generate(
    rows: any[],
    columns: ExportColumn[],
    type: ExportType,
    title = "Export"
  ): Promise<ExportResult> {
    switch (type) {
      case "JSON":
        return {
          content: JSON.stringify(rows, null, 2),
          contentType: "application/json",
          extension: "json",
        };
      case "CSV":
        return {
          content: toCSV(rows, columns),
          contentType: "text/csv",
          extension: "csv",
        };
      case "EXCEL":
        try {
          return {
            content: await toExcel(rows, columns, title),
            contentType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            extension: "xlsx",
          };
        } catch {
          return {
            content: toCSV(rows, columns),
            contentType: "text/csv",
            extension: "csv",
          };
        }
      case "PDF":
        try {
          return {
            content: await toPDF(rows, columns, title),
            contentType: "application/pdf",
            extension: "pdf",
          };
        } catch {
          return {
            content: toCSV(rows, columns),
            contentType: "text/csv",
            extension: "csv",
          };
        }
      default:
        return {
          content: toCSV(rows, columns),
          contentType: "text/csv",
          extension: "csv",
        };
    }
  }

  public static parseType(value?: string): ExportType {
    const v = (value || "CSV").toUpperCase();
    if (["CSV", "EXCEL", "PDF", "JSON"].includes(v)) return v as ExportType;
    return "CSV";
  }
}
