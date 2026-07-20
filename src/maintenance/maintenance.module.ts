import { Module } from '@nestjs/common';
import { MaintenanceService } from './maintenance.service';
import { MaintenanceController } from './maintenance.controller';
import { PrismaService } from '../common/prisma.service';

@Module({
  controllers: [MaintenanceController],
  providers: [MaintenanceService, PrismaService],
})
export class MaintenanceModule {}
