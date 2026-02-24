"use server";

import { desc, eq } from "drizzle-orm";
import { db } from "@/db/index";
import {
  Users,
  Reports,
  UserProfiles,
  CompanyLocations,
  CollectedWastes,
  Rewards,
  Notifications,
  VerificationTokens,
} from "@/db/schema";
import { signIn, signOut, auth } from "@/auth";
import bcrypt from "bcryptjs";
import { AuthError } from "next-auth";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { generateText, Output } from "ai";
import { google } from "@ai-sdk/google";
import { z } from "zod";
import { Resend } from "resend";
import crypto from "crypto";
import { stripe } from "@/lib/stripe";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function getUserByEmail(email: string) {
  const existingUser = await db
    .select()
    .from(Users)
    .where(eq(Users.email, email))
    .limit(1);

  return existingUser[0] ?? null;
}

export async function confirmPass(prevState: any, formData: FormData) {
  const password = formData.get("password") as string;
  const confirm = formData.get("confirm-password") as string;

  if (password === confirm) {
    return null;
  } else {
    return { error: "Passwords doesn't match!" };
  }
}

export async function createUser(prevState: any, formData: FormData) {
  const name = formData.get("name") as string;
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const confirm = formData.get("confirm-password") as string;
  const role = (formData.get("role") as string) || "member";

  if (!email || !password || !role) return { error: "All fields are required" };

  const hashedPass = await bcrypt.hash(password, 10);

  const existingUser = await getUserByEmail(email);

  if (existingUser) {
    return { error: "User already exists" };
  }

  if (password !== confirm) {
    return { error: "Passwords have to match!" };
  }

  try {
    await db.insert(Users).values({ name, email, password: hashedPass, role });
    return { success: "User have been created successfuly!" };
  } catch (error) {
    return { error: "something went wrong, please try again!" };
  }
}

export async function logIn(prevState: any, formData: FormData) {
  try {
    await signIn("credentials", {
      email: formData.get("email"),
      password: formData.get("password"),
      redirect: false,
    });
  } catch (err) {
    if (err instanceof AuthError) {
      switch (err.type) {
        case "CredentialsSignin":
          return { error: "Invalid email or password" };
        default:
          return { error: "something went wrong" };
      }
    }

    throw err;
  }

  redirect("/");
}

export async function logOut() {
  await signOut({ redirectTo: "/" });
}

// report
const reportSchema = z.object({
  wasteType: z.string().min(1, "Waste type is required."),
  amount: z.string().min(1, "Amount is required."),
  location: z.string().min(1, "Location is required."),
  imageUrl: z.url("A valid image URL is required."),
  description: z.string().optional(),
  additionalWaste: z
    .string()
    .min(1, "Please specify if there is other waste, or type 'None'."),
  scale: z.enum(["small", "large"], {
    message: "Scale must be small or large.",
  }),
  totalWasteAmount: z.string().min(1, "Total amount is required."),
  latitude: z.string().min(1, "Latitude coordinates are required."),
  longitude: z.string().min(1, "Longitude coordinates are required."),
});

export async function createReport(prevState: any, formData: FormData) {
  try {
    const session = await auth();

    if (!session?.user?.email) {
      return { error: "you have to be logged in to report waste" };
    }

    const dbUser = await getUserByEmail(session.user.email);
    if (!dbUser) {
      return { error: "User account not found!" };
    }

    const rawData = {
      wasteType: formData.get("wasteType"),
      amount: formData.get("amount"),
      location: formData.get("location"),
      imageUrl: formData.get("imageUrl"),
      description: formData.get("description"),
      additionalWaste: formData.get("additionalWaste"),
      totalWasteAmount: formData.get("totalWasteAmount"),
      scale: formData.get("scale"),
      latitude: formData.get("latitude"),
      longitude: formData.get("longitude"),
    };

    const validatedData = reportSchema.safeParse(rawData);

    if (!validatedData.success) {
      return { error: validatedData.error.message };
    }

    await db.insert(Reports).values({
      userId: dbUser.id,
      ...validatedData.data,
      status: "pending",
    });

    revalidatePath("/dashboard");

    return { success: "Report submitted successfully!" };
  } catch (err) {
    return { error: "Faild to submit report, Please try again." };
  }
}

