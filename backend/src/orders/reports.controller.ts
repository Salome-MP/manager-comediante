import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { ReportsService } from './reports.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Role } from '@prisma/client';

@ApiTags('Reports')
@Controller('reports')
@ApiBearerAuth()
export class ReportsController {
  constructor(private reportsService: ReportsService) {}

  // --- ADMIN ---

  @Get('admin/dashboard')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Estadísticas generales del admin dashboard (Super Admin)' })
  getAdminDashboardStats() {
    return this.reportsService.getAdminDashboardStats();
  }

  @Get('admin/sales-chart')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Gráfico de ventas (Super Admin) — productos + entradas' })
  getAdminSalesChart(
    @Query('period') period?: 'week' | 'month' | 'year',
    @Query('artistId') artistId?: string,
  ) {
    return this.reportsService.getSalesChart(period || 'month', artistId);
  }

  @Get('admin/top-artists')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Top artistas por ingresos generados (Super Admin)' })
  getTopArtists(@Query('limit') limit?: string) {
    return this.reportsService.getTopArtistsByRevenue(limit ? parseInt(limit) : 10);
  }

  @Get('admin/reports-summary')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'KPIs resumen: ventas, ganancia, pendiente, pedidos (Super Admin)' })
  getReportsSummary(@Query('period') period?: 'week' | 'month' | 'year') {
    return this.reportsService.getReportsSummary(period || 'month');
  }

  @Get('admin/top-products')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Top productos por unidades vendidas (Super Admin)' })
  getTopProducts(@Query('limit') limit?: string) {
    return this.reportsService.getTopProducts(limit ? parseInt(limit) : 8);
  }

  @Get('admin/shows-summary')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Resumen de shows: próximos, tickets, ocupación (Super Admin)' })
  getShowsSummary() {
    return this.reportsService.getShowsSummary();
  }

  // --- ARTIST ---

  @Get('artist/dashboard')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Dashboard stats del artista' })
  getArtistDashboardStats(@CurrentUser() user: { id: string; artistId?: string }) {
    return this.reportsService.getArtistDashboardStats(user.artistId || '');
  }

  @Get('artist/sales-chart')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Gráfico de ventas del artista' })
  getArtistSalesChart(
    @CurrentUser() user: { id: string; artistId?: string },
    @Query('period') period?: 'week' | 'month' | 'year',
  ) {
    return this.reportsService.getSalesChart(period || 'month', user.artistId);
  }

  @Get('artist/analytics')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Analytics avanzados del artista' })
  getArtistAnalytics(@CurrentUser() user: { id: string; artistId?: string }) {
    return this.reportsService.getArtistAnalytics(user.artistId || '');
  }

  @Get('artist/sales-detail')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Detalle de ventas del artista' })
  getArtistSalesDetail(
    @CurrentUser() user: { id: string; artistId?: string },
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.reportsService.getArtistSalesDetail(
      user.artistId || '',
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 20,
    );
  }

  @Get('artist/ticket-sales')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Detalle de entradas vendidas del artista' })
  getArtistTicketSales(
    @CurrentUser() user: { id: string; artistId?: string },
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.reportsService.getArtistTicketSales(
      user.artistId || '',
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 20,
    );
  }
}
