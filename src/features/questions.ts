import { QUESTIONS } from '../content/questions';
import type { Feature } from '../ui/types';
import { answerStatus, checkAnswer, recordAnswer, resetAnswer, resetAnswers, type QuizAnswers } from './quiz-state';

let sessionAnswers: QuizAnswers = {};
function currentIndex(): number {
  const id = location.hash.split('/')[2];
  const found = QUESTIONS.findIndex(question => question.id === id);
  return found >= 0 ? found : 0;
}
const labels = ['Yanıtsız', 'Doğru', 'Yanlış'] as const;

export const questions: Feature = { id: 'questions', title: 'Sorular', group: 'Öğren', mount(host) {
  host.innerHTML = '<header class="page-heading"><div class="eyebrow">GEOMETRİ LABORATUVARI</div><h1>Sorular</h1><p>Yanıtlar bu oturum boyunca korunur.</p></header><div class="quiz-layout"><nav class="quiz-list" aria-label="Sorular"></nav><section class="quiz-content" aria-live="polite"></section></div>';
  const list = host.querySelector<HTMLElement>('.quiz-list')!, content = host.querySelector<HTMLElement>('.quiz-content')!;
  const links = QUESTIONS.map(question => {
    const link = document.createElement('a'); link.href = `#/questions/${question.id}`;
    const title = document.createElement('span'); title.textContent = question.title;
    const badge = document.createElement('span'); badge.className = 'quiz-badge'; badge.dataset.status = 'unanswered';
    link.append(title, badge); list.append(link); return { question, link, badge };
  });
  function render() {
    const index = currentIndex(), question = QUESTIONS[index]!;
    links.forEach(({ question: item, link, badge }) => {
      const status = answerStatus(sessionAnswers, item); badge.textContent = labels[status === 'unanswered' ? 0 : status === 'correct' ? 1 : 2]; badge.dataset.status = status;
      if (item.id === question.id) link.setAttribute('aria-current', 'page'); else link.removeAttribute('aria-current');
    });
    content.replaceChildren();
    const heading = document.createElement('h2'); heading.textContent = question.title;
    const topic = document.createElement('p'); topic.className = 'quiz-topic'; topic.textContent = question.topic;
    const prompt = document.createElement('p'); prompt.className = 'quiz-prompt'; prompt.textContent = question.prompt;
    const form = document.createElement('fieldset'); form.className = 'quiz-options';
    const legend = document.createElement('legend'); legend.textContent = 'Bir seçenek işaretleyin'; form.append(legend);
    const saved = sessionAnswers[question.id];
    const radios: HTMLInputElement[] = [];
    question.options.forEach((option, i) => {
      const label = document.createElement('label'); label.className = 'quiz-option';
      const radio = document.createElement('input'); radio.type = 'radio'; radio.name = 'quiz-answer'; radio.value = String(i); radio.checked = saved?.choice === i;
      radio.addEventListener('change', () => {
        sessionAnswers = recordAnswer(sessionAnswers, question.id, i);
        feedback.replaceChildren(); feedback.textContent = 'Seçiminiz kaydedildi. Kontrol etmek için düğmeyi kullanın.';
        solution.replaceChildren(); feedback.dataset.status = 'unanswered';
        const badge = links[index]!.badge; badge.textContent = 'Yanıtsız'; badge.dataset.status = 'unanswered';
      });
      radios.push(radio); label.append(radio, document.createTextNode(`${'ABCD'[i]}) ${option}`)); form.append(label);
    });
    const feedback = document.createElement('p'); feedback.className = 'quiz-feedback'; feedback.setAttribute('role', 'status');
    const solution = document.createElement('ol'); solution.className = 'quiz-solution'; solution.setAttribute('aria-label', 'Dört adımlı çözüm');
    if (saved?.checked) {
      const correct = saved.choice === question.correct;
      feedback.dataset.status = correct ? 'correct' : 'incorrect';
      feedback.textContent = correct ? 'Doğru yanıt. Çözüm adımlarını inceleyin.' : `Yanıtınız doğru değil. Doğru seçenek: ${'ABCD'[question.correct]}.`;
      question.steps.forEach(step => { const li = document.createElement('li'); li.textContent = step; solution.append(li); });
    }
    const actions = document.createElement('div'); actions.className = 'quiz-actions';
    const check = document.createElement('button'); check.type = 'button'; check.textContent = 'Yanıtı kontrol et';
    check.addEventListener('click', () => {
      if (!sessionAnswers[question.id]) { feedback.dataset.status = 'unanswered'; feedback.textContent = 'Önce A, B, C veya D seçeneklerinden birini seçin.'; radios[0]?.focus(); return; }
      sessionAnswers = checkAnswer(sessionAnswers, question); render();
    });
    check.addEventListener('keydown', event => { if (event.key === 'Enter') { event.preventDefault(); check.click(); } });
    form.addEventListener('keydown', event => { if (event.key === 'Enter') { event.preventDefault(); check.click(); } });
    const reset = document.createElement('button'); reset.type = 'button'; reset.textContent = 'Bu soruyu sıfırla'; reset.addEventListener('click', () => { sessionAnswers = resetAnswer(sessionAnswers, question.id); render(); });
    actions.append(check, reset);
    const sources = document.createElement('section'); sources.className = 'quiz-sources';
    const sourceTitle = document.createElement('h3'); sourceTitle.textContent = 'Kaynaklar'; sources.append(sourceTitle);
    for (const source of question.sources) {
      const anchor = document.createElement('a'); anchor.href = source.url; anchor.target = '_blank'; anchor.rel = 'noopener'; anchor.textContent = source.title; sources.append(anchor);
    }
    const resetAll = document.createElement('button'); resetAll.type = 'button'; resetAll.className = 'quiz-reset-all'; resetAll.textContent = 'Tüm yanıtları sıfırla'; resetAll.addEventListener('click', () => { sessionAnswers = resetAnswers(); render(); });
    content.append(heading, topic, prompt, form, actions, feedback, solution, sources, resetAll);
  }
  const onHashChange = () => render(); window.addEventListener('hashchange', onHashChange); render();
  return () => window.removeEventListener('hashchange', onHashChange);
}};
