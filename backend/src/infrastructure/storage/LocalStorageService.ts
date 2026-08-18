import path from 'path';
import fs from 'fs';

export class LocalStorageService {
  private readonly uploadDir: string;

  constructor() {
    this.uploadDir = path.resolve(process.env.UPLOAD_DIR ?? 'uploads');
    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true });
    }
  }

  getPublicUrl(filename: string): string {
    return `/uploads/${filename}`;
  }

  delete(filename: string): void {
    const filePath = path.join(this.uploadDir, filename);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  }
}
