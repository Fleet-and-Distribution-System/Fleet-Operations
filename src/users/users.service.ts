import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { Prisma, UserRole } from '@prisma/client';
import { PrismaService } from '../common/prisma.service';

export interface CreateUserInput {
  email: string;
  phone?: string;
  fullName: string;
  password: string;
  role: 'COMPANY_ADMIN' | 'DISPATCHER';
}

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  // Only COMPANY_ADMIN/DISPATCHER accounts are managed here — driver logins
  // are created through the Drivers module, which already handles the
  // Driver <-> User linkage correctly.
  async create(companyId: string, input: CreateUserInput) {
    const passwordHash = await bcrypt.hash(input.password, 10);
    try {
      return await this.prisma.user.create({
        data: {
          companyId,
          email: input.email,
          phone: input.phone,
          fullName: input.fullName,
          passwordHash,
          role: input.role as UserRole,
        },
        select: { id: true, email: true, phone: true, fullName: true, role: true, isActive: true },
      });
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
        throw new ConflictException('A user with this email or phone already exists.');
      }
      throw err;
    }
  }

  findAll(companyId: string) {
    return this.prisma.user.findMany({
      where: { companyId, role: { in: [UserRole.COMPANY_ADMIN, UserRole.DISPATCHER] } },
      select: { id: true, email: true, phone: true, fullName: true, role: true, isActive: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async setActive(companyId: string, id: string, isActive: boolean) {
    const user = await this.prisma.user.findFirst({ where: { id, companyId } });
    if (!user) throw new NotFoundException('User not found');
    return this.prisma.user.update({ where: { id }, data: { isActive } });
  }
}
