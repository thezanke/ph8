import { Logger } from '@nestjs/common';
import * as fs from 'fs';

const logger = new Logger('readFileString');

export const readFileString = (filePath): Promise<string> => {
  return new Promise((resolve, reject) => {
    logger.debug(`Reading file ${filePath}`);
    fs.readFile(filePath, 'utf-8', (err, stringData: string) => {
      if (err) return reject(err);
      return resolve(stringData);
    });
  });
};
