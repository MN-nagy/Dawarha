"use server";

import { desc, eq } from "drizzle-orm";
import { db } from "@/db/index";
import { Users, Reports } from "@/db/schema";
import { signIn, signOut, auth } from "@/auth";
import bcrypt from "bcryptjs";
import { AuthError } from "next-auth";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { generateText, Output } from "ai";
import { google } from "@ai-sdk/google";
import { z } from "zod";

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

    const wasteType = formData.get("wasteType") as string;
    const amount = formData.get("amount") as string;
    const location = formData.get("location") as string;
    const imageUrl = formData.get("imageUrl") as string;
    const description = formData.get("description") as string;
    const additionalWaste = formData.get("additionalWaste") as string;
    const scale = formData.get("scale") as string;
    const latitude = formData.get("latitude") as string;
    const longitude = formData.get("longitude") as string;

    if (!wasteType || !amount || !location || !imageUrl || !scale) {
      return { error: "Please fill in all fields." };
    }

    await db.insert(Reports).values({
      userId: dbUser.id,
      wasteType,
      amount,
      location,
      imageUrl,
      description,
      additionalWaste,
      scale,
      latitude,
      longitude,
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
            .describe("Estimate the amount of ONLY the dominant material."),
          additionalWaste: z
            .string()
            .describe(
              "List any OTHER visible waste types and their estimated amounts (e.g., '3kg organic, 1kg metal'). If none, return an empty string.",
            ),
          scale: z.enum(["small", "large"]).describe("If the total waste is easily carried by one person or fits in a car trunk (< 20kg), choose 'small'. If it requires a truck or commercial vehicle (> 20kg), choose 'large'."),
          additionalWaste: z.string().describe("Mandatory. List OTHER visible waste types. If absolutely no other waste is present, explicitly repeat the dominant waste type and amount (e.g., 'Only 20kg plastic present')."),
        }),
      }),
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `Analyze this image of waste. Hint: "${userDescription}". 
                 1. Determine the single DOMINANT material and categorize it strictly.
                 2. Estimate the amount of that dominant material.
                 3. Identify any OTHER secondary waste types in the image and estimate their amounts.
                4. categorize as either small or large.`,
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
    const reports = db
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
