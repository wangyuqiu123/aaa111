import { pgTable, index, foreignKey, serial, integer, varchar, real, date, timestamp, text, unique } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"



export const dietRecords = pgTable("diet_records", {
	id: serial().primaryKey().notNull(),
	userId: integer("user_id").notNull(),
	foodName: varchar("food_name", { length: 200 }).notNull(),
	calorie: real().default(0).notNull(),
	carb: real().default(0),
	protein: real().default(0),
	fat: real().default(0),
	sodium: real().default(0),
	servingAmount: real("serving_amount").default(1),
	servingUnit: varchar("serving_unit", { length: 20 }).default('份'),
	mealType: varchar("meal_type", { length: 20 }).default('breakfast').notNull(),
	recordDate: date("record_date").notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("diet_records_meal_type_idx").using("btree", table.mealType.asc().nullsLast().op("text_ops")),
	index("diet_records_record_date_idx").using("btree", table.recordDate.asc().nullsLast().op("date_ops")),
	index("diet_records_user_date_idx").using("btree", table.userId.asc().nullsLast().op("int4_ops"), table.recordDate.asc().nullsLast().op("int4_ops")),
	index("diet_records_user_id_idx").using("btree", table.userId.asc().nullsLast().op("int4_ops")),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "diet_records_user_id_users_id_fk"
		}).onDelete("cascade"),
]);

export const healthCheck = pgTable("health_check", {
	id: serial().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
});

export const foodDatabase = pgTable("food_database", {
	id: serial().primaryKey().notNull(),
	name: varchar({ length: 200 }).notNull(),
	calorie: real().default(0).notNull(),
	carb: real().default(0),
	protein: real().default(0),
	fat: real().default(0),
	sodium: real().default(0),
	servingAmount: real("serving_amount").default(100),
	servingUnit: varchar("serving_unit", { length: 20 }).default('g'),
	category: varchar({ length: 50 }),
	imageUrl: text("image_url"),
}, (table) => [
	index("food_database_category_idx").using("btree", table.category.asc().nullsLast().op("text_ops")),
	index("food_database_name_idx").using("btree", table.name.asc().nullsLast().op("text_ops")),
]);

export const dailyStats = pgTable("daily_stats", {
	id: serial().primaryKey().notNull(),
	userId: integer("user_id").notNull(),
	statDate: date("stat_date").notNull(),
	totalCalorie: real("total_calorie").default(0),
	totalCarb: real("total_carb").default(0),
	totalProtein: real("total_protein").default(0),
	totalFat: real("total_fat").default(0),
	goalAchieved: integer("goal_achieved").default(0),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("daily_stats_stat_date_idx").using("btree", table.statDate.asc().nullsLast().op("date_ops")),
	index("daily_stats_user_date_idx").using("btree", table.userId.asc().nullsLast().op("int4_ops"), table.statDate.asc().nullsLast().op("date_ops")),
	index("daily_stats_user_id_idx").using("btree", table.userId.asc().nullsLast().op("int4_ops")),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "daily_stats_user_id_users_id_fk"
		}).onDelete("cascade"),
]);

export const userFoods = pgTable("user_foods", {
	id: serial().primaryKey().notNull(),
	userId: integer("user_id").notNull(),
	name: varchar({ length: 200 }).notNull(),
	category: varchar({ length: 30 }).default('代餐类'),
	calorie: real().default(0).notNull(),
	carb: real().default(0),
	protein: real().default(0),
	fat: real().default(0),
	servingAmount: real("serving_amount").default(100),
	servingUnit: varchar("serving_unit", { length: 20 }).default('g'),
	imageUrl: text("image_url"),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("user_foods_name_idx").using("btree", table.name.asc().nullsLast().op("text_ops")),
	index("user_foods_user_id_idx").using("btree", table.userId.asc().nullsLast().op("int4_ops")),
	index("user_foods_category_idx").using("btree", table.category.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "user_foods_user_id_users_id_fk"
		}).onDelete("cascade"),
]);

export const users = pgTable("users", {
	id: serial().primaryKey().notNull(),
	deviceId: varchar("device_id", { length: 128 }).notNull(),
	authId: varchar("auth_id", { length: 128 }),
	email: varchar({ length: 255 }),
	username: varchar({ length: 100 }),
	dailyCalorieGoal: real("daily_calorie_goal").default(1800).notNull(),
	dailyCarbGoal: real("daily_carb_goal").default(150),
	dailyProteinGoal: real("daily_protein_goal").default(60),
	dailyFatGoal: real("daily_fat_goal").default(50),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("users_device_id_idx").using("btree", table.deviceId.asc().nullsLast().op("text_ops")),
	unique("users_device_id_unique").on(table.deviceId),
	index("users_auth_id_idx").using("btree", table.authId.asc().nullsLast().op("text_ops")),
	unique("users_auth_id_unique").on(table.authId),
]);