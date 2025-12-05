import { IsBoolean, IsOptional, IsDateString } from 'class-validator';

export class SetFeaturedDto {
  @IsBoolean()
  isFeatured: boolean;

  @IsOptional()
  @IsDateString()
  featuredUntil?: string;
}
