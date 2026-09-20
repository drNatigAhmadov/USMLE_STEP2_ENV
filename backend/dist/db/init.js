"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.db = void 0;
exports.initializeDatabase = initializeDatabase;
const path_1 = require("path");
const fs_1 = require("fs");
const isVercel = process.env.VERCEL === '1';
const dataDir = isVercel ? '/tmp/data' : (0, path_1.join)(process.cwd(), 'data');
if (!(0, fs_1.existsSync)(dataDir)) {
    (0, fs_1.mkdirSync)(dataDir, { recursive: true });
}
const dbFile = (0, path_1.join)(dataDir, 'usmle.json');
const seedFile = (0, path_1.join)(process.cwd(), 'backend', 'data', 'usmle.json');
if (!(0, fs_1.existsSync)(dbFile) && (0, fs_1.existsSync)(seedFile)) {
    (0, fs_1.copyFileSync)(seedFile, dbFile);
}
function readDb() {
    if (!(0, fs_1.existsSync)(dbFile)) {
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
        const content = (0, fs_1.readFileSync)(dbFile, 'utf-8');
        return JSON.parse(content);
    }
    catch {
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
function writeDb(db) {
    (0, fs_1.writeFileSync)(dbFile, JSON.stringify(db, null, 2));
}
function genId() {
    return crypto.randomUUID();
}
exports.db = {
    get: (table, id) => {
        const data = readDb();
        return data[table][id] || null;
    },
    getAll: (table) => {
        const data = readDb();
        return Object.values(data[table]);
    },
    find: (table, predicate) => {
        const data = readDb();
        return Object.values(data[table]).find(predicate);
    },
    findAll: (table, predicate) => {
        const data = readDb();
        return Object.values(data[table]).filter(predicate);
    },
    insert: (table, item) => {
        const data = readDb();
        const id = item.id || genId();
        data[table][id] = { ...item, id, created_at: item.created_at || new Date().toISOString() };
        writeDb(data);
        return data[table][id];
    },
    update: (table, id, updates) => {
        const data = readDb();
        if (data[table][id]) {
            data[table][id] = { ...data[table][id], ...updates };
            writeDb(data);
            return data[table][id];
        }
        return null;
    },
    delete: (table, id) => {
        const data = readDb();
        delete data[table][id];
        writeDb(data);
    },
    query: (table, options = {}) => {
        let results = exports.db.findAll(table, options.where || (() => true));
        if (options.orderBy)
            results.sort(options.orderBy);
        if (options.offset)
            results = results.slice(options.offset);
        if (options.limit)
            results = results.slice(0, options.limit);
        return results;
    },
    run: (sql, params = []) => {
        console.log('SQL not supported in JSON mode:', sql, params);
        return { changes: 0 };
    },
    exec: (sql) => {
        console.log('SQL exec not supported in JSON mode:', sql);
    },
};
function initializeDatabase() {
    const data = readDb();
    writeDb(data);
    console.log('JSON database initialized');
}
initializeDatabase();
//# sourceMappingURL=init.js.map