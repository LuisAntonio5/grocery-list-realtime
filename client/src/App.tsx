
import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Plus, Edit, Trash2, MoreVertical, Package, ShoppingCart, Layers, FolderPlus, ListPlus } from 'lucide-react';
import { trpc } from '@/utils/trpc';
import type { NestedGroceryItem, CreateGroceryItemInput, UpdateGroceryItemInput } from '../../server/src/schema';

function App() {
  const [groceryItems, setGroceryItems] = useState<NestedGroceryItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [editingItem, setEditingItem] = useState<NestedGroceryItem | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [parentForNewItem, setParentForNewItem] = useState<number | null>(null);

  const [formData, setFormData] = useState<CreateGroceryItemInput>({
    title: '',
    description: null,
    quantity: null,
    unit: null,
    is_category: false,
    parent_id: null,
    sort_order: 0
  });

  const loadGroceryItems = useCallback(async () => {
    try {
      const result = await trpc.getGroceryItems.query();
      setGroceryItems(result);
    } catch (error) {
      console.error('Failed to load grocery items:', error);
    }
  }, []);

  useEffect(() => {
    loadGroceryItems();
  }, [loadGroceryItems]);

  const handleCreateItem = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await trpc.createGroceryItem.mutate({
        ...formData,
        parent_id: parentForNewItem
      });
      await loadGroceryItems();
      setFormData({
        title: '',
        description: null,
        quantity: null,
        unit: null,
        is_category: false,
        parent_id: null,
        sort_order: 0
      });
      setIsCreateDialogOpen(false);
      setParentForNewItem(null);
    } catch (error) {
      console.error('Failed to create item:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;
    
    setIsLoading(true);
    try {
      const updateData: UpdateGroceryItemInput = {
        id: editingItem.id,
        title: formData.title,
        description: formData.description,
        quantity: formData.quantity,
        unit: formData.unit,
        is_category: formData.is_category
      };
      
      await trpc.updateGroceryItem.mutate(updateData);
      await loadGroceryItems();
      setEditingItem(null);
      setFormData({
        title: '',
        description: null,
        quantity: null,
        unit: null,
        is_category: false,
        parent_id: null,
        sort_order: 0
      });
    } catch (error) {
      console.error('Failed to update item:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleChecked = async (item: NestedGroceryItem) => {
    try {
      await trpc.toggleGroceryItem.mutate({
        id: item.id,
        is_checked: !item.is_checked
      });
      await loadGroceryItems();
    } catch (error) {
      console.error('Failed to toggle item:', error);
    }
  };

  const handleDeleteItem = async (id: number) => {
    try {
      await trpc.deleteGroceryItem.mutate({ id });
      await loadGroceryItems();
    } catch (error) {
      console.error('Failed to delete item:', error);
    }
  };

  const openCreateDialog = (parentId: number | null = null) => {
    setParentForNewItem(parentId);
    setFormData({
      title: '',
      description: null,
      quantity: null,
      unit: null,
      is_category: false,
      parent_id: parentId,
      sort_order: 0
    });
    setIsCreateDialogOpen(true);
  };

  const openEditDialog = (item: NestedGroceryItem) => {
    setEditingItem(item);
    setFormData({
      title: item.title,
      description: item.description,
      quantity: item.quantity,
      unit: item.unit,
      is_category: item.is_category,
      parent_id: item.parent_id,
      sort_order: item.sort_order
    });
  };

  const getTotalItems = (items: NestedGroceryItem[]): number => {
    return items.reduce((total: number, item: NestedGroceryItem) => {
      let count = item.is_category ? 0 : 1;
      if (item.children) {
        count += getTotalItems(item.children);
      }
      return total + count;
    }, 0);
  };

  const getCheckedItems = (items: NestedGroceryItem[]): number => {
    return items.reduce((total: number, item: NestedGroceryItem) => {
      let count = (item.is_checked && !item.is_category) ? 1 : 0;
      if (item.children) {
        count += getCheckedItems(item.children);
      }
      return total + count;
    }, 0);
  };

  const renderGroceryItem = (item: NestedGroceryItem, depth: number = 0) => {
    const hasChildren = item.children && item.children.length > 0;
    const indentClass = depth > 0 ? `ml-${Math.min(depth * 4, 16)}` : '';
    
    return (
      <div key={item.id} className={`${indentClass} mb-2`}>
        <Card className={`${item.is_checked ? 'opacity-60 bg-gray-50' : ''} hover:shadow-md transition-shadow`}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3 flex-1">
                {!item.is_category && (
                  <Checkbox
                    checked={item.is_checked}
                    onCheckedChange={() => handleToggleChecked(item)}
                    className="h-5 w-5"
                  />
                )}
                
                <div className="flex items-center space-x-2">
                  {item.is_category ? (
                    <Layers className="h-5 w-5 text-blue-500" />
                  ) : (
                    <Package className="h-5 w-5 text-gray-500" />
                  )}
                  
                  <div className="flex-1">
                    <h3 className={`font-medium ${item.is_checked ? 'line-through text-gray-500' : ''}`}>
                      {item.title}
                    </h3>
                    {item.description && (
                      <p className="text-sm text-gray-600 mt-1">{item.description}</p>
                    )}
                    {item.quantity && (
                      <div className="flex items-center space-x-2 mt-1">
                        <Badge variant="secondary" className="text-xs">
                          {item.quantity} {item.unit || 'units'}
                        </Badge>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                {item.is_category && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => openCreateDialog(item.id)}
                    className="h-8 w-8 p-0"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                )}
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => openEditDialog(item)}>
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </DropdownMenuItem>
                    {item.is_category && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => openCreateDialog(item.id)}>
                          <FolderPlus className="h-4 w-4 mr-2" />
                          Add Category
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => {
                          setFormData(prev => ({ ...prev, is_category: false }));
                          openCreateDialog(item.id);
                        }}>
                          <ListPlus className="h-4 w-4 mr-2" />
                          Add Item
                        </DropdownMenuItem>
                      </>
                    )}
                    <DropdownMenuSeparator />
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <DropdownMenuItem onSelect={(e: Event) => e.preventDefault()}>
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete {item.is_category ? 'Category' : 'Item'}</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete "{item.title}"? 
                            {item.is_category && hasChildren && ' This will also delete all items within this category.'}
                            This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDeleteItem(item.id)}>
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </CardContent>
        </Card>

        {hasChildren && (
          <div className="mt-2">
            {item.children!.map((child: NestedGroceryItem) => 
              renderGroceryItem(child, depth + 1)
            )}
          </div>
        )}
      </div>
    );
  };

  const totalItems = getTotalItems(groceryItems);
  const checkedItems = getCheckedItems(groceryItems);
  const progress = totalItems > 0 ? (checkedItems / totalItems) * 100 : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto p-4 max-w-4xl">
        {/* Header */}
        <Card className="mb-6 bg-white/80 backdrop-blur-sm border-0 shadow-lg">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-3 bg-blue-500 rounded-full">
                  <ShoppingCart className="h-6 w-6 text-white" />
                </div>
                <div>
                  <CardTitle className="text-2xl font-bold text-gray-800">
                    🛒 Shared Grocery List
                  </CardTitle>
                  <CardDescription className="text-gray-600">
                    Organize your groceries with infinite nesting • Real-time sync across all devices
                  </CardDescription>
                </div>
              </div>
              
              <div className="text-right">
                <div className="text-2xl font-bold text-blue-600">
                  {checkedItems}/{totalItems}
                </div>
                <div className="text-sm text-gray-500">items completed</div>
                {totalItems > 0 && (
                  <div className="flex items-center space-x-2 mt-1">
                    <div className="w-12 h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-blue-500 transition-all duration-300"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                    <span className="text-xs text-gray-500">{Math.round(progress)}%</span>
                  </div>
                )}
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-3 mb-6">
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-blue-500 hover:bg-blue-600" onClick={() => openCreateDialog()}>
                <FolderPlus className="h-4 w-4 mr-2" />
                Add Category
              </Button>
            </DialogTrigger>
          </Dialog>

          <Button 
            variant="outline" 
            className="border-blue-200 hover:bg-blue-50"
            onClick={() => {
              setFormData(prev => ({ ...prev, is_category: false }));
              openCreateDialog();
            }}
          >
            <ListPlus className="h-4 w-4 mr-2" />
            Add Item
          </Button>
        </div>

        {/* Grocery Items */}
        {groceryItems.length === 0 ? (
          <Card className="text-center py-12 bg-white/60 backdrop-blur-sm border-dashed">
            <CardContent>
              <div className="text-6xl mb-4">🛒</div>
              <h3 className="text-xl font-semibold text-gray-700 mb-2">Your grocery list is empty</h3>
              <p className="text-gray-500 mb-4">Start by adding categories and items to organize your shopping</p>
              <Button onClick={() => openCreateDialog()} className="bg-blue-500 hover:bg-blue-600">
                <Plus className="h-4 w-4 mr-2" />
                Add Your First Item
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {groceryItems.map((item: NestedGroceryItem) => renderGroceryItem(item))}
          </div>
        )}

        {/* Create/Edit Dialog */}
        <Dialog open={isCreateDialogOpen || editingItem !== null} onOpenChange={(open: boolean) => {
          if (!open) {
            setIsCreateDialogOpen(false);
            setEditingItem(null);
            setParentForNewItem(null);
          }
        }}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingItem ? 'Edit' : 'Create'} {formData.is_category ? 'Category' : 'Item'}
              </DialogTitle>
              <DialogDescription>
                {formData.is_category 
                  ? 'Categories help organize your grocery items into groups.'
                  : 'Add details about the grocery item you need to buy.'
                }
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={editingItem ? handleUpdateItem : handleCreateItem} className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Type</label>
                <Select 
                  value={formData.is_category ? 'category' : 'item'} 
                  onValueChange={(value: string) => setFormData(prev => ({ 
                    ...prev, 
                    is_category: value === 'category' 
                  }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="category">📁 Category</SelectItem>
                    <SelectItem value="item">📦 Item</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">
                  {formData.is_category ? 'Category Name' : 'Item Name'}
                </label>
                <Input
                  placeholder={formData.is_category ? 'e.g., Fruits & Vegetables' : 'e.g., Organic Bananas'}
                  value={formData.title}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setFormData((prev: CreateGroceryItemInput) => ({ ...prev, title: e.target.value }))
                  }
                  required
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Description (optional)</label>
                <Textarea
                  placeholder={formData.is_category ? 'Additional notes about this category' : 'Brand, notes, or specific requirements'}
                  value={formData.description || ''}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                    setFormData((prev: CreateGroceryItemInput) => ({
                      ...prev,
                      description: e.target.value || null
                    }))
                  }
                  rows={2}
                />
              </div>

              {!formData.is_category && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Quantity</label>
                    <Input
                      type="number"
                      placeholder="e.g., 2"
                      value={formData.quantity || ''}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setFormData((prev: CreateGroceryItemInput) => ({ 
                          ...prev, 
                          quantity: parseFloat(e.target.value) || null 
                        }))
                      }
                      min="0"
                      step="0.01"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">Unit</label>
                    <Select 
                      value={formData.unit || 'none'} 
                      onValueChange={(value: string) => setFormData(prev => ({ 
                        ...prev, 
                        unit: value === 'none' ? null : value 
                      }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select unit" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">No unit</SelectItem>
                        <SelectItem value="pcs">pieces</SelectItem>
                        <SelectItem value="lbs">pounds</SelectItem>
                        <SelectItem value="kg">kilograms</SelectItem>
                        <SelectItem value="oz">ounces</SelectItem>
                        <SelectItem value="g">grams</SelectItem>
                        <SelectItem value="bottles">bottles</SelectItem>
                        <SelectItem value="boxes">boxes</SelectItem>
                        <SelectItem value="bags">bags</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}

              <DialogFooter>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => {
                    setIsCreateDialogOpen(false);
                    setEditingItem(null);
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isLoading} className="bg-blue-500 hover:bg-blue-600">
                  {isLoading ? 'Saving...' : (editingItem ? 'Update' : 'Create')}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

export default App;
