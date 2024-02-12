import { Injectable } from '@nestjs/common';
import { randomBytes } from 'crypto';
import { Room } from 'type';

@Injectable()
export class MatchmakingService {
  private rooms: { [betAmount: number]: Room[] } = { 10: [], 20: [], 50: [] };
  private roomMap: { [roomId: string]: Room } = {};
  constructor() {}

  addToQueue(
    playerId: string,
    betAmount: number,
    address: string,
    updateRoomCallback: (roomId: string, room: Room) => void,
  ): Room | undefined {
    const availableRoom = this.rooms[betAmount].find(
      (room) => room.players.length === 1,
    );

    if (availableRoom) {
      // Si une room est disponible, ajoute le joueur à cette room
      this.joinRoom(availableRoom.roomId, playerId, address);
      updateRoomCallback(availableRoom.roomId, availableRoom);

      return availableRoom;
    } else {
      // Sinon, crée une nouvelle room avec le betAmount spécifié
      const newRoom = this.createRoom(playerId, betAmount, address);
      return newRoom;
    }
  }

  getRoomById(roomId: string): Room | undefined {
    return this.roomMap[roomId];
  }

  private createRoom(
    playerId: string,
    betAmount: number,
    player1WalletAddress: string,
  ): Room {
    const roomId = this.generateGameId();
    const newRoom: Room = {
      roomId,
      players: [playerId],
      choices: { player1Choice: '', player2Choice: '' },
      scores: { player1Score: 0, player2Score: 0 },
      betAmount,
      address: { gameAddress: '', player1: player1WalletAddress, player2: '' },
      hasGameStarted: false,
      victoryMessage: '',
      victoryAddress: '',
    };
    this.rooms[betAmount].push(newRoom);
    this.roomMap[roomId] = newRoom;
    return newRoom;
  }

  private generateGameId(): string {
    return randomBytes(6).toString('hex');
  }

  private joinRoom(
    roomId: string,
    playerId: string,
    player2WalletAddress: string,
  ): void {
    let foundRoom: Room | undefined;
    let betAmountKey: number | undefined;

    for (const betAmount in this.rooms) {
      foundRoom = this.rooms[betAmount].find((room) => room.roomId === roomId);
      if (foundRoom) {
        foundRoom.address.player2 = player2WalletAddress;
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        betAmountKey = Number(betAmount);
        break;
      }
    }

    if (foundRoom && foundRoom.players.length < 2) {
      foundRoom.players.push(playerId);
    } else {
      console.log(`Failed to join room: ${roomId}`);
      throw new Error('Room does not exist or is full');
    }
  }

  updateRoom(roomId: string, updatedRoom: Room): void {
    const room = this.roomMap[roomId];
    if (!room) {
      console.log(`Room with ID ${roomId} not found for update.`);
      return;
    }

    // Mettre à jour l'objet room dans roomMap
    this.roomMap[roomId] = updatedRoom;

    // Mettre à jour l'objet room dans le tableau rooms correspondant au betAmount
    const roomsArray = this.rooms[updatedRoom.betAmount];
    const roomIndex = roomsArray.findIndex((r) => r.roomId === roomId);
    if (roomIndex !== -1) {
      roomsArray[roomIndex] = updatedRoom;
    } else {
      console.log(
        `Room with ID ${roomId} not found in betAmount array for update.`,
      );
    }
  }

  removeRoom(roomId: string): void {
    const room = this.roomMap[roomId];
    if (room) {
      const roomsArray = this.rooms[room.betAmount];
      this.rooms[room.betAmount] = roomsArray.filter(
        (r) => r.roomId !== roomId,
      );
      delete this.roomMap[roomId];
      console.log('Room removed', roomId);
    } else {
      console.log(`Failed to remove room: ${roomId}, room not found.`);
    }
  }
}
