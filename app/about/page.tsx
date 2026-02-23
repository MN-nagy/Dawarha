import Header from "@/components/Header";
import { auth } from "@/auth";
import AboutClient from "@/components/AboutClient";

export default async function AboutPage() {
	const session = await auth();

	return (
		<div className="min-h-screen flex flex-col">
			<Header user={session?.user} />
			{/* We pass the user down to the client component so it knows whether to show the "Create Account" button */}
			<AboutClient user={session?.user} />
		</div>
	);
}
