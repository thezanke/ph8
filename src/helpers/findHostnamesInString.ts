const DOMAIN_NAME_MATCHER = /((?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+(?:co\.)?[a-z0-9][a-z0-9-]{0,61}[a-z0-9])/gi;

export const findHostnamesInString = (input: string) => {
  return Array.from(new Set(input.match(DOMAIN_NAME_MATCHER)));
};
