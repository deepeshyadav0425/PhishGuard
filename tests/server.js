'use strict';

const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const contentTypes = {
    '.html': 'text/html; charset=utf-8',
    '.js': 'application/javascript; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.json': 'application/json; charset=utf-8'
};

http.createServer((request, response) => {
    let pathname;
    try {
        pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
    } catch {
        response.writeHead(400).end('Bad request');
        return;
    }
    if (pathname === '/') pathname = '/index.html';

    const filePath = path.resolve(root, `.${pathname}`);
    const relativePath = path.relative(root, filePath);
    if (relativePath.startsWith('..') || path.isAbsolute(relativePath)) {
        response.writeHead(403).end('Forbidden');
        return;
    }

    fs.readFile(filePath, (error, contents) => {
        if (error) {
            response.writeHead(error.code === 'ENOENT' ? 404 : 500).end('Not found');
            return;
        }
        response.writeHead(200, {
            'Content-Type': contentTypes[path.extname(filePath).toLowerCase()] || 'application/octet-stream',
            'Cache-Control': 'no-store'
        });
        response.end(contents);
    });
}).listen(4173, '127.0.0.1');
