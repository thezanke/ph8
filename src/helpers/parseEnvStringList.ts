export const parseEnvStringList = (envString: string) => {
  const parsedList = envString.split(/,|\r?\n/).map((s) => s.trim());
  return parsedList;
};
