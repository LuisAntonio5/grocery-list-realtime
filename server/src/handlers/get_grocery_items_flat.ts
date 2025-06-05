
import { db } from '../db';
import { groceryItemsTable } from '../db/schema';
import { type GroceryItem } from '../schema';
import { asc } from 'drizzle-orm';

export const getGroceryItemsFlat = async (): Promise<GroceryItem[]> => {
  try {
    const results = await db.select()
      .from(groceryItemsTable)
      .orderBy(asc(groceryItemsTable.sort_order), asc(groceryItemsTable.id))
      .execute();

    // Convert numeric fields back to numbers
    return results.map(item => ({
      ...item,
      quantity: item.quantity ? parseFloat(item.quantity) : null
    }));
  } catch (error) {
    console.error('Failed to get grocery items:', error);
    throw error;
  }
};
