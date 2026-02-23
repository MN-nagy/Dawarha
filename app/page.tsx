import { auth } from "@/auth";
import Header from "@/components/Header";
import AnimatedHome from "@/components/animated-home";
import { db } from "@/db/index";
import { Users, Reports, CollectedWastes } from "@/db/schema";

export const dynamic = "force-dynamic";

export default async function Home() {
  const session = await auth();

  // Fetch live stats strictly from the database (No fake offsets!)
  const allUsers = await db.select().from(Users);
  const allReports = await db.select().from(Reports);
  const allCollections = await db.select().from(CollectedWastes);

  const stats = {
    users: allUsers.length,
    reports: allReports.length,
    collections: allCollections.length,
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Header user={session?.user} />
      <main className="flex-grow">
        <AnimatedHome user={session?.user} stats={stats} />
      </main>
    </div>
  );
}
