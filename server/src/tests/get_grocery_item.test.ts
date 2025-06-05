
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { groceryItemsTable } from '../db/schema';
import { getGroceryItem } from '../handlers/get_grocery_item';

describe('getGroceryItem', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return a grocery item by id', async () => {
    // Create test item
    const testItem = await db.insert(groceryItemsTable)
      .values({
        title: 'Test Item',
        description: 'A test grocery item',
        quantity: '2.50',
        unit: 'lbs',
        is_checked: false,
        is_category: false,
        parent_id: null,
        sort_order: 1
      })
      .returning()
      .execute();

    const result = await getGroceryItem(testItem[0].id);

    expect(result).not.toBeNull();
    expect(result!.id).toEqual(testItem[0].id);
    expect(result!.title).toEqual('Test Item');
    expect(result!.description).toEqual('A test grocery item');
    expect(result!.quantity).toEqual(2.50);
    expect(typeof result!.quantity).toEqual('number');
    expect(result!.unit).toEqual('lbs');
    expect(result!.is_checked).toEqual(false);
    expect(result!.is_category).toEqual(false);
    expect(result!.parent_id).toBeNull();
    expect(result!.sort_order).toEqual(1);
    expect(result!.created_at).toBeInstanceOf(Date);
    expect(result!.updated_at).toBeInstanceOf(Date);
  });

  it('should return null for non-existent item', async () => {
    const result = await getGroceryItem(999);
    expect(result).toBeNull();
  });

  it('should handle items with null quantity', async () => {
    // Create test item with null quantity
    const testItem = await db.insert(groceryItemsTable)
      .values({
        title: 'Item Without Quantity',
        description: null,
        quantity: null,
        unit: null,
        is_checked: true,
        is_category: true,
        parent_id: null,
        sort_order: 0
      })
      .returning()
      .execute();

    const result = await getGroceryItem(testItem[0].id);

    expect(result).not.toBeNull();
    expect(result!.title).toEqual('Item Without Quantity');
    expect(result!.description).toBeNull();
    expect(result!.quantity).toBeNull();
    expect(result!.unit).toBeNull();
    expect(result!.is_checked).toEqual(true);
    expect(result!.is_category).toEqual(true);
  });

  it('should handle items with parent_id', async () => {
    // Create parent category first
    const parentItem = await db.insert(groceryItemsTable)
      .values({
        title: 'Produce',
        is_category: true,
        sort_order: 0
      })
      .returning()
      .execute();

    // Create child item
    const childItem = await db.insert(groceryItemsTable)
      .values({
        title: 'Apples',
        quantity: '3.00',
        unit: 'lbs',
        parent_id: parentItem[0].id,
        sort_order: 1
      })
      .returning()
      .execute();

    const result = await getGroceryItem(childItem[0].id);

    expect(result).not.toBeNull();
    expect(result!.title).toEqual('Apples');
    expect(result!.parent_id).toEqual(parentItem[0].id);
    expect(result!.quantity).toEqual(3.00);
    expect(typeof result!.quantity).toEqual('number');
  });
});
