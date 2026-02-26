import {
  Controller,
  Post,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  Param,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiBearerAuth, ApiConsumes, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Role } from '@prisma/client';
import { UploadService } from './upload.service';
import { PrismaService } from '../prisma/prisma.service';

@ApiTags('Upload')
@Controller('upload')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
export class UploadController {
  constructor(
    private uploadService: UploadService,
    private prisma: PrismaService,
  ) {}

  // ─── ARTIST PROFILE IMAGE ──────────────────────────────
  @Post('artist/:artistId/profile')
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload artist profile image' })
  async uploadArtistProfile(
    @Param('artistId') artistId: string,
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser() user: any,
  ) {
    if (!file) throw new BadRequestException('No se proporcionó archivo');
    this.uploadService.validateImage(file);

    const artist = await this.prisma.artist.findUnique({ where: { id: artistId } });
    if (!artist) throw new BadRequestException('Artista no encontrado');
    if (artist.userId !== user.id && user.role !== 'SUPER_ADMIN' && user.role !== 'STAFF') {
      throw new BadRequestException('No tienes permiso');
    }

    const filename = this.uploadService.generateFilename(file.originalname, 'profile');
    const cdnUrl = await this.uploadService.uploadFile(
      file.buffer,
      `artists/${artist.slug}`,
      filename,
    );

    await this.prisma.artist.update({
      where: { id: artistId },
      data: { profileImage: cdnUrl },
    });

    return { url: cdnUrl };
  }

  // ─── ARTIST BANNER IMAGE ──────────────────────────────
  @Post('artist/:artistId/banner')
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload artist banner image' })
  async uploadArtistBanner(
    @Param('artistId') artistId: string,
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser() user: any,
  ) {
    if (!file) throw new BadRequestException('No se proporcionó archivo');
    this.uploadService.validateImage(file);

    const artist = await this.prisma.artist.findUnique({ where: { id: artistId } });
    if (!artist) throw new BadRequestException('Artista no encontrado');
    if (artist.userId !== user.id && user.role !== 'SUPER_ADMIN' && user.role !== 'STAFF') {
      throw new BadRequestException('No tienes permiso');
    }

    const filename = this.uploadService.generateFilename(file.originalname, 'banner');
    const cdnUrl = await this.uploadService.uploadFile(
      file.buffer,
      `artists/${artist.slug}`,
      filename,
    );

    await this.prisma.artist.update({
      where: { id: artistId },
      data: { bannerImage: cdnUrl },
    });

    return { url: cdnUrl };
  }

  // ─── ARTIST GALLERY ──────────────────────────────
  @Post('artist/:artistId/gallery')
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload artist gallery image' })
  async uploadArtistGallery(
    @Param('artistId') artistId: string,
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser() user: any,
  ) {
    if (!file) throw new BadRequestException('No se proporcionó archivo');
    this.uploadService.validateImage(file);

    const artist = await this.prisma.artist.findUnique({ where: { id: artistId } });
    if (!artist) throw new BadRequestException('Artista no encontrado');
    if (artist.userId !== user.id && user.role !== 'SUPER_ADMIN' && user.role !== 'STAFF') {
      throw new BadRequestException('No tienes permiso');
    }

    const filename = this.uploadService.generateFilename(file.originalname, 'gallery');
    const cdnUrl = await this.uploadService.uploadFile(
      file.buffer,
      `artists/${artist.slug}/gallery`,
      filename,
    );

    const mediaItem = await this.prisma.mediaItem.create({
      data: {
        artistId,
        type: 'image',
        url: cdnUrl,
        title: file.originalname,
      },
    });

    return mediaItem;
  }

  // ─── PRODUCT IMAGE ──────────────────────────────
  @Post('product/:productId/image')
  @UseGuards(RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.STAFF)
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload product image (Admin)' })
  async uploadProductImage(
    @Param('productId') productId: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) throw new BadRequestException('No se proporcionó archivo');
    this.uploadService.validateImage(file);

    const product = await this.prisma.product.findUnique({ where: { id: productId } });
    if (!product) throw new BadRequestException('Producto no encontrado');

    const filename = this.uploadService.generateFilename(file.originalname, 'img');
    const cdnUrl = await this.uploadService.uploadFile(
      file.buffer,
      `products/${product.slug}`,
      filename,
    );

    await this.prisma.product.update({
      where: { id: productId },
      data: { images: { push: cdnUrl } },
    });

