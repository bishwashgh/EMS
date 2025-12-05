import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type BookingDocument = Booking & Document;

export enum BookingStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  CANCELLED = 'CANCELLED',
  COMPLETED = 'COMPLETED',
}

export enum PaymentStatus {
  UNPAID = 'UNPAID',
  PARTIAL = 'PARTIAL',
  PAID = 'PAID',
  REFUNDED = 'REFUNDED',
}

export enum EventType {
  WEDDING = 'WEDDING',
  BIRTHDAY = 'BIRTHDAY',
  CORPORATE = 'CORPORATE',
  ANNIVERSARY = 'ANNIVERSARY',
  ENGAGEMENT = 'ENGAGEMENT',
  RECEPTION = 'RECEPTION',
  CONFERENCE = 'CONFERENCE',
  SEMINAR = 'SEMINAR',
  OTHER = 'OTHER',
}

@Schema({ timestamps: true })
export class Booking {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Venue', required: true })
  venueId: Types.ObjectId;

  @Prop({ required: true })
  eventDate: Date;

  @Prop({ required: true })
  startTime: string; // Format: "HH:mm"

  @Prop({ required: true })
  endTime: string; // Format: "HH:mm"

  @Prop({ required: true, enum: EventType, default: EventType.OTHER })
  eventType: EventType;

  @Prop({ required: true })
  guestCount: number;

  @Prop({ required: true })
  totalAmount: number;

  @Prop({ default: 0 })
  advancePaid: number;

  @Prop({ default: 0 })
  balanceAmount: number;

  @Prop({ required: true, enum: BookingStatus, default: BookingStatus.PENDING })
  status: BookingStatus;

  @Prop({ required: true, enum: PaymentStatus, default: PaymentStatus.UNPAID })
  paymentStatus: PaymentStatus;

  @Prop()
  specialRequests?: string;

  @Prop()
  contactName: string;

  @Prop()
  contactPhone: string;

  @Prop()
  contactEmail: string;

  @Prop()
  cancellationReason?: string;

  @Prop()
  cancelledAt?: Date;

  // Refund information
  @Prop({ default: 0 })
  refundAmount: number;

  @Prop({ default: 0 })
  refundPercentage: number;
}

export const BookingSchema = SchemaFactory.createForClass(Booking);
