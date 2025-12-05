import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type UserDocument = User & Document;

export enum UserRole {
  USER = 'USER',
  OWNER = 'OWNER',
  ADMIN = 'ADMIN',
}

@Schema({ timestamps: true })
export class User {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true, unique: true })
  email: string;

  @Prop({ required: true })
  password: string;

  @Prop({ required: true, enum: UserRole, default: UserRole.USER })
  role: UserRole;

  @Prop()
  phoneNumber?: string;

  @Prop()
  avatar?: string; // URL to profile picture (Level 2 feature)

  // --- OTP Verification Fields ---
  @Prop({ default: false })
  isVerified: boolean;

  @Prop()
  otp: string; // Store hashed OTP if possible, or plain if short-lived

  @Prop()
  otpExpires: Date;

  // --- Wishlist/Favorites ---
  @Prop({ type: [Types.ObjectId], ref: 'Venue', default: [] })
  favorites: Types.ObjectId[];

  // --- Account Status ---
  @Prop({ default: false })
  isSuspended: boolean;
}

export const UserSchema = SchemaFactory.createForClass(User);
