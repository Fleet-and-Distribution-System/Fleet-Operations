import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';

export interface CreateMaintenanceInput {
  vehicleId: string;
  serviceType: string;
  description?: string;
  cost?: number;
  odometerAtService?: number;
  serviceDate?: Date;
  nextDueDate?: Date;
  nextDueOdometer?: number;
}

@Injectable()
export class MaintenanceService {
  constructor(private prisma: PrismaService) {}

  async create(companyId: string, input: CreateMaintenanceInput) {
    const vehicle = await this.prisma.vehicle.findFirst({ where: { id: input.vehicleId, companyId } });
    if (!vehicle) throw new BadRequestException('Vehicle not found for this company');

    return this.prisma.maintenanceRecord.create({
      data: { ...input, companyId },
    });
  }

  findAll(companyId: string, vehicleId?: string) {
    return this.prisma.maintenanceRecord.findMany({
      where: { companyId, ...(vehicleId ? { vehicleId } : {}) },
      include: { vehicle: { select: { plateNumber: true } } },
      orderBy: { serviceDate: 'desc' },
    });
  }

  async findOne(companyId: string, id: string) {
    const record = await this.prisma.maintenanceRecord.findFirst({ where: { id, companyId } });
    if (!record) throw new NotFoundException('Maintenance record not found');
    return record;
  }
}
