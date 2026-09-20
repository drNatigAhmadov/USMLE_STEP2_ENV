import { join } from 'path';
import { existsSync, mkdirSync, readFileSync, writeFileSync, copyFileSync } from 'fs';

const isVercel = process.env.VERCEL === '1';
const dataDir = isVercel ? '/tmp/data' : join(process.cwd(), 'data');
if (!existsSync(dataDir)) {
  mkdirSync(dataDir, { recursive: true });
}

const dbFile = join(dataDir, 'usmle.json');
const seedFile = join(process.cwd(), 'backend', 'data', 'usmle.json');

if (!existsSync(dbFile) && existsSync(seedFile)) {
  copyFileSync(seedFile, dbFile);
}

interface DatabaseSchema {
  users: Record<string, any>;
  questions: Record<string, any>;
  question_reviews: Record<string, any>;
  user_progress: Record<string, any>;
  practice_exams: Record<string, any>;
  practice_exam_questions: Record<string, any>;
}

function readDb(): DatabaseSchema {
  if (!existsSync(dbFile)) {
    return {
      users: {},
      questions: {},
      question_reviews: {},
      user_progress: {},
      practice_exams: {},
      practice_exam_questions: {},
    };
  }
  try {
    const content = readFileSync(dbFile, 'utf-8');
    return JSON.parse(content);
  } catch {
    return {
      users: {},
      questions: {},
      question_reviews: {},
      user_progress: {},
      practice_exams: {},
      practice_exam_questions: {},
    };
  }
}

function writeDb(db: DatabaseSchema): void {
  writeFileSync(dbFile, JSON.stringify(db, null, 2));
}

function genId(): string {
  return crypto.randomUUID();
}

export const db = {
  get: (table: keyof DatabaseSchema, id: string) => {
    const data = readDb();
    return data[table][id] || null;
  },

  getAll: (table: keyof DatabaseSchema) => {
    const data = readDb();
    return Object.values(data[table]);
  },

  find: (table: keyof DatabaseSchema, predicate: (item: any) => boolean) => {
    const data = readDb();
    return Object.values(data[table]).find(predicate);
  },

  findAll: (table: keyof DatabaseSchema, predicate: (item: any) => boolean) => {
    const data = readDb();
    return Object.values(data[table]).filter(predicate);
  },

  insert: (table: keyof DatabaseSchema, item: any) => {
    const data = readDb();
    const id = item.id || genId();
    data[table][id] = { ...item, id, created_at: item.created_at || new Date().toISOString() };
    writeDb(data);
    return data[table][id];
  },

  update: (table: keyof DatabaseSchema, id: string, updates: any) => {
    const data = readDb();
    if (data[table][id]) {
      data[table][id] = { ...data[table][id], ...updates };
      writeDb(data);
      return data[table][id];
    }
    return null;
  },

  delete: (table: keyof DatabaseSchema, id: string) => {
    const data = readDb();
    delete data[table][id];
    writeDb(data);
  },

  query: (table: keyof DatabaseSchema, options: { where?: (item: any) => boolean; limit?: number; offset?: number; orderBy?: (a: any, b: any) => number } = {}) => {
    let results = db.findAll(table, options.where || (() => true));
    if (options.orderBy) results.sort(options.orderBy);
    if (options.offset) results = results.slice(options.offset);
    if (options.limit) results = results.slice(0, options.limit);
    return results;
  },

  run: (sql: string, params: any[] = []) => {
    console.log('SQL not supported in JSON mode:', sql, params);
    return { changes: 0 };
  },

  exec: (sql: string) => {
    console.log('SQL exec not supported in JSON mode:', sql);
  },
};

export function initializeDatabase() {
  const data = readDb();
  writeDb(data);
  console.log('JSON database initialized');
}

initializeDatabase();