
import { db } from '../db';
import { groceryItemsTable } from '../db/schema';
import { type GroceryItem } from '../schema';
import { eq } from 'drizzle-orm';

export const getGroceryItem = async (id: number): Promise<GroceryItem | null> => {
  try {
    const results = await db.select()
      .from(groceryItemsTable)
      .where(eq(groceryItemsTable.id, id))
      .execute();

    if (results.length === 0) {
      return null;
    }

    const item = results[0];
    return {
      ...item,
      quantity: item.quantity ? parseFloat(item.quantity) : null // Convert numeric field
    };
  } catch (error) {
    console.error('Failed to get grocery item:', error);
    throw error;
  }
};
