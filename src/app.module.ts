import { Module } from '@nestjs/common';
import { GameService } from './game/game.service';
import { GameModule } from './game/game.module';
import { Gateway } from './gateway/gateway';
import { MatchmakingModule } from './matchmaking/matchmaking.module';
import { MatchmakingService } from './matchmaking/matchmaking.service';
import { WalletModule } from './wallet/wallet.module';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    GameModule,
    MatchmakingModule,
    WalletModule,
  ],
  providers: [GameService, Gateway, MatchmakingService],
})
export class AppModule {}
