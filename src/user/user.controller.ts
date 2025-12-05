import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { UserService } from './user.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from './schemas/user.schema';
import { UpdateProfileDto } from './dto/updateProfile.dto';
import { ChangePasswordDto } from './dto/changePassword.dto';

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  // Get current user's profile
  @Get('me')
  @UseGuards(JwtAuthGuard)
  async getProfile(@Request() req) {
    const user = await this.userService.findById(req.user.userId);
    if (!user) {
      return null;
    }
    // Return user without sensitive fields
    return {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      phoneNumber: user.phoneNumber,
      avatar: user.avatar,
      isVerified: user.isVerified,
    };
  }

  // Get user's favorites/wishlist
  @Get('favorites')
  @UseGuards(JwtAuthGuard)
  getFavorites(@Request() req) {
    return this.userService.getFavorites(req.user.userId);
  }

  // Add venue to favorites
  @Post('favorites/:venueId')
  @UseGuards(JwtAuthGuard)
  async addToFavorites(@Param('venueId') venueId: string, @Request() req) {
    await this.userService.addToFavorites(req.user.userId, venueId);
    return { message: 'Venue added to favorites' };
  }

  // Remove venue from favorites
  @Delete('favorites/:venueId')
  @UseGuards(JwtAuthGuard)
  async removeFromFavorites(@Param('venueId') venueId: string, @Request() req) {
    await this.userService.removeFromFavorites(req.user.userId, venueId);
    return { message: 'Venue removed from favorites' };
  }

  // Check if venue is in favorites
  @Get('favorites/:venueId/check')
  @UseGuards(JwtAuthGuard)
  async checkFavorite(@Param('venueId') venueId: string, @Request() req) {
    const isFavorite = await this.userService.isFavorite(req.user.userId, venueId);
    return { isFavorite };
  }

  // ============ Profile Management ============

  // Update profile
  @Patch('me')
  @UseGuards(JwtAuthGuard)
  async updateProfile(@Body() dto: UpdateProfileDto, @Request() req) {
    const user = await this.userService.updateProfile(req.user.userId, dto);
    return {
      message: 'Profile updated successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phoneNumber: user.phoneNumber,
        avatar: user.avatar,
        role: user.role,
      },
    };
  }

  // Change password
  @Post('me/change-password')
  @UseGuards(JwtAuthGuard)
  async changePassword(@Body() dto: ChangePasswordDto, @Request() req) {
    await this.userService.changePassword(
      req.user.userId,
      dto.currentPassword,
      dto.newPassword,
    );
    return { message: 'Password changed successfully' };
  }

  // Delete own account
  @Delete('me')
  @UseGuards(JwtAuthGuard)
  async deleteOwnAccount(@Body('password') password: string, @Request() req) {
    await this.userService.deleteOwnAccount(req.user.userId, password);
    return { message: 'Account deleted successfully' };
  }

  // ============ Admin User Management ============

  // List all users (Admin only)
  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  getUsers(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('role') role?: UserRole,
    @Query('isVerified') isVerified?: string,
    @Query('search') search?: string,
  ) {
    return this.userService.findAllUsers(
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 20,
      {
        role,
        isVerified: isVerified ? isVerified === 'true' : undefined,
        search,
      },
    );
  }

  // Get user by ID (Admin only)
  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  getUserById(@Param('id') id: string) {
    return this.userService.getUserById(id);
  }

  // Update user role (Admin only)
  @Patch(':id/role')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async updateUserRole(@Param('id') id: string, @Body('role') role: UserRole) {
    const user = await this.userService.updateUserRole(id, role);
    return {
      message: `User role updated to ${role}`,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    };
  }

  // Suspend/unsuspend user (Admin only)
  @Patch(':id/suspend')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async suspendUser(@Param('id') id: string, @Body('isSuspended') isSuspended: boolean) {
    const user = await this.userService.suspendUser(id, isSuspended);
    return {
      message: isSuspended ? 'User suspended' : 'User unsuspended',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        isSuspended: user.isSuspended,
      },
    };
  }

  // Delete user (Admin only)
  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async deleteUser(@Param('id') id: string) {
    await this.userService.deleteUser(id);
    return { message: 'User deleted successfully' };
  }
}
