import { Body, Controller, Post } from '@nestjs/common';
import { IsEmail, IsOptional, IsString, MinLength } from 'class-validator';
import { AuthService } from './auth.service';

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
  @IsString() identifier: string; // email or phone
  @IsString() password: string;
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
}
