import { Module } from '@nestjs/common';
import { GameService } from './game/game.service';
import { GameModule } from './game/game.module';
import { Gateway } from './gateway/gateway';
import { MatchmakingModule } from './matchmaking/matchmaking.module';
import { MatchmakingService } from './matchmaking/matchmaking.service';

@Module({
  imports: [GameModule, MatchmakingModule],
  providers: [GameService, Gateway, MatchmakingService],
})
export class AppModule {}
