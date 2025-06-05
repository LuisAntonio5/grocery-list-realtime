
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { groceryItemsTable } from '../db/schema';
import { type MoveGroceryItemInput, type CreateGroceryItemInput } from '../schema';
import { moveGroceryItem } from '../handlers/move_grocery_item';
import { eq } from 'drizzle-orm';

// Test inputs
const testCategory: CreateGroceryItemInput = {
  title: 'Produce',
  description: 'Fresh fruits and vegetables',
  quantity: null,
  unit: null,
  is_category: true,
  parent_id: null,
  sort_order: 0
};

const testItem: CreateGroceryItemInput = {
  title: 'Apples',
  description: 'Red delicious apples',
  quantity: 5,
  unit: 'lbs',
  is_category: false,
  parent_id: null,
  sort_order: 1
};

describe('moveGroceryItem', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should move item to a new parent category', async () => {
    // Create category and item
    const categoryResult = await db.insert(groceryItemsTable)
      .values({
        title: testCategory.title,
        description: testCategory.description,
        quantity: testCategory.quantity?.toString(),
        unit: testCategory.unit,
        is_category: testCategory.is_category,
        parent_id: testCategory.parent_id,
        sort_order: testCategory.sort_order
      })
      .returning()
      .execute();

    const itemResult = await db.insert(groceryItemsTable)
      .values({
        title: testItem.title,
        description: testItem.description,
        quantity: testItem.quantity?.toString(),
        unit: testItem.unit,
        is_category: testItem.is_category,
        parent_id: testItem.parent_id,
        sort_order: testItem.sort_order
      })
      .returning()
      .execute();

    const categoryId = categoryResult[0].id;
    const itemId = itemResult[0].id;

    const moveInput: MoveGroceryItemInput = {
      id: itemId,
      parent_id: categoryId,
      sort_order: 2
    };

    const result = await moveGroceryItem(moveInput);

    expect(result.id).toEqual(itemId);
    expect(result.parent_id).toEqual(categoryId);
    expect(result.sort_order).toEqual(2);
    expect(result.title).toEqual('Apples');
    expect(result.quantity).toEqual(5);
    expect(typeof result.quantity).toBe('number');
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should move item to root level (null parent)', async () => {
    // Create category and item under it
    const categoryResult = await db.insert(groceryItemsTable)
      .values({
        title: testCategory.title,
        description: testCategory.description,
        quantity: testCategory.quantity?.toString(),
        unit: testCategory.unit,
        is_category: testCategory.is_category,
        parent_id: testCategory.parent_id,
        sort_order: testCategory.sort_order
      })
      .returning()
      .execute();

    const itemResult = await db.insert(groceryItemsTable)
      .values({
        title: testItem.title,
        description: testItem.description,
        quantity: testItem.quantity?.toString(),
        unit: testItem.unit,
        is_category: testItem.is_category,
        parent_id: categoryResult[0].id, // Start under category
        sort_order: testItem.sort_order
      })
      .returning()
      .execute();

    const itemId = itemResult[0].id;

    const moveInput: MoveGroceryItemInput = {
      id: itemId,
      parent_id: null, // Move to root level
      sort_order: 5
    };

    const result = await moveGroceryItem(moveInput);

    expect(result.id).toEqual(itemId);
    expect(result.parent_id).toBeNull();
    expect(result.sort_order).toEqual(5);
    expect(result.title).toEqual('Apples');
  });

  it('should update sort order within same parent', async () => {
    // Create item
    const itemResult = await db.insert(groceryItemsTable)
      .values({
        title: testItem.title,
        description: testItem.description,
        quantity: testItem.quantity?.toString(),
        unit: testItem.unit,
        is_category: testItem.is_category,
        parent_id: testItem.parent_id,
        sort_order: testItem.sort_order
      })
      .returning()
      .execute();

    const itemId = itemResult[0].id;

    const moveInput: MoveGroceryItemInput = {
      id: itemId,
      parent_id: null, // Same parent (null)
      sort_order: 10 // New sort order
    };

    const result = await moveGroceryItem(moveInput);

    expect(result.id).toEqual(itemId);
    expect(result.parent_id).toBeNull();
    expect(result.sort_order).toEqual(10);
    expect(result.title).toEqual('Apples');
  });

  it('should save changes to database', async () => {
    // Create item
    const itemResult = await db.insert(groceryItemsTable)
      .values({
        title: testItem.title,
        description: testItem.description,
        quantity: testItem.quantity?.toString(),
        unit: testItem.unit,
        is_category: testItem.is_category,
        parent_id: testItem.parent_id,
        sort_order: testItem.sort_order
      })
      .returning()
      .execute();

    const itemId = itemResult[0].id;

    const moveInput: MoveGroceryItemInput = {
      id: itemId,
      parent_id: null,
      sort_order: 15
    };

    await moveGroceryItem(moveInput);

    // Verify changes were saved to database
    const savedItems = await db.select()
      .from(groceryItemsTable)
      .where(eq(groceryItemsTable.id, itemId))
      .execute();

    expect(savedItems).toHaveLength(1);
    expect(savedItems[0].id).toEqual(itemId);
    expect(savedItems[0].sort_order).toEqual(15);
    expect(savedItems[0].updated_at).toBeInstanceOf(Date);
  });

  it('should throw error for non-existent item', async () => {
    const moveInput: MoveGroceryItemInput = {
      id: 999999, // Non-existent ID
      parent_id: null,
      sort_order: 0
    };

    await expect(moveGroceryItem(moveInput)).rejects.toThrow(/not found/i);
  });
});
