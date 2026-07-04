const http = require("node:http");

function startHealthServer() {
  const port = Number(process.env.PORT || 3000);

  const server = http.createServer((request, response) => {
    if (request.url === "/health") {
      response.writeHead(200, { "Content-Type": "application/json" });
      response.end(JSON.stringify({ ok: true, service: "uniq-prism-bot" }));
      return;
    }

    response.writeHead(200, { "Content-Type": "text/plain" });
    response.end("UNIQ Prism bot is running.");
  });

  server.listen(port, () => {
    console.log(`Health server listening on port ${port}`);
  });

  return server;
}

module.exports = {
  startHealthServer
};
