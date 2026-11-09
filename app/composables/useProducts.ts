import type { Product, PageResult } from '~/types/models'

export interface CreateProductPayload { name: string; size_kg: number; price: number; minimum_stock: number; active: boolean }
export type UpdateProductPayload = Partial<CreateProductPayload>

export function useProducts() {
  const { api } = useApi()
  const products = useState<Product[]>('api_products', () => [])
  const loaded = useState<boolean>('api_products_loaded', () => false)

  async function refresh() {
    const result = await api<PageResult<Product>>('/products?limit=100')
    products.value = result.items.map(product => ({ ...product, size_kg: Number(product.size_kg) }))
    loaded.value = true
    return products.value
  }
  async function addProduct(payload: CreateProductPayload) {
    const product = await api<Product>('/products', { method: 'POST', body: payload })
    await refresh()
    return product
  }
  async function updateProduct(id: string, payload: UpdateProductPayload) {
    const product = await api<Product>(`/products/${id}`, { method: 'PATCH', body: payload })
    await refresh()
    return product
  }
  async function toggleProductStatus(id: string) {
    const product = products.value.find(item => item.id === id)
    if (!product) throw new Error('Produk tidak ditemukan.')
    return updateProduct(id, { active: !product.active })
  }
  if (import.meta.client) onMounted(() => { if (!loaded.value) refresh().catch(() => {}) })
  return { products, refresh, addProduct, updateProduct, toggleProductStatus }
}
