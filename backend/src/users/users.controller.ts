import { Controller, Get, Patch, Body, Request, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UsersService } from './users.service';
import { UpdatePushTokenDto } from './dto/update-push-token.dto';

@ApiTags('users')
@ApiBearerAuth()
@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get('me')
  async getMe(@Request() req: any) {
    return this.usersService.findById(req.user.id);
  }

  @Patch('me/push-token')
  async updatePushToken(@Request() req: any, @Body() dto: UpdatePushTokenDto) {
    await this.usersService.updatePushToken(req.user.id, dto.pushToken);
    return { ok: true };
  }
}
