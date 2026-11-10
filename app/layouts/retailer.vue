<script setup lang="ts">
const isMobileDrawerOpen = ref(false)
const { cartCount } = useOrders()

function closeDrawer() {
  isMobileDrawerOpen.value = false
}

// Navigasi khusus Pengecer sesuai PG-22 s.d PG-27
const retailerNavItems = [
  { label: 'Katalog Produk', to: '/retailer/catalog', icon: '🛒' },
  { label: 'Keranjang Pesanan', to: '/retailer/cart', icon: '🛍️' },
  { label: 'Pesanan Saya', to: '/retailer/orders', icon: '📦' },
  { label: 'Profil Saya', to: '/profile', icon: '👤' }
]
</script>

<template>
  <div class="retailer-layout">
    <!-- Header -->
    <NavbarHeader
      role="pengecer"
      title="Pemesanan LPG — B2B"
      @toggle-sidebar="isMobileDrawerOpen = !isMobileDrawerOpen"
    />

    <div class="retailer-body">
      <!-- Desktop Sidebar -->
      <aside class="retailer-sidebar hide-mobile">
        <div class="sidebar-title">Menu Pengecer</div>
        <nav class="sidebar-nav">
          <NuxtLink
            v-for="item in retailerNavItems"
            :key="item.to"
            :to="item.to"
            class="nav-item"
            active-class="is-active"
            exact-active-class="is-exact-active"
          >
            <span class="nav-item-icon">{{ item.icon }}</span>
            <span class="nav-item-label">{{ item.label }}</span>
          </NuxtLink>
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
        aria-label="Menu navigasi mobile pengecer"
      >
        <div class="drawer-header">
          <div class="drawer-brand">
            <span class="brand-badge">PENGECER</span>
            <span class="drawer-title">Menu Utama</span>
          </div>
          <button type="button" class="drawer-close-btn" @click="closeDrawer">✕</button>
        </div>

        <nav class="drawer-nav">
          <NuxtLink
            v-for="item in retailerNavItems"
            :key="item.to"
            :to="item.to"
            class="nav-item"
            active-class="is-active"
            exact-active-class="is-exact-active"
            @click="closeDrawer"
          >
            <span class="nav-item-icon">{{ item.icon }}</span>
            <span class="nav-item-label">{{ item.label }}</span>
          </NuxtLink>
        </nav>
      </aside>

      <!-- Main Content Area -->
      <main class="retailer-content">
        <div class="container-content">
          <slot />
        </div>
      </main>
    </div>

    <!-- Mobile Bottom Navigation Bar -->
    <nav class="bottom-nav-bar hide-desktop" aria-label="Navigasi bawah mobile">
      <NuxtLink to="/retailer/catalog" class="bottom-nav-item" exact-active-class="is-active">
        <span class="bottom-nav-icon">🛒</span>
        <span class="bottom-nav-label">Katalog</span>
      </NuxtLink>
      <NuxtLink to="/retailer/cart" class="bottom-nav-item" exact-active-class="is-active">
        <span class="bottom-nav-icon nav-icon-wrap">
          🛍️
          <span v-if="cartCount > 0" class="cart-pill">{{ cartCount > 99 ? '99+' : cartCount }}</span>
        </span>
        <span class="bottom-nav-label">Keranjang</span>
      </NuxtLink>
      <NuxtLink to="/retailer/orders" class="bottom-nav-item" exact-active-class="is-active">
        <span class="bottom-nav-icon">📦</span>
        <span class="bottom-nav-label">Pesanan</span>
      </NuxtLink>
      <NuxtLink to="/profile" class="bottom-nav-item" exact-active-class="is-active">
        <span class="bottom-nav-icon">👤</span>
        <span class="bottom-nav-label">Profil</span>
      </NuxtLink>
    </nav>

    <!-- Toast Notifications -->
    <ToastContainer />
  </div>
</template>

<style scoped>
.retailer-layout {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: var(--color-bg);
}

.retailer-body {
  display: flex;
  flex: 1 1 auto;
}

.retailer-sidebar {
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

.sidebar-title {
  font-size: var(--font-size-xs);
  font-weight: 700;
  color: var(--color-text-subtle);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  padding: 0 var(--space-3) var(--space-2);
}

.sidebar-nav {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: 10px var(--space-3);
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
  font-size: 18px;
}

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
  background-color: var(--color-primary-700);
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
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.retailer-content {
  flex: 1 1 auto;
  min-width: 0;
  padding: var(--space-4);
  /* Beri ruang ekstra di bawah pada mobile agar tidak tertutup bottom nav */
  padding-bottom: calc(var(--bottom-nav-height) + var(--space-6));
}

@media (min-width: 1024px) {
  .retailer-content {
    padding: var(--space-6);
  }
}

.container-content {
  max-width: 1080px;
  margin: 0 auto;
}

/* Mobile Bottom Navigation Bar */
.bottom-nav-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: var(--bottom-nav-height);
  background-color: var(--color-surface);
  border-top: 1px solid var(--color-border);
  display: flex;
  align-items: center;
  justify-content: space-around;
  z-index: 50;
  box-shadow: 0 -2px 10px rgba(18, 48, 71, 0.06);
}

.bottom-nav-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  flex: 1 1 0;
  height: 100%;
  color: var(--color-text-muted);
  text-decoration: none;
  font-size: 10px;
  font-weight: 600;
  gap: 2px;
  transition: color var(--transition-fast);
}

.bottom-nav-item:hover {
  color: var(--color-primary-700);
}

.bottom-nav-item.is-active {
  color: var(--color-primary-700);
}

.bottom-nav-icon {
  font-size: 18px;
  line-height: 1;
}

.nav-icon-wrap {
  position: relative;
  display: inline-block;
}

.cart-pill {
  position: absolute;
  top: -4px;
  right: -8px;
  background-color: var(--color-danger);
  color: #ffffff;
  font-size: 9px;
  font-weight: 700;
  border-radius: var(--radius-full);
  padding: 1px 4px;
  line-height: 1;
}

.bottom-nav-label {
  line-height: 1;
}
</style>

