-- CreateEnum
CREATE TYPE "EarningsStatus" AS ENUM ('UPCOMING', 'REPORTED');

-- CreateTable
CREATE TABLE "earnings_events" (
    "event_id" TEXT NOT NULL,
    "account_id" TEXT NOT NULL,
    "symbol" TEXT NOT NULL,
    "report_date" TIMESTAMP(3) NOT NULL,
    "eps_estimate" DOUBLE PRECISION,
    "eps_actual" DOUBLE PRECISION,
    "revenue_estimate" DOUBLE PRECISION,
    "revenue_actual" DOUBLE PRECISION,
    "status" "EarningsStatus" NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "earnings_events_pkey" PRIMARY KEY ("event_id")
);

-- CreateTable
CREATE TABLE "insider_trades" (
    "trade_id" TEXT NOT NULL,
    "account_id" TEXT NOT NULL,
    "symbol" TEXT NOT NULL,
    "filing_date" TIMESTAMP(3) NOT NULL,
    "transaction_date" TIMESTAMP(3) NOT NULL,
    "reporting_name" TEXT NOT NULL,
    "type_of_owner" TEXT NOT NULL,
    "transaction_type" TEXT NOT NULL,
    "securities_transacted" DOUBLE PRECISION NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "security_name" TEXT NOT NULL,
    "form_type" TEXT NOT NULL,
    "url" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "insider_trades_pkey" PRIMARY KEY ("trade_id")
);

-- CreateIndex
CREATE INDEX "earnings_events_account_id_idx" ON "earnings_events"("account_id");

-- CreateIndex
CREATE INDEX "earnings_events_report_date_idx" ON "earnings_events"("report_date");

-- CreateIndex
CREATE INDEX "insider_trades_account_id_idx" ON "insider_trades"("account_id");

-- CreateIndex
CREATE INDEX "insider_trades_timestamp_idx" ON "insider_trades"("timestamp");

-- AddForeignKey
ALTER TABLE "earnings_events" ADD CONSTRAINT "earnings_events_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "insider_trades" ADD CONSTRAINT "insider_trades_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
