/**
 * Enums shared between frontend and backend.
 * In a real-world monorepo, this might be in a shared package.
 */
export enum QuestionType {
  SingleChoice = 'radio',
  MultipleChoice = 'checkbox',
  TrueFalse = 'true_false',
  Ranking = 'ranking',
  Rating = 'rating',
  FillInTheBlank = 'fill_blank',
  ShortText = 'short_text',
  Matching = 'matching',
  Essay = 'essay',
}

export enum GenerationStatus {
  Pending = 'pending',
  Processing = 'processing',
  Completed = 'completed',
  Failed = 'failed',
}

export enum Difficulty {
  Easy = 'Easy',
  Medium = 'Medium',
  Hard = 'Hard',
}
