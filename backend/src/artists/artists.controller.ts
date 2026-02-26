import {
  Controller, Get, Post, Patch, Delete, Param, Body, Query, UseGuards, ForbiddenException,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { ArtistsService } from './artists.service';
import { CreateArtistDto } from './dto/create-artist.dto';
import { UpdateArtistDto } from './dto/update-artist.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Role, CustomizationType, NotificationType } from '@prisma/client';
import { NotificationsService } from '../notifications/notifications.service';
import { EmailService } from '../notifications/email.service';
import { PrismaService } from '../prisma/prisma.service';

@ApiTags('Artists')
@Controller('artists')
export class ArtistsController {
  constructor(
    private artistsService: ArtistsService,
    private notificationsService: NotificationsService,
    private emailService: EmailService,
    private prisma: PrismaService,
  ) {}

  // --- PUBLIC ENDPOINTS ---

  @Get('public')
  @ApiOperation({ summary: 'Listar artistas activos (público)' })
  findAllPublic(@Query('page') page?: string, @Query('limit') limit?: string) {
    return this.artistsService.findAllPublic(
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 20,
    );
  }

  @Get('public/:slug')
  @ApiOperation({ summary: 'Ver perfil público de un artista por slug' })
  findBySlug(@Param('slug') slug: string) {
    return this.artistsService.findBySlug(slug);
  }

  // --- ADMIN ENDPOINTS ---

  @Post()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.STAFF)
  @ApiOperation({ summary: 'Crear nuevo artista (Admin)' })
  create(@Body() dto: CreateArtistDto) {
    return this.artistsService.create(dto);
  }

  @Get()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.STAFF)
  @ApiOperation({ summary: 'Listar todos los artistas (Admin)' })
  findAll(@Query('page') page?: string, @Query('limit') limit?: string) {
    return this.artistsService.findAll(
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 20,
    );
  }

  @Get(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.STAFF, Role.ARTIST)
  @ApiOperation({ summary: 'Ver detalle de un artista (Admin o Artista propio)' })
  findOne(@Param('id') id: string) {
    return this.artistsService.findOne(id);
  }

  @Patch(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.STAFF, Role.ARTIST)
  @ApiOperation({ summary: 'Actualizar artista' })
  update(@Param('id') id: string, @Body() dto: UpdateArtistDto) {
    return this.artistsService.update(id, dto);
  }

  @Patch(':id/approve')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Aprobar artista pendiente (Super Admin)' })
  approve(@Param('id') id: string) {
    return this.artistsService.approve(id);
  }

  @Patch(':id/reject')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Rechazar artista pendiente (Super Admin)' })
  reject(@Param('id') id: string) {
    return this.artistsService.reject(id);
  }

  @Patch(':id/toggle-active')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Activar/desactivar artista (Super Admin)' })
  toggleActive(@Param('id') id: string) {
    return this.artistsService.toggleActive(id);
  }

  // --- USER ENDPOINTS ---

  @Post(':id/follow')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Seguir/dejar de seguir artista' })
  follow(@Param('id') artistId: string, @CurrentUser('id') userId: string) {
    return this.artistsService.followArtist(userId, artistId);
  }

  @Post(':id/blast')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Enviar notificacion masiva a seguidores (Artista)' })
  async blastFollowers(
    @Param('id') artistId: string,
    @CurrentUser('id') userId: string,
    @Body() body: { title: string; message: string; sendEmail?: boolean },
  ) {
    const artist = await this.prisma.artist.findUnique({
      where: { id: artistId },
      include: { user: { select: { id: true } } },
    });
    if (!artist) throw new ForbiddenException('Artista no encontrado');
    if (artist.userId !== userId) throw new ForbiddenException('No tienes permiso');

    // Create in-app notifications for all followers
    await this.notificationsService.notifyFollowers(
      artistId,
      NotificationType.GENERAL,
      body.title,
      body.message,
      { artistId, type: 'artist_blast' },
    );

    // Optionally send email blast
    let emailsSent = 0;
    if (body.sendEmail) {
      const followers = await this.prisma.artistFollower.findMany({
        where: { artistId },
        include: { user: { select: { email: true, firstName: true } } },
      });
      for (const follower of followers) {
        await this.emailService.sendArtistBlast(
          follower.user.email,
          follower.user.firstName,
          artist.stageName,
          body.title,
          body.message,
        );
        emailsSent++;
      }
    }

    const followersCount = await this.prisma.artistFollower.count({ where: { artistId } });

    return {
      message: 'Notificacion enviada exitosamente',
      notificationsSent: followersCount,
      emailsSent,
    };
  }

  // --- CUSTOMIZATION ENDPOINTS (ARTIST) ---

  @Get(':id/customizations')
  @ApiOperation({ summary: 'Ver personalizaciones de un artista' })
  getCustomizations(@Param('id') artistId: string) {
    return this.artistsService.getCustomizations(artistId);
  }

  @Post(':id/customizations')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Crear/actualizar personalizacion (Artista)' })
  upsertCustomization(
    @Param('id') artistId: string,
    @CurrentUser('id') userId: string,
    @Body() body: { type: CustomizationType; price: number; description?: string; isActive?: boolean },
  ) {
    return this.artistsService.upsertCustomization(artistId, userId, body);
  }

  @Delete(':id/customizations/:customizationId')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Eliminar personalizacion (Artista)' })
  deleteCustomization(
    @Param('id') artistId: string,
    @Param('customizationId') customizationId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.artistsService.deleteCustomization(artistId, userId, customizationId);
  }

  @Get(':id/customizations/pending')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Ver personalizaciones pendientes de cumplir (Artista)' })
  getPendingCustomizations(
    @Param('id') artistId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.artistsService.getPendingCustomizations(artistId, userId);
  }

  @Get(':id/customizations/history')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Ver historial de personalizaciones cumplidas (Artista)' })
  getCustomizationHistory(
    @Param('id') artistId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.artistsService.getCustomizationHistory(artistId, userId);
  }

  @Patch(':id/customizations/:customizationId/fulfill')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Marcar personalizacion como cumplida (Artista)' })
  fulfillCustomization(
    @Param('id') artistId: string,
    @Param('customizationId') customizationId: string,
    @CurrentUser('id') userId: string,
    @Body() body: { attachmentUrl?: string; notes?: string; meetingLink?: string; scheduledDate?: string },
  ) {
    return this.artistsService.fulfillOrderCustomization(artistId, userId, customizationId, body);
  }

  @Patch(':id/customizations/:customizationId/start')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Marcar personalizacion como en progreso (Artista)' })
  startCustomization(
    @Param('id') artistId: string,
    @Param('customizationId') customizationId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.artistsService.startCustomization(artistId, userId, customizationId);
  }

  @Patch(':id/video-call-config')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Configurar videollamada (Artista)' })
  updateVideoCallConfig(
    @Param('id') artistId: string,
    @CurrentUser('id') userId: string,
    @Body() body: { meetingLink?: string; callDuration?: number; maxPerWeek?: number; availabilitySlots?: any },
  ) {
    return this.artistsService.updateVideoCallConfig(artistId, userId, body);
  }

  @Get(':id/video-call-slots')
  @ApiOperation({ summary: 'Ver slots disponibles de videollamada (Publico)' })
  getAvailableSlots(@Param('id') artistId: string) {
    return this.artistsService.getAvailableSlots(artistId);
  }

  @Post(':id/video-call-slots/book')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Reservar slot de videollamada (Usuario)' })
  bookVideoCallSlot(
    @Param('id') artistId: string,
    @CurrentUser('id') userId: string,
    @Body() body: { orderCustomizationId: string; slotDate: string },
  ) {
    return this.artistsService.bookVideoCallSlot(artistId, userId, body.orderCustomizationId, body.slotDate);
  }

  // --- LANDING CONFIG ENDPOINTS ---

  @Get(':id/landing-config')
  @ApiOperation({ summary: 'Get artist landing page configuration' })
  getLandingConfig(@Param('id') artistId: string) {
    return this.artistsService.getLandingConfig(artistId);
  }

  @Patch(':id/landing-config')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Update artist landing page configuration' })
  updateLandingConfig(
    @Param('id') artistId: string,
    @CurrentUser('id') userId: string,
    @Body() config: Record<string, any>,
  ) {
    return this.artistsService.updateLandingConfig(artistId, userId, config);
  }

  // --- GALLERY ENDPOINTS ---

  @Get(':id/gallery')
  @ApiOperation({ summary: 'Ver galería de un artista' })
  getGallery(@Param('id') artistId: string) {
    return this.artistsService.getGallery(artistId);
  }

  @Delete(':id/gallery/:mediaItemId')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Eliminar item de galería (Artista)' })
  deleteMediaItem(
    @Param('id') artistId: string,
    @Param('mediaItemId') mediaItemId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.artistsService.deleteMediaItem(artistId, userId, mediaItemId);
  }

  @Patch(':id/gallery/reorder')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Reordenar galería (Artista)' })
  reorderGallery(
    @Param('id') artistId: string,
    @CurrentUser('id') userId: string,
    @Body() body: { items: { id: string; sortOrder: number }[] },
  ) {
    return this.artistsService.reorderGallery(artistId, userId, body.items);
  }
}
