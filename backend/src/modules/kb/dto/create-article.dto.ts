import { IsString, IsNotEmpty, IsOptional, IsArray, IsEnum, IsDateString } from 'class-validator';
import { LawVersion } from '@prisma/client';

export class CreateArticleDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  body: string;

  @IsOptional()
  @IsString()
  category?: string;

  @IsEnum(LawVersion)
  lawVersion: LawVersion;

  @IsDateString()
  effectiveDate: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];
}