import { PartialType } from '@nestjs/mapped-types';
import { CreateVenueDto } from './createVenue.dto';

export class UpdateVenueDto extends PartialType(CreateVenueDto) {}
