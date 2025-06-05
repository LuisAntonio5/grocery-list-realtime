
import { z } from 'zod';

// Grocery item schema
export const groceryItemSchema = z.object({
  id: z.number(),
  title: z.string(),
  description: z.string().nullable(),
  quantity: z.number().nullable(),
  unit: z.string().nullable(),
  is_checked: z.boolean(),
  is_category: z.boolean(),
  parent_id: z.number().nullable(),
  sort_order: z.number(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type GroceryItem = z.infer<typeof groceryItemSchema>;

// Input schema for creating grocery items
export const createGroceryItemInputSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().nullable().optional(),
  quantity: z.number().positive().nullable().optional(),
  unit: z.string().nullable().optional(),
  is_category: z.boolean().default(false),
  parent_id: z.number().nullable().optional(),
  sort_order: z.number().default(0)
});

export type CreateGroceryItemInput = z.infer<typeof createGroceryItemInputSchema>;

// Input schema for updating grocery items
export const updateGroceryItemInputSchema = z.object({
  id: z.number(),
  title: z.string().min(1).optional(),
  description: z.string().nullable().optional(),
  quantity: z.number().positive().nullable().optional(),
  unit: z.string().nullable().optional(),
  is_checked: z.boolean().optional(),
  is_category: z.boolean().optional(),
  parent_id: z.number().nullable().optional(),
  sort_order: z.number().optional()
});

export type UpdateGroceryItemInput = z.infer<typeof updateGroceryItemInputSchema>;

// Input schema for deleting grocery items
export const deleteGroceryItemInputSchema = z.object({
  id: z.number()
});

export type DeleteGroceryItemInput = z.infer<typeof deleteGroceryItemInputSchema>;

// Input schema for moving items (reordering)
export const moveGroceryItemInputSchema = z.object({
  id: z.number(),
  parent_id: z.number().nullable(),
  sort_order: z.number()
});

export type MoveGroceryItemInput = z.infer<typeof moveGroceryItemInputSchema>;

// Input schema for toggling checked status
export const toggleGroceryItemInputSchema = z.object({
  id: z.number(),
  is_checked: z.boolean()
});

export type ToggleGroceryItemInput = z.infer<typeof toggleGroceryItemInputSchema>;

// Define the nested grocery item type using recursive definition
export type NestedGroceryItem = {
  id: number;
  title: string;
  description: string | null;
  quantity: number | null;
  unit: string | null;
  is_checked: boolean;
  is_category: boolean;
  parent_id: number | null;
  sort_order: number;
  created_at: Date;
  updated_at: Date;
  children?: NestedGroceryItem[];
};

// Schema for nested grocery items (with children) - defined after the type
export const nestedGroceryItemSchema: z.ZodType<NestedGroceryItem> = z.object({
  id: z.number(),
  title: z.string(),
  description: z.string().nullable(),
  quantity: z.number().nullable(),
  unit: z.string().nullable(),
  is_checked: z.boolean(),
  is_category: z.boolean(),
  parent_id: z.number().nullable(),
  sort_order: z.number(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date(),
  children: z.array(z.lazy(() => nestedGroceryItemSchema)).optional()
});
