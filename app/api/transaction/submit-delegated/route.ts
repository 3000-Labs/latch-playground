import { NextRequest, NextResponse } from "next/server";
import {
  TransactionBuilder,
  Networks,
  Address,
  xdr,
  rpc,
  Transaction,
  Operation,
  Keypair,
} from "@stellar/stellar-sdk";
import {
  addressStringFromCredentials,
  classifyAuthEntryRole,
  credentialSwitchName,
  normalizeAuthEntries,
  rootInvocationSummary,
} from "@/lib/soroban-auth-entries";
import { applyNativeEd25519ToAddressCredentials } from "@/lib/native-soroban-address-signature";

const getConfig = () => ({
  rpcUrl: process.env.NEXT_PUBLIC_RPC_URL || "https://soroban-testnet.stellar.org",
  networkPassphrase: process.env.NEXT_PUBLIC_NETWORK_PASSPHRASE || Networks.TESTNET,
  bundlerSecret: process.env.BUNDLER_SECRET,
});

async function fundAccountIfNeeded(gAddress: string): Promise<void> {
  try {
    const horizonResponse = await fetch(`https://horizon-testnet.stellar.org/accounts/${gAddress}`);
    if (horizonResponse.ok) return;
  } catch {
    // ignore
  }
  const response = await fetch(`https://friendbot.stellar.org?addr=${encodeURIComponent(gAddress)}`);
  if (!response.ok) {
    throw new Error(`Failed to fund account: ${response.statusText}`);
  }
}

function invokeAuthFromTx(tx: Transaction): xdr.SorobanAuthorizationEntry[] {
  const origOp = tx.operations[0] as Operation.InvokeHostFunction;
  const raw = (origOp.auth ?? []) as unknown[];
  return normalizeAuthEntries(raw);
}

function buildDelegatedSignaturesScVal(
  signerG: string,
  contextRuleId: number,
  sigBytes: Buffer
): xdr.ScVal {
  const signerKey = xdr.ScVal.scvVec([
    xdr.ScVal.scvSymbol("Delegated"),
    Address.fromString(signerG).toScVal(),
  ]);
  return xdr.ScVal.scvMap([
    new xdr.ScMapEntry({
      key: xdr.ScVal.scvSymbol("context_rule_ids"),
      val: xdr.ScVal.scvVec([xdr.ScVal.scvU32(contextRuleId)]),
    }),
    new xdr.ScMapEntry({
      key: xdr.ScVal.scvSymbol("signers"),
      val: xdr.ScVal.scvMap([
        new xdr.ScMapEntry({
          key: signerKey,
          val: xdr.ScVal.scvBytes(sigBytes),
        }),
      ]),
    }),
  ]);
}

/**
 * Submits a tx with Soroban auth: native G rows (Freighter signBlob on per-entry Soroban payload hash) +
 * custom smart-account Signatures.
 * Server acts as fee-payer: Enforcing-mode simulate, assemble, sign envelope, submit.
 */
