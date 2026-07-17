import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';

export interface CreateWaybillInput {
  tripId: string;
  sealNumber?: string;
  productsSummary?: string;
}

export interface RecordProofOfDeliveryInput {
  receiverName: string;
  receiverPhone?: string;
  deliveryPhotos?: string[];
  signedByName?: string;
}

@Injectable()
export class WaybillsService {
  constructor(private prisma: PrismaService) {}

  async create(companyId: string, input: CreateWaybillInput) {
    const trip = await this.prisma.trip.findFirst({ where: { id: input.tripId, companyId } });
    if (!trip) throw new BadRequestException('Trip not found for this company');

    const existing = await this.prisma.waybill.findUnique({ where: { tripId: input.tripId } });
    if (existing) throw new BadRequestException('This trip already has a waybill');

    const waybillNumber = await this.generateWaybillNumber(companyId);

    return this.prisma.waybill.create({
      data: {
        companyId,
        tripId: input.tripId,
        waybillNumber,
        sealNumber: input.sealNumber,
        productsSummary: input.productsSummary,
      },
    });
  }

  findAll(companyId: string) {
    return this.prisma.waybill.findMany({
      where: { companyId },
      include: { trip: { select: { status: true, transportOrderId: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(companyId: string, id: string) {
    const waybill = await this.prisma.waybill.findFirst({
      where: { id, companyId },
      include: { trip: true },
    });
    if (!waybill) throw new NotFoundException('Waybill not found');
    return waybill;
  }

  async recordProofOfDelivery(companyId: string, id: string, input: RecordProofOfDeliveryInput) {
    const waybill = await this.findOne(companyId, id);
    if (waybill.signedAt) {
      throw new BadRequestException('Proof of delivery already recorded for this waybill');
    }
    return this.prisma.waybill.update({
      where: { id },
      data: {
        receiverName: input.receiverName,
        receiverPhone: input.receiverPhone,
        deliveryPhotos: input.deliveryPhotos as any,
        signedByName: input.signedByName,
        signedAt: new Date(),
      },
    });
  }

  private async generateWaybillNumber(companyId: string): Promise<string> {
    const year = new Date().getFullYear();
    const count = await this.prisma.waybill.count({
      where: { companyId, createdAt: { gte: new Date(`${year}-01-01`) } },
    });
    return `WB-${year}-${String(count + 1).padStart(4, '0')}`;
  }
}
