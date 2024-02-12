import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { parseUnits } from 'ethers';
import { GameService } from 'src/game/game.service';
import { MatchmakingService } from 'src/matchmaking/matchmaking.service';
import { WalletService } from 'src/wallet/wallet.service';
import { Room } from 'type';

@WebSocketGateway({
  cors: {
    origin: 'http://localhost:3000',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
  },
  transports: ['websocket'],
})
export class Gateway implements OnGatewayConnection, OnGatewayDisconnect {
  constructor(
    private gameService: GameService,
    private matchmakingService: MatchmakingService,
    private wallet: WalletService,
  ) {}
  private activeClients = new Set<string>();
  private clientRoomMap: { [clientId: string]: string } = {};

  @WebSocketServer()
  server: any;

  handleConnection(client: any) {
    console.log(
      `Client connected: ${client.id}. Total clients: ${this.activeClients.size}`,
    );
  }

  handleDisconnect(client: any) {
    console.log(`Client disconnected: ${client.id}`);
    const roomId = this.clientRoomMap[client.id];
    const room = this.matchmakingService.getRoomById(roomId);
    if (!room) return;
    if (roomId) {
      this.server.to(roomId).emit('opponentLeft', {
        message: 'Your opponent has left the game.',
      });
      const game = this.wallet.findGameContract(room.address.gameAddress);
      console.log('GAME', game);
      if (game) {
        game.destroyGame();
        game.on('GameCancelled', (address: string) => {
          console.log('Game cancelled', address);
        });
        this.wallet.removeGameFromArrays(room.address.gameAddress);
      }
      this.matchmakingService.removeRoom(roomId);
    }
  }

  updateRoom(roomId: string, room: Room) {
    this.server.to(roomId).emit('roomUpdate', room);
  }

  @SubscribeMessage('gameStarted')
  handleGameStarted(@MessageBody() data: Room) {
    const room = this.matchmakingService.getRoomById(data.roomId);
    const roomModified = { ...room, hasGameStarted: true };
    this.matchmakingService.updateRoom(data.roomId, roomModified);
    if (room) this.server.to(data.roomId).emit('gameStarted', roomModified);
  }

  @SubscribeMessage('playerLeft')
  handlePlayerLeft(@MessageBody() data: Room): void {
    const room = this.matchmakingService.getRoomById(data.roomId);
    if (!room) return;
    if (room) {
      this.server
        .to(data.roomId)
        .emit('opponentLeft', { message: 'Your opponent has left the game.' });
      const game = this.wallet.findGameContract(room.address.gameAddress);
      if (game) {
        game.destroyGame();
        game.on('GameCancelled', (address: string) => {
          console.log('Game cancelled', address);
          this.wallet.removeGameFromArrays(room.address.gameAddress);
        });
      }
    }
    this.matchmakingService.removeRoom(data.roomId);
  }

  @SubscribeMessage('requestRoomDetails')
  handleRequestRoomDetails(client: any, roomId: string) {
    const room = this.matchmakingService.getRoomById(roomId);
    if (room) {
      this.server.to(client.id).emit('roomDetails', room);
    } else {
      this.server.to(client.id).emit('error', { message: 'Room not found' });
    }
  }

  @SubscribeMessage('joinQueue')
  async handleMatchmaking(
    @ConnectedSocket() client: any,
    @MessageBody() data: { betAmount: number; address: string },
  ) {
    const room = this.matchmakingService.addToQueue(
      client.id,
      data.betAmount,
      data.address,
      (roomId, room) => {
        client.join(roomId);
        this.updateRoom(roomId, room);
      },
    );

    this.clientRoomMap[client.id] = room.roomId;
    if (room) {
      client.join(room.roomId);
      this.server.to(client.id).emit('roomJoined', room);
    }
    if (room.players.length === 2) {
      const betAmountParsed = parseUnits(room.betAmount.toString(), 18);
      await this.wallet.gameFactoryContract.createGame(
        betAmountParsed,
        room.address.player1,
        room.address.player2,
      );

      this.wallet.gameFactoryContract.on(
        'GameCreated',
        (gameAddress: string) => {
          const roomWithGameAddress = {
            ...room,
            address: { ...room.address, gameAddress },
          };
          this.matchmakingService.updateRoom(room.roomId, roomWithGameAddress);
          this.wallet.newContract(gameAddress);
          this.server.to(room.roomId).emit('gameCreated', roomWithGameAddress);
        },
      );
    }
  }

  @SubscribeMessage('makeChoice')
  async makeChoice(
    @ConnectedSocket() client: any,
    @MessageBody() data: { roomId: string; choice: string },
  ) {
    try {
      const room = this.matchmakingService.getRoomById(data.roomId);
      const roomBeforeUpdate = { ...room };
      const result = this.gameService.playRound(client.id, data);
      console.log('RESULT', result);

      const roundResultObject = {
        player1: roomBeforeUpdate.address.player1,
        player2: roomBeforeUpdate.address.player2,
        player1Choice: roomBeforeUpdate.choices.player1Choice,
        player2Choice: roomBeforeUpdate.choices.player2Choice,
        player1Score: roomBeforeUpdate.scores.player1Score,
        player2Score: roomBeforeUpdate.scores.player2Score,
        roundWinner: result.roundWinner,
      };

      this.gameService.resetChoices(data.roomId);

      this.server.to(data.roomId).emit('roundResult', roundResultObject);

      if (room.scores.player1Score === 3 || room.scores.player2Score === 3) {
        console.log('ROOM IN GATEWAY BEFORE EMIT GAME OVER', room);
        this.server.to(data.roomId).emit('gameOver', room);
        this.matchmakingService.removeRoom(data.roomId);
      }

      return result;
    } catch (error) {
      this.server.to(data.roomId).emit('error', error.message);
    }
  }
}
