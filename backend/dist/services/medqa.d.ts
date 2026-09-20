import { MedQAQuestion } from '../types';
export declare function fetchMedQAQuestions(limit?: number, offset?: number): Promise<MedQAQuestion[]>;
export declare function fetchMedQAByCategory(category: string, limit?: number): Promise<MedQAQuestion[]>;
export declare function categorizeQuestion(question: MedQAQuestion): {
    theme: string;
    subtheme?: string;
};
export declare function calculateDifficulty(question: MedQAQuestion): number;
//# sourceMappingURL=medqa.d.ts.map