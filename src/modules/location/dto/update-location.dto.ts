import { IsString, IsOptional, IsBoolean, IsIn, IsNumber, Min, Max, MaxLength } from 'class-validator';

export class UpdateLocationDto {
  @IsOptional()
  @IsString()
  @MaxLength(200, { message: 'Location name cannot exceed 200 characters' })
  locationName?: string;

  @IsOptional()
  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude?: number;

  @IsOptional()
  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude?: number;

  @IsOptional()
  @IsBoolean()
  showLocation?: boolean;

  @IsOptional()
  @IsIn(['exact', 'city', 'country', 'none'], { message: 'Location privacy must be exact, city, country, or none' })
  locationPrivacy?: 'exact' | 'city' | 'country' | 'none';
}