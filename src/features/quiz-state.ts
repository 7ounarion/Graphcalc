import type { Question } from '../content/types';

export type QuizAnswerStatus = 'unanswered' | 'correct' | 'incorrect';
export interface QuizAnswer { choice: number; checked: boolean }
export type QuizAnswers = Record<string, QuizAnswer>;

export function recordAnswer(answers: QuizAnswers, questionId: string, choice: number): QuizAnswers {
  if (!Number.isInteger(choice) || choice < 0 || choice > 3) return answers;
  return { ...answers, [questionId]: { choice, checked: false } };
}

export function checkAnswer(answers: QuizAnswers, question: Question): QuizAnswers {
  const answer = answers[question.id];
  if (!answer) return answers;
  return { ...answers, [question.id]: { ...answer, checked: true } };
}

export function answerStatus(answers: QuizAnswers, question: Question): QuizAnswerStatus {
  const answer = answers[question.id];
  if (!answer?.checked) return 'unanswered';
  return answer.choice === question.correct ? 'correct' : 'incorrect';
}

export function resetAnswer(answers: QuizAnswers, questionId: string): QuizAnswers {
  const next = { ...answers };
  delete next[questionId];
  return next;
}

export function resetAnswers(): QuizAnswers { return {}; }
