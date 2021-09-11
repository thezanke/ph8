import * as fs from 'fs';

export const readFile = (
  filePath,
  encoding: BufferEncoding = 'utf-8',
): Promise<string> => {
  return new Promise((resolve, reject) => {
    fs.readFile(filePath, encoding, (err, stringData: string) => {
      if (err) return reject(err);
      return resolve(stringData);
    });
  });
};
