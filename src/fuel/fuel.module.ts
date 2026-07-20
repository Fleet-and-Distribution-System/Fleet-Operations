import { Module } from '@nestjs/common';
import { FuelService } from './fuel.service';
import { FuelController } from './fuel.controller';
import { PrismaService } from '../common/prisma.service';

@Module({
  controllers: [FuelController],
  providers: [FuelService, PrismaService],
})
export class FuelModule {}
