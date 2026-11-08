export interface Source { title: string; url: string }
export interface Question { id: string; title: string; topic: string; prompt: string;
  options: [string, string, string, string]; correct: 0 | 1 | 2 | 3;
  steps: [string, string, string, string]; sources: Source[] }
export interface LessonBlock { kind: 'text' | 'formula' | 'example' | 'pitfall'; text: string }
export interface Lesson { id: string; title: string; blocks: LessonBlock[] }
