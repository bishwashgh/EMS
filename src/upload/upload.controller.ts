import {
  Controller,
  Post,
  Delete,
  Param,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  UploadedFiles,
  BadRequestException,
  Request,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { UploadService, UploadFolder } from './upload.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../user/schemas/user.schema';

const multerOptions = {
  storage: memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
  fileFilter: (req: any, file: Express.Multer.File, callback: any) => {
    const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (allowedMimeTypes.includes(file.mimetype)) {
      callback(null, true);
    } else {
      callback(new BadRequestException('Invalid file type'), false);
    }
  },
};

@Controller('upload')
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  // Upload avatar for current user
  @Post('avatar')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('file', multerOptions))
  async uploadAvatar(@UploadedFile() file: Express.Multer.File, @Request() req) {
    if (!file) {
      throw new BadRequestException('No file provided');
    }
    
    const result = await this.uploadService.uploadFile(file, 'avatars');
    
    // Note: You would typically update the user's avatar field here
    // await this.userService.updateAvatar(req.user.userId, result.url);
    
    return {
      message: 'Avatar uploaded successfully',
      ...result,
    };
  }

  // Upload venue images (owner only)
  @Post('venue/:venueId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.OWNER, UserRole.ADMIN)
  @UseInterceptors(FilesInterceptor('files', 10, multerOptions))
  async uploadVenueImages(
    @UploadedFiles() files: Express.Multer.File[],
    @Param('venueId') venueId: string,
  ) {
    if (!files || files.length === 0) {
      throw new BadRequestException('No files provided');
    }

    const results = await this.uploadService.uploadMultipleFiles(files, 'venues');

    // Note: You would typically update the venue's images array here
    // await this.venueService.addImages(venueId, results.map(r => r.url));

    return {
      message: `${results.length} images uploaded successfully`,
      images: results,
    };
  }

  // Upload review images
  @Post('review')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FilesInterceptor('files', 5, multerOptions))
  async uploadReviewImages(@UploadedFiles() files: Express.Multer.File[]) {
    if (!files || files.length === 0) {
      throw new BadRequestException('No files provided');
    }

    const results = await this.uploadService.uploadMultipleFiles(files, 'reviews');

    return {
      message: `${results.length} images uploaded successfully`,
      images: results,
    };
  }

  // Generic single file upload
  @Post(':folder')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('file', multerOptions))
  async uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @Param('folder') folder: string,
  ) {
    const validFolders: UploadFolder[] = ['venues', 'reviews', 'avatars'];
    if (!validFolders.includes(folder as UploadFolder)) {
      throw new BadRequestException('Invalid upload folder');
    }

    if (!file) {
      throw new BadRequestException('No file provided');
    }

    const result = await this.uploadService.uploadFile(file, folder as UploadFolder);

    return {
      message: 'File uploaded successfully',
      ...result,
    };
  }

  // Delete file by public ID
  @Delete(':publicId')
  @UseGuards(JwtAuthGuard)
  async deleteFile(@Param('publicId') publicId: string) {
    // Note: In production, you should verify the user owns the file
    const success = await this.uploadService.deleteFile(publicId);

    if (success) {
      return { message: 'File deleted successfully' };
    } else {
      throw new BadRequestException('Failed to delete file');
    }
  }
}
