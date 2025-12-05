import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UserService } from '../user/user.service';
import { RegisterUserDto } from './dto/registerUser.dto';
import { VerifyOtpDto } from './dto/verifyOtp.dto';
import { ResendOtpDto } from './dto/resendOtp.dto';
import { LoginDto } from './dto/login.dto';
import { ForgotPasswordDto } from './dto/forgotPassword.dto';
import { ResetPasswordDto } from './dto/resetPassword.dto';
import { OtpService } from './otp.service';
import { EmailService } from '../common/email.service';
import * as bcrypt from 'bcrypt';

// Simple in-memory token blacklist (use Redis in production)
const tokenBlacklist: Set<string> = new Set();

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly otpService: OtpService,
    private readonly emailService: EmailService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async registerUser(registerUserDto: RegisterUserDto) {
    // Hash password
    const hashedPassword = await bcrypt.hash(registerUserDto.password, 10);

    // Generate OTP and expiry
    const otp = this.otpService.generateOtp();
    const otpExpires = this.otpService.getOtpExpiry();

    // Create user with OTP
    const user = await this.userService.createUser({
      ...registerUserDto,
      password: hashedPassword,
      otp,
      otpExpires,
    });

    // Send OTP email
    await this.emailService.sendOtpEmail(
      user.email,
      otp,
      user.name,
    );

    return {
      message: 'Registration successful. Please check your email for OTP verification.',
      userId: user._id,
      email: user.email,
    };
  }

  async verifyOtp(verifyOtpDto: VerifyOtpDto) {
    const { email, otp } = verifyOtpDto;

    // Find user by email
    const user = await this.userService.findByEmail(email);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Check if already verified
    if (user.isVerified) {
      throw new BadRequestException('User is already verified');
    }

    // Check if OTP exists
    if (!user.otp || !user.otpExpires) {
      throw new BadRequestException('No OTP found. Please request a new one.');
    }

    // Check if OTP is expired
    if (this.otpService.isOtpExpired(user.otpExpires)) {
      throw new BadRequestException('OTP has expired. Please request a new one.');
    }

    // Validate OTP
    if (!this.otpService.validateOtp(otp, user.otp)) {
      throw new UnauthorizedException('Invalid OTP');
    }

    // Mark user as verified
    await this.userService.verifyUser(email);

    return {
      message: 'Email verified successfully. You can now login.',
    };
  }

  async resendOtp(resendOtpDto: ResendOtpDto) {
    const { email } = resendOtpDto;

    // Find user by email
    const user = await this.userService.findByEmail(email);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Check if already verified
    if (user.isVerified) {
      throw new BadRequestException('User is already verified');
    }

    // Generate new OTP and expiry
    const otp = this.otpService.generateOtp();
    const otpExpires = this.otpService.getOtpExpiry();

    // Update user with new OTP
    await this.userService.updateOtp(email, otp, otpExpires);

    // Send OTP email
    await this.emailService.sendOtpEmail(email, otp, user.name);

    return {
      message: 'OTP sent successfully. Please check your email.',
    };
  }

  async login(loginDto: LoginDto) {
    const { email, password } = loginDto;

    // Find user by email
    const user = await this.userService.findByEmail(email);
    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    // Check if user is verified
    if (!user.isVerified) {
      throw new UnauthorizedException('Please verify your email before logging in');
    }

    // Validate password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    // Generate JWT token
    const payload = {
      sub: user._id.toString(),
      email: user.email,
      role: user.role,
    };

    return {
      message: 'Login successful',
      accessToken: this.jwtService.sign(payload),
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    };
  }

  async forgotPassword(forgotPasswordDto: ForgotPasswordDto) {
    const { email } = forgotPasswordDto;

    // Find user by email
    const user = await this.userService.findByEmail(email);
    if (!user) {
      // Don't reveal if email exists or not for security
      return {
        message: 'If the email exists, a password reset OTP has been sent.',
      };
    }

    // Generate OTP and expiry
    const otp = this.otpService.generateOtp();
    const otpExpires = this.otpService.getOtpExpiry();

    // Update user with OTP
    await this.userService.updateOtp(email, otp, otpExpires);

    // Send password reset email
    await this.emailService.sendPasswordResetEmail(email, otp, user.name);

    return {
      message: 'If the email exists, a password reset OTP has been sent.',
    };
  }

  async resetPassword(resetPasswordDto: ResetPasswordDto) {
    const { email, otp, newPassword } = resetPasswordDto;

    // Find user by email
    const user = await this.userService.findByEmail(email);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Check if OTP exists
    if (!user.otp || !user.otpExpires) {
      throw new BadRequestException('No password reset request found. Please request a new one.');
    }

    // Check if OTP is expired
    if (this.otpService.isOtpExpired(user.otpExpires)) {
      throw new BadRequestException('OTP has expired. Please request a new one.');
    }

    // Validate OTP
    if (!this.otpService.validateOtp(otp, user.otp)) {
      throw new UnauthorizedException('Invalid OTP');
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password
    await this.userService.updatePassword(email, hashedPassword);

    return {
      message: 'Password reset successful. You can now login with your new password.',
    };
  }

  // ============ Logout & Refresh Token ============

  async logout(token: string) {
    // Add token to blacklist
    tokenBlacklist.add(token);
    return { message: 'Logged out successfully' };
  }

  isTokenBlacklisted(token: string): boolean {
    return tokenBlacklist.has(token);
  }

  async refreshToken(userId: string) {
    const user = await this.userService.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.isSuspended) {
      throw new UnauthorizedException('Account is suspended');
    }

    // Generate new access token
    const payload = { sub: user._id, email: user.email, role: user.role };
    const accessToken = this.jwtService.sign(payload, { expiresIn: '1h' });
    
    // Generate refresh token with longer expiry
    const refreshToken = this.jwtService.sign(payload, { expiresIn: '7d' });

    return {
      accessToken,
      refreshToken,
      expiresIn: 3600, // 1 hour in seconds
    };
  }

  async validateRefreshToken(refreshToken: string) {
    try {
      if (this.isTokenBlacklisted(refreshToken)) {
        throw new UnauthorizedException('Token has been invalidated');
      }

      const payload = this.jwtService.verify(refreshToken);
      return payload;
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
  }
}
