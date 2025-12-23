# n8n-nodes-ethena

> [Velocity BPA Licensing Notice]
>
> This n8n node is licensed under the Business Source License 1.1 (BSL 1.1).
>
> Use of this node by for-profit organizations in production environments requires a commercial license from Velocity BPA.
>
> For licensing information, visit https://velobpa.com/licensing or contact licensing@velobpa.com.

---

n8n community nodes for the **Ethena Protocol** — a comprehensive toolkit for interacting with USDe synthetic dollar, sUSDe staking vault, ENA governance token, delta-neutral strategies, points/sats system, and DeFi integrations.

![Ethena Protocol](https://img.shields.io/badge/Ethena-Protocol-blue)
![n8n](https://img.shields.io/badge/n8n-Community%20Node-orange)
![License](https://img.shields.io/badge/License-BSL--1.1-green)
![Version](https://img.shields.io/badge/Version-1.0.0-brightgreen)

## Author

**Velocity BPA**
- Website: [velobpa.com](https://velobpa.com)
- GitHub: [Velocity-BPA](https://github.com/Velocity-BPA)

## Overview

This package provides two n8n nodes for comprehensive Ethena Protocol integration:

### Ethena Node
Action node for executing operations across all Ethena Protocol components:
- **USDe** — Synthetic dollar stablecoin operations
- **sUSDe** — Staked USDe vault (ERC-4626) operations  
- **Yield** — APY tracking, yield sources, earnings calculations
- **Analytics** — Protocol statistics, TVL, volume metrics
- **Points/Sats** — Rewards tracking, leaderboards, seasons
- **Collateral** — Backing asset information
- **Utility** — Address validation, unit conversion, gas estimation

### Ethena Trigger Node
Polling-based trigger for real-time event monitoring:
- USDe transfers and whale alerts
- sUSDe staking/unstaking events
- Exchange rate changes
- APY changes and high yield alerts
- TVL changes
- Points/sats earning events
- Leaderboard rank changes

## Licensing

This n8n community node is licensed under the **Business Source License 1.1**.

### Free Use
Permitted for personal, educational, research, and internal business use.

### Commercial Use
Use of this node within any SaaS, PaaS, hosted platform, managed service,
or paid automation offering requires a commercial license.

For licensing inquiries:
**licensing@velobpa.com**

See [COMMERCIAL_LICENSE.md](COMMERCIAL_LICENSE.md) and [LICENSING_FAQ.md](LICENSING_FAQ.md) for details.

## Installation

### Via n8n Community Nodes (Recommended)

1. Open your n8n instance
2. Go to **Settings** → **Community Nodes**
3. Click **Install**
4. Enter `n8n-nodes-ethena`
5. Click **Install**

### Manual Installation

```bash
# Navigate to your n8n installation directory
cd ~/.n8n

# Install the package
npm install n8n-nodes-ethena

# Restart n8n
n8n start
```

### Local Development Installation

```bash
# Clone the repository
git clone https://github.com/Velocity-BPA/n8n-nodes-ethena.git
cd n8n-nodes-ethena

# Install dependencies
npm install

# Build the project
npm run build

# Link to your n8n installation
npm link

# In your n8n directory
cd ~/.n8n
npm link n8n-nodes-ethena
```

## Credentials Setup

### Ethena Network Credentials

Required for blockchain operations (USDe, sUSDe, ENA transactions):

| Field | Description |
|-------|-------------|
| Network | Select network: Ethereum, Arbitrum, Base, Optimism, BNB Chain, or Custom |
| RPC Endpoint URL | Your RPC provider URL (e.g., Alchemy, Infura, or public RPC) |
| Private Key | Wallet private key for signing transactions |
| Chain ID | Auto-populated based on network selection |
| Referral Code | Optional Ethena referral code |

**Security Note:** Never share your private key. Use dedicated wallets with limited funds for automation.

### Ethena API Credentials

Required for API-based operations (yield, analytics, points):

| Field | Description |
|-------|-------------|
| Environment | Production, Staging, or Custom |
| API Key | Your Ethena API key |
| API Secret | API secret for signed requests |
| Authentication Type | API Key, Signed, OAuth 2.0, or None |
| Wallet Address | Your wallet address for user-specific data |

## Supported Operations

### USDe Resource

| Operation | Description |
|-----------|-------------|
| Get Balance | Get USDe balance for any address |
| Transfer | Transfer USDe to another address |
| Approve | Approve USDe spending for a contract |
| Get Allowance | Check spending allowance |
| Get Total Supply | Get circulating USDe supply |
| Get Price | Get current USDe price |
| Get Market Cap | Get USDe market capitalization |
| Get Transfer History | Get historical transfers |
| Get Holders | Get top USDe holders |
| Get Contract Address | Get USDe contract address by network |

### sUSDe Resource

| Operation | Description |
|-----------|-------------|
| Get Balance | Get sUSDe balance and USD value |
| Stake USDe | Deposit USDe to receive sUSDe |
| Unstake sUSDe | Redeem sUSDe for USDe |
| Get Exchange Rate | Get sUSDe/USDe conversion rate |
| Get APY | Get current staking APY |
| Get Total Supply | Get total sUSDe supply |
| Get Total Assets | Get total USDe in vault |
| Preview Deposit | Calculate shares for deposit amount |
| Preview Withdraw | Calculate shares needed for withdrawal |
| Get Cooldown Status | Check unstaking cooldown period |
| Initiate Cooldown | Start the 7-day unstaking cooldown |
| Get Yield History | Get historical APY data |

### Yield Resource

| Operation | Description |
|-----------|-------------|
| Get Current Yield | Get current, weekly, monthly APY |
| Get Historical Yield | Get APY history by period |
| Get Yield Sources | Breakdown of funding, staking, LST yields |
| Get Funding Rate Yield | Annualized yield from perpetual funding |
| Get Staking Yield | Yield from liquid staking tokens |
| Calculate Earnings | Project earnings for given principal/time |
| Get Yield Forecast | Trend analysis and yield projections |

### Analytics Resource

| Operation | Description |
|-----------|-------------|
| Get Protocol Stats | TVL, supply, APY, users, volume |
| Get TVL | Current total value locked |
| Get TVL History | Historical TVL by period |
| Get Volume (24h) | 24-hour trading volume |
| Get Unique Users | Total unique user count |
| Get Yield Analytics | Yield statistics and volatility |
| Get Risk Metrics | Concentration and insurance metrics |
| Export Report | Generate comprehensive protocol report |

### Points/Sats Resource

| Operation | Description |
|-----------|-------------|
| Get Sats Balance | Total sats and breakdown by activity |
| Get Sats History | Earning history with multipliers |
| Get Multiplier | Current tier and next tier info |
| Get Earning Rate | Daily, weekly, monthly earning rates |
| Get Leaderboard | Top sats holders |
| Get Season Info | Current season dates and rewards pool |
| Get Bonus Multipliers | Available multiplier bonuses |

## Usage Examples

### Example 1: Check USDe Balance

```json
{
  "resource": "usde",
  "operation": "getBalance",
  "address": "0x742d35Cc6634C0532925a3b844Bc9e7595f..."
}
```

### Example 2: Stake USDe for sUSDe

```json
{
  "resource": "susde",
  "operation": "stake",
  "assets": "1000",
  "receiver": "0x..."
}
```

### Example 3: Calculate Projected Earnings

```json
{
  "resource": "yield",
  "operation": "calculateEarnings",
  "principal": 10000,
  "useCurrentApy": true,
  "days": 365
}
```

### Example 4: Monitor Whale Transfers (Trigger)

```json
{
  "event": "largeUsdeTransfer",
  "largeTransferThreshold": 100000
}
```

### Example 5: Get Points Leaderboard

```json
{
  "resource": "points",
  "operation": "getLeaderboard",
  "limit": 50
}
```

## Ethena Protocol Concepts

### USDe (Synthetic Dollar)
A synthetic dollar stablecoin backed by a delta-neutral strategy combining:
- Long spot position (stETH, ETH, BTC collateral)
- Short perpetual futures position (hedge)
- Positive funding rate collection

### sUSDe (Staked USDe)
An ERC-4626 vault token representing staked USDe:
- Earns yield from protocol revenue
- Exchange rate increases over time
- 7-day cooldown period for unstaking

### Delta-Neutral Strategy
Ethena maintains price stability through:
- Hedging spot collateral with short perpetual positions
- Collecting funding payments when rates are positive
- Distributing yields to sUSDe holders

### Sats Points System
Rewards program for protocol participation:
- Earn sats by holding USDe/sUSDe
- Multipliers based on activity and tier
- Seasonal rewards distributed in ENA tokens

## Multi-Network Support

| Network | Chain ID | USDe | sUSDe | ENA |
|---------|----------|------|-------|-----|
| Ethereum Mainnet | 1 | ✅ | ✅ | ✅ |
| Arbitrum One | 42161 | ✅ | ✅ | - |
| Base | 8453 | ✅ | ✅ | - |
| Optimism | 10 | ✅ | ✅ | - |
| BNB Chain | 56 | - | - | - |

## Testing

Run the test suite:

```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch
```

## Building

```bash
# Clean and build
npm run build

# Development mode (watch)
npm run dev

# Type checking only
npm run typecheck

# Lint
npm run lint

# Format
npm run format
```

## Project Structure

```
n8n-nodes-ethena/
├── credentials/
│   ├── EthenaNetwork.credentials.ts
│   ├── EthenaApi.credentials.ts
│   └── EthenaExchange.credentials.ts
├── nodes/
│   └── Ethena/
│       ├── Ethena.node.ts
│       ├── EthenaTrigger.node.ts
│       ├── ethena.svg
│       ├── actions/
│       │   ├── usde/
│       │   ├── susde/
│       │   ├── yield/
│       │   ├── analytics/
│       │   └── points/
│       ├── transport/
│       │   ├── ethenaClient.ts
│       │   ├── ethenaApi.ts
│       │   └── subgraphClient.ts
│       ├── constants/
│       │   ├── networks.ts
│       │   ├── contracts.ts
│       │   ├── collaterals.ts
│       │   └── custodians.ts
│       └── utils/
│           ├── yieldUtils.ts
│           ├── cooldownUtils.ts
│           ├── pointsUtils.ts
│           └── deltaUtils.ts
├── tests/
├── package.json
├── tsconfig.json
├── LICENSE
├── COMMERCIAL_LICENSE.md
├── LICENSING_FAQ.md
└── README.md
```

## Security Considerations

- **Private Keys**: Never commit private keys. Use environment variables or secure credential storage.
- **RPC Endpoints**: Use authenticated RPC providers for production.
- **Transaction Signing**: Review all transactions before signing.
- **Cooldown Periods**: Be aware of the 7-day unstaking cooldown for sUSDe.

## Resources

- [Ethena Protocol Documentation](https://docs.ethena.fi)
- [n8n Documentation](https://docs.n8n.io)
- [n8n Community Nodes Guide](https://docs.n8n.io/integrations/community-nodes/)

## Changelog

### v1.0.0 (Initial Release)
- USDe operations (balance, transfer, approve)
- sUSDe operations (stake, unstake, cooldown)
- Yield tracking and calculations
- Protocol analytics
- Points/Sats system integration
- Multi-network support
- Event triggers for monitoring
