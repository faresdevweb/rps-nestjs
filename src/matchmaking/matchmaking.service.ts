import { Injectable } from '@nestjs/common';
import { randomBytes } from 'crypto';
import { Room } from 'type';

@Injectable()
export class MatchmakingService {
  private waitingPlayers: string[] = [];
  rooms: Room[] = [];
  constructor() {}

  addToQueue(playerId: string): void {
    this.waitingPlayers.push(playerId);
    console.log(`Player ${playerId} added to queuarraye`);
    this.tryToMatchPlayers();
  }

  getRoom(roomId: string): Room | undefined {
    return this.rooms.find((room) => room.roomId === roomId);
  }

  private createRoom(playerId: string): string {
    const roomId = this.generateGameId();
    const newRoom: Room = {
      roomId,
      players: [playerId],
      choices: {
        player1Choice: '',
        player2Choice: '',
      },
      scores: {
        player1Score: 0,
        player2Score: 0,
      },
    };
    this.rooms.push(newRoom);
    return roomId;
  }

  private generateGameId(): string {
    return randomBytes(6).toString('hex');
  }

  private joinRoom(roomId: string, playerId: string): void {
    const room = this.rooms.find((room) => room.roomId === roomId);
    if (room && room.players.length < 2) {
      room.players.push(playerId);
      console.log(`Player ${playerId} joined room ${roomId}`);
    } else {
      console.log(`Failed to join room: ${roomId}`);
      throw new Error('Room does not exist or is full');
    }
  }

  private tryToMatchPlayers(): void {
    console.log('Trying to match players...');
    if (this.waitingPlayers.length >= 2) {
      const playerOneId = this.waitingPlayers.shift()!;
      const playerTwoId = this.waitingPlayers.shift()!;
      console.log(`Matching players: ${playerOneId} and ${playerTwoId}`);

      const roomId = this.createRoom(playerOneId);
      this.joinRoom(roomId, playerTwoId);

      console.log(
        `Room created: ${roomId} with players: ${playerOneId}, ${playerTwoId}`,
      );
      console.log(`Current state of rooms: `, this.rooms);
    }
  }

  removeRoom(roomId: string): void {
    this.rooms = this.rooms.filter((room) => room.roomId !== roomId);
    console.log('room removed', roomId);
  }

  checkWaitingPlayerArrays(): void {
    console.log('Waiting players: ', this.waitingPlayers);
  }
}
