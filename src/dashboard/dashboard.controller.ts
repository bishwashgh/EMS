import { Controller, Get, UseGuards, Request } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  // User Dashboard
  @Get('user')
  @UseGuards(JwtAuthGuard)
  getUserDashboard(@Request() req) {
    return this.dashboardService.getUserDashboard(req.user.userId);
  }

  // Owner Dashboard
  @Get('owner')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('OWNER', 'ADMIN')
  getOwnerDashboard(@Request() req) {
    return this.dashboardService.getOwnerDashboard(req.user.userId);
  }

  // Admin Dashboard
  @Get('admin')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  getAdminDashboard() {
    return this.dashboardService.getAdminDashboard();
  }
}
