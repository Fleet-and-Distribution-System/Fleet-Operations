import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { OrderStatus } from '@prisma/client';
import { PrismaService } from '../common/prisma.service';

export interface CreateOrderInput {
  customerId: string;
  pickupLocation: string;
  destinationLocation: string;
  cargoDescription?: string;
  quantityLitres?: number;
  priority?: string;
  requestedDeliveryDate?: Date;
}

@Injectable()
export class OrdersService {
  constructor(private prisma: PrismaService) {}

  async create(companyId: string, input: CreateOrderInput) {
    const customer = await this.prisma.customer.findFirst({
      where: { id: input.customerId, companyId },
    });
    if (!customer) throw new BadRequestException('Customer not found for this company');

    const orderNumber = await this.generateOrderNumber(companyId);

    return this.prisma.transportOrder.create({
      data: { ...input, companyId, orderNumber },
    });
  }

  findAll(companyId: string, status?: OrderStatus) {
    return this.prisma.transportOrder.findMany({
      where: { companyId, ...(status ? { status } : {}) },
      include: { customer: { select: { id: true, name: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(companyId: string, id: string) {
    const order = await this.prisma.transportOrder.findFirst({
      where: { id, companyId },
      include: { customer: true, trip: true },
    });
    if (!order) throw new NotFoundException('Transport order not found');
    return order;
  }

  async updateStatus(companyId: string, id: string, status: OrderStatus) {
    await this.findOne(companyId, id);
    return this.prisma.transportOrder.update({ where: { id }, data: { status } });
  }

  private async generateOrderNumber(companyId: string): Promise<string> {
    const year = new Date().getFullYear();
    const count = await this.prisma.transportOrder.count({
      where: { companyId, createdAt: { gte: new Date(`${year}-01-01`) } },
    });
    return `ORD-${year}-${String(count + 1).padStart(4, '0')}`;
  }
}
