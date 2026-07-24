import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { IsBoolean, IsEmail, IsIn, IsOptional, IsString, MinLength } from 'class-validator';
import { UsersService } from './users.service';
import { CurrentUser, AuthUser } from '../common/current-user.decorator';
import { Roles, RolesGuard } from '../auth/roles.guard';

class CreateUserDto {
  @IsEmail() email: string;
  @IsOptional() @IsString() phone?: string;
  @IsString() fullName: string;
  @IsString() @MinLength(6) password: string;
  @IsIn(['COMPANY_ADMIN', 'DISPATCHER']) role: 'COMPANY_ADMIN' | 'DISPATCHER';
}

class SetActiveDto {
  @IsBoolean() isActive: boolean;
}

// Only COMPANY_ADMIN can manage other staff accounts — a dispatcher
// shouldn't be able to create or deactivate other users, including admins.
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Controller('users')
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Roles('COMPANY_ADMIN')
  @Post()
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateUserDto) {
    return this.usersService.create(user.companyId, dto);
  }

  @Roles('COMPANY_ADMIN')
  @Get()
  findAll(@CurrentUser() user: AuthUser) {
    return this.usersService.findAll(user.companyId);
  }

  @Roles('COMPANY_ADMIN')
  @Patch(':id/active')
  setActive(@CurrentUser() user: AuthUser, @Param('id') id: string, @Body() dto: SetActiveDto) {
    return this.usersService.setActive(user.companyId, id, dto.isActive);
  }
}
