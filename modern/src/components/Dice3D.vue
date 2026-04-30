<script setup lang="ts">
import { onBeforeUnmount, ref } from 'vue';
import { rollDice } from '../game/engine';

const emit = defineEmits<{
  rollEnd: [value: number];
}>();

const props = defineProps<{
  disabled?: boolean;
  caption: string;
}>();

const value = ref(1);
const displayValue = ref(1);
const rolling = ref(false);
let rollingTimer: number | null = null;

function clearRollingTimer() {
  if (rollingTimer !== null) {
    window.clearInterval(rollingTimer);
    rollingTimer = null;
  }
}

function roll() {
  if (props.disabled || rolling.value) return;

  rolling.value = true;
  clearRollingTimer();
  rollingTimer = window.setInterval(() => {
    displayValue.value = rollDice();
  }, 75);

  window.setTimeout(() => {
    clearRollingTimer();
    const result = rollDice();
    value.value = result;
    displayValue.value = result;
    rolling.value = false;
    emit('rollEnd', result);
  }, 760);
}

onBeforeUnmount(clearRollingTimer);
</script>

<template>
  <button class="dice-wrap" type="button" :disabled="disabled || rolling" @click="roll">
    <span class="dice-scene" aria-hidden="true">
      <span class="dice-face" :class="{ rolling }" :data-value="displayValue">
        <span v-for="dot in displayValue" :key="dot" class="pip" />
      </span>
    </span>
    <span class="dice-caption">{{ caption }}</span>
  </button>
</template>
