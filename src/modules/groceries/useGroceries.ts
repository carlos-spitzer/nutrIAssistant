import { useCallback, useEffect, useState } from 'react'
import { GroceryItem, GroceryCategory, GROCERY_CATEGORY_LABELS, GroceryGroup } from '../../types/groceries'
import {
  getAllGroceryItems,
  upsertGroceryItem,
  togglePurchasedDB,
  deleteGroceryItem,
  clearPurchasedItems,
  batchInsertGroceryItems,
} from './groceriesDB'
import { MealPlan } from '../../types/planner'
import { InventoryItem } from '../../types/inventory'
import { Linking, Platform } from 'react-native'

function inferGroceryCategory(name: string): GroceryCategory {
  const lower = name.toLowerCase()
  const fruitVeg = ['tomato', 'onion', 'garlic', 'carrot', 'spinach', 'broccoli', 'pepper', 'lettuce', 'cucumber', 'zucchini', 'eggplant', 'apple', 'banana', 'orange', 'lemon', 'strawberry', 'grape', 'peach', 'pear', 'potato', 'mushroom', 'avocado']
  const proteins = ['chicken', 'beef', 'pork', 'fish', 'salmon', 'tuna', 'shrimp', 'turkey', 'egg', 'lentil', 'chickpea', 'bean', 'tofu']
  const dairy = ['milk', 'cheese', 'yogurt', 'butter', 'cream', 'mozzarella', 'parmesan']
  const grains = ['bread', 'pasta', 'rice', 'flour', 'oat', 'cereal', 'cracker', 'tortilla', 'quinoa', 'barley']

  if (fruitVeg.some((kw) => lower.includes(kw))) return 'fruits_vegetables'
  if (proteins.some((kw) => lower.includes(kw))) return 'proteins'
  if (dairy.some((kw) => lower.includes(kw))) return 'dairy_alternatives'
  if (grains.some((kw) => lower.includes(kw))) return 'grains_pantry'
  return 'other'
}

export function useGroceries() {
  const [items, setItems] = useState<GroceryItem[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const reload = useCallback(async () => {
    setIsLoading(true)
    const all = await getAllGroceryItems()
    setItems(all)
    setIsLoading(false)
  }, [])

  useEffect(() => {
    reload()
  }, [reload])

  const addItem = useCallback(
    async (
      name: string,
      quantity = 1,
      unit = 'units',
      notes?: string
    ) => {
      const newItem: GroceryItem = {
        id: `groc-${Date.now()}`,
        name,
        quantity,
        unit,
        category: inferGroceryCategory(name),
        notes,
        isPurchased: false,
        addedAt: new Date().toISOString(),
        fromMealPlan: false,
      }
      await upsertGroceryItem(newItem)
      await reload()
    },
    [reload]
  )

  const togglePurchased = useCallback(
    async (id: string) => {
      await togglePurchasedDB(id)
      await reload()
    },
    [reload]
  )

  const removeItem = useCallback(
    async (id: string) => {
      await deleteGroceryItem(id)
      await reload()
    },
    [reload]
  )

  const clearPurchased = useCallback(async () => {
    await clearPurchasedItems()
    await reload()
  }, [reload])

  const autoPopulateFromPlan = useCallback(
    async (plans: MealPlan[], inventory: InventoryItem[]) => {
      const inventoryNames = inventory.map((i) => i.name.toLowerCase())
      const newItems: GroceryItem[] = []

      for (const plan of plans) {
        for (const meal of [plan.meals.breakfast, plan.meals.lunch, plan.meals.dinner]) {
          if (!meal) continue
          for (const ing of meal.ingredients) {
            const inStock = inventoryNames.some(
              (name) =>
                name.includes(ing.name.toLowerCase()) ||
                ing.name.toLowerCase().includes(name)
            )
            if (!inStock) {
              newItems.push({
                id: `groc-plan-${Date.now()}-${Math.random()}`,
                name: ing.name,
                quantity: ing.quantity,
                unit: ing.unit,
                category: inferGroceryCategory(ing.name),
                isPurchased: false,
                addedAt: new Date().toISOString(),
                fromMealPlan: true,
                recipeId: meal.id,
              })
            }
          }
        }
      }

      // Deduplicate by name
      const uniqueItems = newItems.filter(
        (item, idx, arr) =>
          arr.findIndex((i) => i.name.toLowerCase() === item.name.toLowerCase()) === idx
      )

      await batchInsertGroceryItems(uniqueItems)
      await reload()
    },
    [reload]
  )

  const exportToAmazon = useCallback(() => {
    const activeItems = items.filter((i) => !i.isPurchased)
    if (activeItems.length === 0) return

    const query = activeItems.map((i) => i.name).join(', ')
    const url = Platform.OS === 'ios'
      ? `https://www.amazon.es/s?k=${encodeURIComponent(query)}`
      : `https://www.amazon.es/s?k=${encodeURIComponent(query)}`

    Linking.openURL(url)
  }, [items])

  const grouped = useCallback((): GroceryGroup[] => {
    const categories: GroceryCategory[] = [
      'fruits_vegetables', 'proteins', 'dairy_alternatives', 'grains_pantry', 'other',
    ]
    return categories
      .map((cat) => ({
        category: cat,
        label: GROCERY_CATEGORY_LABELS[cat],
        items: items.filter((i) => !i.isPurchased && i.category === cat),
      }))
      .filter((g) => g.items.length > 0)
  }, [items])

  const purchasedItems = items.filter((i) => i.isPurchased)
  const activeItems = items.filter((i) => !i.isPurchased)

  return {
    items,
    activeItems,
    purchasedItems,
    isLoading,
    reload,
    addItem,
    togglePurchased,
    removeItem,
    clearPurchased,
    autoPopulateFromPlan,
    exportToAmazon,
    grouped,
  }
}
