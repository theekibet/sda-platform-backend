import { IsBoolean, IsOptional, IsIn, IsNotEmpty } from 'class-validator';

export class LocationConsentDto {
  @IsBoolean()
  @IsNotEmpty()
  enableLocation: boolean;

  @IsOptional()
  @IsIn(['exact', 'city', 'country', 'none'], { message: 'Privacy level must be exact, city, country, or none' })
  privacyLevel?: 'exact' | 'city' | 'country' | 'none';
}