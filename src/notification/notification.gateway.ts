import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

interface AuthenticatedSocket extends Socket {
  userId?: string;
}

@WebSocketGateway({
  cors: {
    origin: '*', // Configure this properly in production
    credentials: true,
  },
  namespace: '/notifications',
})
export class NotificationGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(NotificationGateway.name);
  private userSocketMap: Map<string, Set<string>> = new Map(); // userId -> Set of socketIds

  constructor(
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  // Handle new connection
  async handleConnection(client: AuthenticatedSocket) {
    try {
      // Get token from query or auth header
      const token =
        client.handshake.query.token as string ||
        client.handshake.auth.token ||
        client.handshake.headers.authorization?.split(' ')[1];

      if (!token) {
        this.logger.warn(`Client ${client.id} connected without token`);
        // Allow connection but don't authenticate
        // Client can authenticate later via 'authenticate' event
        return;
      }

      // Verify JWT token
      const payload = await this.jwtService.verifyAsync(token, {
        secret: this.configService.get<string>('JWT_SECRET'),
      });

      client.userId = payload.sub;
      this.addUserSocket(payload.sub, client.id);
      
      // Join user's room
      client.join(`user:${payload.sub}`);

      this.logger.log(`User ${payload.sub} connected (socket: ${client.id})`);
      
      // Send welcome message
      client.emit('connected', {
        message: 'Connected to notification service',
        userId: payload.sub,
      });
    } catch (error) {
      this.logger.warn(`Connection authentication failed: ${error.message}`);
      // Don't disconnect - allow client to authenticate manually
    }
  }

  // Handle disconnection
  handleDisconnect(client: AuthenticatedSocket) {
    if (client.userId) {
      this.removeUserSocket(client.userId, client.id);
      this.logger.log(`User ${client.userId} disconnected (socket: ${client.id})`);
    }
  }

  // Manual authentication (if token not provided on connect)
  @SubscribeMessage('authenticate')
  async handleAuthenticate(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { token: string },
  ) {
    try {
      const payload = await this.jwtService.verifyAsync(data.token, {
        secret: this.configService.get<string>('JWT_SECRET'),
      });

      client.userId = payload.sub;
      this.addUserSocket(payload.sub, client.id);
      client.join(`user:${payload.sub}`);

      this.logger.log(`User ${payload.sub} authenticated (socket: ${client.id})`);

      return {
        success: true,
        message: 'Authenticated successfully',
        userId: payload.sub,
      };
    } catch (error) {
      return {
        success: false,
        message: 'Authentication failed',
        error: error.message,
      };
    }
  }

  // Subscribe to specific notification types
  @SubscribeMessage('subscribe')
  handleSubscribe(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { types: string[] },
  ) {
    if (!client.userId) {
      return { success: false, message: 'Not authenticated' };
    }

    // Join rooms for specific notification types
    data.types.forEach((type) => {
      client.join(`user:${client.userId}:${type}`);
    });

    return {
      success: true,
      message: `Subscribed to: ${data.types.join(', ')}`,
    };
  }

  // Unsubscribe from notification types
  @SubscribeMessage('unsubscribe')
  handleUnsubscribe(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { types: string[] },
  ) {
    if (!client.userId) {
      return { success: false, message: 'Not authenticated' };
    }

    data.types.forEach((type) => {
      client.leave(`user:${client.userId}:${type}`);
    });

    return {
      success: true,
      message: `Unsubscribed from: ${data.types.join(', ')}`,
    };
  }

  // Ping/pong for connection health check
  @SubscribeMessage('ping')
  handlePing() {
    return { event: 'pong', timestamp: new Date().toISOString() };
  }

  // ============ Server-side methods to send notifications ============

  // Send notification to a specific user
  sendToUser(userId: string, notification: any) {
    this.server.to(`user:${userId}`).emit('notification', notification);
    this.logger.debug(`Notification sent to user ${userId}`);
  }

  // Send notification to user for specific type
  sendToUserByType(userId: string, type: string, notification: any) {
    this.server.to(`user:${userId}:${type}`).emit('notification', notification);
  }

  // Broadcast to all connected users (admin announcements)
  broadcast(notification: any) {
    this.server.emit('broadcast', notification);
    this.logger.log('Broadcast notification sent to all users');
  }

  // Send to multiple users
  sendToUsers(userIds: string[], notification: any) {
    userIds.forEach((userId) => {
      this.sendToUser(userId, notification);
    });
  }

  // Get online users count
  getOnlineUsersCount(): number {
    return this.userSocketMap.size;
  }

  // Check if user is online
  isUserOnline(userId: string): boolean {
    const sockets = this.userSocketMap.get(userId);
    return sockets !== undefined && sockets.size > 0;
  }

  // ============ Private helper methods ============

  private addUserSocket(userId: string, socketId: string) {
    if (!this.userSocketMap.has(userId)) {
      this.userSocketMap.set(userId, new Set());
    }
    this.userSocketMap.get(userId)!.add(socketId);
  }

  private removeUserSocket(userId: string, socketId: string) {
    const sockets = this.userSocketMap.get(userId);
    if (sockets) {
      sockets.delete(socketId);
      if (sockets.size === 0) {
        this.userSocketMap.delete(userId);
      }
    }
  }
}
