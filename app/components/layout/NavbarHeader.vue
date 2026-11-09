<script setup lang="ts">
interface Props {
  role: 'admin' | 'karyawan' | 'pengecer'
  title?: string
}

defineProps<Props>()

const emit = defineEmits<{
  (e: 'toggle-sidebar'): void
}>()

const { currentUser, switchRole, logout } = useAuth()
const isRoleModalOpen = ref(false)

const roleNameMap: Record<string, string> = {
  admin: 'Admin / Pemilik',
  karyawan: 'Karyawan',
  pengecer: 'Pengecer B2B'
}
</script>

<template>
  <header class="app-header">
    <div class="header-left">
      <button
        v-if="false"
        type="button"
        class="menu-toggle-btn hide-desktop"
        aria-label="Buka menu navigasi"
        @click="$emit('toggle-sidebar')"
      >
        â˜°
      </button>

      <div class="header-brand">
        <span class="brand-badge">LPG 3KG</span>
        <h1 class="header-title">{{ title || 'Sistem Pangkalan LPG' }}</h1>
      </div>
    </div>

    <div class="header-right">
      <!-- Role Preview Badge & Quick Switcher -->
      <button
        type="button"
        class="role-preview-btn"
        title="Klik untuk mengganti simulasi role pengguna"
        @click="isRoleModalOpen = true"
      >
        <span class="preview-dot" />
        <span class="role-text">{{ roleNameMap[role] }}</span>
        <span class="switch-hint">Ganti â–¼</span>
      </button>

      <!-- User Profile Menu -->
      <BaseDropdown align="right">
        <template #trigger="{ isOpen }">
          <div class="user-pill" :class="{ 'is-active': isOpen }">
            <div class="avatar">{{ currentUser?.name ? currentUser.name.charAt(0) : 'U' }}</div>
            <div class="user-info hide-mobile">
              <span class="user-name">{{ currentUser?.name || 'Tamu' }}</span>
              <span class="user-biz">{{ currentUser?.business_name || roleNameMap[role] }}</span>
            </div>
          </div>
        </template>

        <template #default="{ close }">
          <div class="user-dropdown-header">
            <strong>{{ currentUser?.name || 'Tamu' }}</strong>
            <small>{{ currentUser?.contact || '-' }}</small>
          </div>
          <div class="dropdown-divider" />
          <NuxtLink to="/profile" class="dropdown-link" @click="close">
            ðŸ‘¤ Profil & Sandi
          </NuxtLink>
          <NuxtLink to="/" class="dropdown-link" @click="close">
            ðŸ  Switcher Preview
          </NuxtLink>
          <div class="dropdown-divider" />
          <button class="dropdown-link text-danger" @click="close(); logout()">
            Keluar
          </button>
        </template>
      </BaseDropdown>
    </div>

    <!-- Role Switcher Modal -->
    <BaseModal
      v-if="false"
      :is-open="isRoleModalOpen"
      title="Pilih Simulasi Role Pengguna"
      max-width="460px"
      @close="isRoleModalOpen = false"
    >
      <p class="modal-desc">
        Pilih peran yang ingin disimulasikan untuk menguji tata letak, menu navigasi, dan hak akses antarmuka secara instan:
      </p>

      <div class="role-selection-list">
        <button
          type="button"
          class="role-select-item"
          :class="{ 'is-active': role === 'admin' }"
          @click="switchRole('admin'); isRoleModalOpen = false; navigateTo('/admin')"
        >
          <div class="role-icon">ðŸ‘‘</div>
          <div class="role-details">
            <strong>Admin (Pemilik Pangkalan)</strong>
            <span>Akses penuh: dashboard agregat, stok, akun, produk, dan laporan usaha.</span>
          </div>
        </button>

        <button
          type="button"
          class="role-select-item"
          :class="{ 'is-active': role === 'karyawan' }"
          @click="switchRole('karyawan'); isRoleModalOpen = false; navigateTo('/staff')"
        >
          <div class="role-icon">ðŸ‘·</div>
          <div class="role-details">
            <strong>Karyawan (Petugas Operasional)</strong>
            <span>Akses operasional: pesanan masuk, serah-terima, pasokan, dan penjualan langsung.</span>
          </div>
        </button>

        <button
          type="button"
          class="role-select-item"
          :class="{ 'is-active': role === 'pengecer' }"
          @click="switchRole('pengecer'); isRoleModalOpen = false; navigateTo('/retailer')"
        >
          <div class="role-icon">ðŸª</div>
          <div class="role-details">
            <strong>Pengecer B2B (Mitra Warung)</strong>
            <span>Tampilan mobile-first: katalog, stok tersedia, keranjang, pesanan, dan tagihan bon.</span>
          </div>
        </button>
      </div>

      <template #footer>
        <BaseButton variant="secondary" @click="isRoleModalOpen = false">
          Tutup
        </BaseButton>
      </template>
    </BaseModal>
  </header>
