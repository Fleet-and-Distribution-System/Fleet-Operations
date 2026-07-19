import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';

export interface UpdateCompanyInput {
  name?: string;
}

@Injectable()
export class CompaniesService {
  constructor(private prisma: PrismaService) {}

  async getOwn(companyId: string) {
    const company = await this.prisma.company.findUnique({ where: { id: companyId } });
    if (!company) throw new NotFoundException('Company not found');
    return company;
  }

  async updateOwn(companyId: string, input: UpdateCompanyInput) {
    await this.getOwn(companyId);
    return this.prisma.company.update({ where: { id: companyId }, data: input });
  }
}
