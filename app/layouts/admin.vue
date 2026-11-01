<script setup lang="ts">
const isMobileDrawerOpen = ref(false)

function closeDrawer() {
  isMobileDrawerOpen.value = false
}

// Navigasi lengkap khusus Role Admin
const navGroups = [
  {
    title: 'Ringkasan Usaha',
    items: [
      { label: 'Dashboard', to: '/admin', icon: '📊' }
    ]
  },
  {
    title: 'Manajemen Pengguna',
    items: [
      { label: 'Kelola Pengguna', to: '/admin/users', icon: '👥' },
      { label: 'Persetujuan Pengecer', to: '/admin/users/pending', icon: '⏳' }
    ]
  },
  {
    title: 'Katalog & Inventaris',
    items: [
      { label: 'Produk & Harga', to: '/admin/products', icon: '🏷️' },
      { label: 'Ringkasan Stok', to: '/admin/inventory', icon: '📦' },
      { label: 'Catat Pasokan Agen', to: '/admin/inventory/receipts', icon: '🚚' },
      { label: 'Riwayat Pergerakan Stok', to: '/admin/inventory/movements', icon: '📜' },
      { label: 'Koreksi Stok Fisik', to: '/admin/inventory/adjustments', icon: '⚙️' }
    ]
  },
  {
    title: 'Pesanan & Transaksi',
    items: [
      { label: 'Pesanan Masuk', to: '/admin/orders', icon: '📥' },
      { label: 'Penjualan Langsung', to: '/admin/sales/direct', icon: '⚡' },
      { label: 'Pembayaran & Piutang', to: '/admin/receivables', icon: '💰' }
    ]
  },
  {
    title: 'Laporan & Audit',
    items: [
      { label: 'Laporan Penjualan', to: '/admin/reports/sales', icon: '📈' },
      { label: 'Laporan Pergerakan Stok', to: '/admin/reports/inventory', icon: '📋' },
      { label: 'Laporan Piutang', to: '/admin/reports/receivables', icon: '📑' },
      { label: 'Jejak Audit Aktivitas', to: '/admin/audit-logs', icon: '🔍' }
    ]
  }
]
</script>

<template>
  <div class="shell-layout">
    <!-- Top Header -->
    <NavbarHeader
      role="admin"
      title="Admin Panel — LPG3KGS"
      @toggle-sidebar="isMobileDrawerOpen = !isMobileDrawerOpen"
    />

    <div class="shell-body">
      <!-- Desktop Sidebar -->
      <aside class="shell-sidebar hide-mobile">
        <nav class="sidebar-nav">
          <div v-for="group in navGroups" :key="group.title" class="nav-group">
            <h4 class="nav-group-title">{{ group.title }}</h4>
            <ul class="nav-list">
              <li v-for="item in group.items" :key="item.to">
                <NuxtLink
                  :to="item.to"
                  class="nav-item"
                  active-class="is-active"
                  exact-active-class="is-exact-active"
                >
                  <span class="nav-item-icon">{{ item.icon }}</span>
                  <span class="nav-item-label">{{ item.label }}</span>
                </NuxtLink>
              </li>
            </ul>
          </div>
        </nav>
      </aside>

      <!-- Mobile Drawer Backdrop & Sidebar -->
      <Transition name="drawer-fade">
        <div
          v-if="isMobileDrawerOpen"
          class="drawer-backdrop hide-desktop"
          @click="closeDrawer"
        />
      </Transition>

      <aside
        :class="['mobile-drawer hide-desktop', { 'is-open': isMobileDrawerOpen }]"
        aria-label="Menu navigasi mobile admin"
      >
        <div class="drawer-header">
          <div class="drawer-brand">
            <span class="brand-badge">ADMIN</span>
            <span class="drawer-title">Menu Utama</span>
          </div>
          <button type="button" class="drawer-close-btn" @click="closeDrawer">✕</button>
        </div>

        <nav class="drawer-nav">
          <div v-for="group in navGroups" :key="group.title" class="nav-group">
            <h4 class="nav-group-title">{{ group.title }}</h4>
            <ul class="nav-list">
              <li v-for="item in group.items" :key="item.to">
                <NuxtLink
                  :to="item.to"
                  class="nav-item"
                  active-class="is-active"
                  exact-active-class="is-exact-active"
                  @click="closeDrawer"
                >
                  <span class="nav-item-icon">{{ item.icon }}</span>
                  <span class="nav-item-label">{{ item.label }}</span>
                </NuxtLink>
              </li>
            </ul>
          </div>
        </nav>
      </aside>

      <!-- Main Content Area -->
      <main class="shell-content">
        <div class="container-content">
          <slot />
        </div>
      </main>
    </div>

    <!-- Toast Notifications -->
    <ToastContainer />
  </div>
