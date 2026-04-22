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

@WebSocketGateway({ path: '/ws' })
export class EventsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private rooms = new Map<string, Set<WebSocket>>();

  handleConnection(client: WebSocket) {
    (client as any)._rooms = new Set<string>();
  }

  handleDisconnect(client: WebSocket) {
    const clientRooms: Set<string> = (client as any)._rooms ?? new Set();
    clientRooms.forEach((room) => {
      this.rooms.get(room)?.delete(client);
    });
  }

  @SubscribeMessage('join')
  handleJoin(@MessageBody() householdId: string, @ConnectedSocket() client: WebSocket) {
    if (!this.rooms.has(householdId)) this.rooms.set(householdId, new Set());
    this.rooms.get(householdId)!.add(client);
    (client as any)._rooms.add(householdId);
  }

  @SubscribeMessage('leave')
  handleLeave(@MessageBody() householdId: string, @ConnectedSocket() client: WebSocket) {
    this.rooms.get(householdId)?.delete(client);
    (client as any)._rooms.delete(householdId);
  }

  emitHouseholdUpdate(householdId: string) {
    const payload = JSON.stringify({ event: 'household:updated', data: { householdId } });
    this.rooms.get(householdId)?.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) client.send(payload);
    });
  }
}
