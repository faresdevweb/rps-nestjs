import { Module, Global } from '@nestjs/common';
import { WalletService } from './wallet.service';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [
    WalletService,
    {
      provide: 'PRIVATE_KEY',
      useFactory: async (configService: ConfigService) =>
        configService.get('PRIVATE_KEY'),
      inject: [ConfigService],
    },
    {
      provide: 'RPC_URL',
      useFactory: async (configService: ConfigService) =>
        configService.get('RPC_URL'),
      inject: [ConfigService],
    },
    {
      provide: 'CONTRACT_ADDRESS',
      useFactory: async (configService: ConfigService) =>
        configService.get('CONTRACT_ADDRESS'),
      inject: [ConfigService],
    },
  ],
  exports: [WalletService],
})
export class WalletModule {}