</template>

<style scoped>
.shell-layout {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: var(--color-bg);
}

.shell-body {
  display: flex;
  flex: 1 1 auto;
}

/* Sidebar Desktop */
.shell-sidebar {
  width: var(--sidebar-width);
  background-color: var(--color-surface);
  border-right: 1px solid var(--color-border);
  flex-shrink: 0;
  position: sticky;
  top: var(--header-height);
  height: calc(100vh - var(--header-height));
  overflow-y: auto;
  padding: var(--space-4) var(--space-3);
}

.nav-group {
  margin-bottom: var(--space-5);
}

.nav-group-title {
  font-size: var(--font-size-xs);
  font-weight: 700;
  color: var(--color-text-subtle);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  padding: 0 var(--space-3) var(--space-2);
}

.nav-list {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: 8px var(--space-3);
  border-radius: var(--radius-md);
  font-size: var(--font-size-sm);
  font-weight: 500;
  color: var(--color-text);
  text-decoration: none;
  transition: all var(--transition-fast);
}

.nav-item:hover {
  background-color: var(--color-surface-subtle);
  color: var(--color-primary-700);
}

.nav-item.is-exact-active,
.nav-item.is-active {
  background-color: var(--color-primary-100);
  color: var(--color-primary-900);
  font-weight: 700;
}

.nav-item-icon {
  font-size: 16px;
  flex-shrink: 0;
}

.nav-item-label {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* Mobile Drawer */
.drawer-backdrop {
  position: fixed;
  inset: 0;
  background-color: rgba(18, 48, 71, 0.45);
  z-index: 100;
}

.mobile-drawer {
  position: fixed;
  top: 0;
  bottom: 0;
  left: 0;
  width: 280px;
  max-width: 85vw;
  background-color: var(--color-surface);
  z-index: 110;
  display: flex;
  flex-direction: column;
  transform: translateX(-100%);
  transition: transform var(--transition-normal);
  box-shadow: var(--shadow-lg);
}

.mobile-drawer.is-open {
  transform: translateX(0);
}

.drawer-header {
  height: var(--header-height);
  padding: 0 var(--space-4);
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid var(--color-border);
}

.drawer-brand {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.brand-badge {
  background-color: var(--color-primary-900);
  color: #ffffff;
  font-size: var(--font-size-xs);
  font-weight: 700;
  padding: 2px 6px;
  border-radius: var(--radius-xs);
}

.drawer-title {
  font-size: var(--font-size-md);
  font-weight: 700;
  color: var(--color-text);
}

.drawer-close-btn {
  font-size: 18px;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-full);
  color: var(--color-text-muted);
}

.drawer-nav {
  flex: 1 1 auto;
  overflow-y: auto;
  padding: var(--space-4) var(--space-3);
}

/* Content Area */
.shell-content {
  flex: 1 1 auto;
  min-width: 0;
  padding: var(--space-4);
}

@media (min-width: 640px) {
  .shell-content {
    padding: var(--space-6);
  }
}

.container-content {
  max-width: 1200px;
  margin: 0 auto;
}

/* Animations */
.drawer-fade-enter-active,
.drawer-fade-leave-active {
  transition: opacity 0.2s ease;
}

.drawer-fade-enter-from,
.drawer-fade-leave-to {
  opacity: 0;
}
</style>

