import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCategoryDto } from './dto/create-category.dto';

@Injectable()
export class CategoriesService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateCategoryDto) {
    const slug = this.generateSlug(dto.name);

    return this.prisma.category.create({
      data: {
        name: dto.name,
        slug,
        sortOrder: dto.sortOrder ?? 0,
        parentId: dto.parentId ?? null,
        variantTemplates: (dto.variantTemplates ?? []) as any,
      },
      include: { parent: true, children: true },
    });
  }

  async findAll() {
    return this.prisma.category.findMany({
      where: { parentId: null },
      orderBy: { sortOrder: 'asc' },
      include: {
        _count: { select: { products: true } },
        children: {
          orderBy: { sortOrder: 'asc' },
          include: { _count: { select: { products: true } } },
        },
      },
    });
  }

  async findAllActive() {
    return this.prisma.category.findMany({
      where: { isActive: true, parentId: null },
      orderBy: { sortOrder: 'asc' },
      include: {
        children: {
          where: { isActive: true },
          orderBy: { sortOrder: 'asc' },
        },
      },
    });
  }

  async update(id: string, dto: Partial<CreateCategoryDto>) {
    const category = await this.prisma.category.findUnique({ where: { id } });
    if (!category) throw new NotFoundException('Categoria no encontrada');

    const data: any = { ...dto };
    if (dto.name && dto.name !== category.name) {
      data.slug = this.generateSlug(dto.name);
    }
    if ('parentId' in dto) {
      data.parentId = dto.parentId ?? null;
    }
    if ('variantTemplates' in dto) {
      data.variantTemplates = dto.variantTemplates ?? [];
    }

    return this.prisma.category.update({
      where: { id },
      data,
      include: { parent: true, children: true },
    });
  }

  async toggleActive(id: string) {
    const category = await this.prisma.category.findUnique({ where: { id } });
    if (!category) throw new NotFoundException('Categoria no encontrada');

    return this.prisma.category.update({
      where: { id },
      data: { isActive: !category.isActive },
    });
  }

  async delete(id: string) {
    const category = await this.prisma.category.findUnique({ where: { id } });
    if (!category) throw new NotFoundException('Categoria no encontrada');

    return this.prisma.category.delete({ where: { id } });
  }

  private generateSlug(name: string): string {
    return name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  }
}
