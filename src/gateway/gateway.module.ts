import { Module } from '@nestjs/common';
import { Gateway } from './gateway';
import { GameModule } from 'src/game/game.module';

@Module({
  imports: [GameModule],
  providers: [Gateway],
})
export class GatewayModule {}
