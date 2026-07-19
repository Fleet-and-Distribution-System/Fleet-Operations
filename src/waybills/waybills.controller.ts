import { Body, Controller, Get, Param, Patch, Post, Res, UploadedFile, UseGuards, UseInterceptors, BadRequestException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import { AuthGuard } from '@nestjs/passport';
import { ArrayNotEmpty, IsArray, IsOptional, IsString, IsUUID } from 'class-validator';
import { WaybillsService } from './waybills.service';
import { CloudinaryService } from '../common/cloudinary.service';
import { PdfService } from '../common/pdf.service';
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
    private pdfService: PdfService,
  ) {}

  @Roles('COMPANY_ADMIN', 'DISPATCHER', 'DRIVER')
  @Post()
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateWaybillDto) {
    return this.waybillsService.create(user.companyId, dto, user);
  }

  @Roles('COMPANY_ADMIN', 'DISPATCHER')
  @Get()
  findAll(@CurrentUser() user: AuthUser) {
    return this.waybillsService.findAll(user.companyId);
  }

  @Roles('COMPANY_ADMIN', 'DISPATCHER')
  @Get(':id')
  findOne(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.waybillsService.findOne(user.companyId, id);
  }

  @Get(':id/pdf')
  async downloadPdf(@CurrentUser() user: AuthUser, @Param('id') id: string, @Res() res: Response) {
    const waybill = await this.waybillsService.findOneWithFullDetails(user.companyId, id);
    const trip = waybill.trip;

    const pdfStream = this.pdfService.generateWaybillPdf({
      waybillNumber: waybill.waybillNumber,
      sealNumber: waybill.sealNumber,
      productsSummary: waybill.productsSummary,
      receiverName: waybill.receiverName,
      receiverPhone: waybill.receiverPhone,
      signedByName: waybill.signedByName,
      signedAt: waybill.signedAt,
      createdAt: waybill.createdAt,
      companyName: waybill.company.name,
      orderNumber: trip.transportOrder.orderNumber,
      pickupLocation: trip.transportOrder.pickupLocation,
      destinationLocation: trip.transportOrder.destinationLocation,
      vehiclePlate: trip.vehicle.plateNumber,
      driverName: trip.driver.fullName,
    });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${waybill.waybillNumber}.pdf"`);
    pdfStream.pipe(res);
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
