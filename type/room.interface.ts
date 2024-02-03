export type Room = {
  roomId: string;
  players: string[];
  choices: {
    player1Choice: string;
    player2Choice: string;
  };
  scores: {
    player1Score: number;
    player2Score: number;
  };
};
