
import { serial, text, pgTable, timestamp, numeric, integer, boolean } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

export const groceryItemsTable = pgTable('grocery_items', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  description: text('description'),
  quantity: numeric('quantity', { precision: 10, scale: 2 }),
  unit: text('unit'),
  is_checked: boolean('is_checked').notNull().default(false),
  is_category: boolean('is_category').notNull().default(false),
  parent_id: integer('parent_id'),
  sort_order: integer('sort_order').notNull().default(0),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

// Self-referencing relations for nested structure
export const groceryItemsRelations = relations(groceryItemsTable, ({ one, many }) => ({
  parent: one(groceryItemsTable, {
    fields: [groceryItemsTable.parent_id],
    references: [groceryItemsTable.id],
    relationName: 'parent_child'
  }),
  children: many(groceryItemsTable, {
    relationName: 'parent_child'
  })
}));

// TypeScript types for the table schema
export type GroceryItem = typeof groceryItemsTable.$inferSelect;
export type NewGroceryItem = typeof groceryItemsTable.$inferInsert;

// Export all tables for proper query building
export const tables = { groceryItems: groceryItemsTable };
