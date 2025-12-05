import { IsNotEmpty, IsOptional, IsString, IsEmail, IsDateString, IsNumber, Min } from 'class-validator';

export class CreateInquiryDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsNotEmpty()
  @IsEmail()
  email: string;

  @IsNotEmpty()
  @IsString()
  phone: string;

  @IsNotEmpty()
  @IsString()
  message: string;

  @IsOptional()
  @IsDateString()
  eventDate?: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  guestCount?: number;
}
