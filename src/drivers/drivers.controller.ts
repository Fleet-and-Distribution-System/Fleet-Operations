import { Body, Controller, Get, Param, Patch, Post, UploadedFile, UseGuards, UseInterceptors, BadRequestException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { AuthGuard } from '@nestjs/passport';
import { IsBoolean, IsDateString, IsEmail, IsOptional, IsString, MinLength } from 'class-validator';
import { DriversService } from './drivers.service';
import { CloudinaryService } from '../common/cloudinary.service';
import { CurrentUser, AuthUser } from '../common/current-user.decorator';
import { Roles, RolesGuard } from '../auth/roles.guard';

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
  constructor(
    private driversService: DriversService,
    private cloudinary: CloudinaryService,
  ) {}

  @Roles('COMPANY_ADMIN', 'DISPATCHER')
  @Post()
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateDriverDto) {
    return this.driversService.create(user.companyId, {
      ...dto,
      licenseExpiry: dto.licenseExpiry ? new Date(dto.licenseExpiry) : undefined,
    });
  }

  @Get()
  findAll(@CurrentUser() user: AuthUser) {
    return this.driversService.findAll(user.companyId);
  }

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

  @Roles('COMPANY_ADMIN', 'DISPATCHER')
  @Post(':id/photo')
  @UseInterceptors(FileInterceptor('photo'))
  async uploadPhoto(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) throw new BadRequestException('No photo file provided (field name must be "photo")');
    if (!file.mimetype.startsWith('image/')) {
      throw new BadRequestException('Only image files are accepted');
    }
    const url = await this.cloudinary.uploadImage(file.buffer, `fleet-ops/${user.companyId}/drivers/${id}`);
    return this.driversService.setPhoto(user.companyId, id, url);
  }
}
