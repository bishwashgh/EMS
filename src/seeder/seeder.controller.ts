import { Controller, Post, Delete, Get, UseGuards, Body } from '@nestjs/common';
import { SeederService } from './seeder.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('seeder')
export class SeederController {
  constructor(private readonly seederService: SeederService) {}

  // Admin: Seed venues from GeoJSON
  @Post('venues')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  async seedVenues(@Body('ownerId') ownerId?: string) {
    return this.seederService.seedVenuesFromGeoJSON(ownerId);
  }

  // Admin: Clear all seeded venues
  @Delete('venues')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  async clearSeededVenues() {
    return this.seederService.clearSeededVenues();
  }

  // Admin: Get seeder statistics
  @Get('stats')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  async getStats() {
    return this.seederService.getSeederStats();
  }

  // Public endpoint to seed (for initial setup - should be disabled in production)
  @Post('venues/init')
  async initSeedVenues() {
    // This is a convenience endpoint for initial setup
    // In production, you should remove or protect this
    if (process.env.NODE_ENV === 'production') {
      return {
        success: false,
        message: 'This endpoint is disabled in production. Use the admin endpoint instead.',
      };
    }
    return this.seederService.seedVenuesFromGeoJSON();
  }
}
