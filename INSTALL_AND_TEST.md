# n8n-nodes-ethena - Installation, Testing & GitHub Guide

> [Velocity BPA Licensing Notice]
>
> This n8n node is licensed under the Business Source License 1.1 (BSL 1.1).
>
> Use of this node by for-profit organizations in production environments requires a commercial license from Velocity BPA.
>
> For licensing information, visit https://velobpa.com/licensing or contact licensing@velobpa.com.

---

## Project Summary

**n8n-nodes-ethena** is a comprehensive n8n community node package for the Ethena Protocol — a synthetic dollar stablecoin platform. This toolkit enables workflow automation for:

- **USDe Operations**: Balance checks, transfers, approvals, market data
- **sUSDe Staking**: Deposit, redeem, exchange rates, cooldown management  
- **Yield Tracking**: APY monitoring, yield sources, earnings projections
- **Protocol Analytics**: TVL, volume, risk metrics, reporting
- **Points/Sats System**: Rewards tracking, leaderboards, seasons
- **Event Triggers**: Transfer alerts, yield changes, whale monitoring

## Project Description (Short)

n8n community nodes for Ethena Protocol - USDe synthetic dollar, sUSDe staking vault, delta-neutral yield strategies, ENA governance, and points/sats rewards system integration.

---

## Step-by-Step Installation Guide

### Prerequisites

- Node.js v18 or higher
- npm v8 or higher  
- n8n installed locally or self-hosted
- Git (for GitHub)

### Option 1: Install from ZIP File

```bash
# 1. Extract the ZIP file
unzip n8n-nodes-ethena.zip
cd n8n-nodes-ethena

# 2. Install dependencies
npm install

# 3. Build the project
npm run build

# 4. Link to your n8n installation
npm link

# 5. Navigate to your n8n custom extensions directory
cd ~/.n8n/custom

# If directory doesn't exist:
mkdir -p ~/.n8n/custom
cd ~/.n8n/custom

# 6. Link the package
npm link n8n-nodes-ethena

# 7. Restart n8n
# If using n8n start command:
n8n start

# Or if using Docker, restart the container
```

### Option 2: Install from GitHub (After Publishing)

```bash
# Navigate to n8n custom directory
cd ~/.n8n

# Install directly from npm (after publishing)
npm install n8n-nodes-ethena

# Restart n8n
n8n start
```

### Option 3: Docker Installation

Add to your Docker Compose or Dockerfile:

```dockerfile
# In your n8n Dockerfile
RUN cd /home/node/.n8n && npm install n8n-nodes-ethena
```

Or with Docker Compose environment:

```yaml
environment:
  - N8N_CUSTOM_EXTENSIONS=/home/node/.n8n/custom
```

---

## Testing Guide

### Run Unit Tests

```bash
cd n8n-nodes-ethena

# Run all tests
npm test

# Run tests with coverage report
npm run test:coverage

# Run tests in watch mode (for development)
npm run test:watch
```

### Manual Testing in n8n

1. **Start n8n** with the custom node installed

2. **Create Test Credentials**:
   - Go to Credentials → Add Credential
   - Add "Ethena Network" with:
     - Network: Ethereum Mainnet
     - RPC URL: `https://eth.llamarpc.com` (or your provider)
     - Private Key: (test wallet with small balance)
   
   - Add "Ethena API" with:
     - Environment: Production
     - Auth Type: None (for public endpoints)

3. **Test USDe Balance Check**:
   - Create new workflow
   - Add "Ethena" node
   - Select Resource: USDe
   - Select Operation: Get Balance
   - Enter a known address (e.g., Ethena treasury)
   - Execute and verify response

4. **Test sUSDe Exchange Rate**:
   - Add "Ethena" node
   - Select Resource: sUSDe  
   - Select Operation: Get Exchange Rate
   - Execute and verify rate > 1.0

5. **Test Yield Data**:
   - Add "Ethena" node
   - Select Resource: Yield
   - Select Operation: Get Current Yield
   - Execute and verify APY data returned

