import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { IsArray, IsDateString, IsOptional, IsUUID } from 'class-validator';
import { TripsService } from './trips.service';
import { CurrentUser, AuthUser } from '../common/current-user.decorator';
import { Roles, RolesGuard } from '../auth/roles.guard';
import { TripStatus } from '@prisma/client';

class CreateTripDto {
  @IsUUID() transportOrderId: string;
  @IsUUID() vehicleId: string;
  @IsUUID() driverId: string;
  @IsOptional() @IsDateString() plannedDeparture?: string;
  @IsOptional() @IsDateString() plannedArrival?: string;
  @IsOptional() @IsArray() stops?: unknown[];
}

@UseGuards(AuthGuard('jwt'), RolesGuard)
@Controller('trips')
export class TripsController {
  constructor(private tripsService: TripsService) {}

  @Roles('COMPANY_ADMIN', 'DISPATCHER')
  @Post()
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateTripDto) {
    return this.tripsService.create(user.companyId, {
      ...dto,
      plannedDeparture: dto.plannedDeparture ? new Date(dto.plannedDeparture) : undefined,
      plannedArrival: dto.plannedArrival ? new Date(dto.plannedArrival) : undefined,
    });
  }

  @Get()
  findAll(@CurrentUser() user: AuthUser, @Query('status') status?: TripStatus) {
    return this.tripsService.findAll(user.companyId, status);
  }

  @Get(':id')
  findOne(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.tripsService.findOne(user.companyId, id);
  }

  @Roles('COMPANY_ADMIN', 'DISPATCHER', 'DRIVER')
  @Patch(':id/start')
  start(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.tripsService.start(user.companyId, id);
  }

  @Roles('COMPANY_ADMIN', 'DISPATCHER', 'DRIVER')
  @Patch(':id/complete')
  complete(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.tripsService.complete(user.companyId, id);
  }

  @Roles('COMPANY_ADMIN', 'DISPATCHER')
  @Patch(':id/cancel')
  cancel(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.tripsService.cancel(user.companyId, id);
  }
}
