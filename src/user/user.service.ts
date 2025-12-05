import { Injectable, ConflictException, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { User, UserDocument, UserRole } from './schemas/user.schema';
import { RegisterUserDto } from '../auth/dto/registerUser.dto';
import { UpdateProfileDto } from './dto/updateProfile.dto';

@Injectable()
export class UserService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
  ) {}

  async createUser(registerUserDto: RegisterUserDto & { otp: string; otpExpires: Date }): Promise<UserDocument> {
    const existingUser = await this.userModel.findOne({ email: registerUserDto.email });
    if (existingUser) {
      throw new ConflictException('Email already exists');
    }

    const newUser = new this.userModel(registerUserDto);
    return newUser.save();
  }

  async findByEmail(email: string): Promise<UserDocument | null> {
    return this.userModel.findOne({ email });
  }

  async findById(id: string): Promise<UserDocument | null> {
    return this.userModel.findById(id);
  }

  async updateOtp(email: string, otp: string, otpExpires: Date): Promise<UserDocument | null> {
    return this.userModel.findOneAndUpdate(
      { email },
      { otp, otpExpires },
      { new: true },
    );
  }

  async verifyUser(email: string): Promise<UserDocument | null> {
    return this.userModel.findOneAndUpdate(
      { email },
      { isVerified: true, otp: null, otpExpires: null },
      { new: true },
    );
  }

  async updatePassword(email: string, hashedPassword: string): Promise<UserDocument | null> {
    return this.userModel.findOneAndUpdate(
      { email },
      { password: hashedPassword, otp: null, otpExpires: null },
      { new: true },
    );
  }

  // Favorites/Wishlist methods
  async addToFavorites(userId: string, venueId: string): Promise<UserDocument | null> {
    return this.userModel.findByIdAndUpdate(
      userId,
      { $addToSet: { favorites: new Types.ObjectId(venueId) } },
      { new: true },
    );
  }

  async removeFromFavorites(userId: string, venueId: string): Promise<UserDocument | null> {
    return this.userModel.findByIdAndUpdate(
      userId,
      { $pull: { favorites: new Types.ObjectId(venueId) } },
      { new: true },
    );
  }

  async getFavorites(userId: string) {
    const user = await this.userModel
      .findById(userId)
      .populate('favorites', 'name address city images pricePerHour rating venueType');
    return user?.favorites || [];
  }

  async isFavorite(userId: string, venueId: string): Promise<boolean> {
    const user = await this.userModel.findById(userId);
    if (!user) return false;
    return user.favorites.some((fav) => fav.toString() === venueId);
  }

  // ============ Profile Management ============

  async updateProfile(userId: string, dto: UpdateProfileDto): Promise<UserDocument> {
    const user = await this.userModel.findByIdAndUpdate(
      userId,
      { $set: dto },
      { new: true },
    );
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<void> {
    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      throw new BadRequestException('Current password is incorrect');
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    await user.save();
  }

  // ============ Admin User Management ============

  async findAllUsers(
    page: number = 1,
    limit: number = 20,
    filters?: { role?: UserRole; isVerified?: boolean; search?: string },
  ) {
    const query: any = {};

    if (filters?.role) {
      query.role = filters.role;
    }
    if (filters?.isVerified !== undefined) {
      query.isVerified = filters.isVerified;
    }
    if (filters?.search) {
      query.$or = [
        { name: { $regex: filters.search, $options: 'i' } },
        { email: { $regex: filters.search, $options: 'i' } },
      ];
    }

    const skip = (page - 1) * limit;

    const [users, total] = await Promise.all([
      this.userModel
        .find(query)
        .select('-password -otp -otpExpires')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      this.userModel.countDocuments(query),
    ]);

    return {
      users,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  async getUserById(userId: string) {
    const user = await this.userModel
      .findById(userId)
      .select('-password -otp -otpExpires')
      .lean();
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  async updateUserRole(userId: string, role: UserRole): Promise<UserDocument> {
    const user = await this.userModel.findByIdAndUpdate(
      userId,
      { role },
      { new: true },
    );
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  async suspendUser(userId: string, isSuspended: boolean): Promise<UserDocument> {
    const user = await this.userModel.findByIdAndUpdate(
      userId,
      { isSuspended },
      { new: true },
    );
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  async deleteUser(userId: string): Promise<void> {
    const result = await this.userModel.findByIdAndDelete(userId);
    if (!result) {
      throw new NotFoundException('User not found');
    }
  }

  // Self-delete account
  async deleteOwnAccount(userId: string, password: string): Promise<void> {
    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Verify password before deletion
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      throw new BadRequestException('Password is incorrect');
    }

    await this.userModel.findByIdAndDelete(userId);
  }
}
