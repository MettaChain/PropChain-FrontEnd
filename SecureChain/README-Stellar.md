# SecureChain - Stellar-based File Verification System

A comprehensive Web3 application that provides decentralized file storage and verification using Stellar blockchain, IPFS, and tokenized assets.

## 🚀 Features

### Core Functionality
- **Decentralized Storage**: Files stored on IPFS (InterPlanetary File System)
- **Stellar Verification**: File metadata and verification records stored on Stellar blockchain
- **Tokenized Ownership**: Each uploaded file is represented as a unique Stellar asset
- **Community Verification**: Users can verify file authenticity and earn XLM rewards
- **Stellar Smart Contracts**: Soroban contracts with comprehensive security measures

### Technical Features
- **Smart Contract**: Written in Rust for Soroban (Stellar's smart contract platform)
- **Web Frontend**: React.js with Next.js framework
- **IPFS Integration**: Full IPFS client implementation for file operations
- **Freighter Integration**: Seamless wallet connection and transaction handling
- **Responsive Design**: Modern UI with Tailwind CSS
- **Comprehensive Testing**: Full test suite for Stellar smart contracts

## 🏗️ Architecture

### Smart Contract (`contracts/SecureChain.ts`)
- Soroban smart contract implementation
- File upload and management functions
- Verification system with scoring mechanism
- XLM reward distribution for verifiers
- Asset creation for file ownership

### Frontend (`pages/`, `components/`)
- **FileUpload**: Drag-and-drop file upload interface
- **FileVerification**: Community verification system
- **FileExplorer**: Browse and search uploaded files
- **Navbar**: Freighter wallet connection and network status

### Stellar Integration (`utils/stellar.js`)
- File upload and retrieval via Stellar operations
- Asset creation and management
- XLM payment handling
- Account management and verification

## 📋 Requirements

- Node.js 16+
- npm or yarn
- Freighter browser extension
- Soroban CLI (for contract development)
- IPFS daemon (optional, for local testing)

## 🛠️ Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd SecureChain
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` with your configuration:
   ```
   STELLAR_DEPLOYER_SECRET=your_stellar_secret_key_here
   STELLAR_ISSUER_SECRET=your_stellar_issuer_secret_key_here
   STELLAR_NETWORK=mainnet
   STELLAR_HORIZON_URL=https://horizon.stellar.org
   NEXT_PUBLIC_STELLAR_CONTRACT_ID=your_deployed_contract_id_here
   NEXT_PUBLIC_STELLAR_ISSUER_PUBLIC_KEY=your_issuer_public_key_here
   IPFS_URL=http://localhost:5001
   VERIFICATION_REWARD=0.01
   ```

4. **Install Soroban CLI**
   ```bash
   cargo install soroban-cli
   ```

5. **Start IPFS daemon** (optional for local testing)
   ```bash
   ipfs daemon
   ```

## 🚀 Usage

### Development

1. **Build the contract**
   ```bash
   soroban contract build contracts/SecureChain.ts
   ```

2. **Deploy to testnet**
   ```bash
   node scripts/deploy-stellar.js deploy --network testnet
   ```

3. **Start the frontend**
   ```bash
   npm run dev
   ```

4. **Open your browser** and navigate to `http://localhost:3000`

### Testing

1. **Run contract tests**
   ```bash
   soroban contract test
   ```

2. **Run integration tests**
   ```bash
   npm test
   ```

### Deployment

1. **Deploy to Stellar Mainnet**
   ```bash
   node scripts/deploy-stellar.js deploy --network mainnet
   ```

2. **Verify deployment**
   ```bash
   node scripts/deploy-stellar.js verify
   ```

## 📱 How to Use

### 1. Connect Wallet
- Install Freighter browser extension
- Click "Connect Freighter" on the homepage
- Approve the connection request

### 2. Upload Files
- Navigate to the "Upload File" tab
- Drag and drop or select a file
- Click "Upload to SecureChain"
- Wait for IPFS upload and Stellar transaction
- Receive a unique asset representing your file

### 3. Verify Files
- Go to the "Verify Files" tab
- Browse available files (excluding your own)
- Select a file to verify
- Choose verification result (valid/invalid)
- Add optional comment
- Submit verification to earn 0.01 XLM

### 4. Explore Files
- Use the "Explore Files" tab
- Search by filename or uploader
- Filter by verification status
- View detailed file information
- Access files via IPFS gateway

## 🔧 Stellar Smart Contract Functions

### File Management
- `uploadFile(ipfsHash, fileHash, fileName, fileSize)`
- `getFile(fileId)`
- `getUserFiles(userAddress)`
- `searchByHash(fileHash)`
- `searchByIpfsHash(ipfsHash)`

### Verification System
- `verifyFile(fileId, isValid, comment)`
- `getFileVerifications(fileId)`
- `getVerifierHistory(verifierAddress)`

### Asset Management
- `createFileAsset(fileId, fileName)`
- `transferFileAsset(assetCode, toAddress)`
- `getFileAsset(fileId)`

## 🛡️ Security Features

- **Access Control**: Contract owner permissions with proper checks
- **Input Validation**: Comprehensive parameter validation
- **Reentrancy Protection**: Built into Soroban runtime
- **Asset Security**: Tokenized ownership with Stellar's security model

## 📊 Verification System

### Scoring Algorithm
- Files receive a verification score based on community feedback
- Score calculated as: (positive verifications / total verifications) × 100
- Files with ≥70% score are marked as "Verified"
- Verifiers earn 0.01 XLM per verification

### Verification Rules
- Users cannot verify their own files
- Each user can verify each file once
- Comments are optional but encouraged
- Rewards distributed from contract balance

## 🌐 Network Support

- **Stellar Mainnet**: Production deployment
- **Stellar Testnet**: Testing and development
- **Stellar FutureNet**: Testing new features

## 📈 Gas Optimization

- Minimal Stellar transaction fees
- Efficient data storage using Stellar's built-in features
- Batch operations where possible
- Optimized asset creation

## 🔍 File Integrity

- SHA-256 hash calculation for all files
- Hash stored on Stellar for verification
- IPFS content addressing ensures data integrity
- Asset metadata links to IPFS hash

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Run the test suite
6. Submit a pull request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Stellar Development Foundation](https://stellar.org/) for the blockchain platform
- [Soroban](https://soroban.stellar.org/) for smart contract capabilities
- [IPFS](https://ipfs.io/) for decentralized storage
- [Freighter](https://freighter.app/) for wallet integration
- [Next.js](https://nextjs.org/) for frontend framework
- [Tailwind CSS](https://tailwindcss.com/) for styling

## 📞 Support

For support and questions:
- Create an issue on GitHub
- Join our Discord community
- Check the documentation

---

**Built with ❤️ for the Stellar ecosystem**
