import { Body, Controller, Get, Patch, Post, UploadedFile, UseGuards, UseInterceptors, BadRequestException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { AuthGuard } from '@nestjs/passport';
import { IsEmail, IsOptional, IsString, Matches, MinLength } from 'class-validator';
import { AuthService } from './auth.service';
import { CurrentUser, AuthUser } from '../common/current-user.decorator';

class RegisterCompanyDto {
  @IsString() companyName: string;
  @IsString() companySlug: string;
  @IsEmail() adminEmail: string;
  @IsOptional() @IsString() adminPhone?: string;
  @IsString() @MinLength(8) adminPassword: string;
  @IsString() adminFullName: string;
}

class LoginDto {
  @IsString() companySlug: string;
  @IsString() identifier: string;
  @IsString() password: string;
}

class LoginPinDto {
  @IsString() companySlug: string;
  @IsString() identifier: string;
  @IsString() pin: string;
}

class ChangePasswordDto {
  @IsString() currentPassword: string;
  @IsString() @MinLength(6) newPassword: string;
}

class SetPinDto {
  @IsString() currentPassword: string;
  @Matches(/^\d{4,6}$/, { message: 'PIN must be 4-6 digits' }) pin: string;
}

class UpdateMeDto {
  @IsOptional() @IsString() phone?: string;
}

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register-company')
  registerCompany(@Body() dto: RegisterCompanyDto) {
    return this.authService.registerCompany(dto);
  }

  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto.identifier, dto.password, dto.companySlug);
  }

  // Alternative driver quick-login using a PIN instead of the full password.
  @Post('login-pin')
  loginPin(@Body() dto: LoginPinDto) {
    return this.authService.loginPin(dto.identifier, dto.pin, dto.companySlug);
  }

  @UseGuards(AuthGuard('jwt'))
  @Post('change-password')
  changePassword(@CurrentUser() user: AuthUser, @Body() dto: ChangePasswordDto) {
    return this.authService.changePassword(user.userId, dto.currentPassword, dto.newPassword);
  }

  // Setting/changing the PIN requires the current password as proof of
  // identity, same trust model as change-password.
  @UseGuards(AuthGuard('jwt'))
  @Patch('pin')
  setPin(@CurrentUser() user: AuthUser, @Body() dto: SetPinDto) {
    return this.authService.setPin(user.userId, dto.currentPassword, dto.pin);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('me')
  me(@CurrentUser() user: AuthUser) {
    return this.authService.getMe(user.userId);
  }

  @UseGuards(AuthGuard('jwt'))
  @Patch('me')
  updateMe(@CurrentUser() user: AuthUser, @Body() dto: UpdateMeDto) {
    return this.authService.updateMe(user.userId, dto);
  }

  @UseGuards(AuthGuard('jwt'))
  @Post('me/photo')
  @UseInterceptors(FileInterceptor('photo'))
  async uploadMyPhoto(@CurrentUser() user: AuthUser, @UploadedFile() file: Express.Multer.File) {
    if (!file) throw new BadRequestException('No photo file provided (field name must be "photo")');
    if (!file.mimetype.startsWith('image/')) {
      throw new BadRequestException('Only image files are accepted');
    }
    return this.authService.updateMyPhoto(user.userId, user.companyId, file.buffer);
  }
}
