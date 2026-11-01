<script setup lang="ts">
interface Props {
  currentPage: number
  totalPages: number
  totalItems?: number
  pageSize?: number
}

const props = withDefaults(defineProps<Props>(), {
  currentPage: 1,
  totalPages: 1,
  pageSize: 25
})

const emit = defineEmits<{
  (e: 'update:page', page: number): void
}>()

function goTo(page: number) {
  if (page >= 1 && page <= props.totalPages && page !== props.currentPage) {
    emit('update:page', page)
  }
}

const itemRange = computed(() => {
  if (!props.totalItems) return null
  const start = (props.currentPage - 1) * props.pageSize + 1
  const end = Math.min(props.currentPage * props.pageSize, props.totalItems)
  return `${start}–${end} dari ${props.totalItems}`
})
</script>

<template>
  <div class="pagination-wrapper">
    <div v-if="itemRange" class="pagination-info">
      Menampilkan {{ itemRange }} data
    </div>

    <div class="pagination-controls">
      <button
        type="button"
        class="page-btn"
        :disabled="currentPage <= 1"
        aria-label="Halaman sebelumnya"
        @click="goTo(currentPage - 1)"
      >
        ‹
      </button>

      <span class="page-current">
        Halaman <strong>{{ currentPage }}</strong> dari {{ totalPages }}
      </span>

      <button
        type="button"
        class="page-btn"
        :disabled="currentPage >= totalPages"
        aria-label="Halaman selanjutnya"
        @click="goTo(currentPage + 1)"
      >
        ›
      </button>
    </div>
  </div>
</template>

<style scoped>
.pagination-wrapper {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: var(--space-3);
  padding: var(--space-4) var(--space-2);
}

.pagination-info {
  font-size: var(--font-size-sm);
  color: var(--color-text-muted);
}

.pagination-controls {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.page-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: var(--radius-md);
  border: 1px solid var(--color-border);
  background-color: var(--color-surface);
  color: var(--color-text);
  font-size: var(--font-size-md);
  font-weight: 700;
  transition: all var(--transition-fast);
}

.page-btn:hover:not(:disabled) {
  background-color: var(--color-surface-subtle);
  border-color: var(--color-border-dark);
}

.page-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.page-current {
  font-size: var(--font-size-sm);
  color: var(--color-text);
  padding: 0 var(--space-2);
}
</style>

