import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Injectable, Logger } from '@nestjs/common';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
  namespace: '/',
})
@Injectable()
export class LocationGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  private readonly logger = new Logger(LocationGateway.name);

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  // Admin subscribes to updates
  @SubscribeMessage('subscribe_locations')
  handleSubscribe(@ConnectedSocket() client: Socket) {
    this.logger.log(`Admin client subscribed to live updates: ${client.id}`);
    client.join('admin_room');
    return { status: 'subscribed' };
  }

  // Broadcast function called from HTTP POST controller or other services
  broadcastLocationUpdate(data: {
    employeeId: string;
    name: string;
    role: string;
    status: string;
    lat: number;
    lng: number;
    batteryLevel?: number;
    timestamp: string;
  }) {
    this.logger.log(`Broadcasting location update for ${data.name}: [${data.lat}, ${data.lng}]`);
    this.server.to('admin_room').emit('location_update', data);
    // Also broadcast generally in case room subscription is delayed
    this.server.emit('location_update', data);
  }

  @SubscribeMessage('ping_from_client')
  handlePing() {
    return { event: 'pong_from_server', timestamp: new Date().toISOString() };
  }
}
