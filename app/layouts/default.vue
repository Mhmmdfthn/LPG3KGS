<template>
  <div class="layout-default">
    <header class="public-nav">
      <div class="container nav-container">
        <NuxtLink to="/" class="nav-brand">
          <span class="brand-badge">LPG 3KG</span>
          <span class="brand-name">Pangkalan LPG Berkah</span>
        </NuxtLink>

        <div class="nav-links">
          <NuxtLink to="/" class="nav-link">Switcher Role</NuxtLink>
          <NuxtLink to="/login" class="nav-link">Masuk</NuxtLink>
          <NuxtLink to="/register" class="nav-btn">Daftar Pengecer</NuxtLink>
        </div>
      </div>
    </header>

    <main class="default-main">
      <slot />
    </main>

    <footer class="public-footer">
      <div class="container">
        <p class="footer-text">
          &copy; 2026 Sistem Pemesanan dan Manajemen Pangkalan LPG (LPG3KGS). Platform B2B & Operasional Internal.
        </p>
      </div>
    </footer>

    <!-- Toast Notifications Container -->
    <ToastContainer />
  </div>
</template>

<style scoped>
.layout-default {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: var(--color-bg);
}

.public-nav {
  height: var(--header-height);
  background-color: var(--color-surface);
  border-bottom: 1px solid var(--color-border);
  position: sticky;
  top: 0;
  z-index: 30;
}

.nav-container {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.nav-brand {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  text-decoration: none;
}

.brand-badge {
  background-color: var(--color-primary-900);
  color: #ffffff;
  font-size: var(--font-size-xs);
  font-weight: 700;
  padding: 3px 8px;
  border-radius: var(--radius-xs);
  letter-spacing: 0.05em;
}

.brand-name {
  font-size: var(--font-size-md);
  font-weight: 700;
  color: var(--color-primary-900);
}

.nav-links {
  display: flex;
  align-items: center;
  gap: var(--space-3);
}

.nav-link {
  font-size: var(--font-size-sm);
  font-weight: 600;
  color: var(--color-text);
  padding: var(--space-2) var(--space-3);
  border-radius: var(--radius-md);
  transition: all var(--transition-fast);
}

.nav-link:hover {
  background-color: var(--color-surface-subtle);
  color: var(--color-primary-700);
}

.nav-btn {
  font-size: var(--font-size-sm);
  font-weight: 600;
  background-color: var(--color-primary-700);
  color: #ffffff;
  padding: 8px 16px;
  border-radius: var(--radius-md);
  transition: background-color var(--transition-fast);
}

.nav-btn:hover {
  background-color: var(--color-primary-800);
  color: #ffffff;
}

.default-main {
  flex: 1 1 auto;
}

.public-footer {
  padding: var(--space-6) 0;
  border-top: 1px solid var(--color-border);
  background-color: var(--color-surface);
  text-align: center;
}

.footer-text {
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
}
</style>

