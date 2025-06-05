
import { db } from '../db';
import { groceryItemsTable } from '../db/schema';
import { type DeleteGroceryItemInput } from '../schema';
import { eq } from 'drizzle-orm';

export const deleteGroceryItem = async (input: DeleteGroceryItemInput): Promise<{ success: boolean }> => {
  try {
    // Delete the grocery item by ID
    const result = await db.delete(groceryItemsTable)
      .where(eq(groceryItemsTable.id, input.id))
      .execute();

    // Return success status based on whether any rows were affected
    // Handle case where rowCount might be null
    return { success: (result.rowCount ?? 0) > 0 };
  } catch (error) {
    console.error('Grocery item deletion failed:', error);
    throw error;
  }
};
