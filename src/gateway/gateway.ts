import {
  ConnectedSocket,
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { GameService } from 'src/game/game.service';
import { MatchmakingService } from 'src/matchmaking/matchmaking.service';

@WebSocketGateway({
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
  },
  transports: ['websocket'],
})
export class Gateway {
  constructor(
    private gameService: GameService,
    private matchmakingService: MatchmakingService,
  ) {}

  @WebSocketServer()
  server: any;

  onModuleInit() {
    this.server.on('connection', (client: any) =>
      this.handleConnection(client),
    );
  }

  handleConnection(client: any) {
    console.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: any) {
    console.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('joinQueue')
  async handleMatchmaking(client: any) {
    const result = this.matchmakingService.addToQueue(client.id);
    return result;
  }

  @SubscribeMessage('makeChoice')
  async makeChoice(
    @ConnectedSocket() client: any,
    @MessageBody() data: { roomId: string; choice: string },
  ) {
    try {
      const result = this.gameService.playRound(client.id, data);
      return result;
    } catch (error) {
      this.server.to(data.roomId).emit('error', error.message);
    }
  }
}
