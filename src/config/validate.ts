import { plainToClass, Transform } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsNumber,
  IsString,
  validateSync,
} from 'class-validator';

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

  @IsString()
  GOOGLE_API_KEY: string;

  @Transform(({ value }) => value.toLowerCase() === 'true')
  @IsBoolean()
  ENABLE_GPT3: string;

  @IsString()
  GPT3_API_SECRET?: string;

  @IsString()
  GPT3_API_BASE_URL?: string;

  @IsString()
  GPT3_STARTING_PROMPT?: string;

  @IsString()
  GPT3_BOT_PROMPT?: string;

  @IsString()
  GPT3_HUMAN_PROMPT?: string;

  @IsString()
  CHITCHAT_MESSAGE_CONTEXT_LIMIT?: string;
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
