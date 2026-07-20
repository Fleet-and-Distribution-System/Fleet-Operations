import { Module } from '@nestjs/common';
import { VehiclesService } from './vehicles.service';
import { VehiclesController } from './vehicles.controller';
import { PrismaService } from '../common/prisma.service';
import { CloudinaryService } from '../common/cloudinary.service';

@Module({
  controllers: [VehiclesController],
  providers: [VehiclesService, PrismaService, CloudinaryService],
})
export class VehiclesModule {}
