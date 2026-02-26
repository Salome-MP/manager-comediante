import {
  Controller, Get, Post, Patch, Param, Body, Query, UseGuards, UseInterceptors, UploadedFiles,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { FilesInterceptor } from '@nestjs/platform-express';
import { ReturnsService } from './returns.service';
import { CreateReturnDto } from './dto/create-return.dto';
import { ResolveReturnDto } from './dto/resolve-return.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Role, ReturnRequestStatus } from '@prisma/client';
import { UploadService } from '../upload/upload.service';

@ApiTags('Returns')
@Controller('returns')
@ApiBearerAuth()
export class ReturnsController {
  constructor(
    private returnsService: ReturnsService,
    private uploadService: UploadService,
  ) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Crear solicitud de devolucion' })
  create(
    @CurrentUser('id') userId: string,
    @Body() dto: CreateReturnDto,
  ) {
    return this.returnsService.create(userId, dto);
  }

  @Get('my-returns')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Mis solicitudes de devolucion' })
  findMyReturns(@CurrentUser('id') userId: string) {
    return this.returnsService.findMyReturns(userId);
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.STAFF)
  @ApiOperation({ summary: 'Todas las solicitudes (Admin)' })
  findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('status') status?: ReturnRequestStatus,
  ) {
    return this.returnsService.findAll(
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 20,
      { status },
    );
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Detalle de solicitud' })
  findOne(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @CurrentUser('role') role: string,
  ) {
    const isAdmin = role === 'SUPER_ADMIN' || role === 'STAFF';
    return this.returnsService.findOne(id, userId, isAdmin);
  }

  @Patch(':id/resolve')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.STAFF)
  @ApiOperation({ summary: 'Resolver solicitud (Aprobar/Rechazar)' })
  resolve(
    @Param('id') id: string,
    @CurrentUser('id') adminUserId: string,
    @Body() dto: ResolveReturnDto,
  ) {
    return this.returnsService.resolve(id, adminUserId, dto);
  }

  @Post(':id/upload')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FilesInterceptor('files', 5))
  @ApiOperation({ summary: 'Subir fotos de evidencia' })
  async upload(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    const urls: string[] = [];
    for (const file of files) {
      this.uploadService.validateImage(file);
      const filename = this.uploadService.generateFilename(file.originalname, 'return');
      const url = await this.uploadService.uploadFile(file.buffer, 'returns', filename);
      urls.push(url);
    }
    return this.returnsService.addImages(id, userId, urls);
  }
}
