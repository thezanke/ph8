import { ConfigService } from '@nestjs/config';
import * as path from 'path';

import { EnvironmentVariables } from '../config/validate';
import { ensureFile } from '../helpers/ensureFile';
import { readFile } from '../helpers/readFile';

export const INITIAL_SCORES = 'INITIAL_SCORES';

export const initialScoresProvider = {
  provide: INITIAL_SCORES,
  async useFactory(configService: ConfigService<EnvironmentVariables>) {
    const scoresJsonFilePath = path.resolve(
      configService.get('SCORES_JSON_FILE_PATH', ''),
    );

    await ensureFile(scoresJsonFilePath);
    const fileStringData = await readFile(scoresJsonFilePath);

    const scores = fileStringData.length ? JSON.parse(fileStringData) : {};

    return scores as Record<string, number>;
  },
  inject: [ConfigService],
};
