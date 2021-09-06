import { Logger } from '@nestjs/common';
import * as fs from 'fs';

const logger = new Logger('ensureFile');

export const ensureFile = (filePath): Promise<void> => {
  return new Promise((resolve, reject) => {
    logger.debug(`Ensuring file ${filePath} exists`);
    fs.stat(filePath, (err) => {
      if (!err || err.code !== 'ENOENT') {
        return resolve();
      }

      fs.writeFile(filePath, '', (err) => {
        if (err) return reject(err);
        return resolve();
      });
    });
  });
};
