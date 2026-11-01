<script setup lang="ts">
interface Props {
  status?: string
  label?: string
  variant?: 'success' | 'warning' | 'danger' | 'info' | 'neutral'
  size?: 'sm' | 'md'
}

const props = withDefaults(defineProps<Props>(), {
  size: 'md'
})

// Pemetaan status backend ke label bahasa Indonesia dan warna design system
const mapped = computed(() => {
  if (props.variant) {
    return {
      variant: props.variant,
      label: props.label || props.status || '-'
    }
  }

  const s = props.status?.toUpperCase()

  switch (s) {
    // Order Statuses
    case 'MENUNGGU_KONFIRMASI':
      return { variant: 'warning', label: 'Menunggu Konfirmasi' }
    case 'DIKONFIRMASI':
      return { variant: 'info', label: 'Dikonfirmasi' }
    case 'SELESAI':
      return { variant: 'success', label: 'Selesai' }
    case 'DITOLAK':
      return { variant: 'danger', label: 'Ditolak' }
    case 'DIBATALKAN':
      return { variant: 'neutral', label: 'Dibatalkan' }

    // Payment Statuses
    case 'LUNAS':
      return { variant: 'success', label: 'Lunas' }
    case 'DIBAYAR_SEBAGIAN':
      return { variant: 'info', label: 'Dibayar Sebagian' }
    case 'BELUM_DIBAYAR':
      return { variant: 'warning', label: 'Belum Dibayar' }

    // User / Account Statuses
    case 'ACTIVE':
    case 'AKTIF':
      return { variant: 'success', label: 'Aktif' }
    case 'PENDING':
      return { variant: 'warning', label: 'Menunggu Persetujuan' }
    case 'REJECTED':
      return { variant: 'danger', label: 'Ditolak' }
    case 'INACTIVE':
    case 'NONAKTIF':
      return { variant: 'neutral', label: 'Nonaktif' }

    // Stock
    case 'LOW_STOCK':
      return { variant: 'warning', label: 'Stok Menipis' }

    default:
      return {
        variant: 'neutral',
        label: props.label || props.status || '-'
      }
  }
})
</script>

<template>
  <span
    :class="[
      'badge',
      `badge-${mapped.variant}`,
      `badge-${size}`
    ]"
  >
    <span class="badge-dot" aria-hidden="true" />
    <span class="badge-text">{{ mapped.label }}</span>
  </span>
</template>

<style scoped>
.badge {
  display: inline-flex;
  align-items: center;
  gap: var(--space-1);
  font-weight: 600;
  border-radius: var(--radius-full);
  line-height: 1;
  white-space: nowrap;
  border: 1px solid transparent;
}

.badge-sm {
  padding: 3px 8px;
  font-size: var(--font-size-xs);
}

.badge-md {
  padding: 5px 10px;
  font-size: var(--font-size-sm);
}

.badge-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background-color: currentColor;
}

/* Variant Themes */
.badge-success {
  background-color: var(--color-success-bg);
  color: var(--color-success);
  border-color: var(--color-success-border);
}

.badge-warning {
  background-color: var(--color-warning-bg);
  color: var(--color-warning);
  border-color: var(--color-warning-border);
}

.badge-danger {
  background-color: var(--color-danger-bg);
  color: var(--color-danger);
  border-color: var(--color-danger-border);
}

.badge-info {
  background-color: var(--color-info-bg);
  color: var(--color-info);
  border-color: var(--color-info-border);
}

.badge-neutral {
  background-color: var(--color-surface-subtle);
  color: var(--color-text-muted);
  border-color: var(--color-border);
}
</style>

