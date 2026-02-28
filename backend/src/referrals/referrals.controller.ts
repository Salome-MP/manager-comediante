import {
  Controller, Get, Post, Patch, Param, Query, UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { ReferralsService } from './referrals.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Role } from '@prisma/client';

@ApiTags('Referrals')
@Controller('referrals')
export class ReferralsController {
  constructor(private referralsService: ReferralsService) {}

  // --- PUBLIC ---

  @Get('validate/:code')
  @ApiOperation({ summary: 'Validar un codigo de referido' })
  validateCode(@Param('code') code: string) {
    return this.referralsService.validateCode(code);
  }

  @Post('track/:code')
  @ApiOperation({ summary: 'Registrar click en enlace de referido' })
  trackClick(@Param('code') code: string) {
    return this.referralsService.trackClick(code);
  }

  // --- USER (authenticated) ---

  @Post('generate')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Generar mi codigo de referido' })
  generateCode(@CurrentUser('id') userId: string) {
    return this.referralsService.generateCode(userId);
  }

  @Get('my-referral')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Ver mi referral y estadisticas' })
  getMyReferral(@CurrentUser('id') userId: string) {
    return this.referralsService.getMyReferral(userId);
  }

  // --- ADMIN ---

  @Get()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.STAFF)
  @ApiOperation({ summary: 'Listar todos los referidos (Admin)' })
  findAll(@Query('page') page?: string, @Query('limit') limit?: string) {
    return this.referralsService.findAll(
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 20,
    );
  }

  @Get('commissions')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Listar todas las comisiones (Super Admin)' })
  getCommissions(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('type') type?: string,
    @Query('status') status?: string,
    @Query('search') search?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('artistId') artistId?: string,
    @Query('referralId') referralId?: string,
  ) {
    return this.referralsService.getCommissions(
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 20,
      { type, status, search, from, to, artistId, referralId },
    );
  }

  @Get('commissions/summary')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Resumen de comisiones (Super Admin)' })
  getCommissionsSummary() {
    return this.referralsService.getCommissionsSummary();
  }

  @Get('commissions/beneficiaries-pending')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Beneficiarios con comisiones pendientes (Super Admin)' })
  getBeneficiariesWithPending() {
    return this.referralsService.getBeneficiariesWithPending();
  }

  @Get('commissions/artists-pending')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Artistas con comisiones pendientes (Super Admin)' })
  getArtistsWithPending() {
    return this.referralsService.getArtistsWithPending();
  }

  @Patch('commissions/pay-all')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Marcar comisiones pendientes como pagadas (por artista, referido, o todas)' })
  markAllPaid(
    @Query('artistId') artistId?: string,
    @Query('referralId') referralId?: string,
  ) {
    return this.referralsService.markAllPaid(artistId, referralId);
  }

  @Patch('commissions/:id/pay')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Marcar comision como pagada (Super Admin)' })
  markCommissionPaid(@Param('id') id: string) {
    return this.referralsService.markCommissionPaid(id);
  }
}
