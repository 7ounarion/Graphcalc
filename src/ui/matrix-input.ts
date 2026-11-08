import { NumberField } from './number-field';
export class MatrixInput {
  readonly element = document.createElement('div');
  private fields: NumberField[][];
  constructor(values: string[][], apply: (row: number, col: number, text: string) => void) {
    this.element.className = 'matrix-input'; this.element.style.gridTemplateColumns = `repeat(${values.length}, minmax(0,1fr))`;
    this.fields = values.map((row,i) => row.map((value,j) => {
      const field = new NumberField({label:`a${i+1}${j+1}`,value,apply:(_,text) => apply(i,j,text)});
      this.element.append(field.element); return field;
    }));
    const errors = document.createElement('div'); errors.className = 'matrix-errors';
    this.fields.forEach((row, i) => row.forEach((field, j) => {
      field.error.dataset.cell = `a${i + 1}${j + 1}`;
      errors.append(field.error);
    }));
    this.element.append(errors);
  }
  sync(values: string[][]): void { this.fields.forEach((row,i) => row.forEach((field,j) => { const value = values[i]?.[j]; if (value !== undefined) field.sync(value); })); }
}
