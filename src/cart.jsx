import { createContext, useContext, useEffect, useMemo, useReducer, useState } from 'react'
import { findPack, findProduct } from './data/products.js'

const KEY = 'gmniche-cart-v1'
const CartContext = createContext(null)

// A saved cart can outlive the catalog: drop lines whose product or pack no longer exists.
const stillSold = (line) => (line?.kind === 'pack' ? findPack(line.refId) : findProduct(line?.refId))

function load() {
  try {
    const raw = localStorage.getItem(KEY)
    const items = raw ? JSON.parse(raw) : []
    return Array.isArray(items) ? items.filter(stillSold) : []
  } catch {
    return []
  }
}

// Each line: { key, kind: 'product' | 'pack', refId, name, detail, price, image, qty, max }
function reducer(items, action) {
  switch (action.type) {
    case 'add': {
      const { line, qty } = action
      const existing = items.find((i) => i.key === line.key)
      if (existing) {
        return items.map((i) => (i.key === line.key ? { ...i, qty: Math.min(i.max, i.qty + qty) } : i))
      }
      return [...items, { ...line, qty: Math.min(line.max, qty) }]
    }
    case 'setQty':
      return items
        .map((i) => (i.key === action.key ? { ...i, qty: Math.max(0, Math.min(i.max, action.qty)) } : i))
        .filter((i) => i.qty > 0)
    case 'remove':
      return items.filter((i) => i.key !== action.key)
    default:
      return items
  }
}

export function CartProvider({ children }) {
  const [items, dispatch] = useReducer(reducer, undefined, load)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(items))
    } catch {
      // Private mode or blocked storage: the cart still works for this visit.
    }
  }, [items])

  const value = useMemo(() => ({
    items,
    count: items.reduce((n, i) => n + i.qty, 0),
    subtotal: items.reduce((n, i) => n + i.qty * i.price, 0),
    open,
    setOpen,
    add: (line, qty = 1) => {
      dispatch({ type: 'add', line, qty })
      setOpen(true)
    },
    setQty: (key, qty) => dispatch({ type: 'setQty', key, qty }),
    remove: (key) => dispatch({ type: 'remove', key }),
  }), [items, open])

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used inside CartProvider')
  return ctx
}
