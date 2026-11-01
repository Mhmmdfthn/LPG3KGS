<script setup lang="ts">
interface Props {
  modelValue?: boolean
  label?: string
  description?: string
  id?: string
  disabled?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: false,
  disabled: false
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
}>()

const checkboxId = computed(() => props.id || `checkbox-${Math.random().toString(36).substring(2, 9)}`)

function handleChange(event: Event) {
  const target = event.target as HTMLInputElement
  emit('update:modelValue', target.checked)
}
</script>

<template>
  <div class="checkbox-wrapper" :class="{ 'is-disabled': disabled }">
    <div class="checkbox-control">
      <input
        :id="checkboxId"
        type="checkbox"
        :checked="modelValue"
        :disabled="disabled"
        class="form-checkbox"
        @change="handleChange"
      />
    </div>
    <div class="checkbox-label-group">
      <label v-if="label" :for="checkboxId" class="checkbox-label">
        {{ label }}
      </label>
      <p v-if="description" class="checkbox-desc">
        {{ description }}
      </p>
    </div>
  </div>
</template>

<style scoped>
.checkbox-wrapper {
  display: flex;
  align-items: flex-start;
  gap: var(--space-2);
  margin-bottom: var(--space-3);
  cursor: pointer;
}

.checkbox-control {
  display: flex;
  align-items: center;
  height: 22px;
}

.form-checkbox {
  width: 18px;
  height: 18px;
  border-radius: var(--radius-xs);
  border: 1px solid var(--color-border-dark);
  accent-color: var(--color-primary-700);
  cursor: pointer;
}

.checkbox-label-group {
  display: flex;
  flex-direction: column;
}

.checkbox-label {
  font-size: var(--font-size-base);
  font-weight: 500;
  color: var(--color-text);
  cursor: pointer;
}

.checkbox-desc {
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
}

.is-disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.is-disabled .checkbox-label,
.is-disabled .form-checkbox {
  cursor: not-allowed;
}
</style>

