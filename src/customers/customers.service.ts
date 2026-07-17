import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';

export interface CreateCustomerInput {
  name: string;
  contactName?: string;
  contactEmail?: string;
  contactPhone?: string;
  billingAddress?: string;
  deliveryAddress?: string;
}

@Injectable()
export class CustomersService {
  constructor(private prisma: PrismaService) {}

  create(companyId: string, input: CreateCustomerInput) {
    return this.prisma.customer.create({
      data: { ...input, companyId },
    });
  }

  findAll(companyId: string) {
    return this.prisma.customer.findMany({
      where: { companyId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(companyId: string, id: string) {
    const customer = await this.prisma.customer.findFirst({
      where: { id, companyId },
    });
    if (!customer) throw new NotFoundException('Customer not found');
    return customer;
  }

  async update(companyId: string, id: string, data: Partial<CreateCustomerInput>) {
    await this.findOne(companyId, id);
    return this.prisma.customer.update({ where: { id }, data });
  }
}
