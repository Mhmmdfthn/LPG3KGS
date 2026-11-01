<script setup lang="ts">
interface Props {
  align?: 'left' | 'right'
}

withDefaults(defineProps<Props>(), {
  align: 'right'
})

const isOpen = ref(false)
const dropdownRef = ref<HTMLElement | null>(null)

function toggle() {
  isOpen.value = !isOpen.value
}

function close() {
  isOpen.value = false
}

function handleClickOutside(event: MouseEvent) {
  if (dropdownRef.value && !dropdownRef.value.contains(event.target as Node)) {
    close()
  }
}

onMounted(() => {
  if (process.client) {
    window.addEventListener('click', handleClickOutside)
  }
})

onUnmounted(() => {
  if (process.client) {
    window.removeEventListener('click', handleClickOutside)
  }
})
</script>

<template>
  <div ref="dropdownRef" class="dropdown-wrapper">
    <div class="dropdown-trigger" @click.stop="toggle">
      <slot name="trigger" :is-open="isOpen" :toggle="toggle" />
    </div>

    <Transition name="dropdown-pop">
      <div
        v-if="isOpen"
        :class="['dropdown-menu', `align-${align}`]"
        @click="close"
      >
        <slot :close="close" />
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.dropdown-wrapper {
  position: relative;
  display: inline-block;
}

.dropdown-trigger {
  cursor: pointer;
}

.dropdown-menu {
  position: absolute;
  top: calc(100% + var(--space-1));
  z-index: 50;
  min-width: 180px;
  background-color: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-md);
  padding: var(--space-1);
  display: flex;
  flex-direction: column;
}

.align-left {
  left: 0;
}

.align-right {
  right: 0;
}

/* Animations */
.dropdown-pop-enter-active,
.dropdown-pop-leave-active {
  transition: opacity 0.15s ease, transform 0.15s ease;
}

.dropdown-pop-enter-from,
.dropdown-pop-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}
</style>

