
import { db } from '../db';
import { groceryItemsTable } from '../db/schema';
import { type MoveGroceryItemInput, type GroceryItem } from '../schema';
import { eq } from 'drizzle-orm';

export const moveGroceryItem = async (input: MoveGroceryItemInput): Promise<GroceryItem> => {
  try {
    // Update the grocery item with new parent_id and sort_order
    const result = await db.update(groceryItemsTable)
      .set({
        parent_id: input.parent_id,
        sort_order: input.sort_order,
        updated_at: new Date()
      })
      .where(eq(groceryItemsTable.id, input.id))
      .returning()
      .execute();

    if (result.length === 0) {
      throw new Error(`Grocery item with id ${input.id} not found`);
    }

    // Convert numeric fields back to numbers before returning
    const item = result[0];
    return {
      ...item,
      quantity: item.quantity ? parseFloat(item.quantity) : null
    };
  } catch (error) {
    console.error('Move grocery item failed:', error);
    throw error;
  }
};
