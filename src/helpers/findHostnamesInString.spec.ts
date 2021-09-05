import { findHostnamesInString } from './findHostnamesInString';

describe('findHostnamesInString', () => {
  it('Returns correct domain names', () => {
    expect(
      findHostnamesInString(
        `https://www.example.com is cool but https://bad-website.co.uk is dangerous.
        Look at this picture https://bad-website.co.uk/images/bad-image.jpg`,
      ),
    ).toEqual(['www.example.com', 'bad-website.co.uk', 'bad-image.jpg']);
  });
});
