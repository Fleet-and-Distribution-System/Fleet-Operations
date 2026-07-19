import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { IsBoolean, IsDateString, IsEmail, IsOptional, IsString, MinLength } from 'class-validator';
import { DriversService } from './drivers.service';
import { CurrentUser, AuthUser } from '../common/current-user.decorator';
import { Roles } from '../auth/roles.guard';
import { RolesGuard } from '../auth/roles.guard';

class CreateDriverDto {
  @IsString() fullName: string;
  @IsOptional() @IsString() phone?: string;
  @IsOptional() @IsString() licenseNumber?: string;
  @IsOptional() @IsDateString() licenseExpiry?: string;

  @IsOptional() @IsEmail() loginEmail?: string;
  @IsOptional() @IsString() loginPhone?: string;
  @IsOptional() @IsString() @MinLength(6) loginPassword?: string;
}

class UpdateDriverDto {
  @IsOptional() @IsString() fullName?: string;
  @IsOptional() @IsString() phone?: string;
  @IsOptional() @IsString() licenseNumber?: string;
  @IsOptional() @IsDateString() licenseExpiry?: string;
}

class SetActiveDto {
  @IsBoolean() isActive: boolean;
}

class ResetPasswordDto {
  @IsString() @MinLength(6) newPassword: string;
}

@UseGuards(AuthGuard('jwt'), RolesGuard)
@Controller('drivers')
export class DriversController {
  constructor(private driversService: DriversService) {}

  @Roles('COMPANY_ADMIN', 'DISPATCHER')
  @Post()
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateDriverDto) {
    return this.driversService.create(user.companyId, {
      ...dto,
      licenseExpiry: dto.licenseExpiry ? new Date(dto.licenseExpiry) : undefined,
    });
  }

  @Roles('COMPANY_ADMIN', 'DISPATCHER')
  @Get()
  findAll(@CurrentUser() user: AuthUser) {
    return this.driversService.findAll(user.companyId);
  }

  @Roles('COMPANY_ADMIN', 'DISPATCHER')
  @Get(':id')
  findOne(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.driversService.findOne(user.companyId, id);
  }

  @Roles('COMPANY_ADMIN', 'DISPATCHER')
  @Patch(':id')
  update(@CurrentUser() user: AuthUser, @Param('id') id: string, @Body() dto: UpdateDriverDto) {
    return this.driversService.update(user.companyId, id, {
      ...dto,
      licenseExpiry: dto.licenseExpiry ? new Date(dto.licenseExpiry) : undefined,
    });
  }

  @Roles('COMPANY_ADMIN', 'DISPATCHER')
  @Patch(':id/active')
  setActive(@CurrentUser() user: AuthUser, @Param('id') id: string, @Body() dto: SetActiveDto) {
    return this.driversService.setActive(user.companyId, id, dto.isActive);
  }

  @Roles('COMPANY_ADMIN', 'DISPATCHER')
  @Patch(':id/reset-password')
  resetPassword(@CurrentUser() user: AuthUser, @Param('id') id: string, @Body() dto: ResetPasswordDto) {
    return this.driversService.resetPassword(user.companyId, id, dto.newPassword);
  }
}
