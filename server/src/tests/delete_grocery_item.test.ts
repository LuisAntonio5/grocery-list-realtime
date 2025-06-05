
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { groceryItemsTable } from '../db/schema';
import { type DeleteGroceryItemInput, type CreateGroceryItemInput } from '../schema';
import { deleteGroceryItem } from '../handlers/delete_grocery_item';
import { eq } from 'drizzle-orm';

// Helper function to create a test grocery item
const createTestItem = async (itemData: Partial<CreateGroceryItemInput> = {}) => {
  const defaultItem = {
    title: 'Test Item',
    description: 'A test grocery item',
    quantity: null,
    unit: null,
    is_category: false,
    parent_id: null,
    sort_order: 0
  };

  const result = await db.insert(groceryItemsTable)
    .values({
      ...defaultItem,
      ...itemData,
      quantity: itemData.quantity?.toString() || null, // Convert number to string for numeric column
      is_checked: false // Default value
    })
    .returning()
    .execute();

  return result[0];
};

describe('deleteGroceryItem', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should delete an existing grocery item', async () => {
    // Create test item
    const testItem = await createTestItem({ title: 'Item to Delete' });
    
    const input: DeleteGroceryItemInput = {
      id: testItem.id
    };

    const result = await deleteGroceryItem(input);

    // Verify deletion was successful
    expect(result.success).toBe(true);

    // Verify item no longer exists in database
    const items = await db.select()
      .from(groceryItemsTable)
      .where(eq(groceryItemsTable.id, testItem.id))
      .execute();

    expect(items).toHaveLength(0);
  });

  it('should return false when trying to delete non-existent item', async () => {
    const input: DeleteGroceryItemInput = {
      id: 99999 // Non-existent ID
    };

    const result = await deleteGroceryItem(input);

    // Should return success: false when no rows affected
    expect(result.success).toBe(false);
  });

  it('should delete category item successfully', async () => {
    // Create test category
    const categoryItem = await createTestItem({
      title: 'Test Category',
      is_category: true,
      sort_order: 1
    });

    const input: DeleteGroceryItemInput = {
      id: categoryItem.id
    };

    const result = await deleteGroceryItem(input);

    expect(result.success).toBe(true);

    // Verify category no longer exists
    const categories = await db.select()
      .from(groceryItemsTable)
      .where(eq(groceryItemsTable.id, categoryItem.id))
      .execute();

    expect(categories).toHaveLength(0);
  });

  it('should delete item with child relationships', async () => {
    // Create parent category
    const parentCategory = await createTestItem({
      title: 'Parent Category',
      is_category: true
    });

    // Create child item
    const childItem = await createTestItem({
      title: 'Child Item',
      parent_id: parentCategory.id,
      sort_order: 1
    });

    // Delete the parent category
    const input: DeleteGroceryItemInput = {
      id: parentCategory.id
    };

    const result = await deleteGroceryItem(input);

    expect(result.success).toBe(true);

    // Verify parent is deleted
    const parentItems = await db.select()
      .from(groceryItemsTable)
      .where(eq(groceryItemsTable.id, parentCategory.id))
      .execute();

    expect(parentItems).toHaveLength(0);

    // Child item should still exist (orphaned but not deleted)
    const childItems = await db.select()
      .from(groceryItemsTable)
      .where(eq(groceryItemsTable.id, childItem.id))
      .execute();

    expect(childItems).toHaveLength(1);
    expect(childItems[0].title).toEqual('Child Item');
  });

  it('should handle deletion of checked items', async () => {
    // Create checked item
    const checkedItem = await db.insert(groceryItemsTable)
      .values({
        title: 'Checked Item',
        description: null,
        quantity: null,
        unit: null,
        is_checked: true,
        is_category: false,
        parent_id: null,
        sort_order: 0
      })
      .returning()
      .execute();

    const input: DeleteGroceryItemInput = {
      id: checkedItem[0].id
    };

    const result = await deleteGroceryItem(input);

    expect(result.success).toBe(true);

    // Verify checked item is deleted
    const items = await db.select()
      .from(groceryItemsTable)
      .where(eq(groceryItemsTable.id, checkedItem[0].id))
      .execute();

    expect(items).toHaveLength(0);
  });
});
