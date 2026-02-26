import {
  Controller,
  Get,
  Put,
  Delete,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { SettingsService } from './settings.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '@prisma/client';

@ApiTags('Settings')
@Controller('settings')
export class SettingsController {
  constructor(private settingsService: SettingsService) {}

  @Get()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.STAFF)
  @ApiOperation({ summary: 'Listar todas las configuraciones' })
  findAll() {
    return this.settingsService.findAll();
  }

  @Get(':key')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.STAFF)
  @ApiOperation({ summary: 'Obtener una configuracion por clave' })
  findByKey(@Param('key') key: string) {
    return this.settingsService.findByKey(key);
  }

  @Put()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Actualizar multiples configuraciones' })
  upsertMany(@Body() body: { settings: { key: string; value: string; label?: string }[] }) {
    return this.settingsService.upsertMany(body.settings);
  }

  @Put(':key')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Crear o actualizar una configuracion' })
  upsert(
    @Param('key') key: string,
    @Body() body: { value: string; label?: string },
  ) {
    return this.settingsService.upsert(key, body.value, body.label);
  }

  @Delete(':key')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Eliminar una configuracion' })
  remove(@Param('key') key: string) {
    return this.settingsService.remove(key);
  }
}
