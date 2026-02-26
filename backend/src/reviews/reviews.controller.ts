import { Controller, Get, Post, Patch, Delete, Param, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { ReviewsService } from './reviews.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('Reviews')
@Controller('reviews')
export class ReviewsController {
  constructor(private reviewsService: ReviewsService) {}

  @Get('product/:artistProductId')
  @ApiOperation({ summary: 'Listar reseñas de un producto' })
  findByProduct(
    @Param('artistProductId') artistProductId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.reviewsService.findByProduct(
      artistProductId,
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 10,
    );
  }

  @Post('product/:artistProductId')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Crear reseña' })
  create(
    @CurrentUser('id') userId: string,
    @Param('artistProductId') artistProductId: string,
    @Body() body: { rating: number; comment?: string },
  ) {
    return this.reviewsService.create(userId, artistProductId, body.rating, body.comment);
  }

  @Patch(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Editar reseña propia' })
  update(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
    @Body() body: { rating: number; comment?: string },
  ) {
    return this.reviewsService.update(userId, id, body.rating, body.comment);
  }

  @Delete(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Eliminar reseña propia' })
  delete(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
  ) {
    return this.reviewsService.delete(userId, id);
  }
}
