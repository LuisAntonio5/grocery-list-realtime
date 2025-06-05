
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { groceryItemsTable } from '../db/schema';
import { type ToggleGroceryItemInput } from '../schema';
import { toggleGroceryItem } from '../handlers/toggle_grocery_item';
import { eq } from 'drizzle-orm';

describe('toggleGroceryItem', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should toggle grocery item to checked', async () => {
    // Create a test item directly in the database
    const createResult = await db.insert(groceryItemsTable)
      .values({
        title: 'Test Item',
        description: 'A test grocery item',
        quantity: '2.00', // Store as string for numeric column
        unit: 'pieces',
        is_checked: false,
        is_category: false,
        parent_id: null,
        sort_order: 0
      })
      .returning()
      .execute();

    const createdItem = createResult[0];
    expect(createdItem.is_checked).toBe(false);

    // Toggle to checked
    const toggleInput: ToggleGroceryItemInput = {
      id: createdItem.id,
      is_checked: true
    };

    const result = await toggleGroceryItem(toggleInput);

    // Verify the result
    expect(result.id).toEqual(createdItem.id);
    expect(result.title).toEqual('Test Item');
    expect(result.is_checked).toBe(true);
    expect(result.quantity).toEqual(2);
    expect(typeof result.quantity).toBe('number');
    expect(result.updated_at).toBeInstanceOf(Date);
    expect(result.updated_at > createdItem.updated_at).toBe(true);
  });

  it('should toggle grocery item to unchecked', async () => {
    // Create a test item directly in the database
    const createResult = await db.insert(groceryItemsTable)
      .values({
        title: 'Test Item 2',
        description: null,
        quantity: null,
        unit: null,
        is_checked: true, // Start as checked
        is_category: false,
        parent_id: null,
        sort_order: 1
      })
      .returning()
      .execute();

    const createdItem = createResult[0];

    // Toggle to unchecked
    const toggleInput: ToggleGroceryItemInput = {
      id: createdItem.id,
      is_checked: false
    };

    const result = await toggleGroceryItem(toggleInput);

    // Verify the result
    expect(result.id).toEqual(createdItem.id);
    expect(result.title).toEqual('Test Item 2');
    expect(result.is_checked).toBe(false);
    expect(result.quantity).toBeNull();
    expect(result.description).toBeNull();
    expect(result.unit).toBeNull();
  });

  it('should save toggle state to database', async () => {
    // Create a test item directly in the database
    const createResult = await db.insert(groceryItemsTable)
      .values({
        title: 'Database Test Item',
        description: 'Testing database persistence',
        quantity: '5.00', // Store as string for numeric column
        unit: 'kg',
        is_checked: false,
        is_category: false,
        parent_id: null,
        sort_order: 2
      })
      .returning()
      .execute();

    const createdItem = createResult[0];

    // Toggle the item
    const toggleInput: ToggleGroceryItemInput = {
      id: createdItem.id,
      is_checked: true
    };

    await toggleGroceryItem(toggleInput);

    // Query the database directly to verify the change was persisted
    const items = await db.select()
      .from(groceryItemsTable)
      .where(eq(groceryItemsTable.id, createdItem.id))
      .execute();

    expect(items).toHaveLength(1);
    expect(items[0].is_checked).toBe(true);
    expect(items[0].title).toEqual('Database Test Item');
    expect(parseFloat(items[0].quantity!)).toEqual(5);
    expect(items[0].updated_at).toBeInstanceOf(Date);
    expect(items[0].updated_at > createdItem.updated_at).toBe(true);
  });

  it('should throw error for non-existent item', async () => {
    const toggleInput: ToggleGroceryItemInput = {
      id: 99999,
      is_checked: true
    };

    await expect(toggleGroceryItem(toggleInput))
      .rejects.toThrow(/grocery item with id 99999 not found/i);
  });

  it('should handle category items correctly', async () => {
    // Create a category item directly in the database
    const createResult = await db.insert(groceryItemsTable)
      .values({
        title: 'Fruits Category',
        description: 'Category for fruits',
        quantity: null,
        unit: null,
        is_checked: false,
        is_category: true,
        parent_id: null,
        sort_order: 0
      })
      .returning()
      .execute();

    const createdCategory = createResult[0];
    expect(createdCategory.is_category).toBe(true);

    // Toggle the category item
    const toggleInput: ToggleGroceryItemInput = {
      id: createdCategory.id,
      is_checked: true
    };

    const result = await toggleGroceryItem(toggleInput);

    // Verify category can be toggled
    expect(result.is_category).toBe(true);
    expect(result.is_checked).toBe(true);
    expect(result.title).toEqual('Fruits Category');
  });
});
