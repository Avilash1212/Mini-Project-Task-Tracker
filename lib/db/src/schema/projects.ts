import { createInsertSchema } from "drizzle-zod";
import { date, integer, pgTable, text, timestamp, serial } from "drizzle-orm/pg-core";
import { z } from "zod/v4";

export const projectsTable = pgTable("projects", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull().default(""),
  scope: text("scope").notNull().default(""),
  startDate: date("start_date", { mode: "string" }),
  targetDate: date("target_date", { mode: "string" }),
  expectedOutcome: text("expected_outcome").notNull().default(""),
  category: text("category"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertProjectSchema = createInsertSchema(projectsTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertProject = z.infer<typeof insertProjectSchema>;
export type Project = typeof projectsTable.$inferSelect;