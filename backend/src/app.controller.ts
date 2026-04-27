import { Controller, Get, Param, Redirect } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('invite/:code')
  @Redirect()
  redirectInvite(@Param('code') code: string) {
    return { url: `casa://join/${code}`, statusCode: 302 };
  }
}
