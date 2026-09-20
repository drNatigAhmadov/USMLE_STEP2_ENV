import { QuestionReview } from '../types';
export interface SM2Result {
    ease_factor: number;
    interval: number;
    repetitions: number;
    next_review: Date;
}
export declare function sm2Algorithm(review: QuestionReview, quality: number): SM2Result;
export declare function getQualityFromUserResponse(isCorrect: boolean, confidence: 'low' | 'medium' | 'high'): number;
export declare function getDueReviews(reviews: QuestionReview[]): QuestionReview[];
export declare function getReviewStats(reviews: QuestionReview[]): {
    due: number;
    learning: number;
    mature: number;
    total: number;
};
//# sourceMappingURL=spaced-repetition.d.ts.map