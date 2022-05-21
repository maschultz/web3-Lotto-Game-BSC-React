import WalletConnectProvider from '@walletconnect/web3-provider';

export const providerOptions = {
	walletconnect: {
		package: WalletConnectProvider, // required
		options: {
			rpc: {
				56: 'https://bsc-dataseed.binance.org',
				// 97: 'https://data-seed-prebsc-1-s1.binance.org:8545',
			},
			network: 'binance',
		},
	},
};
