-- AlterTable
ALTER TABLE "agents" ADD COLUMN     "tool_names" TEXT[] DEFAULT ARRAY[]::TEXT[];
