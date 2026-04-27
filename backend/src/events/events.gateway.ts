import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, WebSocket } from 'ws';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { HouseholdMember } from '../households/household-member.entity';

@WebSocketGateway({ path: '/ws' })
export class EventsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private rooms = new Map<string, Set<WebSocket>>();

  constructor(
    private readonly jwtService: JwtService,
    @InjectRepository(HouseholdMember)
    private readonly memberRepo: Repository<HouseholdMember>,
  ) {}

  handleConnection(client: WebSocket & { _rooms?: Set<string>; _request?: any; data?: any }) {
    // A requisição de upgrade fica em client._socket?.server mas com ws puro
    // precisamos acessar via o request passado pelo adaptador.
    // No NestJS com adaptador ws, o request HTTP fica em (client as any)._socket._httpMessage
    // ou via handshake. Usamos a URL da conexão para extrair o token via query param.
    const request: any = (client as any)._socket?._httpMessage ?? (client as any)._req;
    const rawUrl: string = request?.url ?? '';
    const urlParams = new URLSearchParams(rawUrl.split('?')[1] ?? '');
    const token =
      urlParams.get('token') ??
      (request?.headers?.authorization as string | undefined)?.replace('Bearer ', '');

    if (!token) {
      client.send(JSON.stringify({ event: 'error', data: { message: 'Token não fornecido' } }));
      client.close();
      return;
    }

    try {
      const payload = this.jwtService.verify(token, {
        secret: process.env.JWT_SECRET,
      }) as { sub: string; email: string };

      // Armazena userId e rooms no cliente
      (client as any).data = { userId: payload.sub };
      (client as any)._rooms = new Set<string>();
    } catch {
      client.send(JSON.stringify({ event: 'error', data: { message: 'Token inválido' } }));
      client.close();
    }
  }

  handleDisconnect(client: WebSocket) {
    const clientRooms: Set<string> = (client as any)._rooms ?? new Set();
    clientRooms.forEach((room) => {
      this.rooms.get(room)?.delete(client);
    });
  }

  @SubscribeMessage('join')
  async handleJoin(
    @MessageBody() householdId: string,
    @ConnectedSocket() client: WebSocket,
  ) {
    const userId: string | undefined = (client as any).data?.userId;

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
    (client as any)._rooms.add(householdId);
  }

  @SubscribeMessage('leave')
  handleLeave(@MessageBody() householdId: string, @ConnectedSocket() client: WebSocket) {
    this.rooms.get(householdId)?.delete(client);
    (client as any)._rooms?.delete(householdId);
  }

  emitHouseholdUpdate(householdId: string) {
    const payload = JSON.stringify({ event: 'household:updated', data: { householdId } });
    this.rooms.get(householdId)?.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) client.send(payload);
    });
  }
}
