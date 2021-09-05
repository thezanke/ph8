export const parseEnvStringList = (envString: string) => envString.split(/,|\r?\n/).map((s) => s.trim());
