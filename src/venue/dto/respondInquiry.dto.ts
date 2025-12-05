import { IsString, IsNotEmpty, MinLength } from 'class-validator';

export class RespondInquiryDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(10)
  response: string;
}
