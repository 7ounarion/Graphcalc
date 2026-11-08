import katex from 'katex';
export function formula(host: HTMLElement, latex: string, displayMode = true): void {
  katex.render(latex,host,{displayMode,throwOnError:false,strict:'ignore',trust:false,output:'htmlAndMathml'});
}
