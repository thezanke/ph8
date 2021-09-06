import { Logger } from '@nestjs/common';
import * as fs from 'fs';

const logger = new Logger('readFileString');

export const readFile = (filePath, encoding: BufferEncoding = 'utf-8'): Promise<string> => {
  return new Promise((resolve, reject) => {
    logger.debug(`Reading file ${filePath}`);
    fs.readFile(filePath, encoding, (err, stringData: string) => {
      if (err) return reject(err);
      return resolve(stringData);
    });
  });
};
