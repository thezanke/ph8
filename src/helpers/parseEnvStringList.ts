export const parseEnvStringList = (envString: string) => {
  return envString.split(/,|\r?\n/).map((s) => s.trim());
};
