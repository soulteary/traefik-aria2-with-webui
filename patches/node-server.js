const { createServer } = require("http");
const url = require("url");
const { join, extname } = require("path");
const { exists, statSync, readFile } = require("fs");

const port = parseInt(process.argv[2], 10) || 8888;
const baseDir = join(process.cwd(), "docs");

const httpProxy = require('http-proxy');

const { WEB_PROXY, WS_PROXY } = process.env;
const webProxy = httpProxy.createProxyServer({ target: WEB_PROXY });
const wsProxy = httpProxy.createServer({ target: WS_PROXY, ws: true });

createServer(function (request, response) {
    const uri = url.parse(request.url).pathname;
    let filename = join(baseDir, uri);

    let contentType = "text/html";
    switch (extname(filename)) {
        case ".js":
            contentType = "text/javascript";
            break;
        case ".css":
            contentType = "text/css";
            break;
        case ".ico":
            contentType = "image/x-icon";
            break;
        case ".svg":
            contentType = "image/svg+xml";
            break;
    }

    if (filename.endsWith("jsonrpc")) {
        webProxy.web(request, response);
        return;
    }

    exists(filename, function (exists) {
        if (!exists) {
            response.writeHead(404, { "Content-Type": "text/plain" });
            response.write("404 Not Found\n");
            response.end();
            return;
        }

        if (statSync(filename).isDirectory()) filename += "/index.html";

        readFile(filename, "binary", function (err, file) {
            if (err) {
                response.writeHead(500, { "Content-Type": "text/plain" });
                response.write(`${err}\n`);
                response.end();
                return;
            }
            response.writeHead(200, { "Content-Type": contentType });
            response.write(file, "binary");
            response.end();
        });
    });
}).on('upgrade', function (req, socket, head) {
    wsProxy.ws(req, socket, head);
}).listen(port);

console.log(`WebUI Aria2 Server is running on http://localhost:${port}`);
