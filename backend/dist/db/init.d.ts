interface DatabaseSchema {
    users: Record<string, any>;
    questions: Record<string, any>;
    question_reviews: Record<string, any>;
    user_progress: Record<string, any>;
    practice_exams: Record<string, any>;
    practice_exam_questions: Record<string, any>;
}
export declare const db: {
    get: (table: keyof DatabaseSchema, id: string) => any;
    getAll: (table: keyof DatabaseSchema) => any[];
    find: (table: keyof DatabaseSchema, predicate: (item: any) => boolean) => any;
    findAll: (table: keyof DatabaseSchema, predicate: (item: any) => boolean) => any[];
    insert: (table: keyof DatabaseSchema, item: any) => any;
    update: (table: keyof DatabaseSchema, id: string, updates: any) => any;
    delete: (table: keyof DatabaseSchema, id: string) => void;
    query: (table: keyof DatabaseSchema, options?: {
        where?: (item: any) => boolean;
        limit?: number;
        offset?: number;
        orderBy?: (a: any, b: any) => number;
    }) => any[];
    run: (sql: string, params?: any[]) => {
        changes: number;
    };
    exec: (sql: string) => void;
};
export declare function initializeDatabase(): void;
export {};
//# sourceMappingURL=init.d.ts.map