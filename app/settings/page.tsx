import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Header from "@/components/Header";
import { getUserByEmail, getCompleteUserProfile } from "@/db/actions";
import { SettingsForm } from "@/components/settings-form";

export default async function SettingsPage() {
	const session = await auth();

	// 1. Ensure they are logged in via NextAuth
	if (!session?.user?.email) {
		redirect("/login");
	}

	// 2. Fetch their secure internal database identity
	const dbUser = await getUserByEmail(session.user.email);
	if (!dbUser) {
		redirect("/login");
	}

	// 3. Fetch their extended platform settings and multiple locations
	const { profile, locations } = await getCompleteUserProfile(dbUser.id);

	return (
		<div className="min-h-screen bg-gray-50">
			<Header user={session.user} />

			<main className="max-w-6xl mx-auto p-4 md:p-8 mt-4 animate-in fade-in duration-500">
				<SettingsForm
					userId={dbUser.id}
					baseUser={{ name: dbUser.name, email: dbUser.email }}
					initialProfile={profile}
					initialLocations={locations}
				/>
			</main>
		</div>
	);
}