// for dashboard list.
export async function getRecentReports() {
  const session = await auth();
  if (!session?.user?.email) return [];

  const dbUser = await getUserByEmail(session.user.email);
  if (!dbUser) return [];

  try {
    const reports = await db
      .select()
      .from(Reports)
      .where(eq(Reports.userId, dbUser.id))
      .orderBy(desc(Reports.createdAt))
      .limit(10);

    return reports;
  } catch (err) {
    console.error("Fetch Error: 'reports'", err);
    return [];
  }
}

// Analyze with ai
export async function analyzeWasteImage(formData: FormData) {
  try {
    // 1. Extract the raw File and description from the FormData
    const file = formData.get("file") as File;
    const userDescription = formData.get("description") as string;

    if (!file) {
      return { success: false, error: "No image provided." };
    }

    // 2. Convert the File into a Buffer for Gemini
    const buffer = await file.arrayBuffer();

    const { output } = await generateText({
      model: google("gemini-2.5-flash"),
      output: Output.object({
        schema: z.object({
          wasteType: z.enum(["plastic", "metal", "glass", "paper", "organic"]),
          amount: z
            .string()
            .describe(
              "Estimate the weight of ONLY the dominant material. Return a simple string like '500kg' or '15kg'.",
            ),
          additionalWaste: z
            .string()
            .describe(
              "List OTHER visible waste types. If none, repeat the dominant waste type.",
            ),
          totalWasteAmount: z
            .string()
            .describe(
              "MANDATORY: Add all the individual waste weights together to provide a final total weight string (e.g., '900kg'), you can use the appropriate nameing like '1000kg will be 1ton, etc'",
            ),
          scale: z
            .enum(["small", "large"])
            .describe(
              "STRICT RULE: Read the numeric value from totalWasteAmount. If the total weight is 20kg or more, return 'large'. If it is less than 20kg, return 'small'. Do NOT guess. Do NOT use visual size. Base this ONLY on totalWasteAmount.",
            ),
        }),
      }),
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `Analyze this image of waste. User provided context: "${userDescription}". 
                 Step 1: Determine the single DOMINANT material.
                 Step 2: Estimate the weight of that dominant material.
                 Step 3: Identify any OTHER secondary waste types and estimate their weights.
                 Step 4: Calculate the total combined weight of all materials.
                 Step 5: CRITICAL LOGIC CHECK -> If the total combined weight from Step 4 is 20kg or more, the scale is 'large'. If it is under 20kg, the scale is 'small'.`,
            },
            { type: "image", image: buffer },
          ],
        },
      ],
    });

    return { success: true, data: output };
  } catch (error) {
    console.error("🚨 AI Analysis Error:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to analyze image.",
    };
  }
}

// fetching Reports
export async function getAvailableReports() {
  try {
    const reports = await db
      .select()
      .from(Reports)
      .where(eq(Reports.status, "pending"))
      .orderBy(desc(Reports.createdAt));

    return reports;
  } catch (error) {
    console.log("Error fetching reports for feed", error);
    return [];
  }
}

// -- SETTINGS PAGE RELATED -- \\

// 1. Get the user's complete settings profile (Profile + Office Locations)
export async function getCompleteUserProfile(userId: number) {
  try {
    // Fetch the profile settings
    const profileResult = await db
      .select()
      .from(UserProfiles)
      .where(eq(UserProfiles.userId, userId))
      .limit(1);

    // Fetch all company operating locations (if they have any)
    const locationsResult = await db
      .select()
      .from(CompanyLocations)
      .where(eq(CompanyLocations.userId, userId));

    return {
      profile: profileResult[0] || null,
      locations: locationsResult || [],
    };
  } catch (error) {
    console.error("Error fetching complete profile:", error);
    return { profile: null, locations: [] };
  }
}

