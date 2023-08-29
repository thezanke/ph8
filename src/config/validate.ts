import { plainToClass, Transform } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsNumber,
  IsOptional,
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
  DISCORD_BOT_TOKEN!: string;

  @IsNumber()
  HTTP_PORT!: number;

  @IsString()
  LOG_LEVELS!: string;

  @IsEnum(Environment)
  NODE_ENV!: Environment;

  @IsString()
  POOR_SOURCES!: string;

  @IsString()
  POOR_SOURCE_REPLIES!: string;

  @IsString()
  SCORES_JSON_FILE_PATH!: string;

  @IsString()
  GOOGLE_API_KEY!: string;

  @Transform(({ value }) => value.toLowerCase() === 'true')
  @IsBoolean()
  ENABLE_GPT!: string;

  @IsString()
  @IsOptional()
  GPT_API_SECRET?: string;

  @IsString()
  @IsOptional()
  GPT_API_BASE_URL?: string;

  @IsString()
  GPT_CHITCHAT_SYSTEM_MESSAGE_PREAMBLE!: string;

  @IsString()
  @IsOptional()
  GPT_CHITCHAT_MESSAGE_CONTEXT_LIMIT?: string;

  @IsString()
  @IsOptional()
  GPT_CHITCHAT_MAX_TOKENS?: string;
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
