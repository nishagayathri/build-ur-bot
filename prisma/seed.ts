import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Clearing database...");

  // Clear all data in dependency order
  await prisma.toolInvocation.deleteMany();
  await prisma.agentStep.deleteMany();
  await prisma.agentRun.deleteMany();
  await prisma.agentMessage.deleteMany();
  await prisma.chatMessage.deleteMany();
  await prisma.busEvent.deleteMany();
  await prisma.story.deleteMany();
  await prisma.agent.deleteMany();
  await prisma.persona.deleteMany();
  await prisma.marketSignal.deleteMany();
  await prisma.newsSignal.deleteMany();
  await prisma.trendSignal.deleteMany();
  await prisma.economicEvent.deleteMany();

  console.log("Database cleared. All tables empty — clean slate.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
