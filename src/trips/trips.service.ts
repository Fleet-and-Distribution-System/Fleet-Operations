import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { TripStatus, OrderStatus, VehicleStatus } from '@prisma/client';
import { PrismaService } from '../common/prisma.service';

export interface CreateTripInput {
  transportOrderId: string;
  vehicleId: string;
  driverId: string;
  plannedDeparture?: Date;
  plannedArrival?: Date;
  stops?: unknown;
}

@Injectable()
export class TripsService {
  constructor(private prisma: PrismaService) {}

  async create(companyId: string, input: CreateTripInput) {
    const [order, vehicle, driver] = await Promise.all([
      this.prisma.transportOrder.findFirst({ where: { id: input.transportOrderId, companyId } }),
      this.prisma.vehicle.findFirst({ where: { id: input.vehicleId, companyId } }),
      this.prisma.driver.findFirst({ where: { id: input.driverId, companyId } }),
    ]);
    if (!order) throw new BadRequestException('Transport order not found for this company');
    if (!vehicle) throw new BadRequestException('Vehicle not found for this company');
    if (!driver) throw new BadRequestException('Driver not found for this company');

    if (order.status !== OrderStatus.PENDING) {
      throw new BadRequestException(`Order is already ${order.status.toLowerCase()} — cannot assign a new trip`);
    }
    if (vehicle.status !== VehicleStatus.AVAILABLE) {
      throw new BadRequestException(`Vehicle is currently ${vehicle.status.toLowerCase()}, not available`);
    }
    if (!driver.isActive) {
      throw new BadRequestException('Driver is not active');
    }

    return this.prisma.$transaction(async (tx) => {
      const trip = await tx.trip.create({
        data: {
          companyId,
          transportOrderId: input.transportOrderId,
          vehicleId: input.vehicleId,
          driverId: input.driverId,
          plannedDeparture: input.plannedDeparture,
          plannedArrival: input.plannedArrival,
          stops: input.stops as any,
          status: TripStatus.ASSIGNED,
        },
      });

      await tx.transportOrder.update({
        where: { id: input.transportOrderId },
        data: { status: OrderStatus.ASSIGNED },
      });

      await tx.vehicle.update({
        where: { id: input.vehicleId },
        data: { status: VehicleStatus.LOADING },
      });

      return trip;
    });
  }

  async findAllForUser(
    companyId: string,
    user: { userId: string; role: string },
    status?: TripStatus,
  ) {
    if (user.role !== 'DRIVER') {
      return this.findAll(companyId, status);
    }

    const driver = await this.prisma.driver.findFirst({
      where: { companyId, userId: user.userId },
      select: { id: true },
    });
    if (!driver) return [];

    return this.prisma.trip.findMany({
      where: { companyId, driverId: driver.id, ...(status ? { status } : {}) },
      include: {
        transportOrder: { select: { orderNumber: true, pickupLocation: true, destinationLocation: true } },
        vehicle: { select: { plateNumber: true } },
        driver: { select: { fullName: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  findAll(companyId: string, status?: TripStatus) {
    return this.prisma.trip.findMany({
      where: { companyId, ...(status ? { status } : {}) },
      include: {
        transportOrder: { select: { orderNumber: true, pickupLocation: true, destinationLocation: true } },
        vehicle: { select: { plateNumber: true } },
        driver: { select: { fullName: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOneForUser(companyId: string, id: string, user: { userId: string; role: string }) {
    const trip = await this.findOne(companyId, id);
    if (user.role === 'DRIVER') {
      const driver = await this.prisma.driver.findFirst({
        where: { companyId, userId: user.userId },
        select: { id: true },
      });
      if (!driver || trip.driverId !== driver.id) {
        throw new NotFoundException('Trip not found');
      }
    }
    return trip;
  }

  async findOne(companyId: string, id: string) {
    const trip = await this.prisma.trip.findFirst({
      where: { id, companyId },
      include: { transportOrder: true, vehicle: true, driver: true, waybill: true },
    });
    if (!trip) throw new NotFoundException('Trip not found');
    return trip;
  }

  async start(companyId: string, id: string, requestingUser?: { userId: string; role: string }) {
    const trip = await this.findOne(companyId, id);
    await this.assertOwnershipIfDriver(companyId, trip, requestingUser);
    if (trip.status !== TripStatus.ASSIGNED) {
      throw new BadRequestException(`Trip is ${trip.status}, cannot start`);
    }
    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.trip.update({
        where: { id },
        data: { status: TripStatus.IN_TRANSIT, actualDeparture: new Date() },
      });
      await tx.transportOrder.update({
        where: { id: trip.transportOrderId },
        data: { status: OrderStatus.IN_PROGRESS },
      });
      await tx.vehicle.update({
        where: { id: trip.vehicleId },
        data: { status: VehicleStatus.IN_TRANSIT },
      });
      return updated;
    });
  }

  async complete(companyId: string, id: string, requestingUser?: { userId: string; role: string }) {
    const trip = await this.findOne(companyId, id);
    await this.assertOwnershipIfDriver(companyId, trip, requestingUser);
    if (trip.status !== TripStatus.IN_TRANSIT) {
      throw new BadRequestException(`Trip is ${trip.status}, cannot complete`);
    }
    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.trip.update({
        where: { id },
        data: { status: TripStatus.DELIVERED, actualArrival: new Date() },
      });
      await tx.transportOrder.update({
        where: { id: trip.transportOrderId },
        data: { status: OrderStatus.COMPLETED },
      });
      await tx.vehicle.update({
        where: { id: trip.vehicleId },
        data: { status: VehicleStatus.AVAILABLE },
      });
      return updated;
    });
  }

  private async assertOwnershipIfDriver(
    companyId: string,
    trip: { driverId: string },
    requestingUser?: { userId: string; role: string },
  ) {
    if (!requestingUser || requestingUser.role !== 'DRIVER') return;
    const driver = await this.prisma.driver.findFirst({
      where: { companyId, userId: requestingUser.userId },
      select: { id: true },
    });
    if (!driver || trip.driverId !== driver.id) {
      throw new NotFoundException('Trip not found');
    }
  }

  async cancel(companyId: string, id: string) {
    const trip = await this.findOne(companyId, id);
    if (trip.status === TripStatus.DELIVERED || trip.status === TripStatus.CANCELLED) {
      throw new BadRequestException(`Trip is already ${trip.status}, cannot cancel`);
    }
    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.trip.update({
        where: { id },
        data: { status: TripStatus.CANCELLED },
      });
      await tx.transportOrder.update({
        where: { id: trip.transportOrderId },
        data: { status: OrderStatus.CANCELLED },
      });
      await tx.vehicle.update({
        where: { id: trip.vehicleId },
        data: { status: VehicleStatus.AVAILABLE },
      });
      return updated;
    });
  }
}
