# PropChain Frontend

> 🏠 **Decentralized Real Estate Platform** | Modern Web3 frontend for blockchain-powered property transactions

PropChain Frontend is a cutting-edge React/Next.js application that provides a seamless user interface for interacting with tokenized real estate assets on the blockchain. Our platform offers an intuitive way to browse, invest in, and manage property NFTs through a beautiful, responsive web interface.

Built with modern web technologies and Web3 integration, this frontend serves as the user-facing layer for decentralized real estate transactions, enabling users to connect their wallets, explore property listings, and execute smart contract interactions with ease.

## 🚀 Features

### Core Capabilities
- **🏠 Property Discovery**: Browse and search tokenized real estate properties with advanced filtering
- **💰 Wallet Integration**: Connect MetaMask, WalletConnect, and other Web3 wallets seamlessly
- **🔗 Smart Contract Interaction**: Execute property purchases, transfers, and management through intuitive UI
- **📊 Real-Time Data**: Live property valuations, market trends, and portfolio analytics
- **🔐 Web3 Authentication**: Secure wallet-based authentication with multi-network support
- **� Responsive Design**: Mobile-first design that works perfectly on all devices

### Advanced Features
- **🌐 Multi-Chain Support**: Switch between Ethereum, Polygon, and BSC networks
- **📈 Portfolio Dashboard**: Track your real estate NFT investments and performance
- **🔍 Advanced Search**: Filter by location, price range, property type, and ROI metrics
- **�️ Security First**: Hardware wallet support and transaction verification
- **⚡ Lightning Fast**: Optimized performance with Next.js 15 and React 19

## 👥 Target Audience

This frontend is designed for:
- **Real Estate Investors** looking to diversify into blockchain property assets
- **Crypto Enthusiasts** seeking tangible real-world asset investments
- **Property Developers** wanting to tokenize their real estate projects
- **Real Estate Agents** adapting to the digital property marketplace
- **DeFi Users** exploring real estate as an alternative asset class

## 🛠️ Quick Start

### Prerequisites
Ensure you have the following installed:
- **Node.js** v18+ (LTS recommended)
- **npm**, **yarn**, or **pnpm** package manager
- **Git** version control
- **Web3 Wallet** (MetaMask, Trust Wallet, etc.)

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/MettaChain/PropChain-FrontEnd.git
cd PropChain-FrontEnd

# 2. Install dependencies
npm install
# or
yarn install
# or
pnpm install

# 3. Set up environment variables
cp .env.example .env
# Edit .env with your configuration

# 4. Start development server
npm run dev
# or
yarn dev
# or
pnpm dev
```

The application will be available at `http://localhost:3000`.

## 🚀 Development & Deployment

### Development Environment
```bash
npm run dev          # Start development server with hot reload
npm run lint         # Run ESLint for code quality checks
npm run type-check   # Run TypeScript type checking
```

### Production Build
```bash
npm run build        # Build optimized production bundle
npm run start        # Start production server
npm run analyze      # Analyze bundle size with webpack-bundle-analyzer
```

### Testing Suite
```bash
npm test             # Run unit tests
npm run test:watch   # Run tests in watch mode
npm run test:coverage # Generate coverage report
npm run test:e2e     # Run end-to-end tests
```

## 🌐 Network Configuration

### Supported Blockchains
- **Ethereum** (Mainnet, Sepolia Testnet)
- **Polygon** (Mainnet, Mumbai Testnet) 
- **Binance Smart Chain** (Mainnet, Testnet)
- **Local Development** (Hardhat Network)

### Environment Configuration
```env
# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_WS_URL=ws://localhost:3001

# Blockchain
NEXT_PUBLIC_BLOCKCHAIN_NETWORK=sepolia
NEXT_PUBLIC_RPC_URL=https://sepolia.infura.io/v3/YOUR_PROJECT_ID
NEXT_PUBLIC_CHAIN_ID=11155111

# Features
NEXT_PUBLIC_ENABLE_ANALYTICS=true
NEXT_PUBLIC_ENABLE_TESTNET=true

# Third-party Services
NEXT_PUBLIC_GOOGLE_ANALYTICS_ID=your_ga_id
NEXT_PUBLIC_SENTRY_DSN=your_sentry_dsn
```

