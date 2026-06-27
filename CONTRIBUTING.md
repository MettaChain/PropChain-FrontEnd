# Contributing to PropChain Frontend

Thank you for your interest in contributing to PropChain Frontend! This guide will help you get started with contributing to our decentralized real estate platform.

## 🚀 Getting Started

### Prerequisites

Before you start contributing, make sure you have:

- **Node.js** v18+ (LTS recommended)
- **npm**, **yarn**, or **pnpm** package manager
- **Git** version control
- **Web3 Wallet** (MetaMask, Trust Wallet, etc.) for testing
- **GitHub account** for collaboration

### Development Setup

1. **Fork the Repository**
   ```bash
   # Fork the repository on GitHub, then clone your fork
   git clone https://github.com/YOUR_USERNAME/PropChain-FrontEnd.git
   cd PropChain-FrontEnd
   ```

2. **Add Upstream Remote**
   ```bash
   git remote add upstream https://github.com/MettaChain/PropChain-FrontEnd.git
   ```

3. **Install Dependencies**
   ```bash
   npm install
   # or
   yarn install
   # or
   pnpm install
   ```

4. **Set Up Environment Variables**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

   Key variables to configure:

   | Variable | Description | Example |
   |---|---|---|
   | `NEXT_PUBLIC_API_URL` | Backend REST API base URL | `http://localhost:3001` |
   | `NEXT_PUBLIC_WS_URL` | WebSocket server URL | `ws://localhost:3001` |
   | `NEXT_PUBLIC_BLOCKCHAIN_NETWORK` | Target network name | `sepolia` |
   | `NEXT_PUBLIC_RPC_URL` | Ethereum JSON-RPC endpoint | `https://sepolia.infura.io/v3/YOUR_KEY` |
   | `NEXT_PUBLIC_CHAIN_ID` | EVM chain ID (decimal) | `11155111` |
   | `NEXT_PUBLIC_ENABLE_TESTNET` | Enable testnet features | `true` |
   | `NEXT_PUBLIC_GOOGLE_ANALYTICS_ID` | GA4 measurement ID | `G-XXXXXXXXXX` |
   | `NEXT_PUBLIC_SENTRY_DSN` | Sentry error tracking DSN | `https://...@sentry.io/...` |

   > **Never commit `.env` to version control.** It is already listed in `.gitignore`.

5. **Start Development Server**
   ```bash
   npm run dev
   # or
   yarn dev
   # or
   pnpm dev
   ```

## 📋 How to Contribute

### Reporting Issues

1. **Search Existing Issues**: Check if the issue has already been reported
2. **Use Templates**: Use the appropriate issue template
3. **Provide Details**: Include steps to reproduce, expected vs actual behavior
4. **Add Screenshots**: Include screenshots for UI issues
5. **Environment Info**: Include OS, browser, and Node.js version

### Submitting Pull Requests

1. **Create a Branch**
   ```bash
   git checkout -b feature/your-feature-name
   # or
   git checkout -b fix/your-bug-fix
   ```

2. **Make Your Changes**
   - Follow the code style guidelines
   - Write clean, readable code
   - Add tests for new functionality
   - Update documentation if needed

3. **Test Your Changes**
   ```bash
   # Run tests
   npm test
   
   # Run type checking
   npm run type-check
   
   # Run linting
   npm run lint
   
   # Build the project
   npm run build
   ```

4. **Commit Your Changes**
   ```bash
   git add .
   git commit -m "feat: add your feature description"
   ```

5. **Push to Your Fork**
   ```bash
   git push origin feature/your-feature-name
   ```

6. **Create Pull Request**
   - Use descriptive title and description
   - Link related issues
   - Add screenshots for UI changes
   - Request review from maintainers

## 🎯 Contribution Areas

We welcome contributions in the following areas:

### 🏠 Core Features
- Property browsing and search functionality
- Wallet connection and Web3 integration
- Smart contract interactions
- Portfolio management
- Transaction history

### 🎨 UI/UX Improvements
- Component library enhancements
- Responsive design fixes
- Accessibility improvements
- Performance optimizations
- Design system updates

### 🔧 Technical Improvements
- Code refactoring and optimization
- Testing coverage improvements
- Documentation updates
- Build process enhancements
- Security improvements

### 📚 Documentation
- API documentation
- Component documentation
- Tutorial creation
- Translation contributions
- README improvements

## 📝 Coding Standards

### Code Style

We use the following tools to maintain code quality:

- **ESLint**: JavaScript/TypeScript linting
- **Prettier**: Code formatting
- **TypeScript**: Type safety
- **Husky**: Git hooks for pre-commit checks

**Auto-format before committing**:
```bash
npm run lint -- --fix   # auto-fix ESLint issues
```

