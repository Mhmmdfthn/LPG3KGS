<script setup lang="ts">
interface Props {
  modelValue?: string | number
  label?: string
  id?: string
  type?: string
  placeholder?: string
  helperText?: string
  errorText?: string
  disabled?: boolean
  required?: boolean
  prefix?: string
  suffix?: string
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: '',
  type: 'text',
  disabled: false,
  required: false
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: string | number): void
}>()

const inputId = computed(() => props.id || `input-${Math.random().toString(36).substring(2, 9)}`)

function handleInput(event: Event) {
  const target = event.target as HTMLInputElement
  emit('update:modelValue', props.type === 'number' ? (target.value === '' ? '' : Number(target.value)) : target.value)
}
</script>

<template>
  <div class="form-group" :class="{ 'has-error': !!errorText, 'is-disabled': disabled }">
    <label v-if="label" :for="inputId" class="form-label">
      {{ label }}
      <span v-if="required" class="required-star">*</span>
    </label>

    <div class="input-wrapper">
      <span v-if="prefix" class="input-affix prefix">{{ prefix }}</span>
      <input
        :id="inputId"
        :type="type"
        :value="modelValue"
        :placeholder="placeholder"
        :disabled="disabled"
        :required="required"
        class="form-input"
        :class="{ 'has-prefix': !!prefix, 'has-suffix': !!suffix }"
        @input="handleInput"
      />
      <span v-if="suffix" class="input-affix suffix">{{ suffix }}</span>
    </div>

    <p v-if="errorText" class="form-feedback error">{{ errorText }}</p>
    <p v-else-if="helperText" class="form-feedback helper">{{ helperText }}</p>
  </div>
</template>

<style scoped>
.form-group {
  display: flex;
  flex-direction: column;
  margin-bottom: var(--space-4);
  width: 100%;
}

.form-label {
  font-size: var(--font-size-sm);
  font-weight: 600;
  color: var(--color-text);
  margin-bottom: var(--space-1);
  display: block;
}

.required-star {
  color: var(--color-danger);
  margin-left: 2px;
}

.input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
  width: 100%;
}

.form-input {
  width: 100%;
  height: 44px;
  padding: 0 var(--space-3);
  font-size: var(--font-size-base);
  font-family: inherit;
  color: var(--color-text);
  background-color: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  transition: border-color var(--transition-fast), box-shadow var(--transition-fast);
}

.form-input:focus {
  outline: none;
  border-color: var(--color-primary-600);
  box-shadow: 0 0 0 3px var(--color-primary-100);
}

.form-input:disabled {
  background-color: var(--color-surface-subtle);
  color: var(--color-text-subtle);
  cursor: not-allowed;
}

.has-prefix {
  padding-left: var(--space-8);
}

.has-suffix {
  padding-right: var(--space-8);
}

.input-affix {
  position: absolute;
  font-size: var(--font-size-sm);
  color: var(--color-text-muted);
  pointer-events: none;
}

.input-affix.prefix {
  left: var(--space-3);
}

.input-affix.suffix {
  right: var(--space-3);
}

/* Error States */
.has-error .form-input {
  border-color: var(--color-danger);
}

.has-error .form-input:focus {
  box-shadow: 0 0 0 3px var(--color-danger-bg);
}

.form-feedback {
  font-size: var(--font-size-xs);
  margin-top: var(--space-1);
}

.form-feedback.error {
  color: var(--color-danger);
  font-weight: 500;
}

.form-feedback.helper {
  color: var(--color-text-muted);
}
</style>

