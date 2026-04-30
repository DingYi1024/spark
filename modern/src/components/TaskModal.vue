<script setup lang="ts">
import type { AppCopy, Player } from '../types';
import { copyPlayerLabel } from '../data/copy';

defineProps<{
  player: Player;
  text: string;
  copy: AppCopy;
}>();

defineEmits<{
  complete: [];
  skip: [];
}>();
</script>

<template>
  <div class="modal-mask">
    <div class="modal-container">
      <div class="modal-content">
        <h2 class="modal-title">{{ copyPlayerLabel(player) }}{{ copy.taskTitleSuffix }}</h2>
        <p class="modal-text">{{ text }}</p>
        <button class="modal-btn" type="button" @click="$emit('complete')">{{ copy.taskCompleteButton }}</button>
        <button class="skip-btn" type="button" @click="$emit('skip')">{{ copy.taskSkipButton }}</button>
      </div>
    </div>
  </div>
</template>
