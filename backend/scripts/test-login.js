const http = require("http");
const data = JSON.stringify({email:"test@assetflow.com",password:"TestPass123!"});
const req = http.request({method:"POST",hostname:"localhost",port:5000,path:"/api/v1/auth/login",headers:{"Content-Type":"application/json","Content-Length":Buffer.byteLength(data)}}, res => {
  let body="";
  res.on("data",c=>body+=c);
  res.on("end",()=>{
    console.log("Status:",res.statusCode);
    try { console.log("Body:",JSON.stringify(JSON.parse(body),null,2)); } catch(e) { console.log("Raw:",body.substring(0,1000)); }
  });
});
req.write(data);
req.end();
