const fetch = require('node-fetch');
const addFormats = require('ajv-formats');
const Ajv = require('ajv');
const ajv = new Ajv({ allErrors: true });
addFormats(ajv);
const fs = require('fs');
const path = require('path');

const TOOL_URL = process.env.TOOL_MCP_URL || 'http://127.0.0.1:5001';
const TIMEOUT = Number(process.env.TOOL_TIMEOUT_MS || 5000);

function loadSchema(file) {
  return JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'schemas', file), 'utf8'));
}
const schemaFind = loadSchema('find-availability-response.json');
const schemaBookReq = loadSchema('book-request.json');
const schemaBookRes = loadSchema('book-response.json');
const validateFind = ajv.compile(schemaFind);
const validateBookReq = ajv.compile(schemaBookReq);
const validateBookRes = ajv.compile(schemaBookRes);

function timeoutPromise(ms, p) {
  return Promise.race([p, new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), ms))]);
}

async function health() {
  const res = await timeoutPromise(TIMEOUT, fetch(`${TOOL_URL}/health`));
  if (!res.ok) return null;
  return res.json();
}

async function findAvailability(payload = {}) {
  const res = await timeoutPromise(TIMEOUT, fetch(`${TOOL_URL}/v1/find-availability`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  }));
  if (!res.ok) throw new Error('findAvailability HTTP ' + res.status);
  const data = await res.json();
  if (!validateFind(data)) throw new Error('findAvailability response validation failed: ' + JSON.stringify(validateFind.errors));
  return data;
}

async function book(slot, lead = {}) {
  const req = { slot, lead };
  if (!validateBookReq(req)) throw new Error('book request validation failed: ' + JSON.stringify(validateBookReq.errors));
  const res = await timeoutPromise(TIMEOUT, fetch(`${TOOL_URL}/v1/book`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(req)
  }));
  if (!res.ok) throw new Error('book HTTP ' + res.status);
  const data = await res.json();

  const statusMap = {
    'ok': 'CONFIRMED',
    'success': 'CONFIRMED',
    'booked': 'CONFIRMED',
    'confirmed': 'CONFIRMED',
    'pending': 'PENDING',
    'failed': 'FAILED'
  };
  if (typeof data.status === 'string') {
    const mapped = statusMap[data.status.toLowerCase()];
    if (mapped) data.status = mapped;
  }

  if (!validateBookRes(data)) throw new Error('book response validation failed: ' + JSON.stringify(validateBookRes.errors));
  return data;
}

module.exports = { health, findAvailability, book };
