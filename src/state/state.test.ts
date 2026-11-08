import { it, expect } from 'vitest';
import { defaultState } from './state';
it('matches the persistent v1 defaults', () => {
  expect(defaultState()).toEqual({matrix2:[['2','1'],['0','2']],matrix3:[['2','0','0'],['0','2','0'],['0','0','2']],motion:{x:2,y:1,angle:0,cx:0,cy:0,dx:0,dy:0,first:false},conic:{kind:'Elips',a:3,b:2,h:0,k:0,angle:0},functions:{expr2:'sin(x)',expr3:'(x^2-y^2)/4',lo:-5,hi:5}});
});
it('allocates independent nested defaults', () => {
  const a = defaultState(), b = defaultState(); a.matrix2[0][0] = '99'; a.motion.angle = 90; a.conic.a = 5; a.functions.lo = 0;
  expect(b).toEqual(defaultState());
});