    return { url: cdnUrl };
  }

  // ─── ARTIST PRODUCT CUSTOM IMAGE ──────────────────
  @Post('artist-product/:artistProductId/image')
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload artist-specific product image' })
  async uploadArtistProductImage(
    @Param('artistProductId') artistProductId: string,
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser() user: any,
  ) {
    if (!file) throw new BadRequestException('No se proporcionó archivo');
    this.uploadService.validateImage(file);

    const ap = await this.prisma.artistProduct.findUnique({
      where: { id: artistProductId },
      include: { artist: true, product: true },
    });
    if (!ap) throw new BadRequestException('Producto de artista no encontrado');
    if (ap.artist.userId !== user.id && user.role !== 'SUPER_ADMIN' && user.role !== 'STAFF') {
      throw new BadRequestException('No tienes permiso');
    }

    const filename = this.uploadService.generateFilename(file.originalname, 'custom');
    const cdnUrl = await this.uploadService.uploadFile(
      file.buffer,
      `products/${ap.product.slug}`,
      filename,
    );

    await this.prisma.artistProduct.update({
      where: { id: artistProductId },
      data: { customImages: { push: cdnUrl } },
    });

    return { url: cdnUrl };
  }

  // ─── SHOW GALLERY ──────────────────────────────
  @Post('artist/:artistId/show/:showId/gallery')
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload show gallery image' })
  async uploadShowGallery(
    @Param('artistId') artistId: string,
    @Param('showId') showId: string,
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser() user: any,
  ) {
    if (!file) throw new BadRequestException('No se proporcionó archivo');
    this.uploadService.validateImage(file);

    const artist = await this.prisma.artist.findUnique({ where: { id: artistId } });
    if (!artist) throw new BadRequestException('Artista no encontrado');
    if (artist.userId !== user.id && user.role !== 'SUPER_ADMIN' && user.role !== 'STAFF') {
      throw new BadRequestException('No tienes permiso');
    }

    const show = await this.prisma.show.findUnique({ where: { id: showId } });
    if (!show) throw new BadRequestException('Show no encontrado');
    if (show.artistId !== artistId) throw new BadRequestException('El show no pertenece a este artista');

    const filename = this.uploadService.generateFilename(file.originalname, 'show-gallery');
    const cdnUrl = await this.uploadService.uploadFile(
      file.buffer,
      `artists/${artist.slug}/shows`,
      filename,
    );

    const mediaItem = await this.prisma.mediaItem.create({
      data: {
        artistId,
        showId,
        type: 'image',
        url: cdnUrl,
        title: file.originalname,
      },
    });

    return mediaItem;
  }

  // ─── ARTIST CUSTOMIZATION (video/image) ──────────────────
  @Post('artists/:artistId/customization')
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 100 * 1024 * 1024 } }))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload customization media (video/image)' })
  async uploadCustomization(
    @Param('artistId') artistId: string,
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser() user: any,
  ) {
    if (!file) throw new BadRequestException('No se proporcionó archivo');
    this.uploadService.validateMedia(file);

    const artist = await this.prisma.artist.findUnique({ where: { id: artistId } });
    if (!artist) throw new BadRequestException('Artista no encontrado');
    if (artist.userId !== user.id && user.role !== 'SUPER_ADMIN' && user.role !== 'STAFF') {
      throw new BadRequestException('No tienes permiso');
    }

    const filename = this.uploadService.generateFilename(file.originalname, 'customization');
    const cdnUrl = await this.uploadService.uploadFile(
      file.buffer,
      `artists/${artist.slug}/customizations`,
      filename,
    );

    return { url: cdnUrl };
  }

  // ─── SHOW IMAGE ──────────────────────────────
  @Post('show/:showId/image')
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload show image' })
  async uploadShowImage(
    @Param('showId') showId: string,
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser() user: any,
  ) {
    if (!file) throw new BadRequestException('No se proporcionó archivo');
    this.uploadService.validateImage(file);

    const show = await this.prisma.show.findUnique({
      where: { id: showId },
      include: { artist: true },
    });
    if (!show) throw new BadRequestException('Show no encontrado');
    if (show.artist.userId !== user.id && user.role !== 'SUPER_ADMIN' && user.role !== 'STAFF') {
      throw new BadRequestException('No tienes permiso');
    }

    const filename = this.uploadService.generateFilename(file.originalname, 'show');
    const cdnUrl = await this.uploadService.uploadFile(
      file.buffer,
      `shows`,
      filename,
    );

    await this.prisma.show.update({
      where: { id: showId },
      data: { image: cdnUrl },
    });

    return { url: cdnUrl };
  }
}
