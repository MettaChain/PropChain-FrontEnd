# Local Web3 Development Fixtures

This directory contains fixture files and configuration for local Web3 development using Foundry's Anvil.

## Files

### `PropertyNFT.abi.json`
The ABI for the PropertyNFT contract. This is a standard ERC721 contract with a `mint` function for creating new property tokens.

### `sample-properties.json`
Sample property data for seeding the local development environment. Includes 5 example properties with mock data.

## Usage

### Start Anvil
```bash
docker-compose -f docker-compose.web3.yml up
```

This starts an Anvil instance on `http://localhost:8545` with 10 pre-funded accounts.

### Seed Local Environment
```bash
npm run seed:local
```

This script:
1. Deploys the PropertyNFT contract to Anvil
2. Seeds sample properties into the contract
3. Outputs deployment information for use in the frontend

### Anvil Accounts
Default mnemonic: `test test test test test test test test test test test junk`

Pre-funded accounts:
- Account 0: `0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266`
- Account 1: `0x70997970C51812e339D9B73b0245ad39437D9142`
- Account 2: `0x3C44CdDdB6a900c8d7C64f46199c5e3c2c52bBd8`
- ... and 7 more accounts with 100 ETH each

### Set Environment Variables
Create a `.env.local` file:

```env
# Local Foundry RPC
LOCAL_RPC_URL=http://localhost:8545

# Keep your testnet RPC URLs if using them
ETHEREUM_MAINNET_RPC_URL=https://sepolia.infura.io/v3/YOUR_KEY
POLYGON_MAINNET_RPC_URL=https://polygon-mumbai.g.alchemy.com/v2/YOUR_KEY
```

## Example: Connecting to Local Chain

With `LOCAL_RPC_URL` set, your wagmi config will automatically:
1. Add the Foundry chain (chainId: 31337) to supported chains
2. Allow wallet connection to the local Anvil instance
3. Enable contract interactions with locally deployed contracts

## Resetting Anvil State

Stop and restart the container:
```bash
docker-compose -f docker-compose.web3.yml down
docker-compose -f docker-compose.web3.yml up
```

This clears all state and restarts with fresh accounts.

## Further Reading

- [Foundry Docs](https://book.getfoundry.sh/)
- [Anvil Docs](https://book.getfoundry.sh/anvil/)
- [wagmi Documentation](https://wagmi.sh/)