**Prettier config** (`.prettierrc` or `prettier.config.js`):
- Single quotes for strings
- 2-space indentation
- Trailing commas in multi-line structures
- 100-character line length limit

**TypeScript rules**:
- Prefer `interface` over `type` for object shapes
- Always type function return values explicitly for exported functions
- Avoid `any` — use `unknown` and narrow with type guards instead
- Use `const` assertions (`as const`) for literal tuples and objects

**React-specific rules**:
- One component per file
- Prefer named exports over default exports for components
- Use `React.FC<Props>` or explicit return type annotations
- Extract complex logic into custom hooks rather than inline in components

### Naming Conventions

- **Components**: PascalCase (`PropertyCard.tsx`)
- **Files**: kebab-case for utilities (`property-utils.ts`)
- **Variables**: camelCase (`propertyData`)
- **Constants**: UPPER_SNAKE_CASE (`API_BASE_URL`)
- **Types**: PascalCase (`PropertyType`)

### Component Guidelines

```tsx
// Good component example
interface PropertyCardProps {
  property: Property;
  onPurchase?: (property: Property) => void;
}

export const PropertyCard: React.FC<PropertyCardProps> = ({
  property,
  onPurchase,
}) => {
  return (
    <div className="property-card">
      {/* Component content */}
    </div>
  );
};

export default PropertyCard;
```

### Git Commit Messages

