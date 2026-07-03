import {
  Controller,
  Get,
  Patch,
  Delete,
  Body,
  Request,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import type { AuthenticatedRequest } from '../common/authenticated-request';
import { UsersService } from './users.service';
import { RemovePushTokenDto, UpdatePushTokenDto } from './dto/update-push-token.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';

@ApiTags('users')
@ApiBearerAuth()
@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get('me')
  async getMe(@Request() req: AuthenticatedRequest) {
    return this.usersService.findById(req.user.id);
  }

  @Patch('me')
  async updateProfile(@Request() req: AuthenticatedRequest, @Body() dto: UpdateProfileDto) {
    return this.usersService.updateProfile(req.user.id, dto);
  }

  @Patch('me/push-token')
  async updatePushToken(@Request() req: AuthenticatedRequest, @Body() dto: UpdatePushTokenDto) {
    await this.usersService.updatePushToken(req.user.id, dto);
    return { ok: true };
  }

  @Delete('me/push-token')
  async removePushToken(@Request() req: AuthenticatedRequest, @Body() dto: RemovePushTokenDto) {
    await this.usersService.removePushToken(req.user.id, dto);
    return { ok: true };
  }

  @Delete('me')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteAccount(@Request() req: AuthenticatedRequest) {
    await this.usersService.deleteAccount(req.user.id);
  }
}
