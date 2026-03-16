# PRD — Mobile Wallet + SDK Developer
### Latch | @latch/core + @latch/react + Mobile Wallet (React Native)
### Assigned to: Kachi

---

## Overview

You are building two things:

1. **The @latch/sdk** — the TypeScript SDK that every wallet provider, dApp, and integrator will use to interact with Latch. This is library code — it must be clean, well-typed, and publishable to npm.

2. **The Latch Mobile Wallet** — a React Native app (iOS + Android) that is the mobile version of the Latch wallet. It uses the SDK you build.

You work closely with Frankie (who provides the contract ABIs, relay API spec, and Soroban interaction patterns) and the web frontend dev (who will also consume your SDK for the web wallet).

Stack: **TypeScript, React Native, Expo (or bare RN — confirm with Frankie)**

---

## Part 1 — @latch/sdk

### Package structure

```
@latch/core     — Pure TypeScript, no framework dependencies
@latch/react    — React hooks (depends on @latch/core)
```

Both published to npm as separate packages under the `@latch` scope.

---

### @latch/core

Pure logic. No React. No browser APIs. Works in Node.js, browser, and React Native.

#### Modules

**1. Address**
```typescript
// Derive the deterministic C-address for a user before deployment
deriveSmartAccountAddress(userPubkey: string, factoryAddress: string, network: Network): string

// Generate the proxy G-address for bridge deposits
getProxyGAddress(cAddress: string, bridgeContract: string): string
```

**2. Bridge**
```typescript
// Get the funding instructions for a C-address
getFundingInstructions(cAddress: string, network: Network): {
  proxyGAddress: string   // send XLM here
  memo: string            // with this memo
  memoType: 'text' | 'id'
}

// Watch for a deposit arriving (polls or streams)
watchDeposit(cAddress: string, network: Network, onDeposit: (tx: DepositEvent) => void): () => void
```

**3. Auth**
```typescript
// Build the Soroban auth payload for a Smart Account operation
buildAuthPayload(params: {
  smartAccountAddress: string
  contractAddress: string
  functionName: string
  args: SorobanValue[]
  nonce: bigint
  expirationLedger: number
  network: Network
}): AuthPayload

// Package a raw signature into the correct Soroban auth entry format
packageSignature(params: {
  payload: AuthPayload
  signature: Uint8Array        // raw 64-byte signature from wallet
  publicKey: Uint8Array        // raw 32-byte public key
  verifierAddress: string      // deployed verifier contract
  signerType: 'ed25519' | 'secp256k1' | 'webauthn'
}): SorobanAuthEntry
```

**4. Simulation**
```typescript
// Run Recording Mode simulation (get auth entries needing signatures)
simulateRecording(tx: Transaction, rpc: SorobanRpc): Promise<SimulationResult>

// Run Enforcing Mode simulation (validate signed auth entries)
simulateEnforcing(tx: Transaction, signedAuthEntries: SorobanAuthEntry[], rpc: SorobanRpc): Promise<SimulationResult>
```

**5. Types**
- `Network` — testnet | mainnet with RPC URLs
- `AuthPayload` — structured auth payload ready for signing
- `SorobanAuthEntry` — complete signed entry ready for submission
- `DepositEvent` — bridge deposit notification
- `SimulationResult` — recording or enforcing simulation result

---

### @latch/react

React hooks that wrap @latch/core with state management. Used by both the web wallet and any third-party React integrator.

```typescript
// Smart Account state and operations
useSmartAccount(config: LatchConfig): {
  address: string | null        // C-address (null if not deployed)
  isDeployed: boolean
  deploy: (signer: WalletAdapter) => Promise<void>
  isDeploying: boolean
}

// Bridge funding flow
useBridge(cAddress: string | null, config: LatchConfig): {
  fundingInstructions: FundingInstructions | null
  depositStatus: 'waiting' | 'received' | 'forwarded' | null
  amount: string | null
}

// Transaction building + signing + submission
useTransaction(config: LatchConfig): {
  build: (params: TxParams) => Promise<void>
  sign: (signer: WalletAdapter) => Promise<void>
  submit: () => Promise<string>  // returns tx hash
  status: 'idle' | 'building' | 'signing' | 'submitting' | 'success' | 'error'
  error: Error | null
}

// Wallet adapter connection
useWalletAdapter(): {
  connect: (type: 'phantom' | 'metamask' | 'passkey') => Promise<WalletAdapter>
  adapter: WalletAdapter | null
  disconnect: () => void
}
```

#### WalletAdapter interface
```typescript
interface WalletAdapter {
  type: 'phantom' | 'metamask' | 'passkey' | 'hardware'
  publicKey: Uint8Array
  sign: (payload: Uint8Array) => Promise<Uint8Array>  // returns raw signature
}
```

