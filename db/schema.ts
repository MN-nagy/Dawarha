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

// USERS TABLE
export const Users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  password: varchar("password", { length: 255 }).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  role: varchar("role", { length: 50 }).notNull().default("member"),
  balance: integer("balance").default(0).notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// REPORTS TABLE (core func)
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
  latitude: text("latitude"),
  longitude: text("longitude"),
  imageUrl: text("image_url"),
  verificationResult: jsonb("verification_result"),
  status: varchar("status", { length: 255 }).notNull().default("pending"),
  collectorId: integer("collector_id").references(() => Users.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// REWARDS TABLE (Transactions)
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

// COLLECTED WASTE table (traking collections)
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

// NOTIFICATIONS TABLE (real-time updates)
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

// --- THE USER PROFILE TABLE (1-to-1 with your main User table) ---
export const UserProfiles = pgTable("user_profiles", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .references(() => Users.id)
    .notNull()
    .unique(),

  // Base Identity
  role: text("role").notNull().default("member"), // 'member', 'individual_collector', 'company_collector'

  // Collector Logistics
  preferredWaste: text("preferred_waste").default("all"), // 'plastic', 'metal', etc.
  capacity: text("capacity").default("all"), // 'small_under_20', 'large_over_20', 'all'

  // Company Specifics
  companyType: text("company_type"), // 'for-profit', 'non-profit'

  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// --- THE COMPANY LOCATIONS TABLE (1-to-Many with UserProfiles) ---
export const CompanyLocations = pgTable("company_locations", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .references(() => Users.id)
    .notNull(), // This links back to the user

  // The exact same structure we used for the Reports!
  address: text("address").notNull(),
  latitude: text("latitude").notNull(),
  longitude: text("longitude").notNull(),

  createdAt: timestamp("created_at").defaultNow(),
});