</template>

<style scoped>
.app-header {
  height: var(--header-height);
  background-color: var(--color-surface);
  border-bottom: 1px solid var(--color-border);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 var(--space-4);
  position: sticky;
  top: 0;
  z-index: 40;
}

@media (min-width: 640px) {
  .app-header {
    padding: 0 var(--space-6);
  }
}

.header-left {
  display: flex;
  align-items: center;
  gap: var(--space-3);
}

.menu-toggle-btn {
  font-size: 20px;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-md);
  color: var(--color-text);
  border: 1px solid var(--color-border);
}

.menu-toggle-btn:hover {
  background-color: var(--color-surface-subtle);
}

.header-brand {
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
  letter-spacing: 0.05em;
}

.header-title {
  font-size: var(--font-size-md);
  font-weight: 700;
  color: var(--color-text);
}

.header-right {
  display: flex;
  align-items: center;
  gap: var(--space-3);
}

/* Role preview switcher */
.role-preview-btn {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  padding: 6px 12px;
  background-color: var(--color-primary-100);
  color: var(--color-primary-800);
  border: 1px solid var(--color-primary-600);
  border-radius: var(--radius-full);
  font-size: var(--font-size-xs);
  font-weight: 600;
  cursor: pointer;
  transition: all var(--transition-fast);
}

.role-preview-btn:hover {
  background-color: #d8ebed;
}

.preview-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background-color: var(--color-primary-600);
  animation: pulse 2s infinite;
}

.switch-hint {
  font-size: 10px;
  opacity: 0.7;
}

@keyframes pulse {
  0% { transform: scale(0.95); opacity: 0.8; }
  50% { transform: scale(1.2); opacity: 1; }
  100% { transform: scale(0.95); opacity: 0.8; }
}

/* User pill */
.user-pill {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: 4px 8px;
  border-radius: var(--radius-full);
  cursor: pointer;
  transition: background-color var(--transition-fast);
}

.user-pill:hover,
.user-pill.is-active {
  background-color: var(--color-surface-subtle);
}

.avatar {
  width: 34px;
  height: 34px;
  border-radius: 50%;
  background-color: var(--color-primary-700);
  color: #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: var(--font-size-sm);
}

.user-info {
  display: flex;
  flex-direction: column;
  text-align: left;
}

.user-name {
  font-size: var(--font-size-sm);
  font-weight: 600;
  color: var(--color-text);
  line-height: 1.2;
}

.user-biz {
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
}

/* Dropdown items */
.user-dropdown-header {
  padding: var(--space-2) var(--space-3);
  display: flex;
  flex-direction: column;
}

.user-dropdown-header strong {
  font-size: var(--font-size-sm);
  color: var(--color-text);
}

.user-dropdown-header small {
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
}

.dropdown-divider {
  height: 1px;
  background-color: var(--color-border);
  margin: var(--space-1) 0;
}

.dropdown-link {
  display: flex;
  align-items: center;
  padding: var(--space-2) var(--space-3);
  font-size: var(--font-size-sm);
  color: var(--color-text);
  border-radius: var(--radius-sm);
  transition: background-color var(--transition-fast);
}

.dropdown-link:hover {
  background-color: var(--color-surface-subtle);
}

/* Role modal */
.modal-desc {
  font-size: var(--font-size-sm);
  color: var(--color-text-muted);
  margin-bottom: var(--space-4);
}

.role-selection-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.role-select-item {
  display: flex;
  align-items: flex-start;
  gap: var(--space-3);
  padding: var(--space-3) var(--space-4);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  background-color: var(--color-surface);
  text-align: left;
  cursor: pointer;
  transition: all var(--transition-fast);
}

.role-select-item:hover {
  border-color: var(--color-primary-600);
  background-color: var(--color-primary-50);
}

.role-select-item.is-active {
  border-color: var(--color-primary-700);
  background-color: var(--color-primary-100);
  box-shadow: 0 0 0 2px var(--color-primary-700);
}

.role-icon {
  font-size: 24px;
}

.role-details {
  display: flex;
  flex-direction: column;
}

.role-details strong {
  font-size: var(--font-size-base);
  color: var(--color-text);
  margin-bottom: 2px;
}

.role-details span {
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
  line-height: var(--line-height-normal);
}
</style>

