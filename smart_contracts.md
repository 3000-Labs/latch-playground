# Latch Smart Contracts Architecture

This document outlines the smart contract architecture required to build Latch, organized into three structured phases. It details the purpose, functionality, and role of each contract in bridging G-addresses to Soroban C-addresses.

## Phase 0: The Core Foundation (Completed)
This phase established the foundational primitives required for cross-chain signing and the basic operation of a Smart Account (C-address).

### 1. Smart Account Contract (`smart-account`)
*   **Purpose:** The user's on-chain identity (C-address).
*   **Standard:** Implements the OpenZeppelin Custom Account Interface and delegates core logic to the OZ `stellar-accounts` library.
*   **Key Functionality:** 
    *   Implements `__check_auth` to validate transactions via delegation.
    *   Stores Context Rules (who can sign, what contracts they can call).
    *   Enforces policies (e.g., spending limits) attached to those rules.

### 2. Ed25519 Verifier Contract (`ed25519-verifier`)
*   **Purpose:** A stateless, modular contract that verifies Ed25519 signatures from external wallets (specifically Phantom/Solana wallets).
*   **Key Functionality:**
    *   Accepts a public key, a signature, and a payload hash.
    *   Validates a specific prefix ("Stellar Smart Account Auth:\n") to prevent phishing and formatting errors in the Phantom UI.
    *   Performs pure cryptographic `ed25519_verify()` and returns true/false.
    *   Acts as the trusted verification layer for the Smart Account's context rules.

### 3. Target Contract (`counter`)
*   **Purpose:** A simple dummy contract used strictly for testing the end-to-end authorization flow in the demo.

---

## Phase 1: The Bridge & Deployment Infrastructure (Current Focus)
This phase introduces the infrastructure necessary to solve the "funding problem," enabling seamless deposits from centralized exchanges (CEXs) and deterministic account creation.

### 4. Latch Bridge Proxy Contract
*   **Purpose:** A non-custodial holding contract deployed at a standard G-address. This is the address users provide to CEXs (like Coinbase or Binance).
*   **Problem Solved:** CEXs only support sending funds to G-addresses and cannot construct `InvokeHostFunctionOp` transactions needed to fund C-addresses directly.
*   **Key Functionality:**
    *   **Receive:** Accepts native XLM and standard Stellar Assets (SACs).
    *   **Event Emission:** Emits structured Soroban events containing the deposit amount, the asset type, and the **Memo ID** (which encodes the destination C-address). This allows the off-chain Relay Service to efficiently index deposits.
    *   **Secure Forwarding:** Exposes a `forward()` function that only the Latch Relay Service can invoke. This function strictly forces the funds to be sent *only* to the C-address derived from the Memo ID, ensuring the bridge is non-custodial and trust-minimized.

### 5. Smart Account Factory Contract
*   **Purpose:** A dedicated contract for safely and deterministically deploying user Smart Accounts.
*   **Problem Solved:** Replaces the manual `stellar contract deploy` CLI command from the demo with a robust, atomic on-chain deployment process.
*   **Key Functionality:**
    *   **Deterministic Addresses:** Uses `deployer().with_current_contract(salt)` where the `salt` is a hash of the user's Phantom public key. This ensures a predictable C-address before deployment.
    *   **Atomic Setup:** Deploys the Smart Account and immediately calls `initialize()` in the exact same transaction to bind the user's Ed25519 public key and verifier contract.
    *   **Initial Funding:** Allows the Relay Service to bundle a small XLM transfer during deployment to cover the new account's initial state footprint.

---

## Phase 2: Multi-Ecosystem Expansion (Future)
This phase focuses on expanding Latch's compatibility to support a wider array of ecosystem wallets, moving beyond just Phantom/Solana.

### 6. secp256k1 Verifier Contract
*   **Purpose:** A modular verifier contract that supports Ethereum-ecosystem wallets (e.g., MetaMask, Rabby).
*   **Problem Solved:** Ethereum wallets use the secp256k1 elliptic curve, which is cryptographically incompatible with Ed25519.
*   **Key Functionality:**
    *   Accepts an Ethereum public key (or address), a signed payload, and a signature.
    *   Performs `secp256k1_recover` or similar ECDSA verification logic.
    *   Seamlessly plugs into the existing Smart Account architecture by simply adding a new Context Rule pointing to this verifier instead of the Ed25519 one.

### 7. Passkey (WebAuthn) Verifier Contract
*   **Purpose:** A verifier contract to support biometric authentication (FaceID, TouchID) via standard Passkeys.
*   **Key Functionality:**
    *   Verifies standard WebAuthn cryptographic signatures (typically secp256r1/P-256).
    *   Enables true "walletless" onboarding where the user's device acts as the secure enclave signing for the Stellar Smart Account.
