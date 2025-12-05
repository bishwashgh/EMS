import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ReviewDocument = Review & Document;

export enum ReportReason {
  SPAM = 'SPAM',
  INAPPROPRIATE = 'INAPPROPRIATE',
  FAKE = 'FAKE',
  OFFENSIVE = 'OFFENSIVE',
  OTHER = 'OTHER',
}

@Schema({ timestamps: true })
export class Review {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Venue', required: true })
  venueId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Booking' })
  bookingId?: Types.ObjectId;

  @Prop({ required: true, min: 1, max: 5 })
  rating: number;

  @Prop({ required: true })
  comment: string;

  @Prop({ type: [String], default: [] })
  images?: string[];

  // Helpful feature
  @Prop({ type: [Types.ObjectId], ref: 'User', default: [] })
  helpfulBy: Types.ObjectId[];

  @Prop({ default: 0 })
  helpfulCount: number;

  // Report feature
  @Prop({
    type: [{
      userId: { type: Types.ObjectId, ref: 'User' },
      reason: { type: String, enum: ReportReason },
      description: String,
      reportedAt: { type: Date, default: Date.now },
    }],
    default: [],
  })
  reports: Array<{
    userId: Types.ObjectId;
    reason: ReportReason;
    description?: string;
    reportedAt: Date;
  }>;

  @Prop({ default: false })
  isHidden: boolean;

  // Owner response
  @Prop()
  ownerResponse?: string;

  @Prop()
  ownerResponseAt?: Date;
}

export const ReviewSchema = SchemaFactory.createForClass(Review);

ReviewSchema.index({ venueId: 1, createdAt: -1 });
ReviewSchema.index({ userId: 1 });
