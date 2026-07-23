import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';

@Injectable()
export class MessagesService {
  constructor(private prisma: PrismaService) {}

  async getThread(companyId: string, driverId: string) {
    const driver = await this.prisma.driver.findFirst({ where: { id: driverId, companyId } });
    if (!driver) throw new NotFoundException('Driver not found');

    return this.prisma.message.findMany({
      where: { companyId, driverId },
      orderBy: { createdAt: 'asc' },
    });
  }

  async send(companyId: string, driverId: string, senderId: string, senderRole: string, body: string) {
    const driver = await this.prisma.driver.findFirst({ where: { id: driverId, companyId } });
    if (!driver) throw new NotFoundException('Driver not found');

    return this.prisma.message.create({
      data: { companyId, driverId, senderId, senderRole: senderRole as any, body },
    });
  }

  // Resolves a DRIVER-role user's own driverId, so the driver app never
  // needs to know or pass its own driver record ID explicitly.
  async driverIdForUser(userId: string) {
    const driver = await this.prisma.driver.findUnique({ where: { userId } });
    if (!driver) throw new ForbiddenException('No driver profile for this account');
    return driver.id;
  }
}
