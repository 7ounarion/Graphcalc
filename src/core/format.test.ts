import { it, expect } from 'vitest';
import { formatNumber } from './index';
it.each([
  [0,'0'],[-0,'0'],[0.1*0.1,'0.01'],[0.3*0.3,'0.09'],[1.234567,'1.2346'],
  [-1.234567,'-1.2346'],[1.2,'1.2'],[100,'100'],[1e-7,'0.0000001'],
  [1.234567e21,'1234600000000000000000'],[9.99999,'10'],[0.0000999999,'0.0001'],
])('formats %s with five significant digits and no exponent', (value, expected) => {
  expect(formatNumber(value as number)).toBe(expected);
});
