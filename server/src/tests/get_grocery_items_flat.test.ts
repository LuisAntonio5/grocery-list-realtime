
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { groceryItemsTable } from '../db/schema';
import { getGroceryItemsFlat } from '../handlers/get_grocery_items_flat';

describe('getGroceryItemsFlat', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no items exist', async () => {
    const result = await getGroceryItemsFlat();
    expect(result).toEqual([]);
  });

  it('should return all grocery items in sort order', async () => {
    // Create test items with different sort orders
    await db.insert(groceryItemsTable).values([
      {
        title: 'Item B',
        description: 'Second item',
        sort_order: 2
      },
      {
        title: 'Item A',
        description: 'First item',
        sort_order: 1
      },
      {
        title: 'Item C',
        description: 'Third item',
        sort_order: 3
      }
    ]).execute();

    const result = await getGroceryItemsFlat();

    expect(result).toHaveLength(3);
    expect(result[0].title).toBe('Item A');
    expect(result[1].title).toBe('Item B');
    expect(result[2].title).toBe('Item C');
  });

  it('should convert numeric quantity fields correctly', async () => {
    await db.insert(groceryItemsTable).values([
      {
        title: 'Test Item',
        quantity: '5.25',
        unit: 'lbs',
        sort_order: 1
      },
      {
        title: 'Item without quantity',
        quantity: null,
        sort_order: 2
      }
    ]).execute();

    const result = await getGroceryItemsFlat();

    expect(result).toHaveLength(2);
    expect(result[0].quantity).toBe(5.25);
    expect(typeof result[0].quantity).toBe('number');
    expect(result[1].quantity).toBe(null);
  });

  it('should include all fields in returned items', async () => {
    await db.insert(groceryItemsTable).values({
      title: 'Complete Item',
      description: 'Full description',
      quantity: '10.5',
      unit: 'kg',
      is_checked: true,
      is_category: false,
      parent_id: null,
      sort_order: 1
    }).execute();

    const result = await getGroceryItemsFlat();

    expect(result).toHaveLength(1);
    const item = result[0];
    expect(item.title).toBe('Complete Item');
    expect(item.description).toBe('Full description');
    expect(item.quantity).toBe(10.5);
    expect(item.unit).toBe('kg');
    expect(item.is_checked).toBe(true);
    expect(item.is_category).toBe(false);
    expect(item.parent_id).toBe(null);
    expect(item.sort_order).toBe(1);
    expect(item.id).toBeDefined();
    expect(item.created_at).toBeInstanceOf(Date);
    expect(item.updated_at).toBeInstanceOf(Date);
  });

  it('should handle both categories and regular items', async () => {
    await db.insert(groceryItemsTable).values([
      {
        title: 'Dairy',
        is_category: true,
        sort_order: 1
      },
      {
        title: 'Milk',
        is_category: false,
        parent_id: 1,
        sort_order: 2
      }
    ]).execute();

    const result = await getGroceryItemsFlat();

    expect(result).toHaveLength(2);
    expect(result[0].title).toBe('Dairy');
    expect(result[0].is_category).toBe(true);
    expect(result[1].title).toBe('Milk');
    expect(result[1].is_category).toBe(false);
  });
});
