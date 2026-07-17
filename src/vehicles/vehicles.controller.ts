import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { IsIn, IsInt, IsNumber, IsOptional, IsString, IsUUID } from 'class-validator';
import { VehiclesService } from './vehicles.service';
import { CurrentUser, AuthUser } from '../common/current-user.decorator';
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

@UseGuards(AuthGuard('jwt'))
@Controller('vehicles')
export class VehiclesController {
  constructor(private vehiclesService: VehiclesService) {}

  @Post()
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateVehicleDto) {
    return this.vehiclesService.create(user.companyId, dto);
  }

  @Get()
  findAll(@CurrentUser() user: AuthUser) {
    return this.vehiclesService.findAll(user.companyId);
  }

  @Get(':id')
  findOne(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.vehiclesService.findOne(user.companyId, id);
  }

  @Patch(':id/status')
  updateStatus(@CurrentUser() user: AuthUser, @Param('id') id: string, @Body() dto: UpdateStatusDto) {
    return this.vehiclesService.updateStatus(user.companyId, id, dto.status);
  }

  @Patch(':id/assign-driver')
  assignDriver(@CurrentUser() user: AuthUser, @Param('id') id: string, @Body() dto: AssignDriverDto) {
    return this.vehiclesService.assignDriver(user.companyId, id, dto.driverId ?? null);
  }
}
