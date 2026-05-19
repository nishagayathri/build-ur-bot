-- AlterTable
ALTER TABLE "chat_messages" ADD COLUMN     "thread_id" TEXT;

-- CreateIndex
CREATE INDEX "chat_messages_account_id_thread_id_idx" ON "chat_messages"("account_id", "thread_id");
