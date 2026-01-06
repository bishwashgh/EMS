import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { NotificationService } from './notification.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  // Get user's notifications
  @Get()
  getNotifications(
    @Request() req,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('unreadOnly') unreadOnly?: string,
  ) {
    return this.notificationService.getUserNotifications(
      req.user.userId,
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 20,
      unreadOnly === 'true',
    );
  }

  // Get unread count
  @Get('unread-count')
  getUnreadCount(@Request() req) {
    return this.notificationService.getUnreadCount(req.user.userId);
  }

  // Mark notification as read
  @Post(':id/read')
  markAsRead(@Param('id') id: string, @Request() req) {
    return this.notificationService.markAsRead(id, req.user.userId);
  }

  // Mark all as read
  @Post('read-all')
  markAllAsRead(@Request() req) {
    return this.notificationService.markAllAsRead(req.user.userId);
  }

  // Delete notification
  @Delete(':id')
  deleteNotification(@Param('id') id: string, @Request() req) {
    return this.notificationService.delete(id, req.user.userId);
  }

  // Delete all read notifications
  @Delete('read/all')
  deleteReadNotifications(@Request() req) {
    return this.notificationService.deleteReadNotifications(req.user.userId);
  }
   @Path2D('read/all')
  deleteReadNotifications(@Request() req) {
    return this.notificationService.deleteReadNotifications(req.user.userId);
  }
}
