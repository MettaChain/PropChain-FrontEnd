# SecureChain - Decentralized File Verification System

A comprehensive Web3 application that provides decentralized file storage and verification using blockchain technology, IPFS, and NFTs.

## 🚀 Features

### Core Functionality
- **Decentralized Storage**: Files stored on IPFS (InterPlanetary File System)
- **Blockchain Verification**: File metadata and verification records stored on Ethereum blockchain
- **NFT Representation**: Each uploaded file is represented as an NFT (ERC-721)
- **Community Verification**: Users can verify file authenticity and earn rewards
- **Smart Contract Security**: Comprehensive security measures including reentrancy protection and access controls

### Technical Features
- **Smart Contract**: Written in Solidity with OpenZeppelin libraries
- **Web Frontend**: React.js with Next.js framework
- **IPFS Integration**: Full IPFS client implementation for file operations
- **MetaMask Integration**: Seamless wallet connection and transaction handling
- **Responsive Design**: Modern UI with Tailwind CSS
- **Comprehensive Testing**: Full test suite for smart contracts

## 🏗️ Architecture

### Smart Contract (`contracts/SecureChain.sol`)
- ERC-721 compliant NFT contract
- File upload and management functions
- Verification system with scoring mechanism
- Reward distribution for verifiers
- Owner controls and emergency functions

### Frontend (`pages/`, `components/`)
- **FileUpload**: Drag-and-drop file upload interface
- **FileVerification**: Community verification system
- **FileExplorer**: Browse and search uploaded files
- **Navbar**: Wallet connection and network status

### IPFS Integration (`utils/ipfs.js`)
- File upload and retrieval
- Hash calculation and verification
- Directory structure support
- Gateway URL generation

## 📋 Requirements

- Node.js 16+
- npm or yarn
- MetaMask browser extension
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
   PRIVATE_KEY=your_private_key_here
   SEPOLIA_URL=https://sepolia.infura.io/v3/your_infura_project_id
   ETHERSCAN_API_KEY=your_etherscan_api_key
   IPFS_URL=http://localhost:5001
   ```

4. **Start IPFS daemon** (optional for local testing)
   ```bash
   ipfs daemon
   ```

## 🚀 Usage

### Development

1. **Start local Hardhat network**
   ```bash
   npx hardhat node
   ```

2. **Deploy smart contract**
   ```bash
   npx hardhat run scripts/deploy.js --network localhost
   ```

3. **Start the frontend**
   ```bash
   npm run dev
   ```

4. **Open your browser** and navigate to `http://localhost:3000`

### Testing

1. **Run smart contract tests**
   ```bash
   npm test
   ```

2. **Run tests with coverage**
   ```bash
   npx hardhat coverage
   ```

### Deployment

1. **Compile contracts**
   ```bash
   npm run compile
   ```

2. **Deploy to testnet**
   ```bash
   npm run deploy --network sepolia
   ```

3. **Verify contract** (optional)
   ```bash
   npx hardhat verify --network sepolia <contract-address>
   ```

## 📱 How to Use

### 1. Connect Wallet
- Install MetaMask browser extension
- Click "Connect Wallet" on the homepage
- Approve the connection request

### 2. Upload Files
- Navigate to the "Upload File" tab
- Drag and drop or select a file
- Click "Upload to SecureChain"
- Wait for IPFS upload and blockchain transaction
- Receive an NFT representing your file

### 3. Verify Files
- Go to the "Verify Files" tab
- Browse available files (excluding your own)
- Select a file to verify
- Choose verification result (valid/invalid)
- Add optional comment
- Submit verification to earn rewards

### 4. Explore Files
- Use the "Explore Files" tab
- Search by filename or uploader
- Filter by verification status
- View detailed file information
- Access files via IPFS gateway

## 🔧 Smart Contract Functions

### File Management
- `uploadFile(string _ipfsHash, bytes32 _fileHash, string _fileName, uint256 _fileSize)`
- `getFile(uint256 _fileId)`
- `getUserFiles(address _user)`
- `searchByHash(bytes32 _fileHash)`
- `searchByIpfsHash(string _ipfsHash)`

### Verification System
- `verifyFile(uint256 _fileId, bool _isValid, string _comment)`
- `getFileVerifications(uint256 _fileId)`
- `getVerifierHistory(address _verifier)`

### Admin Functions
- `pause()` / `unpause()`
- `withdraw()`
- `fundContract()`

## 🛡️ Security Features

- **Reentrancy Protection**: Prevents reentrancy attacks
- **Access Control**: Owner-only functions with proper permissions
- **Input Validation**: Comprehensive parameter validation
- **Emergency Controls**: Contract pause and unpause functionality
- **Safe Math**: Prevents integer overflow/underflow

## 📊 Verification System

### Scoring Algorithm
- Files receive a verification score based on community feedback
- Score calculated as: (positive verifications / total verifications) × 100
- Files with ≥70% score are marked as "Verified"
- Verifiers earn 0.01 ETH per verification

### Verification Rules
- Users cannot verify their own files
- Each user can verify each file once
- Comments are optional but encouraged
- Rewards distributed from contract balance

## 🌐 Network Support

- **Ethereum Mainnet**: Production deployment
- **Sepolia Testnet**: Testing and development
- **Local Hardhat**: Local development and testing

## 📈 Gas Optimization

- Optimized storage layout
- Efficient data structures
- Minimal external calls
- Batch operations where possible

## 🔍 File Integrity

- SHA-256 hash calculation for all files
- Hash stored on blockchain for verification
- IPFS content addressing ensures data integrity
- NFT metadata links to IPFS hash

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

- [OpenZeppelin](https://openzeppelin.com/) for secure smart contract libraries
- [IPFS](https://ipfs.io/) for decentralized storage
- [Hardhat](https://hardhat.org/) for development framework
- [Next.js](https://nextjs.org/) for frontend framework
- [Tailwind CSS](https://tailwindcss.com/) for styling

## 📞 Support

For support and questions:
- Create an issue on GitHub
- Join our Discord community
- Check the documentation

---

**Built with ❤️ for the Web3 community**
