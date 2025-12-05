import { IsString, IsNotEmpty, MinLength, MaxLength } from 'class-validator';

export class OwnerResponseDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(10)
  @MaxLength(1000)
  response: string;
}
