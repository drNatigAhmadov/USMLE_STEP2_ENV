import { QuestionReview } from '../types';

export interface SM2Result {
  ease_factor: number;
  interval: number;
  repetitions: number;
  next_review: Date;
}

export function sm2Algorithm(review: QuestionReview, quality: number): SM2Result {
  let { ease_factor, interval, repetitions } = review;
  
  if (quality < 0 || quality > 5) {
    throw new Error('Quality must be between 0 and 5');
  }

  if (quality >= 3) {
    if (repetitions === 0) {
      interval = 1;
    } else if (repetitions === 1) {
      interval = 6;
    } else {
      interval = Math.round(interval * ease_factor);
    }
    repetitions += 1;
  } else {
    repetitions = 0;
    interval = 1;
  }

  ease_factor = ease_factor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
  if (ease_factor < 1.3) ease_factor = 1.3;

  const nextReview = new Date();
  nextReview.setDate(nextReview.getDate() + interval);

  return {
    ease_factor: Math.round(ease_factor * 100) / 100,
    interval,
    repetitions,
    next_review: nextReview
  };
}

export function getQualityFromUserResponse(isCorrect: boolean, confidence: 'low' | 'medium' | 'high'): number {
  if (!isCorrect) {
    return confidence === 'high' ? 1 : confidence === 'medium' ? 2 : 0;
  }
  return confidence === 'high' ? 5 : confidence === 'medium' ? 4 : 3;
}

export function getDueReviews(reviews: QuestionReview[]): QuestionReview[] {
  const now = new Date();
  return reviews.filter(r => new Date(r.next_review) <= now);
}

export function getReviewStats(reviews: QuestionReview[]) {
  const now = new Date();
  const due = reviews.filter(r => new Date(r.next_review) <= now).length;
  const learning = reviews.filter(r => r.repetitions < 2).length;
  const mature = reviews.filter(r => r.interval >= 21).length;
  
  return { due, learning, mature, total: reviews.length };
}