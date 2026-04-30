export type Player = 'boy' | 'girl';

export type ModeId = string;

export interface SpecialAction {
  type: 'move';
  target: number;
}

export type TaskEntry = string | { m: string; f: string; action?: SpecialAction };

export type TaskBank = Record<string, TaskEntry>;

export type TaskDatabase = Record<string, TaskBank>;

export interface ModeMeta {
  id: ModeId;
  name: string;
  title: string;
  icon: string;
  visible: boolean;
  order: number;
  taskBank: string;
  accent: string;
  soft: string;
  boardBg: string;
}

export interface AppCopy {
  documentTitle: string;
  homeTitle: string;
  homeSubtitle: string;
  homeDescriptionLabel: string;
  homeDescription: string;
  startButtonPrefix: string;
  gameTitle: string;
  boyLabel: string;
  girlLabel: string;
  turnLabelTemplate: string;
  boardStartLabel: string;
  boardEndLabel: string;
  diceCaption: string;
  ageGateSuffix: string;
  ageGateDescription: string;
  ageGateRulesButton: string;
  ageGateAgreeButton: string;
  rulesTitleSuffix: string;
  rulesIntro: string;
  rulesTaskDescription: string;
  rulesConfirmButton: string;
  restartButton: string;
  homeButton: string;
  taskTitleSuffix: string;
  taskCompleteButton: string;
  taskSkipButton: string;
  timerTitle: string;
  timerDoneButton: string;
  timerRunningButton: string;
  timerStartButton: string;
  timerPauseButton: string;
  timerResumeButton: string;
  timerResetButton: string;
  victoryTitle: string;
  victoryMessageTemplate: string;
  victoryTurnsPrefix: string;
  victoryTurnsSuffix: string;
  victoryTasksPrefix: string;
  victoryTasksSuffix: string;
  victoryGeneratingLabel: string;
  victoryGenerateButton: string;
  replayButton: string;
  reviewModalTitle: string;
  reviewBackButton: string;
  reviewImageAlt: string;
  reviewCardTitle: string;
  reviewCardSubtitle: string;
  reviewWinnerLabel: string;
  reviewRollsLabel: string;
  reviewRollsSuffix: string;
  reviewTasksLabel: string;
  reviewTasksSuffix: string;
  reviewPrizeLabel: string;
  reviewPrizeText: string;
  reviewFooter: string;
}

export interface BoardCell {
  position: number;
  label: string;
  type: 'start' | 'end' | 'special' | 'normal';
}

export interface GameStats {
  turns: number;
  tasks: number;
}