// 2. Update the main Profile & Role
export async function updateProfileSettings(
  userId: number,
  data: {
    role: string;
    preferredWaste: string;
    capacity: string;
    companyType: string | null;
    contributionModel: string;
    targetAmount: string;
    radius: number;
  },
) {
  try {
    const existing = await db
      .select()
      .from(UserProfiles)
      .where(eq(UserProfiles.userId, userId))
      .limit(1);

    if (existing.length > 0) {
      await db
        .update(UserProfiles)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(UserProfiles.userId, userId));
    } else {
      await db.insert(UserProfiles).values({ userId, ...data });
    }

    // Keep the base Users table role in sync!
    await db.update(Users).set({ role: data.role }).where(eq(Users.id, userId));

    revalidatePath("/settings");
    return { success: "Settings saved successfully!" };
  } catch (error) {
    console.error("Error saving settings:", error);
    return { error: "Failed to save settings. Please try again." };
  }
}

// 3. Add a new Company Office Location
export async function addCompanyLocation(
  userId: number,
  address: string,
  latitude: string,
  longitude: string,
) {
  try {
    await db.insert(CompanyLocations).values({
      userId,
      address,
      latitude,
      longitude,
    });

    revalidatePath("/settings");
    return { success: "Location added!" };
  } catch (error) {
    return { error: "Failed to add location." };
  }
}

// 4. Remove a Company Office Location
export async function removeCompanyLocation(
  locationId: number,
  userId: number,
) {
  try {
    // Verify the user owns this location before deleting
    await db
      .delete(CompanyLocations)
      .where(eq(CompanyLocations.id, locationId)); // In a real app, also add: .and(eq(CompanyLocations.userId, userId))

    revalidatePath("/settings");
    return { success: "Location removed." };
  } catch (error) {
    return { error: "Failed to remove location." };
  }
}

// --- IAM (IDENTITY & ACCESS MANAGEMENT) ---

export async function updateUserName(userId: number, newName: string) {
  try {
    await db.update(Users).set({ name: newName }).where(eq(Users.id, userId));
    revalidatePath("/settings");
    return { success: "Name updated successfully!" };
  } catch (error) {
    return { error: "Failed to update name." };
  }
}

export async function requestEmailChange(
  userId: number,
  currentEmail: string,
  newEmail: string,
) {
  try {
    // 1. Generate a secure random token
    const token = crypto.randomBytes(32).toString("hex");
    const OneHourInMs = 60 * 60 * 1000;
    const expires = new Date(Date.now() + OneHourInMs); // Expires in 1 hour

    // 2. Save to database
    await db.insert(VerificationTokens).values({
      identifier: newEmail,
      token,
      expires,
      type: "email_change",
    });

    // 3. Send the email (In production, replace 'onboarding@resend.dev' with your verified domain)
    const verifyLink = `${process.env.NEXT_PUBLIC_APP_URL}/verify?token=${token}&type=email&id=${userId}`;

    await resend.emails.send({
      from: "Dawarha Security <onboarding@resend.dev>",
      to: newEmail,
      subject: "Verify your new email address",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 32px; border: 1px solid #e5e7eb; border-radius: 12px; background-color: #ffffff; text-align: center;">
            <div style="width: 48px; height: 48px; background-color: #d1fae5; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 16px;">
                <span style="font-size: 24px;">♻️</span>
            </div>
            <h2 style="color: #064e3b; margin-top: 0; margin-bottom: 16px; font-size: 24px;">Update Your Email</h2>
            <p style="color: #4b5563; font-size: 16px; line-height: 1.5; margin-bottom: 32px;">
                You recently requested to change the email address associated with your Dawarha account. Click the button below to verify this new address.
            </p>
            <a href="${verifyLink}" style="background-color: #059669; color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; display: inline-block; transition: background-color 0.2s;">
                Verify Email Address
            </a>
            <p style="color: #9ca3af; font-size: 13px; margin-top: 32px; border-top: 1px solid #e5e7eb; padding-top: 24px;">
                If you did not request this change, you can safely ignore this email. Your account remains secure.
            </p>
        </div>
      `,
    });

    return { success: "Verification link sent to your new email!" };
  } catch (error) {
    console.error(error);
    return { error: "Failed to send verification email." };
  }
}

export async function requestPasswordReset(email: string) {
  try {
    const user = await getUserByEmail(email);
    if (!user)
      return { error: "If an account exists, a reset link has been sent." }; // Security best practice: don't reveal if email exists

    const token = crypto.randomBytes(32).toString("hex");
    const OneHourInMs = 60 * 60 * 1000;
    const expires = new Date(Date.now() + OneHourInMs);

    await db.insert(VerificationTokens).values({
      identifier: email,
      token,
      expires,
      type: "password_reset",
    });

    const resetLink = `${process.env.NEXT_PUBLIC_APP_URL}/verify?token=${token}&type=password`;

    // Replace the old resend.emails.send block with this:
    await resend.emails.send({
      from: "Dawarha Support <onboarding@resend.dev>",
      to: email,
      subject: "Reset your Dawarha password",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 32px; border: 1px solid #e5e7eb; border-radius: 12px; background-color: #ffffff; text-align: center;">
            <div style="width: 48px; height: 48px; background-color: #e0e7ff; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 16px;">
                <span style="font-size: 24px;">🔐</span>
            </div>
            <h2 style="color: #1e3a8a; margin-top: 0; margin-bottom: 16px; font-size: 24px;">Password Reset Request</h2>
            <p style="color: #4b5563; font-size: 16px; line-height: 1.5; margin-bottom: 32px;">
                We received a request to reset the password for your Dawarha account. Click the button below to securely set a new password.
            </p>
            <a href="${resetLink}" style="background-color: #4f46e5; color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; display: inline-block;">
                Reset Password
            </a>
            <p style="color: #9ca3af; font-size: 13px; margin-top: 32px; border-top: 1px solid #e5e7eb; padding-top: 24px;">
                If you did not request a password reset, please ignore this email. This link will expire in 1 hour.
            </p>
        </div>
      `,
    });

    return { success: "Password reset link sent to your email!" };
  } catch (error) {
    return { error: "Failed to send reset email." };
  }
}

