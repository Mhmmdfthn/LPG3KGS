<script setup lang="ts">
definePageMeta({
  layout: 'default'
})

const { switchRole } = useMockAuth()

function goToRole(role: 'admin' | 'karyawan' | 'pengecer', path: string) {
  switchRole(role)
  navigateTo(path)
}
</script>

<template>
  <div class="landing-page container">
    <div class="hero-section">
      <div class="hero-badge">FRONTEND FOUNDATION & UI SETUP</div>
      <h1 class="hero-title">Sistem Pemesanan & Manajemen Pangkalan LPG</h1>
      <p class="hero-subtitle">
        Antarmuka responsif B2B dan manajemen operasional internal pangkalan LPG resmi.
        Dibangun dengan Nuxt 4, Vue 3, TypeScript, dan CSS Native berdasarkan Design System PRD V1.
      </p>
    </div>

    <!-- Role Preview Selection Cards -->
    <div class="section-title-wrap">
      <h2 class="section-title">Pilih Preview Layout Sesuai Role Pengguna</h2>
      <p class="section-desc">Uji coba tata letak, menu navigasi, dan interaksi komponen tanpa autentikasi backend:</p>
    </div>

    <div class="grid grid-cols-1 sm-grid-cols-2 lg-grid-cols-3 gap-6 mb-6">
      <!-- Admin Card -->
      <div class="portal-card" @click="goToRole('admin', '/admin')">
        <div class="portal-header">
          <div class="portal-icon admin-icon">👑</div>
          <StatusBadge status="ACTIVE" label="Admin / Pemilik" variant="info" />
        </div>
        <h3 class="portal-name">Panel Admin / Pemilik</h3>
        <p class="portal-desc">
          Akses menyeluruh seluruh sistem: dashboard omzet & piutang, kelola akun, persetujuan pengecer, produk, koreksi stok, dan laporan usaha.
        </p>
        <div class="portal-footer">
          <span class="portal-link">Buka Layout Admin →</span>
        </div>
      </div>

      <!-- Staff Card -->
      <div class="portal-card" @click="goToRole('karyawan', '/staff')">
        <div class="portal-header">
          <div class="portal-icon staff-icon">👷</div>
          <StatusBadge status="ACTIVE" label="Karyawan" variant="success" />
        </div>
        <h3 class="portal-name">Panel Karyawan Operasional</h3>
        <p class="portal-desc">
          Akses operasional harian terbatas: pemrosesan pesanan masuk, serah-terima fisik, pencatatan pasokan agen, dan penjualan langsung tunai.
        </p>
        <div class="portal-footer">
          <span class="portal-link">Buka Layout Karyawan →</span>
        </div>
      </div>

      <!-- Retailer Card -->
      <div class="portal-card" @click="goToRole('pengecer', '/retailer')">
        <div class="portal-header">
          <div class="portal-icon retailer-icon">🏪</div>
          <StatusBadge status="ACTIVE" label="Pengecer B2B" variant="warning" />
        </div>
        <h3 class="portal-name">Storefront Pengecer (Warung)</h3>
        <p class="portal-desc">
          Tampilan mobile-first yang nyaman untuk ponsel Android: katalog produk, stok tersedia untuk dipesan, keranjang, pesanan, dan tagihan bon.
        </p>
        <div class="portal-footer">
          <span class="portal-link">Buka Layout Pengecer →</span>
        </div>
      </div>
    </div>

    <!-- Quick Links to Public & Components Preview -->
    <div class="quick-links-section">
      <div class="section-title-wrap">
        <h2 class="section-title">Halaman Publik & Galeri Komponen</h2>
        <p class="section-desc">Eksplorasi komponen dasar dan form publik yang telah dibangun:</p>
      </div>

      <div class="grid grid-cols-1 sm-grid-cols-2 lg-grid-cols-4 gap-4">
        <NuxtLink to="/preview-components" class="quick-link-box highlight-box">
          <span class="quick-link-icon">🎨</span>
          <div>
            <strong>Galeri Komponen UI</strong>
            <small>Uji tombol, input, modal, toast, dan status badge</small>
          </div>
        </NuxtLink>

        <NuxtLink to="/login" class="quick-link-box">
          <span class="quick-link-icon">🔑</span>
          <div>
            <strong>Halaman Login (PG-01)</strong>
            <small>Form masuk dengan simulasi role</small>
          </div>
        </NuxtLink>

        <NuxtLink to="/register" class="quick-link-box">
          <span class="quick-link-icon">📝</span>
          <div>
            <strong>Registrasi Pengecer (PG-02)</strong>
            <small>Form pendaftaran mandiri tanpa NIK/KTP</small>
          </div>
        </NuxtLink>

        <NuxtLink to="/registration-pending" class="quick-link-box">
          <span class="quick-link-icon">⏳</span>
          <div>
            <strong>Menunggu Persetujuan (PG-03)</strong>
            <small>Info status pendaftaran baru</small>
          </div>
        </NuxtLink>
      </div>
    </div>
  </div>
