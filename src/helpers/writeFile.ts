import * as fs from 'fs';

export const writeFile = (
  filePath: string,
  data: string | NodeJS.ArrayBufferView,
): Promise<void> => {
  return new Promise((resolve, reject) => {
    fs.writeFile(filePath, data, (err) => {
      if (err) return reject(err);
      return resolve();
    });
  });
};
