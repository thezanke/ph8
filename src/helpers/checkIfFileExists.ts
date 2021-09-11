import * as fs from 'fs';

export const checkIfFileExists = (filePath): Promise<boolean> => {
  return new Promise((resolve, reject) => {
    fs.stat(filePath, (err) => {
      if (err) {
        if (err.code === 'ENOENT') return resolve(false);
        return reject(err);
      }

      return resolve(true);
    });
  });
};
