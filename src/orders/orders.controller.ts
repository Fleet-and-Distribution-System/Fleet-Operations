import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { IsDateString, IsIn, IsNumber, IsOptional, IsString, IsUUID } from 'class-validator';
import { OrdersService } from './orders.service';
import { CurrentUser, AuthUser } from '../common/current-user.decorator';
import { Roles, RolesGuard } from '../auth/roles.guard';
import { OrderStatus } from '@prisma/client';

class CreateOrderDto {
  @IsUUID() customerId: string;
  @IsString() pickupLocation: string;
  @IsString() destinationLocation: string;
  @IsOptional() @IsString() cargoDescription?: string;
  @IsOptional() @IsNumber() weightKg?: number;
  @IsOptional() @IsIn(['normal', 'high', 'urgent']) priority?: string;
  @IsOptional() @IsDateString() requestedDeliveryDate?: string;
}

class UpdateOrderStatusDto {
  @IsIn(['PENDING', 'ASSIGNED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'])
  status: OrderStatus;
}

@UseGuards(AuthGuard('jwt'), RolesGuard)
@Controller('orders')
export class OrdersController {
  constructor(private ordersService: OrdersService) {}

  @Roles('COMPANY_ADMIN', 'DISPATCHER')
  @Post()
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateOrderDto) {
    return this.ordersService.create(user.companyId, {
      ...dto,
      requestedDeliveryDate: dto.requestedDeliveryDate ? new Date(dto.requestedDeliveryDate) : undefined,
    });
  }

  @Get()
  findAll(@CurrentUser() user: AuthUser, @Query('status') status?: OrderStatus) {
    return this.ordersService.findAll(user.companyId, status);
  }

  @Get(':id')
  findOne(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.ordersService.findOne(user.companyId, id);
  }

  @Roles('COMPANY_ADMIN', 'DISPATCHER')
  @Patch(':id/status')
  updateStatus(@CurrentUser() user: AuthUser, @Param('id') id: string, @Body() dto: UpdateOrderStatusDto) {
    return this.ordersService.updateStatus(user.companyId, id, dto.status);
  }
}
