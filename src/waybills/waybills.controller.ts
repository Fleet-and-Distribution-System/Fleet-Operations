import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ArrayNotEmpty, IsArray, IsOptional, IsString, IsUUID } from 'class-validator';
import { WaybillsService } from './waybills.service';
import { CurrentUser, AuthUser } from '../common/current-user.decorator';
import { Roles, RolesGuard } from '../auth/roles.guard';

class CreateWaybillDto {
  @IsUUID() tripId: string;
  @IsOptional() @IsString() sealNumber?: string;
  @IsOptional() @IsString() productsSummary?: string;
}

class RecordProofOfDeliveryDto {
  @IsString() receiverName: string;
  @IsOptional() @IsString() receiverPhone?: string;
  @IsOptional() @IsArray() @ArrayNotEmpty() deliveryPhotos?: string[];
  @IsOptional() @IsString() signedByName?: string;
}

@UseGuards(AuthGuard('jwt'), RolesGuard)
@Controller('waybills')
export class WaybillsController {
  constructor(private waybillsService: WaybillsService) {}

  @Roles('COMPANY_ADMIN', 'DISPATCHER')
  @Post()
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateWaybillDto) {
    return this.waybillsService.create(user.companyId, dto);
  }

  @Get()
  findAll(@CurrentUser() user: AuthUser) {
    return this.waybillsService.findAll(user.companyId);
  }

  @Get(':id')
  findOne(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.waybillsService.findOne(user.companyId, id);
  }

  @Roles('COMPANY_ADMIN', 'DISPATCHER', 'DRIVER')
  @Patch(':id/proof-of-delivery')
  recordProofOfDelivery(@CurrentUser() user: AuthUser, @Param('id') id: string, @Body() dto: RecordProofOfDeliveryDto) {
    return this.waybillsService.recordProofOfDelivery(user.companyId, id, dto);
  }
}
