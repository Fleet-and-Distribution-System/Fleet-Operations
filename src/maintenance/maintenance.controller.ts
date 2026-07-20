import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { IsDateString, IsNumber, IsOptional, IsString, IsUUID } from 'class-validator';
import { MaintenanceService } from './maintenance.service';
import { CurrentUser, AuthUser } from '../common/current-user.decorator';
import { Roles, RolesGuard } from '../auth/roles.guard';

class CreateMaintenanceDto {
  @IsUUID() vehicleId: string;
  @IsString() serviceType: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsNumber() cost?: number;
  @IsOptional() @IsNumber() odometerAtService?: number;
  @IsOptional() @IsDateString() serviceDate?: string;
  @IsOptional() @IsDateString() nextDueDate?: string;
  @IsOptional() @IsNumber() nextDueOdometer?: number;
}

@UseGuards(AuthGuard('jwt'), RolesGuard)
@Controller('maintenance')
export class MaintenanceController {
  constructor(private maintenanceService: MaintenanceService) {}

  @Roles('COMPANY_ADMIN', 'DISPATCHER')
  @Post()
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateMaintenanceDto) {
    return this.maintenanceService.create(user.companyId, {
      ...dto,
      serviceDate: dto.serviceDate ? new Date(dto.serviceDate) : undefined,
      nextDueDate: dto.nextDueDate ? new Date(dto.nextDueDate) : undefined,
    });
  }

  @Roles('COMPANY_ADMIN', 'DISPATCHER')
  @Get()
  findAll(@CurrentUser() user: AuthUser, @Query('vehicleId') vehicleId?: string) {
    return this.maintenanceService.findAll(user.companyId, vehicleId);
  }

  @Roles('COMPANY_ADMIN', 'DISPATCHER')
  @Get(':id')
  findOne(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.maintenanceService.findOne(user.companyId, id);
  }
}
