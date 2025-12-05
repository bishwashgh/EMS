import { IsEmail, IsEnum, IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';
import { UserRole } from '../../user/schemas/user.schema';

export class RegisterUserDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @MinLength(6, { message: 'Password must be at least 6 characters long' })
  password: string;

  @IsOptional()
  @IsEnum(UserRole, { message: 'Role must be either USER, OWNER, or ADMIN' })
  role?: UserRole; // Optional: Defaults to USER in schema if not sent

  @IsOptional()
  @IsString()
  phoneNumber?: string; // Needed for OTP if you plan to send SMS
}