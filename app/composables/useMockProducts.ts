import { MOCK_PRODUCTS, type MockProduct } from '~/data/mockProducts'

export interface CreateProductPayload {
  name: string
  size_kg: number
  price: number
  minimum_stock: number
  active: boolean
}

export interface UpdateProductPayload {
  name?: string
  size_kg?: number
  price?: number
  minimum_stock?: number
  active?: boolean
}

const STORAGE_KEY = 'lpg3kgs_mock_products_v1'

export function useMockProducts() {
  // Single reactive store — dipakai bersama antar-halaman
  const products = useState<MockProduct[]>('mock_products_store', () =>
    JSON.parse(JSON.stringify(MOCK_PRODUCTS))
  )

  // Sinkronisasi dari localStorage setelah client mount (bebas hydration error)
  if (import.meta.client) {
    onMounted(() => {
      try {
        const cached = localStorage.getItem(STORAGE_KEY)
        if (cached) {
          const parsed = JSON.parse(cached)
          if (Array.isArray(parsed) && parsed.length > 0) {
            products.value = parsed
          }
        }
      } catch (e) {
        console.warn('[useMockProducts] Gagal memuat cache produk:', e)
      }
    })
  }

  function saveToStorage() {
    if (import.meta.client) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(products.value))
      } catch (e) {
        console.warn('[useMockProducts] Gagal menyimpan cache produk:', e)
      }
    }
  }

  /**
   * Tambah produk baru.
   * Produk baru mulai dengan stok nol (inventaris dikelola terpisah - PRD §Batasan).
   */
  async function addProduct(payload: CreateProductPayload): Promise<MockProduct> {
    const cleanName = payload.name.trim()
    if (!cleanName) throw new Error('Nama produk wajib diisi.')
    if (payload.size_kg <= 0) throw new Error('Berat tabung harus berupa angka positif.')
    if (payload.price < 0) throw new Error('Harga jual tidak boleh negatif.')
    if (!Number.isInteger(payload.minimum_stock) || payload.minimum_stock < 0) {
      throw new Error('Stok minimum harus berupa bilangan bulat non-negatif.')
    }

    // Cek duplikasi nama produk (case-insensitive)
    const duplicate = products.value.find(
      p => p.name.toLowerCase() === cleanName.toLowerCase()
    )
    if (duplicate) {
      throw new Error(`Produk dengan nama "${cleanName}" sudah ada. Gunakan nama berbeda.`)
    }

    const newProduct: MockProduct = {
      id: `prod-${Date.now()}`,
      name: cleanName,
      size_kg: payload.size_kg,
      price: payload.price,
      minimum_stock: payload.minimum_stock,
      active: payload.active,
      // Inventaris stok bukan tanggung jawab modul produk (PRD)
      full_qty: 0,
      empty_qty: 0,
      reserved_qty: 0,
      available_qty: 0,
      low_stock: payload.minimum_stock > 0,
    }

    products.value.push(newProduct)
    saveToStorage()
    return newProduct
  }

  /**
   * Perbarui informasi produk.
   * PENTING: Tidak mengubah data stok (full_qty, empty_qty, reserved_qty, available_qty).
   */
  async function updateProduct(productId: string, payload: UpdateProductPayload): Promise<MockProduct> {
    const target = products.value.find(p => p.id === productId)
    if (!target) throw new Error('Produk tidak ditemukan.')

    if (payload.name !== undefined) {
      const cleanName = payload.name.trim()
      if (!cleanName) throw new Error('Nama produk tidak boleh kosong.')
      const duplicate = products.value.find(
        p => p.id !== productId && p.name.toLowerCase() === cleanName.toLowerCase()
      )
      if (duplicate) throw new Error(`Nama produk "${cleanName}" sudah digunakan produk lain.`)
      target.name = cleanName
    }

    if (payload.size_kg !== undefined) {
      if (payload.size_kg <= 0) throw new Error('Berat tabung harus berupa angka positif.')
      target.size_kg = payload.size_kg
    }

    if (payload.price !== undefined) {
      if (payload.price < 0) throw new Error('Harga jual tidak boleh negatif.')
      target.price = payload.price
    }

    if (payload.minimum_stock !== undefined) {
      if (!Number.isInteger(payload.minimum_stock) || payload.minimum_stock < 0) {
        throw new Error('Stok minimum harus bilangan bulat non-negatif.')
      }
      target.minimum_stock = payload.minimum_stock
      // Perbarui flag low_stock berdasarkan minimum baru
      target.low_stock = target.available_qty < target.minimum_stock
    }

    if (payload.active !== undefined) {
      target.active = payload.active
    }

    saveToStorage()
    return target
  }

  /**
   * Toggle status aktif/nonaktif produk.
   * Produk nonaktif tetap ada dalam daftar dan stok tetap terjaga.
   */
  async function toggleProductStatus(productId: string): Promise<MockProduct> {
    const target = products.value.find(p => p.id === productId)
    if (!target) throw new Error('Produk tidak ditemukan.')

    target.active = !target.active
    saveToStorage()
    return target
  }

  /** Reset data produk ke kondisi awal (untuk keperluan demo/reset) */
  function resetDefaultProducts() {
    products.value = JSON.parse(JSON.stringify(MOCK_PRODUCTS))
    if (import.meta.client) {
      try { localStorage.removeItem(STORAGE_KEY) } catch {}
    }
  }

  return {
    products,
    addProduct,
    updateProduct,
    toggleProductStatus,
    resetDefaultProducts,
  }
}

