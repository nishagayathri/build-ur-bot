-- CreateTable
CREATE TABLE "competitor_reports" (
    "id" TEXT NOT NULL,
    "account_id" TEXT NOT NULL,
    "agent_id" TEXT NOT NULL,
    "report_type" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "observation" TEXT NOT NULL,
    "editorial_opportunity" TEXT NOT NULL,
    "urgency" TEXT NOT NULL,
    "recommended_action" TEXT NOT NULL,
    "compliance_note" TEXT,
    "topics" TEXT[],
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "competitor_reports_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "competitor_reports_account_id_idx" ON "competitor_reports"("account_id");

-- CreateIndex
CREATE INDEX "competitor_reports_account_id_report_type_idx" ON "competitor_reports"("account_id", "report_type");

-- CreateIndex
CREATE INDEX "competitor_reports_account_id_urgency_idx" ON "competitor_reports"("account_id", "urgency");

-- CreateIndex
CREATE INDEX "competitor_reports_created_at_idx" ON "competitor_reports"("created_at");

-- AddForeignKey
ALTER TABLE "competitor_reports" ADD CONSTRAINT "competitor_reports_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "competitor_reports" ADD CONSTRAINT "competitor_reports_agent_id_fkey" FOREIGN KEY ("agent_id") REFERENCES "agents"("agent_id") ON DELETE CASCADE ON UPDATE CASCADE;
