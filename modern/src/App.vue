<script setup lang="ts">
import html2canvas from 'html2canvas';
import { computed, nextTick, onBeforeUnmount, onMounted, reactive, ref } from 'vue';
import AgeGateModal from './components/AgeGateModal.vue';
import Dice3D from './components/Dice3D.vue';
import FloatingTimer from './components/FloatingTimer.vue';
import TaskModal from './components/TaskModal.vue';
import { appCopy, copyPlayerLabel, formatCopy } from './data/copy';
import { defaultMode, getModeMeta, isKnownMode, modes } from './data/modes';
import { getTaskBank } from './data/tasks';
import { advancePosition, createBoardCells, END_POSITION, getTaskOutcome, nextPlayer } from './game/engine';
import { parseDurationSeconds } from './game/timer-parser';
import type { ModeId, Player, SpecialAction } from './types';

const boyToken = new URL('../../static/male_token.svg', import.meta.url).href;
const girlToken = new URL('../../static/female_token.svg', import.meta.url).href;

const currentMode = ref<ModeId | null>(null);
const selectedHomeMode = ref<ModeId>(defaultMode.id);
const showAgeGate = ref(false);
const gameEnabled = ref(false);
const showRules = ref(false);
const taskText = ref('');
const taskAction = ref<SpecialAction | null>(null);
const taskTimerSeconds = ref<number | null>(null);
const winner = ref<Player | null>(null);
const reviewImage = ref('');
const generatingCard = ref(false);
const reviewCardRef = ref<HTMLElement | null>(null);

const game = reactive({
  boyPosition: 0,
  girlPosition: 0,
  currentPlayer: 'boy' as Player,
  stats: {
    turns: 0,
    tasks: 0,
  },
});

const boardCells = computed(() =>
  createBoardCells().map((cell) => {
    if (cell.type === 'start') return { ...cell, label: appCopy.boardStartLabel };
    if (cell.type === 'end') return { ...cell, label: appCopy.boardEndLabel };
    return cell;
  }),
);
const activeMode = computed(() => getModeMeta(currentMode.value ?? defaultMode.id));
const selectedHomeModeMeta = computed(() => getModeMeta(selectedHomeMode.value));
const activeBank = computed(() => getTaskBank(activeMode.value.id));
const isHome = computed(() => currentMode.value === null);
const hasTask = computed(() => taskText.value.length > 0);
const currentTurnLabel = computed(() => formatCopy(appCopy.turnLabelTemplate, { player: copyPlayerLabel(game.currentPlayer) }));
const winnerLabel = computed(() => (winner.value ? copyPlayerLabel(winner.value) : '???'));
const victoryMessage = computed(() => formatCopy(appCopy.victoryMessageTemplate, { player: winnerLabel.value }));
const reviewWinnerText = computed(() => formatCopy(appCopy.reviewWinnerLabel, { player: winnerLabel.value }));

