
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { groceryItemsTable } from '../db/schema';
import { getGroceryItems } from '../handlers/get_grocery_items';

describe('getGroceryItems', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no items exist', async () => {
    const result = await getGroceryItems();
    expect(result).toEqual([]);
  });

  it('should return flat list of root items', async () => {
    // Create test items at root level
    await db.insert(groceryItemsTable).values([
      {
        title: 'Milk',
        description: 'Whole milk',
        quantity: '2',
        unit: 'gallons',
        sort_order: 1
      },
      {
        title: 'Bread',
        description: 'Whole wheat',
        sort_order: 2
      }
    ]).execute();

    const result = await getGroceryItems();

    expect(result).toHaveLength(2);
    expect(result[0].title).toEqual('Milk');
    expect(result[0].description).toEqual('Whole milk');
    expect(result[0].quantity).toEqual(2);
    expect(result[0].unit).toEqual('gallons');
    expect(result[0].is_checked).toEqual(false);
    expect(result[0].is_category).toEqual(false);
    expect(result[0].parent_id).toBeNull();
    expect(result[0].sort_order).toEqual(1);
    expect(result[0].children).toEqual([]);
    expect(typeof result[0].quantity).toBe('number');

    expect(result[1].title).toEqual('Bread');
    expect(result[1].description).toEqual('Whole wheat');
    expect(result[1].quantity).toBeNull();
    expect(result[1].sort_order).toEqual(2);
    expect(result[1].children).toEqual([]);
  });

  it('should return nested structure with categories and items', async () => {
    // Create category and items
    const categoryResult = await db.insert(groceryItemsTable).values({
      title: 'Dairy',
      is_category: true,
      sort_order: 1
    }).returning().execute();
    
    const categoryId = categoryResult[0].id;

    await db.insert(groceryItemsTable).values([
      {
        title: 'Milk',
        quantity: '1',
        unit: 'gallon',
        parent_id: categoryId,
        sort_order: 1
      },
      {
        title: 'Cheese',
        quantity: '0.5',
        unit: 'lb',
        parent_id: categoryId,
        sort_order: 2
      }
    ]).execute();

    const result = await getGroceryItems();

    expect(result).toHaveLength(1);
    expect(result[0].title).toEqual('Dairy');
    expect(result[0].is_category).toEqual(true);
    expect(result[0].children).toHaveLength(2);
    
    const children = result[0].children!;
    expect(children[0].title).toEqual('Milk');
    expect(children[0].quantity).toEqual(1);
    expect(children[0].unit).toEqual('gallon');
    expect(children[0].parent_id).toEqual(categoryId);
    expect(typeof children[0].quantity).toBe('number');
    
    expect(children[1].title).toEqual('Cheese');
    expect(children[1].quantity).toEqual(0.5);
    expect(children[1].unit).toEqual('lb');
    expect(children[1].parent_id).toEqual(categoryId);
    expect(typeof children[1].quantity).toBe('number');
  });

  it('should respect sort order', async () => {
    // Create items with specific sort order
    await db.insert(groceryItemsTable).values([
      {
        title: 'Third Item',
        sort_order: 3
      },
      {
        title: 'First Item',
        sort_order: 1
      },
      {
        title: 'Second Item',
        sort_order: 2
      }
    ]).execute();

    const result = await getGroceryItems();

    expect(result).toHaveLength(3);
    expect(result[0].title).toEqual('First Item');
    expect(result[0].sort_order).toEqual(1);
    expect(result[1].title).toEqual('Second Item');
    expect(result[1].sort_order).toEqual(2);
    expect(result[2].title).toEqual('Third Item');
    expect(result[2].sort_order).toEqual(3);
  });

  it('should handle mixed root items and categories with children', async () => {
    // Create a mix of root items and categories
    const categoryResult = await db.insert(groceryItemsTable).values({
      title: 'Produce',
      is_category: true,
      sort_order: 2
    }).returning().execute();
    
    const categoryId = categoryResult[0].id;

    await db.insert(groceryItemsTable).values([
      {
        title: 'Bread',
        sort_order: 1
      },
      {
        title: 'Apples',
        parent_id: categoryId,
        quantity: '3',
        unit: 'lbs',
        sort_order: 1
      },
      {
        title: 'Cereal',
        sort_order: 3
      }
    ]).execute();

    const result = await getGroceryItems();

    expect(result).toHaveLength(3);
    expect(result[0].title).toEqual('Bread');
    expect(result[0].children).toEqual([]);
    
    expect(result[1].title).toEqual('Produce');
    expect(result[1].is_category).toEqual(true);
    expect(result[1].children).toHaveLength(1);
    expect(result[1].children![0].title).toEqual('Apples');
    expect(result[1].children![0].quantity).toEqual(3);
    expect(typeof result[1].children![0].quantity).toBe('number');
    
    expect(result[2].title).toEqual('Cereal');
    expect(result[2].children).toEqual([]);
  });
});