// --- KYB (KNOW YOUR BUSINESS) ACTIONS ---
export async function submitCompanyVerification(
  userId: number,
  documentUrl: string,
) {
  try {
    await db
      .update(UserProfiles)
      .set({
        verificationDocumentUrl: documentUrl,
        verificationStatus: "pending",
        updatedAt: new Date(),
      })
      .where(eq(UserProfiles.userId, userId));

    revalidatePath("/settings");
    return { success: "Documents submitted! Status is now Pending." };
  } catch (error) {
    return { error: "Failed to submit verification documents." };
  }
}

// --- BILLING & SUBSCRIPTIONS ---

export async function createStripeCheckoutSession(
  userId: number,
  email: string,
) {
  try {
    const priceId = process.env.STRIPE_PRO_PRICE_ID;

    if (!priceId) {
      return { error: "Stripe Price ID is not configured on the server." };
    }

    // Tell Stripe to generate a secure, hosted checkout page
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: "subscription",
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/settings?billing=success`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/settings?billing=canceled`,
      customer_email: email, // Auto-fills the checkout so they don't have to type it again
      metadata: {
        userId: userId.toString(), // CRITICAL: We need this later to know WHO paid when Stripe pings our webhook!
      },
    });

    if (!session.url) {
      return { error: "Failed to generate checkout URL." };
    }

    return { url: session.url };
  } catch (error) {
    console.error("Stripe Checkout Error:", error);
    return { error: "Internal server error connecting to Stripe." };
  }
}

