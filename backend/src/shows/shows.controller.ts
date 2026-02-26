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
import { ShowsService } from './shows.service';
import { CreateShowDto } from './dto/create-show.dto';
import { UpdateShowDto } from './dto/update-show.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Role, ShowStatus } from '@prisma/client';

@ApiTags('Shows')
@Controller('shows')
export class ShowsController {
  constructor(private showsService: ShowsService) {}

  // ==========================================
  // PUBLIC ENDPOINTS
  // ==========================================

  @Get('upcoming')
  @ApiOperation({ summary: 'Listar shows próximos (público)' })
  findUpcoming(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.showsService.findUpcoming(
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 20,
    );
  }

  @Get('public/:slug')
  @ApiOperation({ summary: 'Ver detalle de show por slug (público)' })
  findBySlug(@Param('slug') slug: string) {
    return this.showsService.findBySlug(slug);
  }

  @Get('artist/:artistId')
  @ApiOperation({ summary: 'Listar shows de un artista (público)' })
  findByArtist(@Param('artistId') artistId: string) {
    return this.showsService.findByArtist(artistId);
  }

  @Get('tickets/verify/:qrCode')
  @ApiOperation({ summary: 'Verificar entrada por QR code (público, solo lectura)' })
  verifyTicketPublic(@Param('qrCode') qrCode: string) {
    return this.showsService.verifyTicketPublic(qrCode);
  }

  // ==========================================
  // USER ENDPOINTS (Authenticated)
  // ==========================================

  @Post(':id/purchase-ticket')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Comprar ticket para un show' })
  purchaseTicket(
    @Param('id') showId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.showsService.purchaseTicket(userId, showId);
  }

  @Post(':id/simulate-ticket-payment')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Simular pago de ticket (solo desarrollo)' })
  simulateTicketPayment(
    @Param('id') showId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.showsService.simulateTicketPayment(userId, showId);
  }

  @Get('my-tickets')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Ver mis tickets comprados' })
  getMyTickets(@CurrentUser('id') userId: string) {
    return this.showsService.getTicketsByUser(userId);
  }

  @Post('validate-ticket')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.STAFF, Role.ARTIST)
  @ApiOperation({ summary: 'Validar un ticket por QR code (Admin/Staff/Artista)' })
  validateTicket(@Body('qrCode') qrCode: string) {
    return this.showsService.validateTicket(qrCode);
  }

  // ==========================================
  // SCHEDULING
  // ==========================================

  @Get('scheduled/:artistId')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get scheduled (unpublished) shows for an artist' })
  getScheduledShows(@Param('artistId') artistId: string) {
    return this.showsService.getScheduledByArtist(artistId);
  }

  @Patch(':id/schedule')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Set publish date for a show' })
  setShowPublishDate(
    @Param('id') id: string,
    @Body() body: { publishAt: string | null },
  ) {
    return this.showsService.setPublishDate(id, body.publishAt);
  }

  // ==========================================
  // ADMIN / ARTIST ENDPOINTS
  // ==========================================

  @Post()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.STAFF, Role.ARTIST)
  @ApiOperation({ summary: 'Crear nuevo show (Admin/Artista)' })
  create(@Body() dto: CreateShowDto) {
    return this.showsService.create(dto);
  }

  @Get()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.STAFF)
  @ApiOperation({ summary: 'Listar todos los shows (Admin)' })
  findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('status') status?: ShowStatus,
    @Query('artistId') artistId?: string,
  ) {
    return this.showsService.findAll(
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 20,
      { search, status, artistId },
    );
  }

  @Get(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.STAFF, Role.ARTIST)
  @ApiOperation({ summary: 'Ver detalle de un show (Admin/Artista)' })
  findOne(@Param('id') id: string) {
    return this.showsService.findOne(id);
  }

  @Patch(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.STAFF, Role.ARTIST)
  @ApiOperation({ summary: 'Actualizar show (Admin/Artista)' })
  update(@Param('id') id: string, @Body() dto: UpdateShowDto) {
    return this.showsService.update(id, dto);
  }

  @Patch(':id/cancel')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.STAFF, Role.ARTIST)
  @ApiOperation({ summary: 'Cancelar show (Admin/Artista)' })
  cancel(@Param('id') id: string) {
    return this.showsService.cancel(id);
  }

  @Delete(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Eliminar show (Solo Super Admin)' })
  remove(@Param('id') id: string) {
    return this.showsService.remove(id);
  }

  @Get(':id/tickets')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.STAFF, Role.ARTIST)
  @ApiOperation({ summary: 'Ver tickets vendidos de un show (Admin/Artista)' })
  getTicketsByShow(@Param('id') showId: string) {
    return this.showsService.getTicketsByShow(showId);
  }
}
