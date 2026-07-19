import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { IsEmail, IsOptional, IsString, MinLength } from 'class-validator';
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

class ChangePasswordDto {
  @IsString() currentPassword: string;
  @IsString() @MinLength(6) newPassword: string;
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

  @UseGuards(AuthGuard('jwt'))
  @Post('change-password')
  changePassword(@CurrentUser() user: AuthUser, @Body() dto: ChangePasswordDto) {
    return this.authService.changePassword(user.userId, dto.currentPassword, dto.newPassword);
  }
}
