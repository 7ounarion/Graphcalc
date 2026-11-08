import type { AppContext } from '../ui/types';
import { MatrixInput } from '../ui/matrix-input';

export function mountDet3DPanel(host: HTMLElement, ctx: AppContext): () => void {
  const input = new MatrixInput(ctx.state.matrix3, (row, col, text) => {
    ctx.update(draft => { draft.matrix3[row]![col] = text; });
  });
  input.element.querySelectorAll('input').forEach((field, index) => {
    field.setAttribute('aria-label', `Satır ${Math.floor(index / 3) + 1}, sütun ${index % 3 + 1}`);
  });
  host.append(input.element);
  const unsubscribe = ctx.subscribe(state => input.sync(state.matrix3));
  return () => { unsubscribe(); input.element.remove(); };
}
