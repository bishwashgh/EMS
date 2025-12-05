import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type VenueDocument = Venue & Document;

export enum VenueType {
  BANQUET = 'BANQUET',
  PARTY_HALL = 'PARTY_HALL',
  GARDEN = 'GARDEN',
  ROOFTOP = 'ROOFTOP',
  CONFERENCE_HALL = 'CONFERENCE_HALL',
  RESTAURANT = 'RESTAURANT',
  OTHER = 'OTHER',
}

@Schema({ timestamps: true })
export class Venue {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  description: string;

  @Prop({ required: true })
  address: string;

  @Prop({ required: true })
  city: string;

  @Prop({ required: true })
  minCapacity: number;

  @Prop({ required: true })
  maxCapacity: number;

  @Prop({ required: true })
  pricePerHour: number;

  @Prop()
  pricePerDay?: number;

  @Prop({ type: [String], default: [] })
  amenities: string[];

  @Prop({ type: [String], default: [] })
  images: string[];

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  ownerId: Types.ObjectId;

  @Prop({ required: true, enum: VenueType, default: VenueType.OTHER })
  venueType: VenueType;

  @Prop({ default: '09:00' })
  openingTime: string;

  @Prop({ default: '22:00' })
  closingTime: string;

  @Prop({ type: [Date], default: [] })
  blockedDates: Date[];

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ default: false })
  isVerified: boolean;

  @Prop({ default: 0 })
  rating: number;

  @Prop({ default: 0 })
  reviewCount: number;

  @Prop()
  contactPhone?: string;

  @Prop()
  contactEmail?: string;

  // Cancellation Policy
  @Prop({
    type: Object,
    default: {
      fullRefundHours: 72, // Hours before event for full refund
      partialRefundHours: 24, // Hours before event for partial refund
      partialRefundPercentage: 50, // Percentage refunded for partial
      noRefundHours: 0, // No refund within these hours
    },
  })
  cancellationPolicy: {
    fullRefundHours: number;
    partialRefundHours: number;
    partialRefundPercentage: number;
    noRefundHours: number;
  };

  // Geolocation for proximity search
  @Prop({ type: Object })
  location?: {
    type: string;
    coordinates: [number, number]; // [longitude, latitude]
  };

  // Featured venue flag
  @Prop({ default: false })
  isFeatured: boolean;

  @Prop()
  featuredUntil?: Date;
}

export const VenueSchema = SchemaFactory.createForClass(Venue);

// Add geospatial index for location-based search
VenueSchema.index({ location: '2dsphere' });
VenueSchema.index({ city: 1, venueType: 1, pricePerHour: 1 });
