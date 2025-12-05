import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as fs from 'fs';
import * as path from 'path';
import { Venue, VenueDocument, VenueType } from '../venue/schemas/venue.schema';
import { User, UserDocument, UserRole } from '../user/schemas/user.schema';

interface GeoJSONFeature {
  type: string;
  properties: {
    Venue_Name: string;
    Latitude: number;
    Longitude: number;
    Address: string;
    Contact: string | null;
    Ratings: number;
  };
  geometry: {
    type: string;
    coordinates: [number, number];
  };
}

interface GeoJSONData {
  type: string;
  name: string;
  features: GeoJSONFeature[];
}

@Injectable()
export class SeederService {
  private readonly logger = new Logger(SeederService.name);

  constructor(
    @InjectModel(Venue.name) private venueModel: Model<VenueDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
  ) {}

  async seedVenuesFromGeoJSON(ownerId?: string): Promise<{ 
    success: boolean; 
    message: string; 
    created: number; 
    skipped: number;
    errors: string[];
  }> {
    const errors: string[] = [];
    let created = 0;
    let skipped = 0;

    try {
      // Read GeoJSON file
      const geoJsonPath = path.join(process.cwd(), 'partpalace_project.geojson');
      
      if (!fs.existsSync(geoJsonPath)) {
        return {
          success: false,
          message: 'GeoJSON file not found at: ' + geoJsonPath,
          created: 0,
          skipped: 0,
          errors: ['File not found'],
        };
      }

      const geoJsonContent = fs.readFileSync(geoJsonPath, 'utf-8');
      const geoData: GeoJSONData = JSON.parse(geoJsonContent);

      // Get or create a default owner for seeded venues
      let owner: UserDocument | null = null;
      
      if (ownerId) {
        owner = await this.userModel.findById(ownerId);
        if (!owner) {
          return {
            success: false,
            message: 'Owner not found with ID: ' + ownerId,
            created: 0,
            skipped: 0,
            errors: ['Owner not found'],
          };
        }
      } else {
        // Find or create a default seed owner
        owner = await this.userModel.findOne({ email: 'seed-owner@ems.local' });
        
        if (!owner) {
          owner = await this.userModel.create({
            name: 'Seed Data Owner',
            email: 'seed-owner@ems.local',
            password: '$2b$10$K8aLZP7zPtP7CQv5H7qcOO.n0d7I3QN5P0lxX1rP5Z6c7d8e9f0g1', // hashed 'seedpassword123'
            role: UserRole.OWNER,
            isVerified: true,
            phoneNumber: '+9779800000000',
          });
          this.logger.log('Created default seed owner account');
        }
      }

      this.logger.log(`Processing ${geoData.features.length} venues from GeoJSON...`);

      for (const feature of geoData.features) {
        try {
          const { properties, geometry } = feature;
          
          // Check if venue already exists by name and location
          const existingVenue = await this.venueModel.findOne({
            name: properties.Venue_Name,
            'location.coordinates': geometry.coordinates,
          });

          if (existingVenue) {
            this.logger.debug(`Skipping duplicate venue: ${properties.Venue_Name}`);
            skipped++;
            continue;
          }

          // Determine city from address
          const city = this.extractCity(properties.Address);

          // Create venue
          const venue = new this.venueModel({
            name: properties.Venue_Name,
            description: `${properties.Venue_Name} is a premier event venue located at ${properties.Address}. Perfect for weddings, birthdays, corporate events, and all kinds of celebrations.`,
            address: properties.Address,
            city: city,
            minCapacity: 50,  // Default values
            maxCapacity: 500,
            pricePerHour: this.generateRandomPrice(5000, 15000),
            pricePerDay: this.generateRandomPrice(50000, 150000),
            amenities: this.generateAmenities(),
            images: this.generatePlaceholderImages(properties.Venue_Name),
            ownerId: owner._id,
            venueType: VenueType.BANQUET,
            openingTime: '09:00',
            closingTime: '22:00',
            isActive: true,
            isVerified: true,
            rating: properties.Ratings || 4.0,
            reviewCount: Math.floor(Math.random() * 50) + 5,
            contactPhone: properties.Contact || '+977-1-4000000',
            contactEmail: this.generateEmail(properties.Venue_Name),
            location: {
              type: 'Point',
              coordinates: geometry.coordinates, // [longitude, latitude]
            },
            cancellationPolicy: {
              fullRefundHours: 72,
              partialRefundHours: 24,
              partialRefundPercentage: 50,
              noRefundHours: 0,
            },
          });

          await venue.save();
          created++;
          this.logger.debug(`Created venue: ${properties.Venue_Name}`);
        } catch (err) {
          const errorMsg = `Failed to create venue ${feature.properties.Venue_Name}: ${err.message}`;
          this.logger.error(errorMsg);
          errors.push(errorMsg);
        }
      }

      this.logger.log(`Seeding completed: ${created} created, ${skipped} skipped, ${errors.length} errors`);

      return {
        success: true,
        message: `Successfully seeded venues from GeoJSON`,
        created,
        skipped,
        errors,
      };
    } catch (error) {
      this.logger.error('Failed to seed venues:', error);
      return {
        success: false,
        message: 'Failed to seed venues: ' + error.message,
        created,
        skipped,
        errors: [error.message],
      };
    }
  }

