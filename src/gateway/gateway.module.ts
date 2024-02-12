import { Module } from '@nestjs/common';
import { Gateway } from './gateway';
import { GameModule } from 'src/game/game.module';
import { WalletModule } from 'src/wallet/wallet.module';
import { WalletService } from 'src/wallet/wallet.service';

@Module({
  imports: [GameModule, WalletModule],
  providers: [Gateway, WalletService],
})
export class GatewayModule {}
