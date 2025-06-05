
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { groceryItemsTable } from '../db/schema';
import { type CreateGroceryItemInput } from '../schema';
import { createGroceryItem } from '../handlers/create_grocery_item';
import { eq } from 'drizzle-orm';

// Simple test input with all fields
const testInput: CreateGroceryItemInput = {
  title: 'Test Grocery Item',
  description: 'A grocery item for testing',
  quantity: 2.5,
  unit: 'lbs',
  is_category: false,
  parent_id: null,
  sort_order: 1
};

// Category test input
const categoryInput: CreateGroceryItemInput = {
  title: 'Produce',
  description: 'Fresh fruits and vegetables',
  quantity: null,
  unit: null,
  is_category: true,
  parent_id: null,
  sort_order: 0
};

describe('createGroceryItem', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a grocery item with all fields', async () => {
    const result = await createGroceryItem(testInput);

    // Basic field validation
    expect(result.title).toEqual('Test Grocery Item');
    expect(result.description).toEqual('A grocery item for testing');
    expect(result.quantity).toEqual(2.5);
    expect(typeof result.quantity).toEqual('number');
    expect(result.unit).toEqual('lbs');
    expect(result.is_checked).toEqual(false); // Database default
    expect(result.is_category).toEqual(false);
    expect(result.parent_id).toBeNull();
    expect(result.sort_order).toEqual(1);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should create a category item', async () => {
    const result = await createGroceryItem(categoryInput);

    expect(result.title).toEqual('Produce');
    expect(result.description).toEqual('Fresh fruits and vegetables');
    expect(result.quantity).toBeNull();
    expect(result.unit).toBeNull();
    expect(result.is_category).toEqual(true);
    expect(result.is_checked).toEqual(false);
    expect(result.sort_order).toEqual(0);
  });

  it('should create item with minimal required fields using defaults', async () => {
    const minimalInput: CreateGroceryItemInput = {
      title: 'Minimal Item',
      is_category: false,
      sort_order: 0
    };

    const result = await createGroceryItem(minimalInput);

    expect(result.title).toEqual('Minimal Item');
    expect(result.description).toBeNull();
    expect(result.quantity).toBeNull();
    expect(result.unit).toBeNull();
    expect(result.is_category).toEqual(false); // Zod default
    expect(result.parent_id).toBeNull();
    expect(result.sort_order).toEqual(0); // Zod default
    expect(result.is_checked).toEqual(false); // Database default
  });

  it('should save grocery item to database', async () => {
    const result = await createGroceryItem(testInput);

    // Query using proper drizzle syntax
    const groceryItems = await db.select()
      .from(groceryItemsTable)
      .where(eq(groceryItemsTable.id, result.id))
      .execute();

    expect(groceryItems).toHaveLength(1);
    const savedItem = groceryItems[0];
    
    expect(savedItem.title).toEqual('Test Grocery Item');
    expect(savedItem.description).toEqual('A grocery item for testing');
    expect(parseFloat(savedItem.quantity!)).toEqual(2.5); // Convert back to number for comparison
    expect(savedItem.unit).toEqual('lbs');
    expect(savedItem.is_category).toEqual(false);
    expect(savedItem.is_checked).toEqual(false);
    expect(savedItem.parent_id).toBeNull();
    expect(savedItem.sort_order).toEqual(1);
    expect(savedItem.created_at).toBeInstanceOf(Date);
    expect(savedItem.updated_at).toBeInstanceOf(Date);
  });

  it('should create nested item with parent relationship', async () => {
    // First create a parent category
    const parentResult = await createGroceryItem(categoryInput);

    // Then create a child item
    const childInput: CreateGroceryItemInput = {
      title: 'Apples',
      description: 'Red delicious apples',
      quantity: 3,
      unit: 'each',
      is_category: false,
      parent_id: parentResult.id,
      sort_order: 1
    };

    const childResult = await createGroceryItem(childInput);

    expect(childResult.title).toEqual('Apples');
    expect(childResult.parent_id).toEqual(parentResult.id);
    expect(childResult.is_category).toEqual(false);
    expect(childResult.quantity).toEqual(3);

    // Verify both items exist in database
    const allItems = await db.select()
      .from(groceryItemsTable)
      .execute();

    expect(allItems).toHaveLength(2);
    
    const parent = allItems.find(item => item.id === parentResult.id);
    const child = allItems.find(item => item.id === childResult.id);
    
    expect(parent?.is_category).toEqual(true);
    expect(child?.parent_id).toEqual(parent?.id || null);
  });
});
