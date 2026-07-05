import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { randomUUID } from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const STORE_FILE = path.join(__dirname, '..', 'data', 'local-store.json');

const createEmptyStore = () => ({
  classes: [],
  attendance: [],
  audits: []
});

const ensureStore = async () => {
  try {
    await fs.access(STORE_FILE);
  } catch {
    await fs.mkdir(path.dirname(STORE_FILE), { recursive: true });
    await fs.writeFile(STORE_FILE, JSON.stringify(createEmptyStore(), null, 2), 'utf8');
  }
};

export const readStore = async () => {
  await ensureStore();
  const raw = await fs.readFile(STORE_FILE, 'utf8');
  try {
    const parsed = JSON.parse(raw);
    return {
      classes: Array.isArray(parsed.classes) ? parsed.classes : [],
      attendance: Array.isArray(parsed.attendance) ? parsed.attendance : [],
      audits: Array.isArray(parsed.audits) ? parsed.audits : []
    };
  } catch {
    const fallback = createEmptyStore();
    await fs.writeFile(STORE_FILE, JSON.stringify(fallback, null, 2), 'utf8');
    return fallback;
  }
};

export const writeStore = async (store) => {
  await fs.mkdir(path.dirname(STORE_FILE), { recursive: true });
  await fs.writeFile(STORE_FILE, JSON.stringify(store, null, 2), 'utf8');
  return store;
};

export const generateId = () => randomUUID();

export const normalizeStudentList = (students = []) => students
  .map((student) => {
    if (typeof student === 'string') {
      return { name: student.trim(), email: '', rollNumber: '' };
    }

    return {
      name: String(student?.name || '').trim(),
      email: String(student?.email || '').trim().toLowerCase(),
      rollNumber: String(student?.rollNumber || student?.regNo || '').trim()
    };
  })
  .filter((student) => student.name);

export const appendAudit = async (entry) => {
  const store = await readStore();
  store.audits.unshift({
    ...entry,
    _id: generateId(),
    createdAt: entry.createdAt || new Date().toISOString()
  });
  store.audits = store.audits.slice(0, 500);
  await writeStore(store);
  return store.audits[0];
};
