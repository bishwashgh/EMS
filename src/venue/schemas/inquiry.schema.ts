import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type InquiryDocument = Inquiry & Document;

export enum InquiryStatus {
  PENDING = 'PENDING',
  RESPONDED = 'RESPONDED',
  CLOSED = 'CLOSED',
}

@Schema({ timestamps: true })
export class Inquiry {
  @Prop({ type: Types.ObjectId, ref: 'User' })
  userId?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Venue', required: true })
  venueId: Types.ObjectId;

  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  email: string;

  @Prop({ required: true })
  phone: string;

  @Prop({ required: true })
  message: string;

  @Prop()
  eventDate?: Date;

  @Prop()
  guestCount?: number;

  @Prop({ enum: InquiryStatus, default: InquiryStatus.PENDING })
  status: InquiryStatus;

  @Prop()
  ownerResponse?: string;

  @Prop()
  respondedAt?: Date;
}

export const InquirySchema = SchemaFactory.createForClass(Inquiry);

InquirySchema.index({ venueId: 1, createdAt: -1 });
InquirySchema.index({ userId: 1 });
