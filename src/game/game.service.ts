import { Injectable } from '@nestjs/common';
import { MatchmakingService } from 'src/matchmaking/matchmaking.service';
import { PlayerChoice, Room } from 'type';

@Injectable()
export class GameService {
  constructor(private matchmakingService: MatchmakingService) {}

  playRound(playerId: string, data: { roomId: string; choice: string }): any {
    console.log('PLAYER ID ', playerId);
    console.log('roomId', data.roomId);

    const room = this.matchmakingService.rooms.find(
      (room) => room.roomId === data.roomId,
    );

    if (!room) throw new Error('Room not found');

    // Mise à jour des choix
    if (room.players[0] === playerId) {
      room.choices.player1Choice = data.choice;
    } else if (room.players[1] === playerId) {
      room.choices.player2Choice = data.choice;
    }

    // Vérification des choix et mise à jour des scores
    if (room.choices.player1Choice && room.choices.player2Choice) {
      // Dans playRound
      const roundWinner = this.determineWinner(
        room.choices.player1Choice,
        room.choices.player2Choice,
      );

      this.updateScores(roundWinner, room);

      room.choices.player1Choice = '';
      room.choices.player2Choice = '';

      console.log('ROOM STATE AFTER UPDATE', room);

      const gameWinner = this.checkForGameWinner(room);
      if (gameWinner) {
        this.matchmakingService.removeRoom(data.roomId); // Nettoyer la room
        console.log('GAME WINNER', gameWinner);
      }
    } else {
      console.log(`Waiting for other player's choice in room ${data.roomId}`);
    }
  }

  private updateScores(roundWinner: any, room: Room) {
    if (roundWinner === 'player1') {
      room.scores.player1Score = (room.scores.player1Score || 0) + 1;
    } else if (roundWinner === 'player2') {
      room.scores.player2Score = (room.scores.player2Score || 0) + 1;
    }
  }

  private checkForGameWinner(room: any): string | null {
    if (room.scores.player1Score === 3) {
      return `Player ${room.players[0]} wins the game!`;
    } else if (room.scores.player2Score === 3) {
      return `Player ${room.players[1]} wins the game!`;
    }
    return null;
  }

  private determineWinner(player1Choice: string, player2Choice: string) {
    if (player1Choice === player2Choice) {
      return 'draw';
    }

    const winningCombinations: Record<PlayerChoice, PlayerChoice> = {
      rock: 'scissors',
      scissors: 'papper',
      papper: 'rock',
    };

    if (winningCombinations[player1Choice] === player2Choice) {
      return 'player1';
    } else {
      return 'player2';
    }
  }
}
