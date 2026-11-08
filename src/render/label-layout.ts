export interface ScreenPoint { x: number; y: number }
export interface LabelAnchor extends ScreenPoint {
  width: number;
  height: number;
  direction: ScreenPoint;
}
export interface ScreenSegment { start: ScreenPoint; end: ScreenPoint }
interface Rect { left: number; top: number; right: number; bottom: number }

function overlaps(a: Rect, b: Rect): boolean {
  return a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;
}

/** Segment/rectangle clipping also handles arrows viewed almost end-on. */
function crosses(rect: Rect, segment: ScreenSegment): boolean {
  let enter = 0;
  let leave = 1;
  for (const [start, delta, low, high] of [
    [segment.start.x, segment.end.x - segment.start.x, rect.left, rect.right],
    [segment.start.y, segment.end.y - segment.start.y, rect.top, rect.bottom],
  ] as const) {
    if (Math.abs(delta) < 0.0001) {
      if (start < low || start > high) return false;
    } else {
      const first = (low - start) / delta;
      const last = (high - start) / delta;
      enter = Math.max(enter, Math.min(first, last));
      leave = Math.min(leave, Math.max(first, last));
      if (enter > leave) return false;
    }
  }
  return true;
}

/** Prefer the projected vector direction, then nearby collision-free positions.
 * Hide a label when a crowded or clipped viewport offers no readable position.
 */
export function layoutLabels(anchors: LabelAnchor[], arrows: ScreenSegment[], width: number, height: number): (ScreenPoint | null)[] {
  const occupied: Rect[] = [];
  return anchors.map(anchor => {
    if (anchor.x < 0 || anchor.x > width || anchor.y < 0 || anchor.y > height) return null;
    const angle = Math.atan2(anchor.direction.y, anchor.direction.x);
    for (const distance of [24, 40, 58, 80]) {
      for (const turn of [0, 1, -1, 2, -2, 3, -3, 4]) {
        const direction = angle + turn * Math.PI / 4;
        const x = anchor.x + Math.cos(direction) * distance;
        const y = anchor.y + Math.sin(direction) * distance;
        const rect = {
          left: x - anchor.width / 2 - 5, right: x + anchor.width / 2 + 5,
          top: y - anchor.height / 2 - 5, bottom: y + anchor.height / 2 + 5,
        };
        if (rect.left < 4 || rect.top < 4 || rect.right > width - 4 || rect.bottom > height - 4) continue;
        if (occupied.some(other => overlaps(rect, other)) || arrows.some(arrow => crosses(rect, arrow))) continue;
        occupied.push(rect);
        return { x, y };
      }
    }
    return null;
  });
}
