import { Injectable } from '@nestjs/common';
import * as crypto from 'crypto';

@Injectable()
export class OtpService {
  // Generate a 6-digit OTP
  generateOtp(): string {
    return crypto.randomInt(100000, 999999).toString();
  }

  // Get OTP expiration time (10 minutes from now)
  getOtpExpiry(): Date {
    const expiry = new Date();
    expiry.setMinutes(expiry.getMinutes() + 10);
    return expiry;
  }

  // Validate if OTP is expired
  isOtpExpired(otpExpires: Date): boolean {
    return new Date() > new Date(otpExpires);
  }

  // Validate OTP match
  validateOtp(inputOtp: string, storedOtp: string): boolean {
    return inputOtp === storedOtp;
  }
}
