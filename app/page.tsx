import { auth } from "@/auth";
import Header from "@/components/Header";
import AnimatedHome from "@/components/animated-home"; // Import the new component

export default async function Home() {
  const session = await auth();

  return (
    <div className="min-h-screen bg-white">
      <Header user={session?.user} />
      <main>
        {/* Pass the user down so the Home page knows whether to show 'Get Started' or 'Go to Dashboard' */}
        <AnimatedHome user={session?.user} />
      </main>
    </div>
  );
}
