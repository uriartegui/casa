import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import type { IncomingMessage } from 'node:http';
import { Server, WebSocket } from 'ws';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { HouseholdMember } from '../households/household-member.entity';

type AuthenticatedWebSocket = WebSocket & {
  _req?: IncomingMessage;
  _socket?: {
    _httpMessage?: IncomingMessage;
  };
  data?: {
    userId: string;
  };
  _rooms?: Set<string>;
};

type JwtPayload = {
  sub: string;
  email: string;
};

@WebSocketGateway({ path: '/ws' })
export class EventsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private rooms = new Map<string, Set<AuthenticatedWebSocket>>();

  constructor(
    private readonly jwtService: JwtService,
    @InjectRepository(HouseholdMember)
    private readonly memberRepo: Repository<HouseholdMember>,
  ) {}

  handleConnection(client: AuthenticatedWebSocket, requestFromAdapter?: IncomingMessage) {
    const request = requestFromAdapter ?? client._req ?? client._socket?._httpMessage;
    const rawUrl = request?.url ?? '';
    const urlParams = new URLSearchParams(rawUrl.split('?')[1] ?? '');
    const authorization = request?.headers?.authorization;
    const bearerToken = Array.isArray(authorization) ? authorization[0] : authorization;
    const token = urlParams.get('token') ?? bearerToken?.replace('Bearer ', '');

    if (!token) {
      client.send(JSON.stringify({ event: 'error', data: { message: 'Token não fornecido' } }));
      client.close();
      return;
    }

    try {
      const payload = this.jwtService.verify(token, {
        secret: process.env.JWT_SECRET,
      }) as JwtPayload;

      client.data = { userId: payload.sub };
      client._rooms = new Set<string>();
    } catch {
      client.send(JSON.stringify({ event: 'error', data: { message: 'Token inválido' } }));
      client.close();
    }
  }

  handleDisconnect(client: AuthenticatedWebSocket) {
    const clientRooms = client._rooms ?? new Set<string>();
    clientRooms.forEach((room) => {
      this.rooms.get(room)?.delete(client);
    });
  }

  @SubscribeMessage('join')
  async handleJoin(
    @MessageBody() householdId: string,
    @ConnectedSocket() client: AuthenticatedWebSocket,
  ) {
    const userId = client.data?.userId;

    if (!userId) {
      return;
    }

    const membership = await this.memberRepo.findOne({
      where: { userId, householdId },
    });

    if (!membership) {
      client.send(
        JSON.stringify({ event: 'error', data: { message: 'Acesso negado à casa' } }),
      );
      return;
    }

    if (!this.rooms.has(householdId)) this.rooms.set(householdId, new Set());
    this.rooms.get(householdId)!.add(client);
    client._rooms?.add(householdId);
  }

  @SubscribeMessage('leave')
  handleLeave(@MessageBody() householdId: string, @ConnectedSocket() client: AuthenticatedWebSocket) {
    this.rooms.get(householdId)?.delete(client);
    client._rooms?.delete(householdId);
  }

  emitHouseholdUpdate(householdId: string) {
    const payload = JSON.stringify({ event: 'household:updated', data: { householdId } });
    this.rooms.get(householdId)?.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) client.send(payload);
    });
  }
}
