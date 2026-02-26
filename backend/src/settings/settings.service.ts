import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SettingsService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.platformSetting.findMany({
      orderBy: { key: 'asc' },
    });
  }

  async findByKey(key: string) {
    const setting = await this.prisma.platformSetting.findUnique({
      where: { key },
    });
    if (!setting) throw new NotFoundException(`Setting "${key}" not found`);
    return setting;
  }

  async upsert(key: string, value: string, label?: string) {
    return this.prisma.platformSetting.upsert({
      where: { key },
      update: { value, ...(label !== undefined && { label }) },
      create: { key, value, label },
    });
  }

  async upsertMany(settings: { key: string; value: string; label?: string }[]) {
    const results = await Promise.all(
      settings.map((s) => this.upsert(s.key, s.value, s.label)),
    );
    return results;
  }

  async remove(key: string) {
    const setting = await this.prisma.platformSetting.findUnique({
      where: { key },
    });
    if (!setting) throw new NotFoundException(`Setting "${key}" not found`);
    return this.prisma.platformSetting.delete({ where: { key } });
  }
}