## 📚 Documentation & Resources

### Project Documentation
- **[📖 Component Library](./docs/components.md)** - Reusable UI components and usage examples
- **[🔗 Web3 Integration](./docs/web3.md)** - Wallet connection and blockchain interaction guides
- **[🚀 Deployment Guide](./docs/deployment.md)** - Production deployment best practices
- **[🏗️ Architecture](./docs/architecture.md)** - Frontend architecture and state management

### Repository Structure
```
PropChain-FrontEnd/
├── 📁 src/
│   ├── 📁 app/             # Next.js 15 App Router pages and layouts
│   ├── 📁 components/      # Reusable React components
│   ├── 📁 hooks/           # Custom React hooks
│   ├── 📁 lib/             # Utility functions and configurations
│   ├── 📁 store/           # State management (Zustand/Redux)
│   ├── 📁 types/           # TypeScript type definitions
│   └── 📁 styles/          # Global styles and Tailwind CSS
├── 📁 public/              # Static assets (images, icons)
├── 📁 docs/                # Project documentation
├── 📁 tests/               # Unit, integration, and E2E tests
├── 📁 .github/             # CI/CD workflows and issue templates
└── 📁 scripts/             # Build and deployment scripts
```

### Contributing
- **[🤝 Contributing Guide](./CONTRIBUTING.md)** - How to contribute effectively
- **[📋 Code of Conduct](./CODE_OF_CONDUCT.md)** - Community guidelines and standards
- **[🐛 Issue Templates](./.github/ISSUE_TEMPLATE/)** - Standardized issue reporting
- **[💡 Feature Requests](./.github/ISSUE_TEMPLATE/feature_request.md)** - Feature proposal template

### Additional Resources
- **[🔌 Backend API](https://github.com/MettaChain/PropChain-BackEnd)** - Server-side NestJS application
- **[🎨 Design System](./docs/design-system.md)** - UI/UX guidelines and design tokens
- **[📊 Performance Metrics](./docs/performance.md)** - Optimization guides and benchmarks
- **[🎓 Tutorials](./docs/tutorials/)** - Step-by-step development tutorials

## 🛠️ Technology Stack

### Frontend Framework
- **⚛️ Framework**: Next.js 15 with App Router - Modern React framework
- **🎨 UI Library**: React 19 - Latest React with concurrent features
- **🎭 Styling**: Tailwind CSS 4 - Utility-first CSS framework
- **� Components**: Headless UI + custom components - Accessible UI primitives

### State Management & Data
- **🔄 State**: Zustand - Lightweight state management
- **🌐 Data Fetching**: TanStack Query (React Query) - Server state management
- **🔗 Web3**: ethers.js + wagmi - Modern Ethereum React hooks
- **📝 Forms**: React Hook Form + Zod - Type-safe form handling

### Development & Tooling
- **� Language**: TypeScript 5 - Type-safe JavaScript
- **🧪 Testing**: Jest + Testing Library + Playwright - Comprehensive testing
- **� Bundling**: Next.js built-in webpack - Optimized bundling
- **🔧 Linting**: ESLint + Prettier - Code quality and formatting
- **🐳 Containerization**: Docker - Consistent development environment

### UI/UX & Performance
- **🎨 Design**: Tailwind CSS + custom design system - Consistent styling
- **� Analytics**: Google Analytics + Vercel Analytics - User insights
- **� SEO**: Next.js SEO optimizations - Search engine friendly
- **⚡ Performance**: Next.js optimizations + lazy loading - Fast loading

---

## 📄 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for complete details.

## 🤝 Support & Community

### Get Help
- **🐛 Report Issues**: [GitHub Issues](https://github.com/MettaChain/PropChain-FrontEnd/issues)
- **📧 Email Support**: frontend@propchain.io
- **📖 Documentation**: [docs.propchain.io](https://docs.propchain.io)

### Contributing
We welcome contributions! Please read our [Contributing Guide](./CONTRIBUTING.md) to get started. 

**Quick contribution steps:**
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

<div align="center">

**⭐ Star this repository if it helped you!**

Made with ❤️ by the PropChain Team

</div>
