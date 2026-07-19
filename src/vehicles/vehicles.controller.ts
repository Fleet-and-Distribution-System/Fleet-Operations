import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { IsIn, IsInt, IsNumber, IsOptional, IsString, IsUUID } from 'class-validator';
import { VehiclesService } from './vehicles.service';
import { CurrentUser, AuthUser } from '../common/current-user.decorator';
import { Roles, RolesGuard } from '../auth/roles.guard';
import { VehicleStatus } from '@prisma/client';

class CreateVehicleDto {
  @IsString() plateNumber: string;
  @IsOptional() @IsString() fleetNumber?: string;
  @IsOptional() @IsString() vin?: string;
  @IsOptional() @IsString() make?: string;
  @IsOptional() @IsString() model?: string;
  @IsOptional() @IsInt() year?: number;
  @IsOptional() @IsString() vehicleType?: string;
  @IsOptional() @IsNumber() capacity?: number;
  @IsOptional() @IsString() fuelType?: string;
}

class UpdateStatusDto {
  @IsIn(['AVAILABLE', 'LOADING', 'IN_TRANSIT', 'DELIVERED', 'MAINTENANCE', 'ACCIDENT', 'BREAKDOWN', 'PARKED', 'INACTIVE'])
  status: VehicleStatus;
}

class AssignDriverDto {
  @IsOptional() @IsUUID() driverId?: string;
}

@UseGuards(AuthGuard('jwt'), RolesGuard)
@Controller('vehicles')
export class VehiclesController {
  constructor(private vehiclesService: VehiclesService) {}

  @Roles('COMPANY_ADMIN', 'DISPATCHER')
  @Post()
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateVehicleDto) {
    return this.vehiclesService.create(user.companyId, dto);
  }

  @Roles('COMPANY_ADMIN', 'DISPATCHER')
  @Get()
  findAll(@CurrentUser() user: AuthUser) {
    return this.vehiclesService.findAll(user.companyId);
  }

  @Roles('COMPANY_ADMIN', 'DISPATCHER')
  @Get(':id')
  findOne(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.vehiclesService.findOne(user.companyId, id);
  }

  @Roles('COMPANY_ADMIN', 'DISPATCHER')
  @Patch(':id/status')
  updateStatus(@CurrentUser() user: AuthUser, @Param('id') id: string, @Body() dto: UpdateStatusDto) {
    return this.vehiclesService.updateStatus(user.companyId, id, dto.status);
  }

  @Roles('COMPANY_ADMIN', 'DISPATCHER')
  @Patch(':id/assign-driver')
  assignDriver(@CurrentUser() user: AuthUser, @Param('id') id: string, @Body() dto: AssignDriverDto) {
    return this.vehiclesService.assignDriver(user.companyId, id, dto.driverId ?? null);
  }
}
