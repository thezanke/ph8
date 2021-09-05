import { plainToClass } from 'class-transformer';
import { IsEnum, IsNumber, IsString, validateSync } from 'class-validator';

enum Environment {
  Development = 'development',
  Production = 'production',
  Test = 'test',
}

export class EnvironmentVariables {
  @IsString()
  DISCORD_BOT_TOKEN: string;

  @IsNumber()
  HTTP_PORT: number;

  @IsString()
  LOG_LEVELS: string;

  @IsEnum(Environment)
  NODE_ENV: Environment;

  @IsString()
  POOR_SOURCES: string;

  @IsString()
  POOR_SOURCE_REPLIES: string;

  @IsString()
  SCORES_JSON_FILE_PATH: string;
}

export function validate(config: Record<string, unknown>) {
  const validatedConfig = plainToClass(EnvironmentVariables, config, {
    enableImplicitConversion: true,
  });

  const errors = validateSync(validatedConfig, {
    skipMissingProperties: false,
  });

  if (errors.length > 0) {
    throw new Error(errors.toString());
  }
  return validatedConfig;
}
