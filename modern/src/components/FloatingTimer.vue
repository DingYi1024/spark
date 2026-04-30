<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue';
import type { AppCopy } from '../types';

const props = defineProps<{
  seconds: number | null;
  active: boolean;
  copy: AppCopy;
}>();

const remaining = ref(0);
const running = ref(false);
let timerId: number | null = null;

const visible = computed(() => props.active && props.seconds !== null && props.seconds > 0);
const display = computed(() => {
  const minutes = Math.floor(remaining.value / 60).toString().padStart(2, '0');
  const seconds = (remaining.value % 60).toString().padStart(2, '0');
  return `${minutes}:${seconds}`;
});

watch(
  () => props.seconds,
  (value) => {
    stop();
    remaining.value = value ?? 0;
  },
  { immediate: true },
);

function stop() {
  if (timerId !== null) {
    window.clearInterval(timerId);
    timerId = null;
  }
  running.value = false;
}

function start() {
  if (remaining.value <= 0 || running.value) return;
  running.value = true;
  timerId = window.setInterval(() => {
    remaining.value -= 1;
    if (remaining.value <= 0) stop();
  }, 1000);
}

function reset() {
  stop();
  remaining.value = props.seconds ?? 0;
}

onBeforeUnmount(stop);
</script>

<template>
  <div class="task-timer" :class="{ active: visible }">
    <div class="tt-header">{{ copy.timerTitle }}</div>
    <div class="tt-time" :class="{ done: remaining <= 0 }">{{ display }}</div>
    <div class="tt-controls">
      <button class="tt-btn start" type="button" @click="remaining <= 0 ? reset() : start()">
        {{ remaining <= 0 ? copy.timerDoneButton : running ? copy.timerRunningButton : copy.timerStartButton }}
      </button>
      <button class="tt-btn pause" type="button" @click="running ? stop() : start()">
        {{ running ? copy.timerPauseButton : copy.timerResumeButton }}
      </button>
      <button class="tt-btn reset" type="button" @click="reset">{{ copy.timerResetButton }}</button>
    </div>
  </div>
</template>
