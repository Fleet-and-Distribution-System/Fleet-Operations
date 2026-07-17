import { Module } from '@nestjs/common';
import { WaybillsService } from './waybills.service';
import { WaybillsController } from './waybills.controller';
import { PrismaService } from '../common/prisma.service';

@Module({
  controllers: [WaybillsController],
  providers: [WaybillsService, PrismaService],
})
export class WaybillsModule {}
