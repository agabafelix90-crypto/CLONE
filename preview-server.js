const http = require('http');
const fs = require('fs');
const path = require('path');

const host = process.env.HOST || '::';
const port = Number(process.env.PORT || 4173);
const root = path.resolve(__dirname, 'dist');

const mimeTypes = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.eot': 'application/vnd.ms-fontobject',
  '.map': 'application/octet-stream',
};

const sendFile = (filePath, res, status = 200) => {
  fs.readFile(filePath, (err, content) => {
    if (err) {
      res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Internal server error');
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = mimeTypes[ext] || 'application/octet-stream';
    res.writeHead(status, { 'Content-Type': contentType });
    res.end(content);
  });
};

const fallbackHtml = path.join(root, 'index.html');

const server = http.createServer((req, res) => {
  if (req.method !== 'GET') {
    res.writeHead(405, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Method not allowed');
    return;
  }

  const requestUrl = new URL(req.url, `http://${req.headers.host}`);
  let pathname = decodeURIComponent(requestUrl.pathname);
  const filePath = path.join(root, pathname);
  const relative = path.relative(root, filePath);

  if (relative.startsWith('..') || path.isAbsolute(relative)) {
    res.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Forbidden');
    return;
  }

  const serveOrFallback = (targetPath) => {
    fs.stat(targetPath, (err, stats) => {
      if (!err && stats.isFile()) {
        sendFile(targetPath, res);
      } else {
        sendFile(fallbackHtml, res);
      }
    });
  };

  fs.stat(filePath, (err, stats) => {
    if (!err && stats.isDirectory()) {
      serveOrFallback(path.join(filePath, 'index.html'));
      return;
    }
    serveOrFallback(filePath);
  });
});

server.listen(port, host, () => {
  console.log(`SPA preview server running at http://${host}:${port}`);
  console.log(`Serving built files from: ${root}`);
});