function parseRoute() {
  const hash = window.location.hash.replace(/^#/, '');
  const match = hash.match(/^\/pages\/game\/([a-z][a-z0-9_-]*)$/);

  if (!match || !isKnownMode(match[1])) {
    currentMode.value = null;
    document.title = appCopy.documentTitle;
    return;
  }

  startMode(match[1]);
}

function goHome() {
  window.location.hash = '/pages/index/index';
  currentMode.value = null;
  document.title = appCopy.documentTitle;
}

function navigateToMode(modeId: ModeId) {
  window.location.hash = `/pages/game/${modeId}`;
}

function selectHomeMode(modeId: ModeId) {
  selectedHomeMode.value = modeId;
}

function startSelectedHomeMode() {
  navigateToMode(selectedHomeMode.value);
}

function startMode(modeId: ModeId) {
  currentMode.value = modeId;
  selectedHomeMode.value = modeId;
  document.title = getModeMeta(modeId).title;
  resetGame();
  showAgeGate.value = true;
  gameEnabled.value = false;
}

function resetGame() {
  game.boyPosition = 0;
  game.girlPosition = 0;
  game.currentPlayer = 'boy';
  game.stats.turns = 0;
  game.stats.tasks = 0;
  taskText.value = '';
  taskAction.value = null;
  taskTimerSeconds.value = null;
  winner.value = null;
  reviewImage.value = '';
}

function restartGame() {
  resetGame();
  gameEnabled.value = true;
}

function handleRollEnd(value: number) {
  if (!gameEnabled.value || hasTask.value || winner.value) return;

  game.stats.turns += 1;
  const key = game.currentPlayer === 'boy' ? 'boyPosition' : 'girlPosition';
  game[key] = advancePosition(game[key], value);

  window.setTimeout(() => {
    if (game[key] >= END_POSITION) {
      winner.value = game.currentPlayer;
      return;
    }

    openTask(game[key]);
  }, 260);
}

function openTask(position: number) {
  const outcome = getTaskOutcome(activeBank.value, position, game.currentPlayer);
  taskText.value = outcome.text;
  taskAction.value = outcome.action;
  taskTimerSeconds.value = parseDurationSeconds(outcome.text);
  game.stats.tasks += 1;
}

function completeTask() {
  if (taskAction.value?.type === 'move') {
    const key = game.currentPlayer === 'boy' ? 'boyPosition' : 'girlPosition';
    game[key] = taskAction.value.target;
    if (game[key] >= END_POSITION) {
      winner.value = game.currentPlayer;
    }
  }

  taskText.value = '';
  taskAction.value = null;
  taskTimerSeconds.value = null;

  if (!winner.value) {
    game.currentPlayer = nextPlayer(game.currentPlayer);
  }
}

function skipTask() {
  const entries = Object.keys(activeBank.value);
  const randomKey = entries[Math.floor(Math.random() * entries.length)];
  const outcome = getTaskOutcome(activeBank.value, Number(randomKey), game.currentPlayer);
  taskText.value = outcome.text;
  taskAction.value = outcome.action;
  taskTimerSeconds.value = parseDurationSeconds(outcome.text);
}

function agreeAgeGate() {
  showAgeGate.value = false;
  gameEnabled.value = true;
}

function closeRules() {
  showRules.value = false;
}

async function generateReviewCard() {
  if (!reviewCardRef.value || !winner.value) return;

  generatingCard.value = true;
  await nextTick();
  const canvas = await html2canvas(reviewCardRef.value, { scale: 2, backgroundColor: null });
  reviewImage.value = canvas.toDataURL('image/png');
  generatingCard.value = false;
}

onMounted(() => {
  parseRoute();
  window.addEventListener('hashchange', parseRoute);
});

onBeforeUnmount(() => {
  window.removeEventListener('hashchange', parseRoute);
});
</script>

<template>
  <main class="app-shell" :style="{ '--accent': activeMode.accent, '--soft': activeMode.soft, '--board-bg': activeMode.boardBg }">
    <section v-if="isHome" class="home-container">
      <header class="home-nav">
        <div class="home-title-block">
          <h1>{{ appCopy.homeTitle }}</h1>
          <p>{{ appCopy.homeSubtitle }}</p>
        </div>
      </header>

      <div class="home-hero" aria-hidden="true">
        <div class="home-dice-mark">
          <span></span>
          <i></i>
          <b></b>
        </div>
        <div class="home-ring home-ring-main"></div>
        <div class="home-ring home-ring-wide"></div>
      </div>

      <div class="mode-selection" aria-label="选择游戏模式">
        <div class="mode-grid">
          <button
            v-for="mode in modes"
            :key="mode.id"
            class="mode-card"
            :class="{ active: mode.id === selectedHomeMode }"
            :aria-pressed="mode.id === selectedHomeMode"
            type="button"
            @click="selectHomeMode(mode.id)"
          >
            <span class="mode-name">{{ mode.name }}</span>
          </button>
        </div>
      </div>

      <button class="home-primary" type="button" @click="startSelectedHomeMode">{{ appCopy.startButtonPrefix }}{{ selectedHomeModeMeta.name }}</button>

      <section class="game-description" aria-label="玩法说明">
        <span>{{ appCopy.homeDescriptionLabel }}</span>
        <p>{{ appCopy.homeDescription }}</p>
      </section>
    </section>

    <section v-else class="game-container" :class="`theme-${activeMode.id}`">
      <header class="game-topbar">
        <button class="back-icon" type="button" aria-label="返回" @click="goHome"></button>
        <h1>{{ appCopy.gameTitle }}</h1>
      </header>

      <nav class="mode-selector">
        <button
          v-for="mode in modes"
          :key="mode.id"
          type="button"
          :class="{ active: mode.id === activeMode.id }"
          @click="navigateToMode(mode.id)"
        >
          {{ mode.name }}
        </button>
      </nav>

      <div class="board-container">
        <div class="game-board">
          <div v-for="cell in boardCells" :key="cell.position" class="cell" :class="`cell-${cell.type}`">
            <span v-if="cell.position !== 0 || (game.boyPosition !== 0 && game.girlPosition !== 0)">{{ cell.label }}</span>
            <span v-if="game.boyPosition === cell.position && game.boyPosition !== game.girlPosition" class="chess-container boy">
              <img class="chess-icon" :src="boyToken" alt="" />
            </span>
            <span v-if="game.girlPosition === cell.position" class="chess-container girl" :class="{ same: game.boyPosition === game.girlPosition }">
              <img class="chess-icon" :src="girlToken" alt="" />
            </span>
          </div>
        </div>
      </div>

      <div class="dice-container">
        <Dice3D :caption="appCopy.diceCaption" :disabled="!gameEnabled || hasTask || Boolean(winner)" @roll-end="handleRollEnd" />
        <p class="turn-text">{{ currentTurnLabel }}</p>
      </div>

      <div class="control-container">
        <button class="btn" type="button" @click="restartGame">{{ appCopy.restartButton }}</button>
        <button class="btn back" type="button" @click="goHome">{{ appCopy.homeButton }}</button>
      </div>

      <AgeGateModal v-if="showAgeGate" :mode="activeMode" :copy="appCopy" @agree="agreeAgeGate" @rules="showRules = true" />

      <TaskModal v-if="hasTask" :player="game.currentPlayer" :text="taskText" :copy="appCopy" @complete="completeTask" @skip="skipTask" />

      <div v-if="showRules" class="modal-mask">
        <div class="rules-dialog">
          <h2>{{ activeMode.name }}{{ appCopy.rulesTitleSuffix }}</h2>
          <p>{{ appCopy.rulesIntro }}</p>
          <p>{{ appCopy.rulesTaskDescription }}</p>
          <button class="modal-btn" type="button" @click="closeRules">{{ appCopy.rulesConfirmButton }}</button>
        </div>
      </div>

      <div v-if="winner" class="modal-mask">
        <div class="victory-dialog">
          <h2>{{ appCopy.victoryTitle }}</h2>
          <p>{{ victoryMessage }}</p>
          <div class="victory-stats">
            {{ appCopy.victoryTurnsPrefix }} <strong>{{ game.stats.turns }}</strong> {{ appCopy.victoryTurnsSuffix }}<br />
            {{ appCopy.victoryTasksPrefix }} <strong>{{ game.stats.tasks }}</strong> {{ appCopy.victoryTasksSuffix }}
          </div>
          <button class="modal-btn" type="button" :disabled="generatingCard" @click="generateReviewCard">
            {{ generatingCard ? appCopy.victoryGeneratingLabel : appCopy.victoryGenerateButton }}
          </button>
          <button class="btn back" type="button" @click="restartGame">{{ appCopy.replayButton }}</button>
        </div>
      </div>

      <div v-if="reviewImage" class="modal-mask review-mask">
        <div class="review-modal">
          <h3>{{ appCopy.reviewModalTitle }}</h3>
          <img :src="reviewImage" :alt="appCopy.reviewImageAlt" />
          <button class="modal-btn" type="button" @click="reviewImage = ''">{{ appCopy.reviewBackButton }}</button>
        </div>
      </div>

      <FloatingTimer :seconds="taskTimerSeconds" :active="hasTask" :copy="appCopy" />

      <div ref="reviewCardRef" class="review-card-template" aria-hidden="true">
        <h1>{{ appCopy.reviewCardTitle }}</h1>
        <p>{{ appCopy.reviewCardSubtitle }}</p>
        <section>
          <h2>{{ reviewWinnerText }}</h2>
          <p>{{ appCopy.reviewRollsLabel }}<strong>{{ game.stats.turns }}</strong>{{ appCopy.reviewRollsSuffix }}</p>
          <p>{{ appCopy.reviewTasksLabel }}<strong>{{ game.stats.tasks }}</strong>{{ appCopy.reviewTasksSuffix }}</p>
          <p>{{ appCopy.reviewPrizeLabel }}</p>
          <small>{{ appCopy.reviewPrizeText }}</small>
        </section>
        <footer>{{ appCopy.reviewFooter }}</footer>
      </div>
    </section>
  </main>
</template>
