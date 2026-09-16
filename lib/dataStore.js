const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'data');

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function filePath(name) {
  return path.join(DATA_DIR, name.endsWith('.json') ? name : `${name}.json`);
}

function readJson(name, fallback) {
  ensureDataDir();
  const file = filePath(name);
  try {
    if (!fs.existsSync(file)) {
      if (fallback !== undefined) {
        writeJson(name, fallback);
        return structuredClone(fallback);
      }
      return null;
    }
    const raw = fs.readFileSync(file, 'utf8');
    return JSON.parse(raw);
  } catch (err) {
    console.error(`Failed to read ${file}:`, err.message);
    return fallback !== undefined ? structuredClone(fallback) : null;
  }
}

function writeJson(name, data) {
  ensureDataDir();
  const file = filePath(name);
  const tmp = `${file}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(data, null, 2), 'utf8');
  fs.renameSync(tmp, file);
  return data;
}

module.exports = {
  DATA_DIR,
  readJson,
  writeJson,
  ensureDataDir
};
