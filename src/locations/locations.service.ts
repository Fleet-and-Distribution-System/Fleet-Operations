import { Injectable, NotFoundException } from '@nestjs/common';

import { PrismaService } from '../common/prisma.service';

export interface CreateLocationInput {
  name: string;
  type?: string;
  address?: string;
  lat?: number;
  lng?: number;
}

@Injectable()
export class LocationsService {
  constructor(private prisma: PrismaService) {}

  create(companyId: string, input: CreateLocationInput) {
    return this.prisma.location.create({
      data: { ...input, companyId },
    });
  }

  findAll(companyId: string) {
    return this.prisma.location.findMany({
      where: { companyId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(companyId: string, id: string) {
    const location = await this.prisma.location.findFirst({
      where: { id, companyId },
    });
    if (!location) throw new NotFoundException('Location not found');
    return location;
  }

  async update(companyId: string, id: string, data: Partial<CreateLocationInput>) {
    await this.findOne(companyId, id);
    return this.prisma.location.update({ where: { id }, data });
  }

  async setActive(companyId: string, id: string, isActive: boolean) {
    await this.findOne(companyId, id);
    return this.prisma.location.update({ where: { id }, data: { isActive } });
  }
}
