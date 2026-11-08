import { describe, expect, it } from 'vitest';
import { QUESTIONS } from '../content/questions';
import { answerStatus, checkAnswer, recordAnswer, resetAnswer, resetAnswers } from './quiz-state';

describe('quiz answer state', () => {
  const question = QUESTIONS[0]!;
  it('records an unchecked answer and checks it against the key', () => {
    const answers = recordAnswer({}, question.id, question.correct);
    expect(answerStatus(answers, question)).toBe('unanswered');
    expect(answerStatus(checkAnswer(answers, question), question)).toBe('correct');
  });
  it('marks wrong answers and returns to unanswered when changed', () => {
    const wrong = (question.correct + 1) % 4;
    const checked = checkAnswer(recordAnswer({}, question.id, wrong), question);
    expect(answerStatus(checked, question)).toBe('incorrect');
    expect(answerStatus(recordAnswer(checked, question.id, question.correct), question)).toBe('unanswered');
  });
  it('resets one answer or all answers', () => {
    const answers = recordAnswer(recordAnswer({}, 'q01', 0), 'q02', 1);
    expect(Object.keys(resetAnswer(answers, 'q01'))).toEqual(['q02']);
    expect(resetAnswers()).toEqual({});
  });
});
