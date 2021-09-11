import { Logger } from '@nestjs/common';
import * as fs from 'fs';

const logger = new Logger('writeFile');

export const writeFile = (
  filePath: string,
  data: string | NodeJS.ArrayBufferView,
): Promise<void> => {
  return new Promise((resolve, reject) => {
    logger.debug(`Writing file ${filePath}`);
    fs.writeFile(filePath, data, (err) => {
      if (err) return reject(err);
      return resolve();
    });
  });
};
