'use strict';

const fs = require('node:fs/promises');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const output = path.join(root, '_site');

async function build() {
    await fs.rm(output, { recursive: true, force: true });
    await fs.mkdir(path.join(output, 'vendor'), { recursive: true });
    const files = [
        'index.html',
        'PhishGuard_API_Free.html',
        'service-worker.js',
        'vendor/tailwind.cdn.js',
        'vendor/jsQR.min.js'
    ];
    for (const file of files) {
        await fs.copyFile(path.join(root, file), path.join(output, file));
    }
    console.log(`Static site built in ${output}`);
}

build().catch(error => {
    console.error('Static site build failed:', error);
    process.exitCode = 1;
});
