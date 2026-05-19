-- DropForeignKey
ALTER TABLE "agent_messages" DROP CONSTRAINT "agent_messages_agent_id_fkey";

-- DropForeignKey
ALTER TABLE "agent_runs" DROP CONSTRAINT "agent_runs_agent_id_fkey";

-- AddForeignKey
ALTER TABLE "agent_runs" ADD CONSTRAINT "agent_runs_agent_id_fkey" FOREIGN KEY ("agent_id") REFERENCES "agents"("agent_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agent_messages" ADD CONSTRAINT "agent_messages_agent_id_fkey" FOREIGN KEY ("agent_id") REFERENCES "agents"("agent_id") ON DELETE CASCADE ON UPDATE CASCADE;
