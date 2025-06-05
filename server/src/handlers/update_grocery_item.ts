
import { db } from '../db';
import { groceryItemsTable } from '../db/schema';
import { type UpdateGroceryItemInput, type GroceryItem } from '../schema';
import { eq } from 'drizzle-orm';

export const updateGroceryItem = async (input: UpdateGroceryItemInput): Promise<GroceryItem> => {
  try {
    // Build update object only with provided fields
    const updateData: any = {
      updated_at: new Date()
    };

    if (input.title !== undefined) {
      updateData.title = input.title;
    }
    if (input.description !== undefined) {
      updateData.description = input.description;
    }
    if (input.quantity !== undefined) {
      updateData.quantity = input.quantity ? input.quantity.toString() : null;
    }
    if (input.unit !== undefined) {
      updateData.unit = input.unit;
    }
    if (input.is_checked !== undefined) {
      updateData.is_checked = input.is_checked;
    }
    if (input.is_category !== undefined) {
      updateData.is_category = input.is_category;
    }
    if (input.parent_id !== undefined) {
      updateData.parent_id = input.parent_id;
    }
    if (input.sort_order !== undefined) {
      updateData.sort_order = input.sort_order;
    }

    // Update the grocery item
    const result = await db.update(groceryItemsTable)
      .set(updateData)
      .where(eq(groceryItemsTable.id, input.id))
      .returning()
      .execute();

    if (result.length === 0) {
      throw new Error(`Grocery item with id ${input.id} not found`);
    }

    // Convert numeric fields back to numbers before returning
    const groceryItem = result[0];
    return {
      ...groceryItem,
      quantity: groceryItem.quantity ? parseFloat(groceryItem.quantity) : null
    };
  } catch (error) {
    console.error('Grocery item update failed:', error);
    throw error;
  }
};
