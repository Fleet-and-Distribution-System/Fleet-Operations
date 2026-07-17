import { Module } from '@nestjs/common';
import { DriversService } from './drivers.service';
import { DriversController } from './drivers.controller';
import { PrismaService } from '../common/prisma.service';

@Module({
  controllers: [DriversController],
  providers: [DriversService, PrismaService],
})
export class DriversModule {}
