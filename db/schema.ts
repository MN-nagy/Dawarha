import {
  pgTable,
  serial,
  text,
  varchar,
  integer,
  timestamp,
  boolean,
  jsonb,
} from "drizzle-orm/pg-core";

// --- USERS TABLE ---
export const Users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  password: varchar("password", { length: 255 }).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  role: varchar("role", { length: 50 }).notNull().default("member"),
  balance: integer("balance").default(0).notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// --- REPORTS TABLE (core func) ---
export const Reports = pgTable("reports", {
  id: serial("id").notNull().primaryKey(),
  userId: integer("user_id")
    .references(() => Users.id)
    .notNull(),
  location: text("location"),
  wasteType: varchar("waste_type", { length: 255 }).notNull(),
  amount: varchar("amount", { length: 255 }).notNull(),
  description: text("description"),
  scale: text("scale"),
  additionalWaste: text("additional_waste"),
  totalWasteAmount: text("total_waste_amount"), //TODO: add .notNull() after cleaning up the database
  latitude: text("latitude"),
  longitude: text("longitude"),
  imageUrl: text("image_url"),
  verificationResult: jsonb("verification_result"),
  status: varchar("status", { length: 255 }).notNull().default("pending"),
  collectorId: integer("collector_id").references(() => Users.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// --- REWARDS TABLE (Transactions) ---
export const Rewards = pgTable("rewards", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .references(() => Users.id)
    .notNull(),
  points: integer("points").notNull(),
  description: text("description").notNull(),
  collectionInfo: text("collection_info").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// --- COLLECTED WASTE table (traking collections) ---
export const CollectedWastes = pgTable("collected_wastes", {
  id: serial("id").primaryKey(),
  reportId: integer("report_id")
    .references(() => Reports.id)
    .notNull(),
  collectorId: integer("collector_id")
    .references(() => Users.id)
    .notNull(),
  collectionDate: timestamp("collection_date").defaultNow().notNull(),
  status: varchar("status", { length: 20 }).notNull().default("collected"),
});

// --- NOTIFICATIONS TABLE (real-time updates) ---
export const Notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .references(() => Users.id)
    .notNull(),
  message: text("message").notNull(),
  type: varchar("type", { length: 50 }).notNull(),
  isRead: boolean("is_read").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// --- THE USER PROFILE TABLE (for updating user info) (1-to-1 with Users table) ---
export const UserProfiles = pgTable("user_profiles", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .references(() => Users.id)
    .notNull()
    .unique(),

  // Base Identity
  role: text("role").notNull().default("member"), // 'member', 'solo_collector', 'company_collector'

  // Collector Logistics
  preferredWaste: text("preferred_waste").default("all"), // 'plastic', 'metal', etc.
  capacity: text("capacity").default("all"), // 'small_under_20', 'large_over_20', 'all'

  // Feed radar
  targetAmount: text("target_amount").default("any"), // "50-100", "110-200", "any"
  radius: integer("radius").default(10), // search radius in km

  // Company Specifics
  companyType: text("company_type"), // 'for-profit', 'non-profit'
  // Value Exchange (Monetization Model)
  contributionModel: varchar("contribution_model", { length: 50 }).default(
    "subscription",
  ), // 'subscription' or 'reward_partner'
  slaDocumentUrl: text("sla_document_url"), // URL for the signed SLA (URL from UploadThing)

  verificationStatus: varchar("verification_status", { length: 50 })
    .notNull()
    .default("unverified"), // 'unverified', 'pending', 'verified', 'rejected'
  verificationDocumentUrl: text("verification_document_url"), // URL from UploadThing

  // strip config
  stripeCustomerId: varchar("stripe_customer_id", { length: 255 }).unique(),
  stripeSubscriptionId: varchar("stripe_subscription_id", {
    length: 255,
  }).unique(),
  stripePriceId: varchar("stripe_price_id", { length: 255 }),
  stripeCurrentPeriodEnd: timestamp("stripe_current_period_end"),

  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// --- THE COMPANY LOCATIONS TABLE (1-to-Many with UserProfiles) ---
export const CompanyLocations = pgTable("company_locations", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .references(() => Users.id)
    .notNull(), // This links back to the user

  // The exact same structure we used for the Reports location
  address: text("address").notNull(),
  latitude: text("latitude").notNull(),
  longitude: text("longitude").notNull(),

  createdAt: timestamp("created_at").defaultNow(),
});

// --- VERIFICATION TOKENS (For Email changes and Password resets) ---
export const VerificationTokens = pgTable("verification_tokens", {
  id: serial("id").primaryKey(),
  identifier: varchar("identifier", { length: 255 }).notNull(), // The user's email
  token: varchar("token", { length: 255 }).notNull().unique(), // The secure random string
  expires: timestamp("expires").notNull(), // When the link dies (e.g., 1 hour)
  type: varchar("type", { length: 50 }).notNull(), // 'email_change' or 'password_reset'
});
