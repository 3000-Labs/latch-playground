-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "created_at" BIGINT NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "created_at" BIGINT NOT NULL,
    "expires_at" BIGINT NOT NULL,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "webauthn_credentials" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "credential_id" TEXT NOT NULL,
    "credential_id_bytes" BYTEA NOT NULL,
    "cose_public_key" BYTEA NOT NULL,
    "p256_raw_public_key" BYTEA NOT NULL,
    "sign_count" INTEGER NOT NULL,
    "transports" TEXT,
    "device_type" TEXT,
    "backed_up" INTEGER NOT NULL DEFAULT 0,
    "created_at" BIGINT NOT NULL,

    CONSTRAINT "webauthn_credentials_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "smart_accounts" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "credential_id" TEXT NOT NULL,
    "key_data_hex" TEXT NOT NULL,
    "salt_hex" TEXT NOT NULL,
    "smart_account_address" TEXT NOT NULL,
    "deployed" INTEGER NOT NULL DEFAULT 0,
    "created_at" BIGINT NOT NULL,

    CONSTRAINT "smart_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "webauthn_challenges" (
    "id" TEXT NOT NULL,
    "user_id" TEXT,
    "purpose" TEXT NOT NULL,
    "challenge" TEXT NOT NULL,
    "rp_id" TEXT NOT NULL,
    "origin" TEXT NOT NULL,
    "expires_at" BIGINT NOT NULL,
    "created_at" BIGINT NOT NULL,

    CONSTRAINT "webauthn_challenges_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "account_signers" (
    "id" TEXT NOT NULL,
    "smart_account_address" TEXT NOT NULL,
    "signer_type" TEXT NOT NULL,
    "credential_id" TEXT,
    "label" TEXT,
    "created_at" BIGINT NOT NULL,

    CONSTRAINT "account_signers_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "sessions_user_id_idx" ON "sessions"("user_id");

-- CreateIndex
CREATE INDEX "sessions_expires_at_idx" ON "sessions"("expires_at");

-- CreateIndex
CREATE UNIQUE INDEX "webauthn_credentials_credential_id_key" ON "webauthn_credentials"("credential_id");

-- CreateIndex
CREATE INDEX "webauthn_credentials_user_id_idx" ON "webauthn_credentials"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "smart_accounts_credential_id_key" ON "smart_accounts"("credential_id");

-- CreateIndex
CREATE UNIQUE INDEX "smart_accounts_key_data_hex_key" ON "smart_accounts"("key_data_hex");

-- CreateIndex
CREATE UNIQUE INDEX "smart_accounts_smart_account_address_key" ON "smart_accounts"("smart_account_address");

-- CreateIndex
CREATE INDEX "smart_accounts_user_id_idx" ON "smart_accounts"("user_id");

-- CreateIndex
CREATE INDEX "webauthn_challenges_expires_idx" ON "webauthn_challenges"("expires_at");

-- CreateIndex
CREATE INDEX "account_signers_addr_type_idx" ON "account_signers"("smart_account_address", "signer_type");

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "webauthn_credentials" ADD CONSTRAINT "webauthn_credentials_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "smart_accounts" ADD CONSTRAINT "smart_accounts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "smart_accounts" ADD CONSTRAINT "smart_accounts_credential_id_fkey" FOREIGN KEY ("credential_id") REFERENCES "webauthn_credentials"("credential_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "webauthn_challenges" ADD CONSTRAINT "webauthn_challenges_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "account_signers" ADD CONSTRAINT "account_signers_smart_account_address_fkey" FOREIGN KEY ("smart_account_address") REFERENCES "smart_accounts"("smart_account_address") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "account_signers" ADD CONSTRAINT "account_signers_credential_id_fkey" FOREIGN KEY ("credential_id") REFERENCES "webauthn_credentials"("credential_id") ON DELETE SET NULL ON UPDATE CASCADE;
