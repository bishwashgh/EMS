import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type PaymentDocument = Payment & Document;

export enum PaymentGateway {
  ESEWA = 'ESEWA',
  KHALTI = 'KHALTI',
}

export enum PaymentType {
  ADVANCE = 'ADVANCE',
  FULL = 'FULL',
  BALANCE = 'BALANCE',
  REFUND = 'REFUND',
}

export enum TransactionStatus {
  INITIATED = 'INITIATED',
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  REFUNDED = 'REFUNDED',
}

@Schema({ timestamps: true })
export class Payment {
  @Prop({ type: Types.ObjectId, ref: 'Booking', required: true })
  bookingId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Venue', required: true })
  venueId: Types.ObjectId;

  @Prop({ required: true })
  amount: number;

  @Prop({ enum: PaymentGateway, required: true })
  gateway: PaymentGateway;

  @Prop({ enum: PaymentType, required: true })
  paymentType: PaymentType;

  @Prop({ enum: TransactionStatus, default: TransactionStatus.INITIATED })
  status: TransactionStatus;

  // Gateway-specific transaction ID
  @Prop()
  transactionId: string;

  // Our internal reference ID
  @Prop({ required: true, unique: true })
  referenceId: string;

  // Gateway response data
  @Prop({ type: Object })
  gatewayResponse: Record<string, any>;

  // For refunds
  @Prop()
  refundReason: string;

  @Prop({ type: Types.ObjectId, ref: 'Payment' })
  originalPaymentId: Types.ObjectId;
}

export const PaymentSchema = SchemaFactory.createForClass(Payment);

// Index for faster queries
PaymentSchema.index({ bookingId: 1 });
PaymentSchema.index({ userId: 1 });
PaymentSchema.index({ referenceId: 1 });
PaymentSchema.index({ transactionId: 1 });