export async function POST(request: NextRequest) {
  const config = getConfig();
  if (!config.bundlerSecret) {
    return NextResponse.json({ error: "BUNDLER_SECRET is not set in environment variables." }, { status: 500 });
  }

  try {
    const server = new rpc.Server(config.rpcUrl);
    const body = await request.json();
    const {
      txXdr,
      signedAuthEntryXdr,
      authEntryXdr,
      signatureBase64,
      signerG,
      contextRuleId,
      signedDelegatedAuthEntries,
      smartAccountAuthEntryIndex,
      smartAccountAddress,
    } = body;

    if (!txXdr) {
      return NextResponse.json({ error: "Missing txXdr." }, { status: 400 });
    }

    if (typeof txXdr !== "string" || txXdr.length < 50) {
      return NextResponse.json(
        { error: `txXdr must be a base64 XDR string (got ${typeof txXdr}, len=${String(txXdr).length})` },
        { status: 400 }
      );
    }

    const tx = TransactionBuilder.fromXDR(txXdr, config.networkPassphrase) as Transaction;
    const opAuth = invokeAuthFromTx(tx);

    const useMergedVector =
      typeof smartAccountAuthEntryIndex === "number" &&
      Number.isInteger(smartAccountAuthEntryIndex) &&
      smartAccountAuthEntryIndex >= 0 &&
      typeof signatureBase64 === "string" &&
      Array.isArray(signedDelegatedAuthEntries);

    const useLegacySingle =
      !useMergedVector &&
      (signedAuthEntryXdr || (authEntryXdr && signatureBase64));

    if (!useMergedVector && !useLegacySingle) {
      return NextResponse.json(
        {
          error:
            "Missing parameters. Send (txXdr, smartAccountAuthEntryIndex, signatureBase64, signedDelegatedAuthEntries) " +
            "or legacy (txXdr, signedAuthEntryXdr) or (txXdr, authEntryXdr, signatureBase64).",
        },
        { status: 400 }
      );
    }

    let mergedAuth: xdr.SorobanAuthorizationEntry[];

    if (useMergedVector) {
      if (opAuth.length === 0) {
        return NextResponse.json(
          { error: "Transaction invoke operation has no auth vector; rebuild with /api/transaction/build." },
          { status: 400 }
        );
      }
      if (smartAccountAuthEntryIndex >= opAuth.length) {
        return NextResponse.json(
          { error: `smartAccountAuthEntryIndex ${smartAccountAuthEntryIndex} out of range (auth length ${opAuth.length}).` },
          { status: 400 }
        );
      }

      if (!signerG || typeof signerG !== "string" || !signerG.startsWith("G")) {
        return NextResponse.json({ error: "Missing signerG (expected Stellar G... address) for delegated signer." }, { status: 400 });
      }

      const sigBytes = Buffer.from(String(signatureBase64), "base64");
      if (sigBytes.length !== 64) {
        return NextResponse.json(
          { error: `signatureBase64 must decode to 64 bytes (got ${sigBytes.length}).` },
          { status: 400 }
        );
      }

      const id = typeof contextRuleId === "number" ? contextRuleId : Number(contextRuleId ?? 0);
      mergedAuth = opAuth.map((e) => xdr.SorobanAuthorizationEntry.fromXDR(e.toXDR()));

      for (const patch of signedDelegatedAuthEntries as {
        index?: unknown;
        signedAuthEntryXdr?: unknown;
        nativeEd25519SignatureBase64?: unknown;
      }[]) {
        const idx = typeof patch.index === "number" ? patch.index : Number(patch.index);
        if (!Number.isInteger(idx) || idx < 0 || idx >= mergedAuth.length) {
          return NextResponse.json({ error: `Invalid delegated auth patch index: ${patch.index}` }, { status: 400 });
        }
        const xdrStr = patch.signedAuthEntryXdr;
        const nativeSig = patch.nativeEd25519SignatureBase64;
        const hasXdr = typeof xdrStr === "string" && xdrStr.length >= 20;
        const hasNative = typeof nativeSig === "string" && nativeSig.length >= 20;
        if (hasXdr === hasNative) {
          return NextResponse.json(
            {
              error:
                "Each signedDelegatedAuthEntries item must include exactly one of: signedAuthEntryXdr (full entry) or nativeEd25519SignatureBase64 (Freighter signBlob output).",
            },
            { status: 400 }
          );
        }
        if (hasXdr) {
          mergedAuth[idx] = xdr.SorobanAuthorizationEntry.fromXDR(String(xdrStr), "base64");
        } else {
          const entryClone = xdr.SorobanAuthorizationEntry.fromXDR(mergedAuth[idx].toXDR());
          try {
            applyNativeEd25519ToAddressCredentials(
              entryClone,
              String(nativeSig),
              config.networkPassphrase
            );
          } catch (e: unknown) {
            const msg = e instanceof Error ? e.message : String(e);
            return NextResponse.json({ error: `Delegated native signature (index ${idx}): ${msg}` }, { status: 400 });
          }
          mergedAuth[idx] = entryClone;
        }
      }

      const smartEntry = xdr.SorobanAuthorizationEntry.fromXDR(mergedAuth[smartAccountAuthEntryIndex].toXDR());
      const creds = smartEntry.credentials();
      if (creds.switch().name !== "sorobanCredentialsAddress") {
        return NextResponse.json({ error: "Smart account auth entry credentials must be address-based" }, { status: 400 });
      }
      creds.address().signature(buildDelegatedSignaturesScVal(signerG, id, sigBytes));
      mergedAuth[smartAccountAuthEntryIndex] = smartEntry;

      const signerGStr = signerG;
      const saAddr =
        typeof smartAccountAddress === "string" && smartAccountAddress.startsWith("C")
          ? smartAccountAddress
          : null;

      if (process.env.DEBUG_SOROBAN_AUTH === "1") {
        console.log(
          "[DEBUG_SOROBAN_AUTH] submit-delegated: mergedAuthLen=%s smartAccountIndex=%s delegatedPatches=%s",
          mergedAuth.length,
          smartAccountAuthEntryIndex,
          signedDelegatedAuthEntries.length
        );
        mergedAuth.forEach((e, i) => {
          const credAddr = addressStringFromCredentials(e);
          const role = saAddr ? classifyAuthEntryRole(e, saAddr, signerGStr) : "other";
          console.log(
            "[DEBUG_SOROBAN_AUTH] submit-delegated merged[%s] credential=%s credAddress=%s root=%s role=%s",
            i,
            credentialSwitchName(e),
            credAddr ?? "(none)",
            rootInvocationSummary(e),
            role
          );
        });
      }
    } else {
      // Legacy: single auth entry on the invoke op (or replace entire op auth with one entry).
      let authEntry: xdr.SorobanAuthorizationEntry;
      if (signedAuthEntryXdr) {
        authEntry = xdr.SorobanAuthorizationEntry.fromXDR(String(signedAuthEntryXdr), "base64");
      } else {
        authEntry = xdr.SorobanAuthorizationEntry.fromXDR(String(authEntryXdr), "base64");
        const sigBytes = Buffer.from(String(signatureBase64), "base64");
        if (sigBytes.length !== 64) {
          const preview = String(signatureBase64);
          const shortPreview = preview.length > 32 ? `${preview.slice(0, 32)}…` : preview;
          return NextResponse.json(
            {
              error:
                `signatureBase64 must decode to 64 bytes (got ${sigBytes.length}). ` +
                `signatureBase64.len=${String(signatureBase64).length} preview=${shortPreview}`,
            },
            { status: 400 }
          );
        }

        if (!signerG || typeof signerG !== "string" || !signerG.startsWith("G")) {
          return NextResponse.json({ error: "Missing signerG (expected Stellar G... address) for delegated signer." }, { status: 400 });
        }

        const id = typeof contextRuleId === "number" ? contextRuleId : Number(contextRuleId ?? 0);
        const creds = authEntry.credentials();
        if (creds.switch().name !== "sorobanCredentialsAddress") {
          return NextResponse.json({ error: "Auth entry credentials must be address-based" }, { status: 400 });
        }
        creds.address().signature(buildDelegatedSignaturesScVal(signerG, id, sigBytes));
      }

      mergedAuth = [authEntry];
    }

    const env = tx.toEnvelope();
    if (env.switch().name !== "envelopeTypeTx") {
      return NextResponse.json({ error: "Expected a v1 transaction envelope" }, { status: 400 });
    }
    const txExt = env.v1().tx().ext();
    if (txExt.switch() === 0) {
      return NextResponse.json(
        { error: "Transaction is missing Soroban resource data. Call /api/transaction/build again." },
        { status: 400 }
      );
    }
    const sorobanData = txExt.value() as xdr.SorobanTransactionData;

    const origOp = tx.operations[0] as Operation.InvokeHostFunction;
    const tb = TransactionBuilder.cloneFrom(tx, {
      fee: tx.fee,
      sorobanData,
      networkPassphrase: config.networkPassphrase,
    });
    tb.clearOperations();
    tb.addOperation(
      Operation.invokeHostFunction({
        source: origOp.source,
        func: origOp.func,
        auth: mergedAuth,
      })
    );
    const txWithAuth = tb.build();

    const enforcingSim = await server.simulateTransaction(txWithAuth);
    if (rpc.Api.isSimulationError(enforcingSim)) {
      return NextResponse.json(
        {
          error: `Auth validation failed: ${enforcingSim.error}`,
        },
        { status: 400 }
      );
    }

    const assembledTx = rpc.assembleTransaction(txWithAuth, enforcingSim).build();
    const bundlerKeypair = Keypair.fromSecret(config.bundlerSecret);

    try {
      await server.getAccount(bundlerKeypair.publicKey());
    } catch (e: any) {
      const msg = String(e?.message ?? e);
      if (msg.includes("Account not found")) {
        await fundAccountIfNeeded(bundlerKeypair.publicKey());
      } else {
        throw e;
      }
    }

    assembledTx.sign(bundlerKeypair);

    const sendResult = await server.sendTransaction(assembledTx);
    if (sendResult.status === "ERROR") {
      throw new Error(`Transaction submission failed: ${sendResult.errorResult?.toXDR("base64")}`);
    }

    const txHash = sendResult.hash;
    let txResult: rpc.Api.GetTransactionResponse | undefined;
    for (let i = 0; i < 30; i++) {
      await new Promise((r) => setTimeout(r, 1000));
      txResult = await server.getTransaction(txHash);
      if (txResult.status !== rpc.Api.GetTransactionStatus.NOT_FOUND) break;
    }

    if (txResult?.status === rpc.Api.GetTransactionStatus.SUCCESS) {
      return NextResponse.json({ hash: txHash, status: "SUCCESS" });
    }

    throw new Error(`Transaction failed: ${txResult?.status ?? "UNKNOWN"}`);
  } catch (error) {
    console.error("Error submitting delegated transaction:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to submit transaction" },
      { status: 500 }
    );
  }
}