  async clearSeededVenues(): Promise<{ deleted: number }> {
    // Find the seed owner
    const seedOwner = await this.userModel.findOne({ email: 'seed-owner@ems.local' });
    
    if (!seedOwner) {
      return { deleted: 0 };
    }

    // Delete all venues owned by seed owner
    const result = await this.venueModel.deleteMany({ ownerId: seedOwner._id });
    
    this.logger.log(`Deleted ${result.deletedCount} seeded venues`);
    
    return { deleted: result.deletedCount };
  }

  async getSeederStats(): Promise<{
    totalVenues: number;
    seededVenues: number;
    geoJsonFeatures: number;
  }> {
    const totalVenues = await this.venueModel.countDocuments();
    
    const seedOwner = await this.userModel.findOne({ email: 'seed-owner@ems.local' });
    const seededVenues = seedOwner 
      ? await this.venueModel.countDocuments({ ownerId: seedOwner._id })
      : 0;

    let geoJsonFeatures = 0;
    try {
      const geoJsonPath = path.join(process.cwd(), 'partpalace_project.geojson');
      if (fs.existsSync(geoJsonPath)) {
        const content = fs.readFileSync(geoJsonPath, 'utf-8');
        const data = JSON.parse(content);
        geoJsonFeatures = data.features?.length || 0;
      }
    } catch {
      // Ignore errors
    }

    return {
      totalVenues,
      seededVenues,
      geoJsonFeatures,
    };
  }

  private extractCity(address: string): string {
    const addressLower = address.toLowerCase();
    
    if (addressLower.includes('kathmandu')) return 'Kathmandu';
    if (addressLower.includes('lalitpur')) return 'Lalitpur';
    if (addressLower.includes('bhaktapur')) return 'Bhaktapur';
    if (addressLower.includes('budhanilkantha')) return 'Kathmandu';
    if (addressLower.includes('gokarneshwor')) return 'Kathmandu';
    if (addressLower.includes('madhyapur thimi')) return 'Bhaktapur';
    
    // Default to Kathmandu
    return 'Kathmandu';
  }

  private generateRandomPrice(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1) + min);
  }

  private generateAmenities(): string[] {
    const allAmenities = [
      'Parking',
      'Air Conditioning',
      'Sound System',
      'Projector',
      'WiFi',
      'Catering',
      'Decoration',
      'Stage',
      'Dance Floor',
      'Garden Area',
      'Valet Parking',
      'Generator Backup',
      'Changing Room',
      'Kitchen',
      'Bar Area',
    ];

    // Randomly select 5-10 amenities
    const count = Math.floor(Math.random() * 6) + 5;
    const shuffled = allAmenities.sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
  }

  private generatePlaceholderImages(venueName: string): string[] {
    // Generate placeholder image URLs
    const slug = venueName.toLowerCase().replace(/[^a-z0-9]/g, '-');
    return [
      `https://placehold.co/1200x800/e91e63/white?text=${encodeURIComponent(venueName.slice(0, 20))}`,
      `https://placehold.co/1200x800/9c27b0/white?text=Hall+View`,
      `https://placehold.co/1200x800/673ab7/white?text=Interior`,
      `https://placehold.co/1200x800/3f51b5/white?text=Stage`,
    ];
  }

  private generateEmail(venueName: string): string {
    const slug = venueName
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '')
      .slice(0, 15);
    return `${slug}@venue.local`;
  }
}
