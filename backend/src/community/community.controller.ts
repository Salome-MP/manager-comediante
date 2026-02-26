import {
  Controller, Get, Post, Delete, Patch, Param, Body, Query, UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { CommunityService } from './community.service';
import { CreateCommunityMessageDto } from './dto/create-community-message.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('Community')
@Controller('community')
export class CommunityController {
  constructor(private communityService: CommunityService) {}

  // ─── MEMBERSHIP ──────────────────────────────────────

  @Get('my-communities')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Listar comunidades del usuario' })
  getMyCommunities(@CurrentUser('id') userId: string) {
    return this.communityService.getMyCommunities(userId);
  }

  @Post(':artistId/join')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Unirse a la comunidad de un artista' })
  joinCommunity(
    @Param('artistId') artistId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.communityService.joinCommunity(userId, artistId);
  }

  @Delete(':artistId/leave')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Salir de la comunidad de un artista' })
  leaveCommunity(
    @Param('artistId') artistId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.communityService.leaveCommunity(userId, artistId);
  }

  @Get(':artistId/is-member')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Verificar si el usuario es miembro de la comunidad' })
  isMember(
    @Param('artistId') artistId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.communityService.isMember(userId, artistId);
  }

  // ─── PUBLIC CONTENT ──────────────────────────────────────

  @Get(':artistId/info')
  @ApiOperation({ summary: 'Info pública del artista para la comunidad' })
  getArtistInfo(@Param('artistId') artistId: string) {
    return this.communityService.getArtistInfo(artistId);
  }

  @Get(':artistId/members')
  @ApiOperation({ summary: 'Listar miembros de la comunidad (público)' })
  getMembers(@Param('artistId') artistId: string) {
    return this.communityService.getMembers(artistId);
  }

  @Get(':artistId/announcements')
  @ApiOperation({ summary: 'Listar avisos de la comunidad (público)' })
  getAnnouncements(
    @Param('artistId') artistId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.communityService.getAnnouncements(
      artistId,
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 20,
    );
  }

  @Get(':artistId/chat')
  @ApiOperation({ summary: 'Listar mensajes del chat (público)' })
  getChatMessages(
    @Param('artistId') artistId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.communityService.getChatMessages(
      artistId,
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 50,
    );
  }

  // ─── ARTIST-ONLY ACTIONS ──────────────────────────────────────

  @Post(':artistId/announcements')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Crear aviso (solo artista dueño)' })
  createAnnouncement(
    @Param('artistId') artistId: string,
    @CurrentUser('id') userId: string,
    @Body() dto: CreateCommunityMessageDto,
  ) {
    return this.communityService.createAnnouncement(artistId, userId, dto.content);
  }

  @Post(':artistId/chat')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Enviar mensaje al chat (cualquier usuario logueado)' })
  createChatMessage(
    @Param('artistId') artistId: string,
    @CurrentUser('id') userId: string,
    @Body() dto: CreateCommunityMessageDto,
  ) {
    return this.communityService.createChatMessage(artistId, userId, dto.content);
  }

  @Delete(':artistId/messages/:messageId')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Eliminar mensaje (moderación, solo artista)' })
  deleteMessage(
    @Param('artistId') artistId: string,
    @Param('messageId') messageId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.communityService.deleteMessage(artistId, userId, messageId);
  }

  @Patch(':artistId/messages/:messageId/pin')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Fijar/desfijar aviso (solo artista)' })
  togglePin(
    @Param('artistId') artistId: string,
    @Param('messageId') messageId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.communityService.togglePin(artistId, userId, messageId);
  }
}
