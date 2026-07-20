import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { VehicleStatus } from '@prisma/client';

export interface CreateVehicleInput {
  plateNumber: string;
  fleetNumber?: string;
  vin?: string;
  make?: string;
  model?: string;
  year?: number;
  vehicleType?: string;
  capacity?: number;
  fuelType?: string;
}

@Injectable()
export class VehiclesService {
  constructor(private prisma: PrismaService) {}

  create(companyId: string, input: CreateVehicleInput) {
    return this.prisma.vehicle.create({
      data: { ...input, companyId },
    });
  }

  findAll(companyId: string) {
    return this.prisma.vehicle.findMany({
      where: { companyId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(companyId: string, id: string) {
    const vehicle = await this.prisma.vehicle.findFirst({
      where: { id, companyId },
    });
    if (!vehicle) throw new NotFoundException('Vehicle not found');
    return vehicle;
  }

  async updateStatus(companyId: string, id: string, status: VehicleStatus) {
    await this.findOne(companyId, id);
    return this.prisma.vehicle.update({
      where: { id },
      data: { status },
    });
  }

  async assignDriver(companyId: string, vehicleId: string, driverId: string | null) {
    await this.findOne(companyId, vehicleId);
    return this.prisma.vehicle.update({
      where: { id: vehicleId },
      data: { assignedDriverId: driverId },
    });
  }

  async setPhoto(companyId: string, id: string, photoUrl: string) {
    await this.findOne(companyId, id);
    return this.prisma.vehicle.update({ where: { id }, data: { photoUrl } });
  }
}
