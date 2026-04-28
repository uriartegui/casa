import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class SmsService {
  private readonly logger = new Logger('SmsService');

  async send(phone: string, message: string): Promise<void> {
    this.logger.warn(`[SMS → ${phone}] ${message}`);
  }
}
