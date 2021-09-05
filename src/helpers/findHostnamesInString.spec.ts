import { findHostnamesInString } from './findHostnamesInString';

describe('findHostnamesInString', () => {
  it('Returns correct domain names', () => {
    expect(
      findHostnamesInString(
        `https://www.example.com is cool but https://bad-website.com is dangerous.
        Look at this picture https://bad-website.com/images/bad-image.jpg`,
      ),
    ).toEqual(['www.example.com', 'bad-website.com', 'bad-image.jpg']);
  });
});
