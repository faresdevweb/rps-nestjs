import { Injectable } from '@nestjs/common';
import { MatchmakingService } from 'src/matchmaking/matchmaking.service';
import { WalletService } from 'src/wallet/wallet.service';
import { PlayerChoice, Room } from 'type';

@Injectable()
export class GameService {
  constructor(
    private matchmakingService: MatchmakingService,
    private walletService: WalletService,
  ) {}

  playRound(playerId: string, data: { roomId: string; choice: string }): any {
    const room = this.matchmakingService.getRoomById(data.roomId);

    if (!room) throw new Error('Room not found');

    // Mise à jour des choix
    if (room.players[0] === playerId) {
      room.choices.player1Choice = data.choice;
    } else if (room.players[1] === playerId) {
      room.choices.player2Choice = data.choice;
    }

    // Vérification des choix et mise à jour des scores
    if (room.choices.player1Choice && room.choices.player2Choice) {
      const roundWinner = this.determineWinner(
        room.choices.player1Choice,
        room.choices.player2Choice,
      );

      this.updateScores(roundWinner, room);

      console.log('ROOM STATE AFTER UPDATE', room);

      const gameWinner = this.checkForGameWinner(room);

      if (gameWinner) {
        room.victoryMessage = gameWinner.message;
        room.victoryAddress = gameWinner.address;
        console.log('VICTORY MESSAGE', room.victoryMessage);
        console.log(room);
        return room;
      }
      console.log(room);

      return room;
    } else {
      console.log(`Waiting for other player's choice in room ${data.roomId}`);
    }
  }

  resetChoices(roomId: string) {
    const room = this.matchmakingService.getRoomById(roomId);
    room.choices.player1Choice = '';
    room.choices.player2Choice = '';
  }

  private updateScores(roundWinner: any, room: Room) {
    if (roundWinner === 'player1') {
      room.scores.player1Score = (room.scores.player1Score || 0) + 1;
    } else if (roundWinner === 'player2') {
      room.scores.player2Score = (room.scores.player2Score || 0) + 1;
    }
  }

  private checkForGameWinner(
    room: Room,
  ): { message: string; address: string } | null {
    const gameContract = this.walletService.findGameContract(
      room.address.gameAddress,
    );
    if (room.scores.player1Score === 3) {
      // appel smart contract set winner avec l'address du vainqueur
      gameContract.setWinner(room.address.player1);
      return {
        message: `Player with address : ${room.address.player1} wins the game!`,
        address: room.address.player1,
      };
    } else if (room.scores.player2Score === 3) {
      // appel smart contract set winner avec l'address du vainqueur
      gameContract.setWinner(room.address.player2);
      return {
        message: `Player with address : ${room.address.player2} wins the game!`,
        address: room.address.player2,
      };
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
