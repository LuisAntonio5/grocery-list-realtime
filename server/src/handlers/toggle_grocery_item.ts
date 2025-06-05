
import { db } from '../db';
import { groceryItemsTable } from '../db/schema';
import { type ToggleGroceryItemInput, type GroceryItem } from '../schema';
import { eq } from 'drizzle-orm';

export const toggleGroceryItem = async (input: ToggleGroceryItemInput): Promise<GroceryItem> => {
  try {
    // Update the item's checked status and updated_at timestamp
    const result = await db.update(groceryItemsTable)
      .set({
        is_checked: input.is_checked,
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
    console.error('Toggle grocery item failed:', error);
    throw error;
  }
};
