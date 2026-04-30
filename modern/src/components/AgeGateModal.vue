<script setup lang="ts">
import type { AppCopy, ModeMeta } from '../types';

defineProps<{
  mode: ModeMeta;
  copy: AppCopy;
}>();

defineEmits<{
  agree: [];
  rules: [];
}>();
</script>

<template>
  <div class="modal-mask age-mask">
    <div class="age-dialog">
      <h2>
        {{ mode.name }}
        <span>{{ copy.ageGateSuffix }}</span>
      </h2>
      <p>{{ copy.ageGateDescription }}</p>
      <button class="text-link" type="button" @click="$emit('rules')">{{ copy.ageGateRulesButton }}</button>
      <button class="primary-pill" type="button" @click="$emit('agree')">{{ copy.ageGateAgreeButton }}</button>
    </div>
  </div>
</template>
