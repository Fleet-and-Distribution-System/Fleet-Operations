import { ConflictException, Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { UserRole, Prisma } from '@prisma/client';
import { PrismaService } from '../common/prisma.service';

export interface CreateDriverInput {
  fullName: string;
  phone?: string;
  licenseNumber?: string;
  licenseExpiry?: Date;
  loginEmail?: string;
  loginPhone?: string;
  loginPassword?: string;
}

@Injectable()
export class DriversService {
  constructor(private prisma: PrismaService) {}

  async create(companyId: string, input: CreateDriverInput) {
    const { loginEmail, loginPhone, loginPassword, ...driverFields } = input;

    if (!loginEmail && !loginPhone) {
      return this.prisma.driver.create({
        data: { ...driverFields, companyId },
      });
    }

    if (!loginPassword) {
      throw new ConflictException('loginPassword is required when creating driver login credentials');
    }

    const passwordHash = await bcrypt.hash(loginPassword, 10);

    try {
      return await this.prisma.$transaction(async (tx) => {
        const user = await tx.user.create({
          data: {
            companyId,
            email: loginEmail ?? `${input.phone ?? Date.now()}@no-email.local`,
            phone: loginPhone,
            passwordHash,
            fullName: input.fullName,
            role: UserRole.DRIVER,
          },
        });

        return tx.driver.create({
          data: {
            ...driverFields,
            companyId,
            userId: user.id,
          },
          include: { user: { select: { id: true, email: true, phone: true, role: true } } },
        });
      });
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
        const target = (err.meta?.target as string[] | undefined)?.join(', ') ?? 'field';
        throw new ConflictException(
          `A user with this ${target.includes('phone') ? 'phone number' : target.includes('email') ? 'email' : target} already exists.`,
        );
      }
      throw err;
    }
  }

  findAll(companyId: string) {
    return this.prisma.driver.findMany({
      where: { companyId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(companyId: string, id: string) {
    const driver = await this.prisma.driver.findFirst({
      where: { id, companyId },
      include: { user: { select: { id: true, email: true, phone: true, role: true, isActive: true } } },
    });
    if (!driver) throw new NotFoundException('Driver not found');
    return driver;
  }

  async update(companyId: string, id: string, data: Partial<Omit<CreateDriverInput, 'loginEmail' | 'loginPhone' | 'loginPassword'>>) {
    await this.findOne(companyId, id);
    return this.prisma.driver.update({
      where: { id },
      data,
    });
  }

  async setActive(companyId: string, id: string, isActive: boolean) {
    const driver = await this.findOne(companyId, id);
    if (driver.userId) {
      await this.prisma.user.update({ where: { id: driver.userId }, data: { isActive } });
    }
    return this.prisma.driver.update({ where: { id }, data: { isActive } });
  }

  async resetPassword(companyId: string, id: string, newPassword: string) {
    const driver = await this.findOne(companyId, id);
    if (!driver.userId) {
      throw new BadRequestException('This driver has no login account to reset');
    }
    const passwordHash = await bcrypt.hash(newPassword, 10);
    await this.prisma.user.update({ where: { id: driver.userId }, data: { passwordHash } });
    return { success: true };
  }

  async setPhoto(companyId: string, id: string, photoUrl: string) {
    await this.findOne(companyId, id);
    return this.prisma.driver.update({ where: { id }, data: { photoUrl } });
  }
}
