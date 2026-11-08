import { parseNumber } from '../core/number';

let sequence = 0;
export interface NumberFieldOptions {
  label: string; value: string | number; range?: [number, number]; step?: number;
  apply: (value: number, text: string) => void;
}
export class NumberField {
  readonly element = document.createElement('div');
  readonly input = document.createElement('input');
  readonly error = document.createElement('small');
  readonly slider?: HTMLInputElement;
  private value: number;
  private options: NumberFieldOptions;
  constructor(options: NumberFieldOptions) {
    this.options = options;
    const id = `number-${++sequence}`;
    this.element.className = 'number-field';
    const label = document.createElement('label'); label.htmlFor = id; label.textContent = options.label;
    this.input.id = id; this.input.type = 'text'; this.input.inputMode = 'decimal'; this.input.autocomplete = 'off';
    this.error.id = `${id}-error`; this.error.className = 'field-error'; this.error.setAttribute('aria-live','polite');
    this.input.setAttribute('aria-describedby',this.error.id);
    this.value = Number(options.value); this.input.value = String(options.value);
    const row = document.createElement('div'); row.className = 'number-row'; row.append(this.input);
    if (options.range) {
      const slider = this.slider = document.createElement('input'); slider.type = 'range';
      slider.min = String(options.range[0]); slider.max = String(options.range[1]); slider.step = String(options.step ?? 0.01);
      slider.setAttribute('aria-label',`${options.label} — kaydırıcı`); row.append(slider);
      slider.addEventListener('input',() => this.commit(slider.value));
    }
    this.element.append(label,row,this.error); this.set(options.value);
    this.input.addEventListener('blur',() => this.commit());
    this.input.addEventListener('keydown',e => { if (e.key === 'Enter') { e.preventDefault(); this.commit(); } });
  }
  commit(text = this.input.value): boolean {
    const parsed = parseNumber(text);
    try {
      if (!parsed.ok) throw new Error(parsed.error);
      if (parsed.value !== this.value || text !== this.input.value) this.options.apply(parsed.value,text);
      this.set(text); return true;
    } catch (e) {
      this.error.textContent = e instanceof Error ? e.message : 'Geçerli bir sayı girin.';
      this.input.setAttribute('aria-invalid','true'); return false;
    }
  }
  set(value: string | number): void {
    const parsed = parseNumber(String(value)); if (!parsed.ok) return;
    this.value = parsed.value; this.input.value = String(value); this.error.textContent = ''; this.input.removeAttribute('aria-invalid');
    if (this.slider) {
      this.slider.min = String(Math.min(Number(this.slider.min),this.value));
      this.slider.max = String(Math.max(Number(this.slider.max),this.value)); this.slider.value = String(this.value);
    }
  }
  sync(value: string | number): void {
    const parsed = parseNumber(String(value));
    if (parsed.ok && parsed.value !== this.value) this.set(value);
  }
}
