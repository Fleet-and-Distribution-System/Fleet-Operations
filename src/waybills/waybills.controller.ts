import { Body, Controller, Get, Param, Patch, Post, UploadedFile, UseGuards, UseInterceptors, BadRequestException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { AuthGuard } from '@nestjs/passport';
import { ArrayNotEmpty, IsArray, IsOptional, IsString, IsUUID } from 'class-validator';
import { WaybillsService } from './waybills.service';
import { CloudinaryService } from '../common/cloudinary.service';
import { CurrentUser, AuthUser } from '../common/current-user.decorator';
import { Roles, RolesGuard } from '../auth/roles.guard';

class CreateWaybillDto {
  @IsUUID() tripId: string;
  @IsOptional() @IsString() sealNumber?: string;
  @IsOptional() @IsString() productsSummary?: string;
}

class RecordProofOfDeliveryDto {
  @IsString() receiverName: string;
  @IsOptional() @IsString() receiverPhone?: string;
  @IsOptional() @IsArray() @ArrayNotEmpty() deliveryPhotos?: string[];
  @IsOptional() @IsString() signedByName?: string;
}

@UseGuards(AuthGuard('jwt'), RolesGuard)
@Controller('waybills')
export class WaybillsController {
  constructor(
    private waybillsService: WaybillsService,
    private cloudinary: CloudinaryService,
  ) {}

  @Roles('COMPANY_ADMIN', 'DISPATCHER')
  @Post()
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateWaybillDto) {
    return this.waybillsService.create(user.companyId, dto);
  }

  @Get()
  findAll(@CurrentUser() user: AuthUser) {
    return this.waybillsService.findAll(user.companyId);
  }

  @Get(':id')
  findOne(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.waybillsService.findOne(user.companyId, id);
  }

  @Roles('COMPANY_ADMIN', 'DISPATCHER', 'DRIVER')
  @Post(':id/photos')
  @UseInterceptors(FileInterceptor('photo'))
  async uploadPhoto(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) throw new BadRequestException('No photo file provided (field name must be "photo")');
    if (!file.mimetype.startsWith('image/')) {
      throw new BadRequestException('Only image files are accepted');
    }
    const url = await this.cloudinary.uploadImage(file.buffer, `fleet-ops/${user.companyId}/waybills/${id}`);
    return this.waybillsService.addDeliveryPhoto(user.companyId, id, url);
  }

  @Roles('COMPANY_ADMIN', 'DISPATCHER', 'DRIVER')
  @Patch(':id/proof-of-delivery')
  recordProofOfDelivery(@CurrentUser() user: AuthUser, @Param('id') id: string, @Body() dto: RecordProofOfDeliveryDto) {
    return this.waybillsService.recordProofOfDelivery(user.companyId, id, dto);
  }
}
