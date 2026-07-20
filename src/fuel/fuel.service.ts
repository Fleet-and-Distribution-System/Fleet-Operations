import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';

export interface CreateFuelLogInput {
  vehicleId: string;
  quantity: number;
  unit?: string;
  cost?: number;
  odometerAtFueling?: number;
  fuelDate?: Date;
  station?: string;
}

@Injectable()
export class FuelService {
  constructor(private prisma: PrismaService) {}

  async create(companyId: string, input: CreateFuelLogInput) {
    const vehicle = await this.prisma.vehicle.findFirst({ where: { id: input.vehicleId, companyId } });
    if (!vehicle) throw new BadRequestException('Vehicle not found for this company');

    const unit = input.unit ?? this.defaultUnitFor(vehicle.fuelType);

    return this.prisma.fuelLog.create({
      data: { ...input, unit, companyId },
    });
  }

  private defaultUnitFor(fuelType: string | null): string {
    if (!fuelType) return 'Litres';
    const normalized = fuelType.trim().toUpperCase();
    if (normalized === 'CNG') return 'Kg';
    return 'Litres';
  }

  findAll(companyId: string, vehicleId?: string) {
    return this.prisma.fuelLog.findMany({
      where: { companyId, ...(vehicleId ? { vehicleId } : {}) },
      include: { vehicle: { select: { plateNumber: true, fuelType: true } } },
      orderBy: { fuelDate: 'desc' },
    });
  }

  async findOne(companyId: string, id: string) {
    const record = await this.prisma.fuelLog.findFirst({ where: { id, companyId } });
    if (!record) throw new NotFoundException('Fuel log not found');
    return record;
  }
}
