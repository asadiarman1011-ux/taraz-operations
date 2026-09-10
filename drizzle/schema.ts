import { double, int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export const customers = mysqlTable("customers", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 160 }).notNull(),
  phone: varchar("phone", { length: 40 }).notNull(),
  business: varchar("business", { length: 180 }).default("").notNull(),
  city: varchar("city", { length: 120 }).default("").notNull(),
  address: text("address").notNull(),
  lat: double("lat"),
  lng: double("lng"),
  status: mysqlEnum("status", ["ثابت", "غیر ثابت", "نیاز به پیگیری", "در حال پیگیری"]).default("غیر ثابت").notNull(),
  note: text("note"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const orders = mysqlTable("orders", {
  id: int("id").autoincrement().primaryKey(),
  customerId: int("customerId").notNull(),
  jalaliDate: varchar("jalaliDate", { length: 32 }).notNull(),
  address: text("address").notNull(),
  lat: double("lat"),
  lng: double("lng"),
  itemsJson: text("itemsJson").notNull(),
  total: int("total").default(0).notNull(),
  status: mysqlEnum("status", ["pending", "delivered"]).default("pending").notNull(),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type Customer = typeof customers.$inferSelect;
export type Order = typeof orders.$inferSelect;
