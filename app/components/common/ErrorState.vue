<script setup lang="ts">
interface Props {
  title?: string
  message?: string
  retryLabel?: string
}

withDefaults(defineProps<Props>(), {
  title: 'Gagal Memuat Data',
  message: 'Terjadi kendala saat mengambil data. Silakan coba kembali.',
  retryLabel: 'Coba Lagi'
})

defineEmits<{
  (e: 'retry'): void
}>()
</script>

<template>
  <div class="error-state" role="alert">
    <div class="error-icon" aria-hidden="true">⚠️</div>
    <h3 class="error-title">{{ title }}</h3>
    <p class="error-message">{{ message }}</p>
    <div class="error-action">
      <BaseButton variant="secondary" size="sm" @click="$emit('retry')">
        {{ retryLabel }}
      </BaseButton>
    </div>
  </div>
</template>

<style scoped>
.error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--space-8) var(--space-4);
  text-align: center;
  background-color: var(--color-danger-bg);
  border: 1px solid var(--color-danger-border);
  border-radius: var(--radius-lg);
  margin: var(--space-4) 0;
}

.error-icon {
  font-size: 32px;
  margin-bottom: var(--space-2);
}

.error-title {
  font-size: var(--font-size-md);
  font-weight: 700;
  color: var(--color-danger);
  margin-bottom: var(--space-1);
}

.error-message {
  font-size: var(--font-size-sm);
  color: #7a151f;
  max-width: 420px;
  margin-bottom: var(--space-4);
  line-height: var(--line-height-normal);
}
</style>

