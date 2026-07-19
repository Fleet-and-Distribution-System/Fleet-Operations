import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';

@Injectable()
export class TrackingService {
  constructor(private prisma: PrismaService) {}

  async trackOrder(companySlug: string, orderNumber: string) {
    const company = await this.prisma.company.findUnique({ where: { slug: companySlug } });
    if (!company) throw new NotFoundException('Not found');

    const order = await this.prisma.transportOrder.findFirst({
      where: { companyId: company.id, orderNumber },
      include: {
        trip: {
          include: {
            vehicle: { select: { plateNumber: true } },
            driver: { select: { fullName: true } },
            waybill: { select: { waybillNumber: true, signedAt: true, signedByName: true } },
          },
        },
      },
    });
    if (!order) throw new NotFoundException('Not found');

    return {
      companyName: company.name,
      orderNumber: order.orderNumber,
      status: order.status,
      pickupLocation: order.pickupLocation,
      destinationLocation: order.destinationLocation,
      cargoDescription: order.cargoDescription,
      createdAt: order.createdAt,
      trip: order.trip
        ? {
            status: order.trip.status,
            plannedDeparture: order.trip.plannedDeparture,
            actualDeparture: order.trip.actualDeparture,
            actualArrival: order.trip.actualArrival,
            vehiclePlate: order.trip.vehicle?.plateNumber,
            driverName: order.trip.driver?.fullName,
            waybillNumber: order.trip.waybill?.waybillNumber,
            signedAt: order.trip.waybill?.signedAt,
            signedByName: order.trip.waybill?.signedByName,
          }
        : null,
    };
  }
}
