import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { IsString, MinLength } from 'class-validator';
import { MessagesService } from './messages.service';
import { CurrentUser, AuthUser } from '../common/current-user.decorator';

class SendMessageDto {
  @IsString() @MinLength(1) body: string;
}

@UseGuards(AuthGuard('jwt'))
@Controller('messages')
export class MessagesController {
  constructor(private messagesService: MessagesService) {}

  // The driver's own thread — routes declared before ':driverId' so 'me'
  // is never swallowed by the dynamic param.
  @Get('me')
  async myThread(@CurrentUser() user: AuthUser) {
    const driverId = await this.messagesService.driverIdForUser(user.userId);
    return this.messagesService.getThread(user.companyId, driverId);
  }

  @Post('me')
  async sendMine(@CurrentUser() user: AuthUser, @Body() dto: SendMessageDto) {
    const driverId = await this.messagesService.driverIdForUser(user.userId);
    return this.messagesService.send(user.companyId, driverId, user.userId, user.role, dto.body);
  }

  // Admin/dispatcher view of a specific driver's thread.
  @Get(':driverId')
  thread(@CurrentUser() user: AuthUser, @Param('driverId') driverId: string) {
    return this.messagesService.getThread(user.companyId, driverId);
  }

  @Post(':driverId')
  send(@CurrentUser() user: AuthUser, @Param('driverId') driverId: string, @Body() dto: SendMessageDto) {
    return this.messagesService.send(user.companyId, driverId, user.userId, user.role, dto.body);
  }
}
