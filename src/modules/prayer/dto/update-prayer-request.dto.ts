import { PartialType } from '@nestjs/mapped-types';
import { CreatePrayerRequestDto } from './create-prayer-request.dto';

export class UpdatePrayerRequestDto extends PartialType(CreatePrayerRequestDto) {}