import {
  pgTable,
  pgEnum,
  uuid,
  varchar,
  text,
  integer,
  date,
  time,
  timestamp,
  boolean,
  numeric,
  uniqueIndex,
  primaryKey,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// ── Enums ──────────────────────────────────────────────

export const roleEnum = pgEnum("role", ["admin", "staff", "manager"]);
export const statusEnum = pgEnum("status", [
  "confirmed",
  "seated",
  "cancelled",
  "no_show",
]);

// ── Users ──────────────────────────────────────────────

export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  username: varchar("username", { length: 50 }).unique().notNull(),
  passwordHash: text("password_hash").notNull(),
  email: varchar("email", { length: 255 }).unique().notNull(),
  fullName: varchar("full_name", { length: 100 }).notNull(),
  role: roleEnum("role").default("staff").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  lastLogin: timestamp("last_login"),
});

// ── Customers ──────────────────────────────────────────

export const customers = pgTable("customers", {
  id: uuid("id").defaultRandom().primaryKey(),
  firstName: varchar("first_name", { length: 100 }).notNull(),
  lastName: varchar("last_name", { length: 100 }).notNull(),
  phone: varchar("phone", { length: 20 }).unique().notNull(),
  email: varchar("email", { length: 255 }),
  totalVisits: integer("total_visits").default(1).notNull(),
  totalSpent: numeric("total_spent", { precision: 10, scale: 2 }).default("0"),
  dietaryNotes: text("dietary_notes"),
  birthday: date("birthday"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  lastVisit: timestamp("last_visit"),
  optInMarketing: boolean("opt_in_marketing").default(false).notNull(),
});

// ── Reservations ───────────────────────────────────────

export const reservations = pgTable(
  "reservations",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    customerId: uuid("customer_id")
      .references(() => customers.id, { onDelete: "cascade" })
      .notNull(),
    partySize: integer("party_size").notNull(),
    reservationDate: date("reservation_date").notNull(),
    reservationTime: time("reservation_time").notNull(),
    employeeId: uuid("employee_id")
      .references(() => users.id)
      .notNull(),
    status: statusEnum("status").default("confirmed").notNull(),
    specialRequests: text("special_requests"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    uniqueBooking: uniqueIndex("unique_booking").on(
      table.reservationDate,
      table.reservationTime,
      table.partySize
    ),
  })
);

// ── Campaigns ──────────────────────────────────────────

export const campaigns = pgTable("campaigns", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: varchar("name", { length: 200 }).notNull(),
  description: text("description"),
  startDate: date("start_date").notNull(),
  endDate: date("end_date").notNull(),
  discountPercent: integer("discount_percent"),
  isActive: boolean("is_active").default(true).notNull(),
});

// ── Customer-Campaigns (junction) ──────────────────────

export const customerCampaigns = pgTable(
  "customer_campaigns",
  {
    customerId: uuid("customer_id")
      .references(() => customers.id, { onDelete: "cascade" })
      .notNull(),
    campaignId: uuid("campaign_id")
      .references(() => campaigns.id, { onDelete: "cascade" })
      .notNull(),
    redeemed: boolean("redeemed").default(false).notNull(),
    redeemedAt: timestamp("redeemed_at"),
  },
  (table) => ({ pk: primaryKey({ columns: [table.customerId, table.campaignId] }) })
);

// ── Relations ──────────────────────────────────────────

export const reservationsRelations = relations(reservations, ({ one }) => ({
  customer: one(customers, {
    fields: [reservations.customerId],
    references: [customers.id],
  }),
  employee: one(users, {
    fields: [reservations.employeeId],
    references: [users.id],
  }),
}));

export const customersRelations = relations(customers, ({ many }) => ({
  reservations: many(reservations),
  campaigns: many(customerCampaigns),
}));

export const usersRelations = relations(users, ({ many }) => ({
  reservations: many(reservations),
}));

export const campaignsRelations = relations(campaigns, ({ many }) => ({
  customerCampaigns: many(customerCampaigns),
}));

export const customerCampaignsRelations = relations(
  customerCampaigns,
  ({ one }) => ({
    customer: one(customers, {
      fields: [customerCampaigns.customerId],
      references: [customers.id],
    }),
    campaign: one(campaigns, {
      fields: [customerCampaigns.campaignId],
      references: [campaigns.id],
    }),
  })
);
