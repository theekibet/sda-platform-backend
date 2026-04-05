import { PartialType } from '@nestjs/mapped-types';
import { CreateTestimonyDto } from './create-testimony.dto';

export class UpdateTestimonyDto extends PartialType(CreateTestimonyDto) {}