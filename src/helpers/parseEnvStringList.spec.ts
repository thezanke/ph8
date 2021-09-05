import { parseEnvStringList } from './parseEnvStringList';

describe('parseEnvStringList', () => {
  it('Returns the expected arrays', () => {
    expect(parseEnvStringList('abc,123')).toEqual(['abc', '123']);
    expect(parseEnvStringList(`abc\n123`)).toEqual(['abc', '123']);
    expect(parseEnvStringList(`abc\r\n123`)).toEqual(['abc', '123']);
  });
});
