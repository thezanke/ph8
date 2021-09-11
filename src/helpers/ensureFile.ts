import { checkIfFileExists } from './checkIfFileExists';
import { writeFile } from './writeFile';

export const ensureFile = async (filePath): Promise<void> => {
  const fileExists = await checkIfFileExists(filePath);
  if (!fileExists) await writeFile(filePath, '');
};
