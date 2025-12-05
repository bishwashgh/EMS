import { IsOptional, IsString, IsNumber, IsEnum, IsDateString, IsArray, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { VenueType } from '../schemas/venue.schema';

export enum VenueSortBy {
  CREATED_AT = 'createdAt',
  PRICE_LOW = 'priceAsc',
  PRICE_HIGH = 'priceDesc',
  RATING = 'rating',
  POPULARITY = 'popularity',
}

export class QueryVenueDto {
  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsEnum(VenueType)
  venueType?: VenueType;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  minCapacity?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  maxCapacity?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  minPrice?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  maxPrice?: number;

  @IsOptional()
  @IsString()
  search?: string;

  // Advanced Search - Sort options
  @IsOptional()
  @IsEnum(VenueSortBy)
  sortBy?: VenueSortBy;

  // Advanced Search - Amenities filter
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  amenities?: string[];

  // Advanced Search - Availability filter
  @IsOptional()
  @IsDateString()
  availableDate?: string;

  @IsOptional()
  @IsString()
  availableStartTime?: string;

  @IsOptional()
  @IsString()
  availableEndTime?: string;

  // Geolocation search
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  latitude?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  longitude?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100)
  radiusKm?: number; // Search radius in kilometers

  // Verified venues only
  @IsOptional()
  verifiedOnly?: boolean;

  // Minimum rating filter
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(5)
  minRating?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(50)
  limit?: number = 10;
}
