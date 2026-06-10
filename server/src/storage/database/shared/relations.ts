import { relations } from "drizzle-orm/relations";
import { users, dietRecords, dailyStats, userFoods } from "./schema";

export const dietRecordsRelations = relations(dietRecords, ({one}) => ({
	user: one(users, {
		fields: [dietRecords.userId],
		references: [users.id]
	}),
}));

export const usersRelations = relations(users, ({many}) => ({
	dietRecords: many(dietRecords),
	dailyStats: many(dailyStats),
	userFoods: many(userFoods),
}));

export const dailyStatsRelations = relations(dailyStats, ({one}) => ({
	user: one(users, {
		fields: [dailyStats.userId],
		references: [users.id]
	}),
}));

export const userFoodsRelations = relations(userFoods, ({one}) => ({
	user: one(users, {
		fields: [userFoods.userId],
		references: [users.id]
	}),
}));