</template>

<style scoped>
.landing-page {
  padding-top: var(--space-8);
  padding-bottom: var(--space-12);
}

.hero-section {
  text-align: center;
  max-width: 800px;
  margin: 0 auto var(--space-10);
}

.hero-badge {
  display: inline-block;
  padding: 4px 12px;
  background-color: var(--color-primary-100);
  color: var(--color-primary-800);
  border-radius: var(--radius-full);
  font-size: var(--font-size-xs);
  font-weight: 700;
  letter-spacing: 0.08em;
  margin-bottom: var(--space-3);
}

.hero-title {
  font-size: var(--font-size-2xl);
  font-weight: 800;
  color: var(--color-primary-900);
  line-height: var(--line-height-tight);
  margin-bottom: var(--space-3);
}

@media (min-width: 640px) {
  .hero-title {
    font-size: var(--font-size-3xl);
  }
}

.hero-subtitle {
  font-size: var(--font-size-md);
  color: var(--color-text-muted);
  line-height: var(--line-height-relaxed);
}

.section-title-wrap {
  margin-bottom: var(--space-4);
}

.section-title {
  font-size: var(--font-size-lg);
  font-weight: 700;
  color: var(--color-text);
}

.section-desc {
  font-size: var(--font-size-sm);
  color: var(--color-text-muted);
}

/* Portal Cards */
.portal-card {
  background-color: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-xl);
  padding: var(--space-6);
  cursor: pointer;
  transition: all var(--transition-fast);
  display: flex;
  flex-direction: column;
}

.portal-card:hover {
  border-color: var(--color-primary-600);
  transform: translateY(-3px);
  box-shadow: var(--shadow-md);
}

.portal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--space-4);
}

.portal-icon {
  width: 48px;
  height: 48px;
  border-radius: var(--radius-lg);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
}

.admin-icon {
  background-color: #EAF2FC;
}

.staff-icon {
  background-color: #E8F6EE;
}

.retailer-icon {
  background-color: #FFF4DE;
}

.portal-name {
  font-size: var(--font-size-lg);
  font-weight: 700;
  color: var(--color-text);
  margin-bottom: var(--space-2);
}

.portal-desc {
  font-size: var(--font-size-sm);
  color: var(--color-text-muted);
  line-height: var(--line-height-normal);
  flex: 1 1 auto;
  margin-bottom: var(--space-5);
}

.portal-footer {
  border-top: 1px solid var(--color-border);
  padding-top: var(--space-3);
}

.portal-link {
  font-size: var(--font-size-sm);
  font-weight: 700;
  color: var(--color-primary-700);
}

/* Quick links */
.quick-links-section {
  margin-top: var(--space-8);
}

.quick-link-box {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-4);
  background-color: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  text-decoration: none;
  transition: all var(--transition-fast);
}

.quick-link-box:hover {
  border-color: var(--color-primary-600);
  background-color: var(--color-surface-subtle);
}

.highlight-box {
  border-color: var(--color-primary-600);
  background-color: var(--color-primary-50);
}

.quick-link-icon {
  font-size: 24px;
}

.quick-link-box strong {
  display: block;
  font-size: var(--font-size-sm);
  color: var(--color-text);
}

.quick-link-box small {
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
}
</style>

