
import { db } from '../db';
import { groceryItemsTable } from '../db/schema';
import { type NestedGroceryItem } from '../schema';
import { asc, isNull } from 'drizzle-orm';

export const getGroceryItems = async (): Promise<NestedGroceryItem[]> => {
  try {
    // Get all grocery items ordered by sort_order
    const allItems = await db.select()
      .from(groceryItemsTable)
      .orderBy(asc(groceryItemsTable.sort_order))
      .execute();

    // Convert numeric fields and create a map for efficient lookups
    const itemsMap = new Map<number, NestedGroceryItem>();
    const convertedItems = allItems.map(item => ({
      ...item,
      quantity: item.quantity ? parseFloat(item.quantity) : null,
      children: [] as NestedGroceryItem[]
    }));

    // Build the map
    convertedItems.forEach(item => {
      itemsMap.set(item.id, item);
    });

    // Build the nested structure
    const rootItems: NestedGroceryItem[] = [];
    
    convertedItems.forEach(item => {
      if (item.parent_id === null) {
        // Root level item
        rootItems.push(item);
      } else {
        // Child item - add to parent's children array
        const parent = itemsMap.get(item.parent_id);
        if (parent) {
          parent.children!.push(item);
        }
      }
    });

    return rootItems;
  } catch (error) {
    console.error('Failed to get grocery items:', error);
    throw error;
  }
};
