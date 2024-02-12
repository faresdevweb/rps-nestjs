import { Injectable, Inject } from '@nestjs/common';
import { ethers } from 'ethers';
import abi from '../abi/game_contract.json';
import abi_game from '../abi/game.json';

@Injectable()
export class WalletService {
  private wallet: ethers.Wallet;
  private provider: ethers.JsonRpcProvider;
  walletSigner: ethers.Wallet;
  gameFactoryContract: ethers.Contract;
  gamesContractArrays: ethers.Contract[] = [];

  constructor(
    @Inject('PRIVATE_KEY') privateKey: string,
    @Inject('RPC_URL') rpcUrl: string,
    @Inject('CONTRACT_ADDRESS') address: string,
  ) {
    this.provider = new ethers.JsonRpcProvider(rpcUrl);
    this.wallet = new ethers.Wallet(privateKey, this.provider);
    this.walletSigner = this.wallet.connect(this.provider);
    this.gameFactoryContract = new ethers.Contract(
      address,
      abi.abi,
      this.walletSigner,
    );
  }

  newContract(address: string) {
    const newGame = new ethers.Contract(
      address,
      abi_game.abi,
      this.walletSigner,
    );
    this.gamesContractArrays.push(newGame);
    console.log(this.gamesContractArrays, 'CONTRACTS ARRAY');
  }

  findGameContract(address: string) {
    const contract = this.gamesContractArrays.find(
      (contract: ethers.Contract) => contract.target === address,
    );
    return contract;
  }

  removeGameFromArrays(address: string) {
    this.gamesContractArrays = this.gamesContractArrays.filter(
      (contract: ethers.Contract) => contract.target !== address,
    );
    console.log(this.gamesContractArrays, 'CONTRACTS ARRAY');
  }
}
