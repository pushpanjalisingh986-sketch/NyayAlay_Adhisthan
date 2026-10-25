import { IsEmail, IsOptional, IsString, MinLength, IsPhoneNumber } from 'class-validator';

export class SignupDto {
  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsString()
  @MinLength(8)
  password: string;
}