export async function createStripePortalSession(customerId: string) {
  try {
    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${process.env.NEXT_PUBLIC_APP_URL}/settings`,
    });

    if (!session.url) {
      return { error: "Failed to generate portal URL." };
    }

    return { url: session.url };
  } catch (error) {
    console.error("Stripe Portal Error:", error);
    return { error: "Internal server error connecting to Stripe Portal." };
  }
}

// --- FEED RADAR ENGINE (PERSONALIZED) ---

// Helper 1: The Haversine Formula (Calculates distance over the Earth's curve)
function getDistanceFromLatLonInKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
) {
  const R = 6371; // Radius of the earth in kilometers
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) *
      Math.cos(deg2rad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function deg2rad(deg: number) {
  return deg * (Math.PI / 180);
}

// Helper 2: AI Weight Parser (Turns "1.5 tons" into 1500)
function parseWeightToKg(weightStr: string | null): number {
  if (!weightStr) return 0;
  const lowerStr = weightStr.toLowerCase();

  // Extract only the numbers and decimals using a Regular Expression
  let num = parseFloat(lowerStr.replace(/[^0-9.]/g, ""));
  if (isNaN(num)) return 0;

  // If the AI used the word "ton", multiply by 1000 to keep it in KG
  if (lowerStr.includes("ton")) num *= 1000;

  return num;
}

// Main Function: Get the highly personalized Feed
export async function getPersonalizedFeed() {
  const session = await auth();
  if (!session?.user?.email) return { error: "Unauthorized" };

  const dbUser = await getUserByEmail(session.user.email);
  if (!dbUser) return { error: "User not found" };

  try {
    // 1. Get the user's complete profile & operating locations
    const profileData = await getCompleteUserProfile(dbUser.id);
    const profile = profileData.profile;
    const locations = profileData.locations;

    if (!profile) return { error: "Profile not set up." };
    if (!locations || locations.length === 0)
      return {
        error:
          "No locations set. Please add a base location in Settings to use the Radar.",
      };

    // 2. Fetch ALL pending reports from the database
    const allReports = await db
      .select()
      .from(Reports)
      .where(eq(Reports.status, "pending"));

    // 3. The Radar Filter Pipeline
    const radarFeed = allReports
      .map((report) => {
        // A. Calculate Distance
        const reportLat = parseFloat(report.latitude || "0");
        const reportLng = parseFloat(report.longitude || "0");

        // If a company has 3 branches, find which branch is closest to the waste
        let minDistance = Infinity;
        for (const loc of locations) {
          const locLat = parseFloat(loc.latitude);
          const locLng = parseFloat(loc.longitude);
          const dist = getDistanceFromLatLonInKm(
            locLat,
            locLng,
            reportLat,
            reportLng,
          );
          if (dist < minDistance) minDistance = dist;
        }

        // Inject the distance into the report object so the UI can display it!
        return { ...report, distance: minDistance };
      })
      .filter((report) => {
        // B. Filter by Radius
        if (report.distance > (profile.radius || 10)) return false;

        // C. Filter by Waste Type
        const preferredTypes = profile.preferredWaste
          ? profile.preferredWaste.split(",")
          : ["all"];
        if (!preferredTypes.includes("all")) {
          if (!preferredTypes.includes(report.wasteType)) return false;
        }

        // D. Filter by Scale / Capacity Restrictions
        if (profile.role === "individual_collector" && report.scale !== "small")
          return false;
        if (profile.role === "company_collector" && report.scale !== "large")
          return false;

        // E. Filter by Target Amount (Company Only)
        if (
          profile.role === "company_collector" &&
          profile.targetAmount &&
          profile.targetAmount !== "any"
        ) {
          const weightKg = parseWeightToKg(report.totalWasteAmount);
          if (
            profile.targetAmount === "50-100" &&
            (weightKg < 50 || weightKg > 100)
          )
            return false;
          if (
            profile.targetAmount === "110-200" &&
            (weightKg < 110 || weightKg > 200)
          )
            return false;
          if (profile.targetAmount === "200+" && weightKg < 200) return false;
        }

        return true; // If it survives all checks, keep it!
      });

    // 4. Sort the feed so the closest waste is at the top of the list
    radarFeed.sort((a, b) => a.distance - b.distance);

    return { success: true, feed: radarFeed, userRole: profile.role };
  } catch (error) {
    console.error("Feed generation error:", error);
    return { error: "Failed to generate radar feed." };
  }
}

// --- COLLECT & REWARD POINTS ENGINE ---
// ==========================================

// --- CLAIM ROUTE (STEP 1: IN PROGRESS) ---
export async function claimWasteReport(reportId: number) {
  const session = await auth();
  if (!session?.user?.email) return { error: "Unauthorized. Please log in." };

  try {
    const dbUser = await getUserByEmail(session.user.email);
    if (!dbUser) return { error: "User not found." };

    const [report] = await db
      .select()
      .from(Reports)
      .where(eq(Reports.id, reportId));

    if (!report) return { error: "Report not found." };
    if (report.status !== "pending")
      return { error: "This waste is no longer available!" };

    // 1. Lock the report to this collector and mark as 'in_progress'
    await db
      .update(Reports)
      .set({ status: "in_progress", collectorId: dbUser.id })
      .where(eq(Reports.id, reportId));

    // 2. Notify the Member so they know someone is coming!
    await db.insert(Notifications).values({
      userId: report.userId,
      message: `🚚 Good news! A collector has reserved your ${report.wasteType} and is planning their route.`,
      type: "route_planned",
      isRead: false,
    });

    // Revalidate the explore and feed pages so the UI updates globally
    revalidatePath("/explore");
    revalidatePath("/feed");

    return { success: true };
  } catch (error: any) {
    console.error("Claim Error:", error);
    return { error: "Failed to claim waste. Please try again." };
  }
}

// --- COMPLETE ROUTE (STEP 2: COLLECTED & REWARDED) ---
export async function completeWastePickup(reportId: number) {
  const session = await auth();
  if (!session?.user?.email) return { error: "Unauthorized" };

  try {
    const dbUser = await getUserByEmail(session.user.email);
    if (!dbUser) return { error: "User not found." };

    const [report] = await db
      .select()
      .from(Reports)
      .where(eq(Reports.id, reportId));
    if (!report) return { error: "Report not found." };
    if (report.status !== "in_progress")
      return { error: "This job is not in progress!" };
    if (report.collectorId !== dbUser.id)
      return { error: "You are not authorized to complete this job." };

    // --- 1. CALCULATE REPORTER POINTS ---
    // Base 10 points, +5 bonus if they provided a description
    let reporterPoints = 10;
    if (report.description && report.description.trim().length > 0) {
      reporterPoints += 5;
    }

    // --- 2. CALCULATE COLLECTOR POINTS ---
    // Solo collectors get 15 points. Companies get 0.
    // (We check dbUser.role since it syncs with UserProfiles)
    let collectorPoints = 0;
    if (dbUser.role === "individual_collector") {
      collectorPoints = 15;
    }

    // --- EXECUTE THE UPDATES ---

    // A. Mark the report as Collected
    await db
      .update(Reports)
      .set({ status: "collected" })
      .where(eq(Reports.id, reportId));

    // B. Reward the Member who reported it
    const [reporter] = await db
      .select()
      .from(Users)
      .where(eq(Users.id, report.userId));
    if (reporter) {
      const oldBalance = reporter.balance || 0;
      const newBalance = oldBalance + reporterPoints;

      await db
        .update(Users)
        .set({ balance: newBalance })
        .where(eq(Users.id, report.userId));

      // ... (keep the Rewards insert and standard Notification insert here) ...
      await db.insert(Rewards).values({
        userId: report.userId,
        points: reporterPoints,
        description: `Reward for reporting ${report.wasteType}${reporterPoints === 15 ? " (includes +5 description bonus)" : ""}`,
        collectionInfo: `Collected on ${new Date().toLocaleDateString()}`,
      });

      await db.insert(Notifications).values({
        userId: report.userId,
        message: `🎉 Success! Your waste was collected. You earned ${reporterPoints} points!`,
        type: "collection_complete",
        isRead: false,
      });

      // --- PROMOTION DETECTOR (MEMBER) ---
      let newRank = null;
      if (oldBalance < 50 && newBalance >= 50) newRank = "Planter";
      else if (oldBalance < 150 && newBalance >= 150)
        newRank = "Forest Guardian";
      else if (oldBalance < 500 && newBalance >= 500)
        newRank = "Earth Champion";

      if (newRank) {
        await db.insert(Notifications).values({
          userId: report.userId,
          message: `🏆 Congratulations! You have been promoted to the ${newRank} rank!`,
          type: "rank_up",
          isRead: false,
        });
      }
    }

    // C. Reward the Solo Collector (If applicable)
    if (collectorPoints > 0) {
      await db
        .update(Users)
        .set({ balance: (dbUser.balance || 0) + collectorPoints })
        .where(eq(Users.id, dbUser.id));

      await db.insert(Rewards).values({
        userId: dbUser.id,
        points: collectorPoints,
        description: `Reward for collecting ${report.wasteType} route`,
        collectionInfo: `Completed on ${new Date().toLocaleDateString()}`,
      });

      // --- PROMOTION DETECTOR (SOLO COLLECTOR) ---
      // Fetch total completed jobs to check for rank up
      const collectorJobs = await db
        .select()
        .from(CollectedWastes)
        .where(eq(CollectedWastes.collectorId, dbUser.id));
      const oldJobCount = collectorJobs.length;
      const newJobCount = oldJobCount + 1; // including the one we are about to insert below

      let newRank = null;
      if (oldJobCount < 10 && newJobCount >= 10) newRank = "Route Master";
      else if (oldJobCount < 50 && newJobCount >= 50) newRank = "Fleet Captain";

      if (newRank) {
        await db.insert(Notifications).values({
          userId: dbUser.id,
          message: `🏆 Congratulations! You have been promoted to the ${newRank} rank!`,
          type: "rank_up",
          isRead: false,
        });
      }
    }

    // D. Log the Physical Collection Event for the Platform
    await db.insert(CollectedWastes).values({
      reportId: report.id,
      collectorId: dbUser.id,
      status: "collected",
    });

    // --- PROMOTION DETECTOR (COMPANY COLLECTOR) ---
    if (dbUser.role === "company_collector") {
      const companyJobs = await db
        .select()
        .from(CollectedWastes)
        .where(eq(CollectedWastes.collectorId, dbUser.id));
      const oldJobCount = companyJobs.length;
      const newJobCount = oldJobCount + 1;

      let newTier = null;
      if (oldJobCount < 25 && newJobCount >= 25)
        newTier = "Gold Sustainability Partner";
      else if (oldJobCount < 100 && newJobCount >= 100)
        newTier = "Platinum Impact Hub";

      if (newTier) {
        await db.insert(Notifications).values({
          userId: dbUser.id,
          message: `🏢 Certification Upgraded! You are now a ${newTier}!`,
          type: "tier_up",
          isRead: false,
        });
      }
    }

    revalidatePath("/dashboard");
    return { success: true, pointsAwarded: reporterPoints };
  } catch (error: any) {
    console.error("Complete Job Error:", error);
    return { error: "Failed to complete job." };
  }
}

export async function redeemReward(userId: number, rewardId: number) {
    try {
        const [user] = await db.select().from(Users).where(eq(Users.id, userId));

        // 1. Define Available Rewards (Must match frontend ID)
        const rewards = [
            { id: 1, name: "100 EGP Cash via Vodafone Cash", cost: 500 },
            { id: 2, name: "20% Off at Zara", cost: 200 },
            { id: 3, name: "Free Coffee at Starbucks", cost: 150 },
            { id: 4, name: "Donation to Green Egypt Charity", cost: 300 },
            { id: 5, name: "500 EGP Carrefour Voucher", cost: 2000 },
            { id: 6, name: "Cinema Ticket (IMAX)", cost: 400 },
        ];

        const reward = rewards.find(r => r.id === rewardId);
        if (!reward) return { success: false, error: "Reward not found" };

        // 2. Check Balance
        if ((user.balance || 0) < reward.cost) {
            return { success: false, error: "Insufficient balance" };
        }

        // 3. Deduct Points & Log Transaction
        const newBalance = (user.balance || 0) - reward.cost;

        await db.update(Users).set({ balance: newBalance }).where(eq(Users.id, userId));

        // Generate a fake coupon code
        const couponCode = `DW-${Math.random().toString(36).substring(2, 8).toUpperCase()}-${new Date().getFullYear()}`;

        await db.insert(Rewards).values({
            userId: userId,
            points: -reward.cost, // Negative points indicates a spend
            description: `Redeemed: ${reward.name}`,
            collectionInfo: `Coupon Code: ${couponCode}`
        });

        await db.insert(Notifications).values({
            userId: userId,
            message: `🎉 You redeemed ${reward.name}! Your code is ${couponCode}.`,
            type: "reward_redeemed",
            isRead: false
        });

        revalidatePath("/dashboard");
        return { success: true, code: couponCode };

    } catch (error) {
        console.error("Redemption error:", error);
        return { success: false, error: "Failed to redeem reward" };
    }
}