We follow [Conventional Commits](https://www.conventionalcommits.org/) specification:

- `feat:` New features
- `fix:` Bug fixes
- `docs:` Documentation changes
- `style:` Code style changes (formatting, etc.)
- `refactor:` Code refactoring
- `test:` Adding or updating tests
- `chore:` Build process or dependency changes

Examples:
```
feat: add property search functionality
fix: resolve wallet connection issue
docs: update API documentation
test: add unit tests for property service
```

## 🧪 Testing

### Test Types

- **Unit Tests**: Test individual functions and components
- **Integration Tests**: Test component interactions
- **E2E Tests**: Test user workflows
- **Visual Tests**: Test UI consistency

### Writing Tests

```tsx
// Example unit test
import { render, screen } from '@testing-library/react';
import { PropertyCard } from './PropertyCard';

describe('PropertyCard', () => {
  const mockProperty = {
    id: '1',
    name: 'Test Property',
    price: '100000',
    // ... other properties
  };

  it('renders property information correctly', () => {
    render(<PropertyCard property={mockProperty} />);
    
    expect(screen.getByText('Test Property')).toBeInTheDocument();
    expect(screen.getByText('$100,000')).toBeInTheDocument();
  });
});
```

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run E2E tests
npm run test:e2e
```

### Running Tests Locally

Before opening a PR, run the full test suite locally to catch issues early:

```bash
# 1. Unit and integration tests (Jest)
npm test

# 2. Type checking (no emitted output)
npm run type-check

# 3. Linting
npm run lint

# 4. End-to-end tests (Playwright) — requires a running dev server
npm run dev &          # start dev server in background
npm run test:e2e       # run Playwright tests
kill %1                # stop dev server

# 5. Build check — ensures the production bundle compiles cleanly
npm run build
```

**Coverage requirements**: PRs must not decrease overall coverage below the current threshold. Check the current threshold in `jest.config.js` under `coverageThreshold`.

**Running a single test file**:
```bash
npx jest src/hooks/useTransaction.test.ts
```

**Debugging a failing test**:
```bash
npx jest --verbose --no-coverage src/path/to/test.ts
```

## 🎨 Design System

### Component Library

We use a consistent design system based on:

- **Tailwind CSS** for styling
- **Headless UI** for accessible components
- **Lucide React** for icons
- **Custom design tokens** for consistency

### Design Guidelines

- Follow the established color palette
- Use consistent spacing and typography
- Ensure accessibility (WCAG 2.1 AA)
- Test on multiple screen sizes
- Use semantic HTML elements

## 🌐 Web3 Development

### Wallet Integration

When working with Web3 features:

- Test with multiple wallet providers
- Handle connection errors gracefully
- Provide clear user feedback
- Support multiple networks
- Implement proper error boundaries

### Smart Contract Interaction

- Use type-safe contract interfaces
- Handle transaction states properly
- Provide gas estimates
- Implement transaction monitoring
- Handle network switching

## 📦 Package Management

### Adding Dependencies

Before adding new dependencies:

1. Check if existing dependencies can solve the problem
2. Prefer smaller, focused packages
3. Check for security vulnerabilities
4. Update documentation if needed

```bash
# Install production dependency
npm install package-name

# Install development dependency
npm install --save-dev package-name

# Install exact version
npm install package-name@1.2.3
```

## 🚀 Deployment

### Pre-deployment Checklist

- [ ] All tests pass
- [ ] Build completes successfully
- [ ] Environment variables are configured
- [ ] Performance budgets are met
- [ ] Accessibility checks pass
- [ ] Security scans are clean

### Build Process

```bash
# Build for production
npm run build

# Analyze bundle size
npm run analyze

# Start production server
npm start
```

## 🤝 Community Guidelines

### Code of Conduct

We are committed to providing a welcoming and inclusive environment. Please read our [Code of Conduct](./CODE_OF_CONDUCT.md) and follow it in all interactions.

### Getting Help

- **GitHub Issues**: For bug reports and feature requests
- **Discussions**: For general questions and ideas
- **Email**: frontend@propchain.io for private matters

### Recognition

Contributors are recognized in:

- README.md contributors section
- Release notes
- Annual contributor highlights
- Special contributor badges

## 📋 Review Process

### Pull Request Review

All PRs go through the following review process:

1. **Automated Checks**: CI/CD pipeline validation
2. **Code Review**: Maintainer review for code quality
3. **Design Review**: UI/UX review for frontend changes
4. **Testing Review**: Test coverage and quality check
5. **Documentation Review**: Documentation updates

### PR Review Checklist

When reviewing a PR, maintainers check:

- [ ] Code follows the project's style guide and naming conventions
- [ ] New logic is covered by unit or integration tests
- [ ] No `console.log` or debug statements left in production code
- [ ] Accessibility requirements are met (WCAG 2.1 AA)
- [ ] No new `any` types introduced without justification
- [ ] Breaking changes are documented and versioned appropriately
- [ ] Environment variables are documented in `.env.example`
- [ ] PR description links to the relevant issue(s)

### Responding to Review Feedback

- Address each comment with either a code change or a reply explaining why no change is needed
- Mark resolved threads as resolved after addressing them
- Request a re-review once all feedback has been addressed
- Avoid force-pushing after a review has started — use new commits instead

### Merge Requirements

- All tests must pass
- Code coverage must not decrease
- No breaking changes without proper version bump
- Documentation must be updated
- At least one maintainer approval

## 🚀 Release Process

PropChain Frontend uses [Release Please](https://github.com/googleapis/release-please) for automated releases based on Conventional Commits.

### How Releases Work

1. Commits to `main` following the Conventional Commits spec are automatically parsed
2. Release Please opens a release PR that bumps the version and updates `CHANGELOG.md`
3. Merging the release PR triggers a GitHub Actions workflow that:
   - Creates a Git tag (e.g. `v1.2.0`)
   - Publishes a GitHub Release with auto-generated release notes
   - Deploys to the production environment

### Version Bumping Rules

| Commit type | Version bump |
|---|---|
| `fix:` | Patch (`1.0.x`) |
| `feat:` | Minor (`1.x.0`) |
| `feat!:` or `BREAKING CHANGE:` footer | Major (`x.0.0`) |

### Hotfix Process

For urgent production fixes:

```bash
# 1. Branch from the latest release tag
git checkout -b hotfix/v1.2.1 v1.2.0

# 2. Apply the fix and commit with conventional format
git commit -m "fix: resolve critical wallet connection crash"

# 3. Open a PR targeting main (and cherry-pick to release branch if needed)
```

## 🎉 Recognition & Rewards

### Contributor Benefits

- **GitHub Contributors** recognition
- **Early access** to new features
- **Special Discord** role and channel access
- **PropChain merchandise** for significant contributions
- **Speaking opportunities** at community events

### Contributor Tiers

- **Contributor**: 1+ merged PRs
- **Active Contributor**: 5+ merged PRs
- **Core Contributor**: 20+ merged PRs
- **Maintainer**: Trusted team member with merge access

## 📞 Contact

### Get in Touch

- **GitHub Issues**: [Create an issue](https://github.com/MettaChain/PropChain-FrontEnd/issues)
- **GitHub Discussions**: [Start a discussion](https://github.com/MettaChain/PropChain-FrontEnd/discussions)
- **Email**: frontend@propchain.io
- **Discord**: [Join our community](https://discord.gg/propchain)

### Office Hours

Join our weekly contributor office hours:

- **When**: Every Thursday, 2:00 PM - 4:00 PM UTC
- **Where**: Discord voice channel
- **What**: Get help with contributions, ask questions, meet the team

---

## 🙏 Thank You

Thank you for contributing to PropChain Frontend! Your contributions help make decentralized real estate accessible to everyone.

Every contribution, no matter how small, makes a difference. We appreciate your time and effort in improving our platform.

**Happy coding! 🚀**

---

<div align="center">

Made with ❤️ by the PropChain Team

</div>
