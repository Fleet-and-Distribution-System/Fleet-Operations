import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { IsDateString, IsNumber, IsOptional, IsString, IsUUID } from 'class-validator';
import { FuelService } from './fuel.service';
import { CurrentUser, AuthUser } from '../common/current-user.decorator';
import { Roles, RolesGuard } from '../auth/roles.guard';

class CreateFuelLogDto {
  @IsUUID() vehicleId: string;
  @IsNumber() quantity: number;
  @IsOptional() @IsString() unit?: string;
  @IsOptional() @IsNumber() cost?: number;
  @IsOptional() @IsNumber() odometerAtFueling?: number;
  @IsOptional() @IsDateString() fuelDate?: string;
  @IsOptional() @IsString() station?: string;
}

@UseGuards(AuthGuard('jwt'), RolesGuard)
@Controller('fuel')
export class FuelController {
  constructor(private fuelService: FuelService) {}

  @Roles('COMPANY_ADMIN', 'DISPATCHER')
  @Post()
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateFuelLogDto) {
    return this.fuelService.create(user.companyId, {
      ...dto,
      fuelDate: dto.fuelDate ? new Date(dto.fuelDate) : undefined,
    });
  }

  @Roles('COMPANY_ADMIN', 'DISPATCHER')
  @Get()
  findAll(@CurrentUser() user: AuthUser, @Query('vehicleId') vehicleId?: string) {
    return this.fuelService.findAll(user.companyId, vehicleId);
  }

  @Roles('COMPANY_ADMIN', 'DISPATCHER')
  @Get(':id')
  findOne(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.fuelService.findOne(user.companyId, id);
  }
}
