import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { ReportForm } from "@/components/report-form";
import Header from "@/components/Header";
import AnimatedReport from "@/components/animated-report";

export default async function ReportPage() {
	const session = await auth();

	// Protect the route
	if (!session?.user) {
		redirect("/login");
	}

	return (
		<div className="min-h-screen bg-gray-50">
			<Header user={session.user} />
			<AnimatedReport>
				<ReportForm />
			</AnimatedReport>
		</div>
	);
}
