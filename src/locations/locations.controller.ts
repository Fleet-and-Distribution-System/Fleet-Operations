import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { IsBoolean, IsIn, IsNumber, IsOptional, IsString } from 'class-validator';
import { LocationsService } from './locations.service';
import { CurrentUser, AuthUser } from '../common/current-user.decorator';
import { Roles, RolesGuard } from '../auth/roles.guard';
import { LocationType } from '@prisma/client';

class CreateLocationDto {
  @IsString() name: string;
  @IsOptional() @IsIn(['DEPOT', 'WAREHOUSE', 'CUSTOMER_SITE', 'LOADING_POINT', 'OTHER'])
  type?: LocationType;
  @IsOptional() @IsString() address?: string;
  @IsOptional() @IsNumber() lat?: number;
  @IsOptional() @IsNumber() lng?: number;
}

class UpdateLocationDto {
  @IsOptional() @IsString() name?: string;
  @IsOptional() @IsIn(['DEPOT', 'WAREHOUSE', 'CUSTOMER_SITE', 'LOADING_POINT', 'OTHER'])
  type?: LocationType;
  @IsOptional() @IsString() address?: string;
  @IsOptional() @IsNumber() lat?: number;
  @IsOptional() @IsNumber() lng?: number;
}

class SetActiveDto {
  @IsBoolean() isActive: boolean;
}

@UseGuards(AuthGuard('jwt'), RolesGuard)
@Controller('locations')
export class LocationsController {
  constructor(private locationsService: LocationsService) {}

  @Roles('COMPANY_ADMIN', 'DISPATCHER')
  @Post()
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateLocationDto) {
    return this.locationsService.create(user.companyId, dto);
  }

  @Get()
  findAll(@CurrentUser() user: AuthUser) {
    return this.locationsService.findAll(user.companyId);
  }

  @Get(':id')
  findOne(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.locationsService.findOne(user.companyId, id);
  }

  @Roles('COMPANY_ADMIN', 'DISPATCHER')
  @Patch(':id')
  update(@CurrentUser() user: AuthUser, @Param('id') id: string, @Body() dto: UpdateLocationDto) {
    return this.locationsService.update(user.companyId, id, dto);
  }

  @Roles('COMPANY_ADMIN', 'DISPATCHER')
  @Patch(':id/active')
  setActive(@CurrentUser() user: AuthUser, @Param('id') id: string, @Body() dto: SetActiveDto) {
    return this.locationsService.setActive(user.companyId, id, dto.isActive);
  }
}
