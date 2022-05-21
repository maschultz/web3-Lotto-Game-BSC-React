import { useEffect, useState } from 'react';
import {
	VStack,
	Button,
	Text,
	Flex,
	HStack,
	Select,
	FormControl,
	Spacer,
	FormLabel,
	FormErrorMessage,
	FormHelperText,
	Input,
	Box,
} from '@chakra-ui/react';
import { CheckCircleIcon, WarningIcon } from '@chakra-ui/icons';
import { Tooltip } from '@chakra-ui/react';
import { networkParams } from './networks';
import { toHex, truncateAddress } from './utils';
import { ethers, BigNumber } from 'ethers';
import Web3Modal from 'web3modal';
import { providerOptions } from './providerOptions';
import { CONTRACT_ADDRESS, ABI } from './utils';
import { Logo } from './components/logo';

const web3Modal = new Web3Modal({
	cacheProvider: true, // optional
	providerOptions, // required
});

export default function Home() {
	const [value, setValue] = useState('0.01');
	const [userTypedWallet, setUserTypedWallet] = useState('');
	const [provider, setProvider] = useState();
	const [library, setLibrary] = useState();
	const [account, setAccount] = useState();
	const [signature, setSignature] = useState('');
	const [error, setError] = useState('');
	const [chainId, setChainId] = useState();
	const [network, setNetwork] = useState();
	const [message, setMessage] = useState('');
	const [signedMessage, setSignedMessage] = useState('');
	const [verified, setVerified] = useState();
	const [entryAmount, setEntryAmount] = useState('');
	const [winTimes, setWinTimes] = useState('');
	const [winDate, setWinDate] = useState('');
	const [winnerAddress, setWinnerAddress] = useState('');
	const [winnableAmount, setWinnableAmount] = useState('');

	const handleChange = (event) => setValue(event.target.value);
	const handleAddrChange = (event) => setUserTypedWallet(event.target.value);

	const connectWallet = async () => {
		try {
			const provider = await web3Modal.connect();
			const library = new ethers.providers.Web3Provider(provider);
			const accounts = await library.listAccounts();
			const network = await library.getNetwork();
			setProvider(provider);
			setLibrary(library);
			if (accounts) setAccount(accounts[0]);
			setChainId(network.chainId);
		} catch (error) {
			setError(error);
		}
	};

	const handleNetwork = (e) => {
		const id = e.target.value;
		setNetwork(Number(id));
	};

	const handleInput = (e) => {
		const msg = e.target.value;
		setMessage(msg);
	};

	const switchNetwork = async () => {
		try {
			await library.provider.request({
				method: 'wallet_switchEthereumChain',
				params: [{ chainId: toHex(network) }],
			});
		} catch (switchError) {
			if (switchError.code === 4902) {
				try {
					await library.provider.request({
						method: 'wallet_addEthereumChain',
						params: [networkParams[toHex(network)]],
					});
				} catch (error) {
					setError(error);
				}
			}
		}
	};

	const handleSubmit = async (event) => {
		if (!library) return;

		try {
			console.log('starting now');
			const signer = library.getSigner();
			const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, signer);
			console.log(signer, contract);
			// const ref = '0xd6a029E931E3657E3067858EDFA8cD98550a7C65';

			let transaction = await contract.BuyTicket({
				value: ethers.utils.parseEther(String(value)),
			});
			alert('Sent!');

			// const signature = await library.provider.request({
			// 	method: 'personal_sign',
			// 	params: [message, account],
			// });
			// setSignedMessage(message);
			// setSignature(signature);
		} catch (error) {
			setError(error);
		}
	};

	const signMessage = async () => {
		if (!library) return;
		try {
			const signature = await library.provider.request({
				method: 'personal_sign',
				params: [message, account],
			});
			setSignedMessage(message);
			setSignature(signature);
		} catch (error) {
			setError(error);
		}
	};

	const verifyMessage = async () => {
		if (!library) return;
		try {
			const verify = await library.provider.request({
				method: 'personal_ecRecover',
				params: [signedMessage, signature],
			});
			setVerified(verify === account.toLowerCase());
		} catch (error) {
			setError(error);
		}
	};

	const refreshState = () => {
		setAccount();
		setChainId();
		setNetwork('');
		setMessage('');
		setSignature('');
		setVerified(undefined);
	};

	const disconnect = async () => {
		await web3Modal.clearCachedProvider();
		refreshState();
	};

	const runHolders = async (e) => {
		e.preventDefault();
		if (!library) return;

		try {
			console.log('getting List now');
			const signer = library.getSigner();
			const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, signer);
			if (userTypedWallet || account) {
				if (userTypedWallet == '' || userTypedWallet == null) {
					setUserTypedWallet(account);
				}
				let transaction = await contract.userContribution(userTypedWallet);
				let transactionTwo = await contract.userData(userTypedWallet);
				let transactionAmount = toHex(transaction);
				let getAmount = BigNumber.from(transactionAmount);
				let finalAmount = ethers.utils.formatEther(getAmount);

				let winAmountOne = transactionTwo[0];
				let winAmountTwo = transactionTwo[1];

				let convertWinAmountOne = BigNumber.from(winAmountOne);
				let convertWinAmountTwo = BigNumber.from(winAmountTwo);

				console.log(convertWinAmountTwo);

				// let winTimesFinal = ethers.utils.formatEther(convertWinAmountOne);
				let winTimesFinal = Number(convertWinAmountOne * 1).toFixed(0);
				var d = new Date(0);
				d.setUTCSeconds(convertWinAmountTwo);
				let dateFinal = d.toString();
				setEntryAmount(finalAmount);
				setWinTimes(winTimesFinal);
				setWinDate(dateFinal);
			}

			// const signature = await library.provider.request({
			// 	method: 'personal_sign',
			// 	params: [message, account],
			// });
			// setSignedMessage(message);
			// setSignature(signature);
		} catch (error) {
			setError(error);
		}
	};

	useEffect(() => {
		if (web3Modal.cachedProvider) {
			connectWallet();
		}
	}, []);

	useEffect(() => {
		if (provider?.on) {
			const handleAccountsChanged = (accounts) => {
				console.log('accountsChanged', accounts);
				if (accounts) setAccount(accounts[0]);
			};

			const handleChainChanged = (_hexChainId) => {
				setChainId(_hexChainId);
			};

			const handleDisconnect = () => {
				console.log('disconnect', error);
				disconnect();
			};

			provider.on('accountsChanged', handleAccountsChanged);
			provider.on('chainChanged', handleChainChanged);
			provider.on('disconnect', handleDisconnect);

			return () => {
				if (provider.removeListener) {
					provider.removeListener('accountsChanged', handleAccountsChanged);
					provider.removeListener('chainChanged', handleChainChanged);
					provider.removeListener('disconnect', handleDisconnect);
				}
			};
		}
	}, [provider]);

	useEffect(() => {
		async function getLastWinner() {
			if (!library) return;
			try {
				console.log('getting List now');
				const signer = library.getSigner();
				const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, signer);
				let lengthFromContract = await contract.getWinnersArrLength();

				if (lengthFromContract) {
					let theNumber = lengthFromContract - 1;
					console.log(theNumber);
					let getWinnerAddress = await contract.winners(theNumber);
					setWinnerAddress(getWinnerAddress);
				}
			} catch (e) {
				console.log(e);
			}
		}
		getLastWinner();
	}, [library]);

	useEffect(() => {
		async function getWinnableAmount() {
			if (!library) return;
			try {
				console.log('Winnable amount being gathered');
				const signer = library.getSigner();
				const token = new ethers.Contract(CONTRACT_ADDRESS, ABI, signer);
				const balance = await token.getContractBalance();

				let theBalance = ethers.utils.formatEther(balance);

				console.log('the new balance is: ' + theBalance);
				if (theBalance) {
					setWinnableAmount(theBalance);
				}
			} catch (e) {
				console.log(e);
			}
		}
		getWinnableAmount();
	}, [library]);

	return (
		<>
			<Flex>
				<Spacer />
				<Box p='4'>
					<HStack>
						{!account ? (
							<Button onClick={connectWallet}>Connect Wallet</Button>
						) : (
							<Button onClick={disconnect}>Disconnect</Button>
						)}
					</HStack>
				</Box>
			</Flex>
			<VStack
				justifyContent='center'
				alignItems='center'
				h='100vh'
				marginTop='-60px'
				textColor='#c3c3c3'
			>
				<HStack paddingTop='0px' paddingBottom='20px'>
					<Logo />
				</HStack>
				<HStack marginBottom='10px'>
					<Text
						margin='0'
						lineHeight='1.15'
						fontSize={['1.5em', '2em', '3em', '4em']}
						fontWeight='600'
						textColor='#c3c3c3	'
					>
						BLOOD{' '}
					</Text>
					<Text
						margin='0'
						lineHeight='1.15'
						fontSize={['1.5em', '2em', '3em', '4em']}
						fontWeight='600'
						sx={{
							background: 'linear-gradient(90deg, #C71111 0%, #851212 70.35%)',
							WebkitBackgroundClip: 'text',
							WebkitTextFillColor: 'transparent',
						}}
					>
						DONOR
					</Text>
				</HStack>
				<HStack>
					<FormControl>
						<Text mb='8px'>Enter your bet (Max {value} per wallet):</Text>
						<Input
							value={value}
							onChange={handleChange}
							placeholder='0.01'
							size='sm'
							borderRadius='10px'
							borderColor='#555'
							p='5'
						/>
						<Button
							mt={4}
							colorScheme='teal'
							// isLoading={props.isSubmitting}
							type='submit'
							onClick={handleSubmit}
							backgroundColor='#A80808'
							color='#c3c3c3'
						>
							Submit
						</Button>
					</FormControl>
				</HStack>
				<VStack>
					<HStack>Winnable amount in this round:</HStack>
					<HStack>{winnableAmount}</HStack>
				</VStack>
				<Spacer />
				{/* <HStack textAlign='left' width='60%'>
					<Text mb='8px' textAlign='left'>
						Wallet:{' '}
						{userTypedWallet ?? 'Enter a wallet address to see entry details.'}
					</Text>
				</HStack> */}
				<VStack bg='#2d2d2d' p='10' borderRadius='20px' width='680px'>
					<Text fontSize={['1.4em']} fontWeight='bold'>
						Latest Winner
					</Text>

					<VStack justifyContent='center' alignItems='center' padding='10px 0'>
						<Text>
							<strong>{winnerAddress}</strong>
						</Text>
					</VStack>
				</VStack>
				<VStack bg='#2d2d2d' p='10' borderRadius='20px' width='680px'>
					<Text fontSize='1.3em' fontWeight='bold'>
						Entry Lookup:
					</Text>

					<FormControl>
						<Input
							value={userTypedWallet}
							onChange={handleAddrChange}
							placeholder='0x12345....'
							size='sm'
							borderRadius='10px'
							borderColor='#555'
							p='5'
						/>
						<Button
							mt={4}
							colorScheme='teal'
							// isLoading={props.isSubmitting}
							type='submit'
							backgroundColor='#A80808'
							color='#c3c3c3'
							onClick={(e) => runHolders(e)}
						>
							Submit
						</Button>
					</FormControl>
					<VStack justifyContent='center' alignItems='center' padding='10px 0'>
						<Text>
							<strong>Amount Entered:</strong> <u>{entryAmount}</u>
						</Text>
						<Text>
							<strong>Past Wins:</strong> <u>{winTimes}</u>
						</Text>
						<Text>
							<strong>Last Win At:</strong> <u>{winDate}</u>
						</Text>
					</VStack>
				</VStack>

				{/* {account && (
					<HStack justifyContent='flex-start' alignItems='flex-start'>
						<Box
							maxW='sm'
							borderWidth='1px'
							borderRadius='lg'
							overflow='hidden'
							padding='10px'
						>
							<VStack>
								<Button onClick={switchNetwork} isDisabled={!network}>
									Switch Network
								</Button>
								<Select placeholder='Select network' onChange={handleNetwork}>
									<option value='3'>Ropsten</option>
									<option value='4'>Rinkeby</option>
									<option value='42'>Kovan</option>
									<option value='1666600000'>Harmony</option>
									<option value='42220'>Celo</option>
								</Select>
							</VStack>
						</Box>
						<Box
							maxW='sm'
							borderWidth='1px'
							borderRadius='lg'
							overflow='hidden'
							padding='10px'
						>
							<VStack>
								<Button onClick={signMessage} isDisabled={!message}>
									Sign Message
								</Button>
								<Input
									placeholder='Set Message'
									maxLength={20}
									onChange={handleInput}
									w='140px'
								/>
								{signature ? (
									<Tooltip label={signature} placement='bottom'>
										<Text>{`Signature: ${truncateAddress(signature)}`}</Text>
									</Tooltip>
								) : null}
							</VStack>
						</Box>
						<Box
							maxW='sm'
							borderWidth='1px'
							borderRadius='lg'
							overflow='hidden'
							padding='10px'
						>
							<VStack>
								<Button onClick={verifyMessage} isDisabled={!signature}>
									Verify Message
								</Button>
								{verified !== undefined ? (
									verified === true ? (
										<VStack>
											<CheckCircleIcon color='green' />
											<Text>Signature Verified!</Text>
										</VStack>
									) : (
										<VStack>
											<WarningIcon color='red' />
											<Text>Signature Denied!</Text>
										</VStack>
									)
								) : null}
							</VStack>
						</Box>
					</HStack>
				)} */}
				<Text>{error ? error.message : null}</Text>
			</VStack>
			<Flex textColor='#666' textAlign='right'>
				<Spacer />
				<Box p='4'>
					{account ? (
						<CheckCircleIcon color='green' />
					) : (
						<WarningIcon color='#cd5700' />
					)}
					<Text>{`Connection Status`}</Text>

					<Tooltip label={account} placement='right'>
						<Text>{`Account: ${truncateAddress(account)}`}</Text>
					</Tooltip>
					<Text>{`Network ID: ${chainId ? chainId : 'No Network'}`}</Text>
				</Box>
			</Flex>
		</>
	);
}
