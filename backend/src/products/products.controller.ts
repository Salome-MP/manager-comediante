import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { AssignProductDto } from './dto/assign-product.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Role } from '@prisma/client';

@ApiTags('Products')
@Controller('products')
export class ProductsController {
  constructor(private productsService: ProductsService) {}

  // --- PUBLIC ENDPOINTS ---

  @Get('featured')
  @ApiOperation({ summary: 'Listar productos destacados (público)' })
  findFeatured(@Query('limit') limit?: string) {
    return this.productsService.findFeatured(limit ? parseInt(limit) : 8);
  }

  @Get('artist/:artistId')
  @ApiOperation({ summary: 'Listar productos de un artista (público)' })
  findByArtist(
    @Param('artistId') artistId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('categoryId') categoryId?: string,
  ) {
    return this.productsService.findByArtist(
      artistId,
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 20,
      categoryId,
    );
  }

  @Get('search')
  @ApiOperation({ summary: 'Buscar productos con filtros (público)' })
  search(
    @Query('q') q?: string,
    @Query('categoryId') categoryId?: string,
    @Query('artistId') artistId?: string,
    @Query('minPrice') minPrice?: string,
    @Query('maxPrice') maxPrice?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.productsService.search({
      q,
      categoryId,
      artistId,
      minPrice: minPrice ? parseFloat(minPrice) : undefined,
      maxPrice: maxPrice ? parseFloat(maxPrice) : undefined,
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 20,
    });
  }

  @Get('artist-product/:id/related')
  @ApiOperation({ summary: 'Productos relacionados (público)' })
  findRelated(
    @Param('id') id: string,
    @Query('limit') limit?: string,
  ) {
    return this.productsService.findRelated(id, limit ? parseInt(limit) : 8);
  }

  @Get('artist-product/:id')
  @ApiOperation({ summary: 'Ver detalle de producto de artista (público)' })
  findArtistProductDetail(@Param('id') id: string) {
    return this.productsService.findArtistProductDetail(id);
  }

  // --- ARTIST SCHEDULING ENDPOINTS ---

  @Get('scheduled/:artistId')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get scheduled (unpublished) products for an artist' })
  getScheduled(@Param('artistId') artistId: string) {
    return this.productsService.getScheduledByArtist(artistId);
  }

  @Patch('artist-product/:id/schedule')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Set publish date for an artist product' })
  setPublishDate(
    @Param('id') id: string,
    @Body() body: { publishAt: string | null },
  ) {
    return this.productsService.setPublishDate(id, body.publishAt);
  }

  // --- ADMIN ENDPOINTS ---

  @Post()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.STAFF)
  @ApiOperation({ summary: 'Crear producto base (Admin)' })
  create(@Body() dto: CreateProductDto) {
    return this.productsService.create(dto);
  }

  @Get('assignments')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.STAFF)
  @ApiOperation({ summary: 'Listar todas las asignaciones artista-producto (Admin)' })
  findAllAssignments(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('artistId') artistId?: string,
    @Query('categoryId') categoryId?: string,
  ) {
    return this.productsService.findAllAssignments(
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 20,
      artistId,
      categoryId,
    );
  }

  @Get()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.STAFF)
  @ApiOperation({ summary: 'Listar todos los productos base (Admin)' })
  findAll(@Query('page') page?: string, @Query('limit') limit?: string) {
    return this.productsService.findAll(
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 20,
    );
  }

  @Get(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.STAFF)
  @ApiOperation({ summary: 'Ver detalle de producto base (Admin)' })
  findOne(@Param('id') id: string) {
    return this.productsService.findOne(id);
  }

  @Patch(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.STAFF)
  @ApiOperation({ summary: 'Actualizar producto base (Admin)' })
  update(@Param('id') id: string, @Body() dto: UpdateProductDto) {
    return this.productsService.update(id, dto);
  }

  @Delete(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Eliminar producto base (Super Admin)' })
  delete(@Param('id') id: string) {
    return this.productsService.delete(id);
  }

  @Post('assign')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.STAFF)
  @ApiOperation({ summary: 'Asignar producto a artista (Admin)' })
  assignToArtist(@Body() dto: AssignProductDto) {
    return this.productsService.assignToArtist(dto);
  }

  @Patch('artist-product/:id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.STAFF)
  @ApiOperation({ summary: 'Actualizar producto de artista (Admin)' })
  updateArtistProduct(
    @Param('id') id: string,
    @Body() data: { salePrice?: number; stock?: number; isActive?: boolean; isFeatured?: boolean; publishAt?: string | null; customImages?: string[] },
  ) {
    return this.productsService.updateArtistProduct(id, data);
  }
}