6. **Test Trigger Node**:
   - Create new workflow
   - Add "Ethena Trigger" node
   - Select Event: Exchange Rate Changed
   - Set threshold: 0.01%
   - Activate workflow
   - Monitor for events

### Verify Build

```bash
# Type check without emitting
npm run typecheck

# Lint the code
npm run lint

# Format code
npm run format
```

---

## GitHub Repository Setup

### Initial Repository Creation

```bash
# Extract and navigate
unzip n8n-nodes-ethena.zip
cd n8n-nodes-ethena

# Initialize Git repository
git init

# Add all files
git add .

# Create initial commit
git commit -m "Initial commit: n8n Ethena Protocol community node

Features:
- USDe: Get balance, transfer, approve, total supply, price, market cap
- sUSDe: Stake, unstake, exchange rate, APY, cooldown management
- Yield: Current yield, historical data, yield sources, earnings calculator
- Analytics: Protocol stats, TVL, volume, risk metrics, reporting
- Points: Sats balance, history, multipliers, leaderboard, seasons
- Triggers: Transfer alerts, yield changes, whale monitoring, rank changes

Supported Networks:
- Ethereum Mainnet
- Arbitrum One
- Base
- Optimism
- BNB Chain (partial)

Author: Velocity BPA
Website: https://velobpa.com
GitHub: https://github.com/Velocity-BPA"

# Add remote origin
git remote add origin https://github.com/Velocity-BPA/n8n-nodes-ethena.git

# Create main branch
git branch -M main

# Push to GitHub
git push -u origin main
```

### Create GitHub Release

After pushing, create a release on GitHub:

1. Go to repository → Releases → Create new release
2. Tag: `v1.0.0`
3. Title: `v1.0.0 - Initial Release`
4. Description:
```
## n8n-nodes-ethena v1.0.0

Initial release of the Ethena Protocol community nodes for n8n.

### Features
- USDe stablecoin operations
- sUSDe staking vault (ERC-4626)
- Yield tracking and analytics
- Protocol statistics
- Points/Sats rewards system
- Real-time event triggers

### Supported Networks
- Ethereum Mainnet
- Arbitrum One
- Base
- Optimism

### Installation
```bash
npm install n8n-nodes-ethena
```

See README.md for full documentation.
```

---

## Publish to npm (Optional)

```bash
# Login to npm
npm login

# Publish (ensure package.json has correct version)
npm publish

# For scoped packages:
npm publish --access public
```

---

## Troubleshooting

### Build Errors

```bash
# Clean and rebuild
npm run prebuild
npm run build
```

### n8n Not Finding Node

1. Verify node is in correct directory:
   ```bash
   ls ~/.n8n/custom/node_modules/n8n-nodes-ethena
   ```

2. Check n8n logs for loading errors:
   ```bash
   n8n start 2>&1 | grep -i ethena
   ```

3. Verify package.json n8n configuration points to dist files

### Credential Errors

- Ensure private key starts with `0x`
- Verify RPC endpoint is accessible
- Check network connectivity

### API Errors

- Ethena API may require authentication for some endpoints
- Check rate limits
- Verify wallet address format

---

## File Structure Reference

```
n8n-nodes-ethena/
├── credentials/           # Credential type definitions
├── nodes/
│   └── Ethena/
│       ├── Ethena.node.ts        # Main action node
│       ├── EthenaTrigger.node.ts # Trigger node
│       ├── actions/              # Operation implementations
│       ├── transport/            # API/blockchain clients
│       ├── constants/            # Network/contract configs
│       └── utils/                # Utility functions
├── tests/                 # Jest test files
├── dist/                  # Compiled JavaScript
├── package.json
├── tsconfig.json
└── README.md
```

---

## Support

- **Documentation**: See README.md
- **Issues**: GitHub Issues
- **Author**: Velocity BPA (https://velobpa.com)
