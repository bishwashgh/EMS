import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Venue, VenueDocument } from './schemas/venue.schema';
import { Inquiry, InquiryDocument, InquiryStatus } from './schemas/inquiry.schema';
import { CreateVenueDto } from './dto/createVenue.dto';
import { UpdateVenueDto } from './dto/updateVenue.dto';
import { QueryVenueDto, VenueSortBy } from './dto/queryVenue.dto';
import { CreateInquiryDto } from './dto/createInquiry.dto';

@Injectable()
export class VenueService {
  constructor(
    @InjectModel(Venue.name) private venueModel: Model<VenueDocument>,
    @InjectModel(Inquiry.name) private inquiryModel: Model<InquiryDocument>,
  ) {}

  async create(createVenueDto: CreateVenueDto, ownerId: string): Promise<VenueDocument> {
    const venue = new this.venueModel({
      ...createVenueDto,
      ownerId: new Types.ObjectId(ownerId),
    });
    return venue.save();
  }

  async findAll(queryDto: QueryVenueDto) {
    const {
      city,
      venueType,
      minCapacity,
      maxCapacity,
      minPrice,
      maxPrice,
      search,
      sortBy,
      amenities,
      verifiedOnly,
      minRating,
      latitude,
      longitude,
      radiusKm,
      page = 1,
      limit = 10,
    } = queryDto;

    const filter: any = { isActive: true };

    if (city) {
      filter.city = { $regex: city, $options: 'i' };
    }

    if (venueType) {
      filter.venueType = venueType;
    }

    if (minCapacity) {
      filter.maxCapacity = { $gte: minCapacity };
    }

    if (maxCapacity) {
      filter.minCapacity = { $lte: maxCapacity };
    }

    if (minPrice || maxPrice) {
      filter.pricePerHour = {};
      if (minPrice) filter.pricePerHour.$gte = minPrice;
      if (maxPrice) filter.pricePerHour.$lte = maxPrice;
    }

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { address: { $regex: search, $options: 'i' } },
      ];
    }

    // Advanced filters
    if (amenities && amenities.length > 0) {
      filter.amenities = { $all: amenities };
    }

    if (verifiedOnly) {
      filter.isVerified = true;
    }

    if (minRating) {
      filter.rating = { $gte: minRating };
    }

    // Geolocation search
    if (latitude && longitude && radiusKm) {
      filter.location = {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [longitude, latitude],
          },
          $maxDistance: radiusKm * 1000, // Convert km to meters
        },
      };
    }

    const skip = (page - 1) * limit;

    // Determine sort order
    let sortOption: any = { createdAt: -1 };
    if (sortBy) {
      switch (sortBy) {
        case VenueSortBy.PRICE_LOW:
          sortOption = { pricePerHour: 1 };
          break;
        case VenueSortBy.PRICE_HIGH:
          sortOption = { pricePerHour: -1 };
          break;
        case VenueSortBy.RATING:
          sortOption = { rating: -1, reviewCount: -1 };
          break;
        case VenueSortBy.POPULARITY:
          sortOption = { reviewCount: -1, rating: -1 };
          break;
        default:
          sortOption = { createdAt: -1 };
      }
    }

    const [venues, total] = await Promise.all([
      this.venueModel
        .find(filter)
        .populate('ownerId', 'name email')
        .skip(skip)
        .limit(limit)
        .sort(sortOption),
      this.venueModel.countDocuments(filter),
    ]);

    return {
      data: venues,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findById(id: string): Promise<VenueDocument> {
    const venue = await this.venueModel
      .findById(id)
      .populate('ownerId', 'name email phoneNumber');

    if (!venue) {
      throw new NotFoundException('Venue not found');
    }

    return venue;
  }

  async findByOwner(ownerId: string) {
    return this.venueModel.find({ ownerId: new Types.ObjectId(ownerId) });
  }

  async update(
    id: string,
    updateVenueDto: UpdateVenueDto,
    userId: string,
    userRole: string,
  ): Promise<VenueDocument> {
    const venue = await this.venueModel.findById(id);

    if (!venue) {
      throw new NotFoundException('Venue not found');
    }

    // Check ownership or admin role
    if (venue.ownerId.toString() !== userId && userRole !== 'ADMIN') {
      throw new ForbiddenException('You can only update your own venues');
    }

    Object.assign(venue, updateVenueDto);
    return venue.save();
  }

  async delete(id: string, userId: string, userRole: string): Promise<void> {
    const venue = await this.venueModel.findById(id);

    if (!venue) {
      throw new NotFoundException('Venue not found');
    }

    // Check ownership or admin role
    if (venue.ownerId.toString() !== userId && userRole !== 'ADMIN') {
      throw new ForbiddenException('You can only delete your own venues');
    }

    await this.venueModel.findByIdAndDelete(id);
  }

  async blockDates(id: string, dates: Date[], userId: string): Promise<VenueDocument> {
    const venue = await this.venueModel.findById(id);

    if (!venue) {
      throw new NotFoundException('Venue not found');
    }

    if (venue.ownerId.toString() !== userId) {
      throw new ForbiddenException('You can only block dates for your own venues');
    }

    venue.blockedDates = [...venue.blockedDates, ...dates];
    return venue.save();
  }

  async unblockDates(id: string, dates: Date[], userId: string): Promise<VenueDocument> {
    const venue = await this.venueModel.findById(id);

    if (!venue) {
      throw new NotFoundException('Venue not found');
    }

    if (venue.ownerId.toString() !== userId) {
      throw new ForbiddenException('You can only unblock dates for your own venues');
    }

    const datesToRemove = dates.map((d) => new Date(d).toISOString());
    venue.blockedDates = venue.blockedDates.filter(
      (d) => !datesToRemove.includes(new Date(d).toISOString()),
    );
    return venue.save();
  }

  async verifyVenue(id: string): Promise<VenueDocument> {
    const venue = await this.venueModel.findById(id);

    if (!venue) {
      throw new NotFoundException('Venue not found');
    }

    venue.isVerified = true;
    return venue.save();
  }

  async updateRating(id: string, newRating: number, newReviewCount: number): Promise<void> {
    await this.venueModel.findByIdAndUpdate(id, {
      rating: newRating,
      reviewCount: newReviewCount,
    });
  }

  // ==================== Featured & Popular Venues ====================

  async findFeatured(limit: number = 10) {
    const now = new Date();
    return this.venueModel
      .find({
        isActive: true,
        isFeatured: true,
        $or: [
          { featuredUntil: { $gte: now } },
          { featuredUntil: null },
        ],
      })
      .populate('ownerId', 'name email')
      .limit(limit)
      .sort({ rating: -1 });
  }

  async findPopular(limit: number = 10) {
    return this.venueModel
      .find({ isActive: true })
      .populate('ownerId', 'name email')
      .limit(limit)
      .sort({ reviewCount: -1, rating: -1 });
  }

  async findNearby(latitude: number, longitude: number, radiusKm: number = 10, limit: number = 20) {
    return this.venueModel
      .find({
        isActive: true,
        location: {
          $near: {
            $geometry: {
              type: 'Point',
              coordinates: [longitude, latitude],
            },
            $maxDistance: radiusKm * 1000,
          },
        },
      })
      .populate('ownerId', 'name email')
      .limit(limit);
  }

  async setFeatured(id: string, isFeatured: boolean, featuredUntil?: Date): Promise<VenueDocument> {
    const venue = await this.venueModel.findById(id);
    if (!venue) {
      throw new NotFoundException('Venue not found');
    }

    venue.isFeatured = isFeatured;
    venue.featuredUntil = isFeatured ? featuredUntil : undefined;
    return venue.save();
  }

  // ==================== Inquiry System ====================

  async createInquiry(
    venueId: string,
    createInquiryDto: CreateInquiryDto,
    userId?: string,
  ): Promise<InquiryDocument> {
    const venue = await this.venueModel.findById(venueId);
    if (!venue) {
      throw new NotFoundException('Venue not found');
    }

    const inquiry = new this.inquiryModel({
      ...createInquiryDto,
      venueId: new Types.ObjectId(venueId),
      userId: userId ? new Types.ObjectId(userId) : undefined,
    });

    return inquiry.save();
  }

  async findInquiriesByVenue(venueId: string, userId: string, userRole: string) {
    const venue = await this.venueModel.findById(venueId);
    if (!venue) {
      throw new NotFoundException('Venue not found');
    }

    // Only owner or admin can see inquiries
    if (venue.ownerId.toString() !== userId && userRole !== 'ADMIN') {
      throw new ForbiddenException('You can only view inquiries for your own venues');
    }

    return this.inquiryModel
      .find({ venueId: new Types.ObjectId(venueId) })
      .populate('userId', 'name email')
      .sort({ createdAt: -1 });
  }

  async findInquiriesByUser(userId: string) {
    return this.inquiryModel
      .find({ userId: new Types.ObjectId(userId) })
      .populate('venueId', 'name city address')
      .sort({ createdAt: -1 });
  }

  async respondToInquiry(
    inquiryId: string,
    response: string,
    userId: string,
    userRole: string,
  ): Promise<InquiryDocument> {
    const inquiry = await this.inquiryModel.findById(inquiryId).populate('venueId');
    if (!inquiry) {
      throw new NotFoundException('Inquiry not found');
    }

    const venue = inquiry.venueId as unknown as VenueDocument;
    
    // Only venue owner or admin can respond
    if (venue.ownerId.toString() !== userId && userRole !== 'ADMIN') {
      throw new ForbiddenException('You can only respond to inquiries for your own venues');
    }

    inquiry.ownerResponse = response;
    inquiry.respondedAt = new Date();
    inquiry.status = InquiryStatus.RESPONDED;

    return inquiry.save();
  }

  async closeInquiry(
    inquiryId: string,
    userId: string,
    userRole: string,
  ): Promise<InquiryDocument> {
    const inquiry = await this.inquiryModel.findById(inquiryId).populate('venueId');
    if (!inquiry) {
      throw new NotFoundException('Inquiry not found');
    }

    const venue = inquiry.venueId as unknown as VenueDocument;
    
    // Only venue owner, inquiry creator, or admin can close
    const isOwner = venue.ownerId.toString() === userId;
    const isCreator = inquiry.userId?.toString() === userId;
    const isAdmin = userRole === 'ADMIN';

    if (!isOwner && !isCreator && !isAdmin) {
      throw new ForbiddenException('You do not have permission to close this inquiry');
    }

    inquiry.status = InquiryStatus.CLOSED;
    return inquiry.save();
  }

  async getInquiryById(inquiryId: string, userId: string, userRole: string): Promise<InquiryDocument> {
    const inquiry = await this.inquiryModel
      .findById(inquiryId)
      .populate('venueId', 'name city address ownerId')
      .populate('userId', 'name email');

    if (!inquiry) {
      throw new NotFoundException('Inquiry not found');
    }

    const venue = inquiry.venueId as unknown as VenueDocument;
    const isOwner = venue.ownerId.toString() === userId;
    const isCreator = inquiry.userId?.toString() === userId;
    const isAdmin = userRole === 'ADMIN';

    if (!isOwner && !isCreator && !isAdmin) {
      throw new ForbiddenException('You do not have permission to view this inquiry');
    }

    return inquiry;
  }
}
