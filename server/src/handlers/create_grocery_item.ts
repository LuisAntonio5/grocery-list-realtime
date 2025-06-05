
import { db } from '../db';
import { groceryItemsTable } from '../db/schema';
import { type CreateGroceryItemInput, type GroceryItem } from '../schema';

export const createGroceryItem = async (input: CreateGroceryItemInput): Promise<GroceryItem> => {
  try {
    // Insert grocery item record
    const result = await db.insert(groceryItemsTable)
      .values({
        title: input.title,
        description: input.description,
        quantity: input.quantity ? input.quantity.toString() : null, // Convert number to string for numeric column
        unit: input.unit,
        is_category: input.is_category, // Default handled by Zod
        parent_id: input.parent_id,
        sort_order: input.sort_order // Default handled by Zod
      })
      .returning()
      .execute();

    // Convert numeric fields back to numbers before returning
    const groceryItem = result[0];
    return {
      ...groceryItem,
      quantity: groceryItem.quantity ? parseFloat(groceryItem.quantity) : null // Convert string back to number
    };
  } catch (error) {
    console.error('Grocery item creation failed:', error);
    throw error;
  }
};
