import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import * as path from 'path';
import { EnvironmentVariables } from '../config/validate';

export const INITIAL_SCORES = 'INITIAL_SCORES';

const readOrCreateFile = (filePath, defaultString = '') => {
  try {
    fs.statSync(filePath);
    return fs.readFileSync(filePath, 'utf-8');
  } catch (err) {
    if (err.code === 'ENOENT') {
      fs.writeFileSync(filePath, defaultString);
      return defaultString;
    } else {
      throw err;
    }
  }
};

export const initialScoresProvider = {
  provide: INITIAL_SCORES,
  useFactory(configService: ConfigService<EnvironmentVariables>) {
    const scoresJsonFilePath = path.resolve(configService.get('SCORES_JSON_FILE_PATH', ''));
    const fileContents = readOrCreateFile(scoresJsonFilePath, '{}');
    const scores = JSON.parse(fileContents);
    return scores as Record<string, number>;
  },
  inject: [ConfigService],
};
