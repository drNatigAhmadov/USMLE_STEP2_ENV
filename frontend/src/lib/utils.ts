import { formatDistanceToNow, format } from 'date-fns';

export function formatDate(dateString: string): string {
  return format(new Date(dateString), 'MMM d, yyyy');
}

export function formatDateTime(dateString: string): string {
  return format(new Date(dateString), 'MMM d, yyyy h:mm a');
}

export function formatRelativeTime(dateString: string): string {
  return formatDistanceToNow(new Date(dateString), { addSuffix: true });
}

export function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  if (mins > 0) {
    return `${mins}m ${secs}s`;
  }
  return `${secs}s`;
}

export function getDifficultyColor(difficulty: number): string {
  if (difficulty < 0.3) return 'bg-green-100 text-green-800';
  if (difficulty < 0.6) return 'bg-yellow-100 text-yellow-800';
  return 'bg-red-100 text-red-800';
}

export function getDifficultyLabel(difficulty: number): string {
  if (difficulty < 0.3) return 'Easy';
  if (difficulty < 0.6) return 'Medium';
  return 'Hard';
}

export function getScoreColor(score: number): string {
  if (score >= 80) return 'text-green-600';
  if (score >= 60) return 'text-yellow-600';
  return 'text-red-600';
}

export function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export function generateId(): string {
  return crypto.randomUUID();
}

export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout> | null = null;
  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}