import { Module } from '@nestjs/common';
import { WaybillsService } from './waybills.service';
import { WaybillsController } from './waybills.controller';
import { PrismaService } from '../common/prisma.service';
import { CloudinaryService } from '../common/cloudinary.service';
import { PdfService } from '../common/pdf.service';

@Module({
  controllers: [WaybillsController],
  providers: [WaybillsService, PrismaService, CloudinaryService, PdfService],
})
export class WaybillsModule {}
