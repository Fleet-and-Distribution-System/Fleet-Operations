import { Module } from '@nestjs/common';
import { TripsService } from './trips.service';
import { TripsController } from './trips.controller';
import { PrismaService } from '../common/prisma.service';
import { EmailService } from '../common/email.service';

@Module({
  controllers: [TripsController],
  providers: [TripsService, PrismaService, EmailService],
})
export class TripsModule {}
