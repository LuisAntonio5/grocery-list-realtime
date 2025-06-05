
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { groceryItemsTable } from '../db/schema';
import { type UpdateGroceryItemInput } from '../schema';
import { updateGroceryItem } from '../handlers/update_grocery_item';
import { eq } from 'drizzle-orm';

describe('updateGroceryItem', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should update a grocery item with all fields', async () => {
    // Create initial item directly in database
    const created = await db.insert(groceryItemsTable)
      .values({
        title: 'Test Item',
        description: 'A test grocery item',
        quantity: '2.00',
        unit: 'pieces',
        is_checked: false,
        is_category: false,
        parent_id: null,
        sort_order: 1
      })
      .returning()
      .execute();

    const createdItem = created[0];

    const updateInput: UpdateGroceryItemInput = {
      id: createdItem.id,
      title: 'Updated Item',
      description: 'Updated description',
      quantity: 5,
      unit: 'kg',
      is_checked: true,
      is_category: false,
      parent_id: null,
      sort_order: 2
    };

    const result = await updateGroceryItem(updateInput);

    // Verify updated fields
    expect(result.id).toEqual(createdItem.id);
    expect(result.title).toEqual('Updated Item');
    expect(result.description).toEqual('Updated description');
    expect(result.quantity).toEqual(5);
    expect(typeof result.quantity).toEqual('number');
    expect(result.unit).toEqual('kg');
    expect(result.is_checked).toEqual(true);
    expect(result.is_category).toEqual(false);
    expect(result.parent_id).toBeNull();
    expect(result.sort_order).toEqual(2);
    expect(result.updated_at).toBeInstanceOf(Date);
    expect(result.updated_at > createdItem.updated_at).toBe(true);
  });

  it('should update only provided fields', async () => {
    // Create initial item directly in database
    const created = await db.insert(groceryItemsTable)
      .values({
        title: 'Test Item',
        description: 'A test grocery item',
        quantity: '2.00',
        unit: 'pieces',
        is_checked: false,
        is_category: false,
        parent_id: null,
        sort_order: 1
      })
      .returning()
      .execute();

    const createdItem = created[0];

    const updateInput: UpdateGroceryItemInput = {
      id: createdItem.id,
      title: 'Partially Updated',
      is_checked: true
    };

    const result = await updateGroceryItem(updateInput);

    // Verify only specified fields were updated
    expect(result.title).toEqual('Partially Updated');
    expect(result.is_checked).toEqual(true);
    
    // Verify other fields remained unchanged
    expect(result.description).toEqual(createdItem.description);
    expect(result.quantity).toEqual(parseFloat(createdItem.quantity!));
    expect(result.unit).toEqual(createdItem.unit);
    expect(result.is_category).toEqual(createdItem.is_category);
    expect(result.parent_id).toEqual(createdItem.parent_id);
    expect(result.sort_order).toEqual(createdItem.sort_order);
  });

  it('should update parent_id correctly', async () => {
    // Create category
    const categoryResult = await db.insert(groceryItemsTable)
      .values({
        title: 'Test Category',
        description: 'A test category',
        quantity: null,
        unit: null,
        is_checked: false,
        is_category: true,
        parent_id: null,
        sort_order: 0
      })
      .returning()
      .execute();

    const category = categoryResult[0];

    // Create item
    const itemResult = await db.insert(groceryItemsTable)
      .values({
        title: 'Test Item',
        description: 'A test grocery item',
        quantity: '2.00',
        unit: 'pieces',
        is_checked: false,
        is_category: false,
        parent_id: null,
        sort_order: 1
      })
      .returning()
      .execute();

    const item = itemResult[0];

    const updateInput: UpdateGroceryItemInput = {
      id: item.id,
      parent_id: category.id
    };

    const result = await updateGroceryItem(updateInput);

    expect(result.parent_id).toEqual(category.id);
    expect(result.title).toEqual(item.title); // Other fields unchanged
  });

  it('should handle null quantity correctly', async () => {
    // Create initial item with quantity
    const created = await db.insert(groceryItemsTable)
      .values({
        title: 'Test Item',
        description: 'A test grocery item',
        quantity: '2.00',
        unit: 'pieces',
        is_checked: false,
        is_category: false,
        parent_id: null,
        sort_order: 1
      })
      .returning()
      .execute();

    const createdItem = created[0];

    const updateInput: UpdateGroceryItemInput = {
      id: createdItem.id,
      quantity: null
    };

    const result = await updateGroceryItem(updateInput);

    expect(result.quantity).toBeNull();
  });

  it('should save updated item to database', async () => {
    // Create initial item
    const created = await db.insert(groceryItemsTable)
      .values({
        title: 'Test Item',
        description: 'A test grocery item',
        quantity: '2.00',
        unit: 'pieces',
        is_checked: false,
        is_category: false,
        parent_id: null,
        sort_order: 1
      })
      .returning()
      .execute();

    const createdItem = created[0];

    const updateInput: UpdateGroceryItemInput = {
      id: createdItem.id,
      title: 'Database Test Update',
      quantity: 10
    };

    await updateGroceryItem(updateInput);

    // Query database to verify changes
    const items = await db.select()
      .from(groceryItemsTable)
      .where(eq(groceryItemsTable.id, createdItem.id))
      .execute();

    expect(items).toHaveLength(1);
    expect(items[0].title).toEqual('Database Test Update');
    expect(parseFloat(items[0].quantity!)).toEqual(10);
    expect(items[0].updated_at).toBeInstanceOf(Date);
    expect(items[0].updated_at > createdItem.updated_at).toBe(true);
  });

  it('should throw error for non-existent item', async () => {
    const updateInput: UpdateGroceryItemInput = {
      id: 99999,
      title: 'This should fail'
    };

    await expect(updateGroceryItem(updateInput)).rejects.toThrow(/not found/i);
  });

  it('should handle category conversion', async () => {
    // Create regular item
    const created = await db.insert(groceryItemsTable)
      .values({
        title: 'Test Item',
        description: 'A test grocery item',
        quantity: '2.00',
        unit: 'pieces',
        is_checked: false,
        is_category: false,
        parent_id: null,
        sort_order: 1
      })
      .returning()
      .execute();

    const createdItem = created[0];

    const updateInput: UpdateGroceryItemInput = {
      id: createdItem.id,
      is_category: true,
      quantity: null // Categories typically don't have quantities
    };

    const result = await updateGroceryItem(updateInput);

    expect(result.is_category).toEqual(true);
    expect(result.quantity).toBeNull();
  });
});
