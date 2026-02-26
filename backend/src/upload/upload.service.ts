import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class UploadService {
  private storageZone: string;
  private apiKey: string;
  private cdnHostname: string;
  private basePath: string;

  constructor(private config: ConfigService) {
    this.storageZone = this.config.get('BUNNY_STORAGE_ZONE', 'codeaunidev');
    this.apiKey = this.config.get('BUNNY_STORAGE_API_KEY', '');
    this.cdnHostname = this.config.get('BUNNY_CDN_HOSTNAME', 'codeauni2.b-cdn.net');
    this.basePath = this.config.get('BUNNY_BASE_PATH', 'comediantes');
  }

  async uploadFile(
    buffer: Buffer,
    folder: string,
    filename: string,
  ): Promise<string> {
    const path = `${this.basePath}/${folder}/${filename}`;
    const url = `https://storage.bunnycdn.com/${this.storageZone}/${path}`;

    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        AccessKey: this.apiKey,
        'Content-Type': 'application/octet-stream',
      },
      body: new Uint8Array(buffer),
    });

    if (!response.ok) {
      throw new BadRequestException(
        `Error uploading to Bunny CDN: ${response.statusText}`,
      );
    }

    return `https://${this.cdnHostname}/${path}`;
  }

  async deleteFile(cdnUrl: string): Promise<void> {
    try {
      const path = cdnUrl.replace(`https://${this.cdnHostname}/`, '');
      const url = `https://storage.bunnycdn.com/${this.storageZone}/${path}`;

      await fetch(url, {
        method: 'DELETE',
        headers: { AccessKey: this.apiKey },
      });
    } catch {
      // Silently fail on delete — file might not exist
    }
  }

  generateFilename(originalName: string, prefix?: string): string {
    const ext = originalName.split('.').pop()?.toLowerCase() || 'webp';
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    return prefix
      ? `${prefix}-${timestamp}-${random}.${ext}`
      : `${timestamp}-${random}.${ext}`;
  }

  validateImage(file: Express.Multer.File): void {
    const allowedMimes = [
      'image/jpeg',
      'image/png',
      'image/webp',
      'image/gif',
    ];
    if (!allowedMimes.includes(file.mimetype)) {
      throw new BadRequestException(
        'Formato no permitido. Usa JPG, PNG, WEBP o GIF.',
      );
    }
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      throw new BadRequestException('La imagen no debe superar los 10MB.');
    }
  }

  validateMedia(file: Express.Multer.File): void {
    const allowedMimes = [
      'image/jpeg',
      'image/png',
      'image/webp',
      'image/gif',
      'video/mp4',
      'video/webm',
      'video/quicktime',
    ];
    if (!allowedMimes.includes(file.mimetype)) {
      throw new BadRequestException(
        'Formato no permitido. Usa JPG, PNG, WEBP, GIF, MP4, WEBM o MOV.',
      );
    }
    const maxSize = 100 * 1024 * 1024; // 100MB
    if (file.size > maxSize) {
      throw new BadRequestException('El archivo no debe superar los 100MB.');
    }
  }
}
