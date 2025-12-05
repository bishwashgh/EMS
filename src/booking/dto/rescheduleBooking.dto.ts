import { IsNotEmpty, IsDateString, IsString, Matches } from 'class-validator';

export class RescheduleBookingDto {
  @IsNotEmpty()
  @IsDateString()
  newEventDate: string;

  @IsNotEmpty()
  @IsString()
  @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, { message: 'startTime must be in HH:mm format' })
  newStartTime: string;

  @IsNotEmpty()
  @IsString()
  @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, { message: 'endTime must be in HH:mm format' })
  newEndTime: string;
}