Implementations:
- `PhantomAdapter` — connects to window.phantom, signs with Phantom
- `MetaMaskAdapter` — connects to window.ethereum, signs with personal_sign
- `PasskeyAdapter` — uses navigator.credentials (WebAuthn), signs with device biometric
- `ReactNativePasskeyAdapter` — uses react-native-passkey for mobile

---

### SDK Requirements

- Full TypeScript, strict mode
- Every public function and type has JSDoc comments
- 100% of public API covered by unit tests
- Works in: Node.js 18+, modern browsers (Chrome/Firefox/Safari), React Native
- Zero runtime dependencies except @stellar/stellar-sdk
- Published to npm: `@latch/core` and `@latch/react` as separate packages
- README with quick start example for each package

---

## Part 2 — Latch Mobile Wallet (React Native)

### Goal
Native iOS and Android wallet app for Latch Smart Accounts. Full feature parity with the web wallet, built for touch — biometric signing (Face ID / Touch ID) is the primary authentication method on mobile.

### Tech
- **Expo** (managed workflow) — builds to iOS App Store and Google Play from one TypeScript codebase
- Uses `@latch/core` and `@latch/react` you build in Part 1
- Passkey signing via `react-native-passkey`
- Phantom wallet via deep link (mobile has no browser extension — use Phantom's mobile deep link API)

---

### Screens

**Onboarding**

| Screen | Description |
|---|---|
| Welcome | App logo, "Create your Stellar Smart Account", Get Started button |
| Choose signer | Passkey (recommended on mobile) / Phantom deep link / MetaMask deep link |
| Creating | Deployment loading, show C-address as soon as it's derived |
| Fund | Proxy G-address + memo, QR code for easy scanning, copy buttons |
| Waiting | Live deposit status, amount, progress |
| Ready | Wallet ready screen, enter app |

**Bottom tab navigation**
- Home (Dashboard)
- Send
- Receive
- History
- Settings

**Home / Dashboard**
- Portfolio total (USD)
- Asset list (icon, name, balance, USD value)
- Quick send / receive buttons

**Send**
- Address input (paste or scan QR)
- Asset selector
- Amount + USD conversion
- Review: recipient, asset, amount, fee
- Sign: Face ID / Touch ID biometric prompt → submit

**Receive**
- C-address QR code (large, scannable)
- Copy address button
- Bridge section: proxy G-address + memo for CEX deposits
- Share button (share address as text)

**Transaction History**
- List: type icon, asset, amount, date, status
- Pull-to-refresh
- Tap to expand detail

**Session Keys**
- Active session keys list
- Create new: scope, limits, expiry
- Revoke (with biometric confirmation)

**Settings**
- Account details, registered signers
- Add signer (additional Passkey credential, hardware key)
- Network toggle (testnet / mainnet)
- App version, links

---

### Mobile-specific requirements

- **Biometric first** — Passkey (Face ID / Touch ID) is the default and recommended signer on mobile. Make it feel native, not bolted-on.
- **Deep links** — Phantom and MetaMask connect via deep link on mobile (no browser extension). Handle the redirect flow correctly.
- **Offline states** — show cached data when RPC is unreachable, with a clear "offline" indicator
- **Push notifications** — nice to have: notify when a deposit arrives. Not required for v1 but structure the code to add it.
- **App store ready** — Expo build for iOS (TestFlight) and Android (Play Store internal track) by end of build period

---

## What you receive before starting

From Frankie:
- Contract ABIs (Smart Account, verifiers, factory, bridge)
- API route spec (build tx, simulate, submit)
- Relay API spec (deposit status polling endpoint)
- Soroban auth construction reference (existing scripts in `/scripts`)

From design team (Lexie):
- Figma designs for all mobile screens, all states
- Component specs

---

## Deliverables

| # | Deliverable | Done when |
|---|---|---|
| 1 | `@latch/core` published to npm | All modules implemented, tested, documented |
| 2 | `@latch/react` published to npm | All hooks implemented, tested |
| 3 | Wallet adapters | Phantom, MetaMask, Passkey adapters working on testnet |
| 4 | Mobile onboarding | User creates Smart Account with Passkey on testnet |
| 5 | Mobile dashboard | Balances display correctly |
| 6 | Mobile send/receive | Full round-trip token transfer on testnet |
| 7 | Mobile session keys | Create, view, revoke session keys |
| 8 | App store build | iOS TestFlight + Android internal track submission |

---

## Timeline

| Week | Work |
|---|---|
| 1–2 | @latch/core — address, bridge, auth, simulation modules |
| 2–3 | @latch/react hooks + wallet adapters |
| 3 | Publish to npm (beta), hand off to web frontend dev |
| 4–5 | Mobile onboarding + dashboard + send/receive |
| 6–7 | Mobile history, session keys, settings |
| 8 | Polish, QA, app store builds |
| 9–10 | Bug fixes from web frontend integration feedback |
