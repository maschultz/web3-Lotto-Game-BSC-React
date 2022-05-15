import WalletConnect from '@walletconnect/web3-provider';
import CoinbaseWalletSDK from '@coinbase/wallet-sdk';

export const providerOptions = {
	walletconnect: {
		package: WalletConnect, // required
		options: {
			rpc: {
				56: 'https://bsc-dataseed.binance.org',
			},
			network: 'binance',
		},
	},
};
