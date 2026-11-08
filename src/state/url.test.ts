import { it, expect } from 'vitest';
import { defaultState } from './state';
import { encodeState, decodeState } from './url';
it('round trips Unicode state as uncompressed base64url JSON', () => {
  const s = defaultState(); s.conic.kind = 'Çember'; s.matrix2[0][0] = '−1/3';
  const hash = encodeState(s); expect(hash).toMatch(/^#s=[A-Za-z0-9_-]+$/);
  expect(decodeState(hash)).toEqual({ok:true,state:s});
  expect(decodeState(encodeState(defaultState()))).toEqual({ok:true,state:defaultState()});
});
it.each(['','#s=','#s=!!!','#s=a','#s=_w','#other=abc','#s=e30','#s=bnVsbA'])('rejects malformed or invalid shared state %s', hash => expect(decodeState(hash).ok).toBe(false));
