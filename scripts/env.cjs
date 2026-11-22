const fs = require('node:fs');
const path = require('node:path');
const { root } = require('./project.cjs');

// Reads Supabase settings from process.env, else .env.local / .env at the repo root. Only public values are ever returned.
// shortcut: simple KEY=VALUE parser (no multiline or interpolation), upgrade if .env files get complex.
function parseEnv(text) {
  const out = {};
  for (const line of text.split(/\r?\n/)) {
    const m = line.match(/^\s*(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*?)\s*$/);
    if (m) out[m[1]] = m[2].replace(/^(["'])(.*)\1$/, '$2');
  }
  return out;
}

const pick = (env, names) => names.map(n => (env[n] || '').trim()).find(Boolean) || '';

// A secret in the browser bundle would be public: refuse it. Messages never contain the value.
function looksSecret(value) {
  if (/^sb_secret_/.test(value) || /service_role/i.test(value)) return true;
  try { return JSON.parse(Buffer.from(value.split('.')[1] || '', 'base64url').toString()).role === 'service_role'; } catch { return false; }
}

function isPublicKey(value) {
  if (/^sb_publishable_[A-Za-z0-9_-]+$/.test(value)) return true;
  if (!/^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(value)) return false;
  try { return JSON.parse(Buffer.from(value.split('.')[1], 'base64url').toString()).role === 'anon'; } catch { return false; }
}

// Precedence: real environment, then .env.local, then .env.
function loadEnv(env = process.env, dir = root) {
  const merged = {};
  const groups = [
    ['SUPABASE_URL', 'NEXT_PUBLIC_SUPABASE_URL'],
    ['SUPABASE_PUBLISHABLE_KEY', 'NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY', 'SUPABASE_ANON_KEY'],
  ];
  const overlay = layer => {
    Object.assign(merged, layer);
    for (const names of groups) { const value = pick(layer, names); if (value) merged[names[0]] = value; }
  };
  for (const name of ['.env', '.env.local']) {
    const file = path.join(dir, name);
    if (fs.existsSync(file)) overlay(parseEnv(fs.readFileSync(file, 'utf8')));
  }
  overlay(Object.fromEntries(Object.entries(env).filter(([, v]) => v)));
  return merged;
}

// Returns {supabaseUrl, supabaseKey} or {} when unset. Throws on a secret-looking value or a non-https URL.
function cloudConfig(env = loadEnv()) {
  const supabaseUrl = pick(env, ['SUPABASE_URL', 'NEXT_PUBLIC_SUPABASE_URL']);
  const supabaseKey = pick(env, ['SUPABASE_PUBLISHABLE_KEY', 'NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY', 'SUPABASE_ANON_KEY']);
  if (!supabaseUrl && !supabaseKey) return {};
  if (!supabaseUrl || !supabaseKey) throw new Error('Set both the Supabase URL and the publishable key, or neither.');
  if (looksSecret(supabaseKey) || looksSecret(supabaseUrl)) throw new Error('Refusing a secret-looking Supabase value: only the publishable key may reach the browser.');
  if (!isPublicKey(supabaseKey)) throw new Error('Only a Supabase publishable key or legacy anon JWT may reach the browser.');
  let url;
  try { url = new URL(supabaseUrl); } catch { throw new Error('The Supabase URL must be a valid https URL.'); }
  if (url.protocol !== 'https:') throw new Error('The Supabase URL must be https.');
  if (url.username || url.password) throw new Error('The Supabase URL must not contain credentials.');
  return { supabaseUrl: url.origin, supabaseKey };
}

const configJs = config => `window.ECHOLAC_CONFIG=${JSON.stringify(config)};\n`;

module.exports = { parseEnv, loadEnv, cloudConfig, configJs };
