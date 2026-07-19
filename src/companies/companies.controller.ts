import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { IsOptional, IsString, MinLength } from 'class-validator';
import { CompaniesService } from './companies.service';
import { CurrentUser, AuthUser } from '../common/current-user.decorator';
import { Roles, RolesGuard } from '../auth/roles.guard';

class UpdateCompanyDto {
  @IsOptional() @IsString() @MinLength(2) name?: string;
}

@UseGuards(AuthGuard('jwt'), RolesGuard)
@Controller('company')
export class CompaniesController {
  constructor(private companiesService: CompaniesService) {}

  @Get()
  getOwn(@CurrentUser() user: AuthUser) {
    return this.companiesService.getOwn(user.companyId);
  }

  @Roles('COMPANY_ADMIN')
  @Patch()
  updateOwn(@CurrentUser() user: AuthUser, @Body() dto: UpdateCompanyDto) {
    return this.companiesService.updateOwn(user.companyId, dto);
  }
}
