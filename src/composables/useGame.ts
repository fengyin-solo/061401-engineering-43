import { ref, computed } from 'vue'
import type { GameState, LogEntry, RandomEvent, ActionType, ActionEffect } from '@/types/game'
import { randomEvents } from '@/data/events'

const STORAGE_KEY_HIGH_SCORE = 'survival_game_high_score'
export const MAX_STAT = 100

export const actionEffects: Record<ActionType, ActionEffect> = {
  gatherWood: {
    health: -5, hunger: 5, thirst: 3, wood: 10, stone: 0 },
  gatherStone: {
    health: -8, hunger: 6, thirst: 4, wood: 0, stone: 8 },
  hunt: {
    health: 15, hunger: -20, thirst: 5, wood: -5, stone: 0 },
  drink: {
    health: 0, hunger: 2, thirst: -25, wood: -3, stone: 0 },
}

export const actionNames: Record<ActionType, string> = {
  gatherWood: '采集木头',
  gatherStone: '采集石头',
  hunt: '打猎',
  drink: '喝水',
}

export function clampStat(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}

export function applyEffectsToState(state: GameState, effects: ActionEffect): GameState {
  const newState = { ...state }
  if (effects.health !== undefined) {
    newState.health = clampStat(newState.health + effects.health, 0, MAX_STAT)
  }
  if (effects.hunger !== undefined) {
    newState.hunger = clampStat(newState.hunger + effects.hunger, 0, MAX_STAT)
  }
  if (effects.thirst !== undefined) {
    newState.thirst = clampStat(newState.thirst + effects.thirst, 0, MAX_STAT)
  }
  if (effects.wood !== undefined) {
    newState.wood = Math.max(0, newState.wood + effects.wood)
  }
  if (effects.stone !== undefined) {
    newState.stone = Math.max(0, newState.stone + effects.stone)
  }
  return newState
}

export function isGameOverState(state: GameState): boolean {
  return state.health <= 0 || state.hunger >= MAX_STAT || state.thirst >= MAX_STAT
}

export function canPerformActionWithState(state: GameState, action: ActionType): boolean {
  if (state.isGameOver) return false
  const effects = actionEffects[action]
  if (effects.wood !== undefined && state.wood + effects.wood < 0) {
    return false
  }
  if (effects.stone !== undefined && state.stone + effects.stone < 0) {
    return false
  }
  return true
}

export function createInitialState(): GameState {
  return {
    health: 80,
    hunger: 30,
    thirst: 30,
    wood: 10,
    stone: 5,
    turn: 0,
    isGameOver: false,
    logs: [],
  }
}

export interface SimulateActionResult {
  newState: GameState
  actionLog: LogEntry
  eventLog: LogEntry
  gameOverLog?: LogEntry
  triggeredGameOver: boolean
}

export function simulateAction(
  state: GameState,
  action: ActionType,
  event: RandomEvent,
  logIdStart: number = 1,
): SimulateActionResult | null {
  if (!canPerformActionWithState(state, action)) return null

  let newState = applyEffectsToState(state, actionEffects[action])
  newState.turn = state.turn + 1
  newState.logs = [...state.logs]

  let logId = logIdStart
  const actionLog: LogEntry = {
    id: logId++,
    text: `第 ${newState.turn} 回合：${actionNames[action]}`,
    type: 'action',
    turn: newState.turn,
  }
  newState.logs.unshift(actionLog)

  newState = applyEffectsToState(newState, event.effects)

  const eventLogType = event.type === 'good' ? 'good' : event.type === 'bad' ? 'bad' : 'event'
  const eventLog: LogEntry = {
    id: logId++,
    text: event.text,
    type: eventLogType,
    turn: newState.turn,
  }
  newState.logs.unshift(eventLog)

  let gameOverLog: LogEntry | undefined
  let triggeredGameOver = false
  if (isGameOverState(newState)) {
    newState.isGameOver = true
    triggeredGameOver = true
    gameOverLog = {
      id: logId++,
      text: '你没能在荒野中生存下来...',
      type: 'system',
      turn: newState.turn,
    }
    newState.logs.unshift(gameOverLog)
  }

  if (newState.logs.length > 50) {
    newState.logs = newState.logs.slice(0, 50)
  }

  return {
    newState,
    actionLog,
    eventLog,
    gameOverLog,
    triggeredGameOver,
  }
}

export function useGame() {
  const state = ref<GameState>(createInitialState())
  const highScore = ref<number>(0)
  let logIdCounter = 0

  const canAct = computed(() => !state.value.isGameOver)

  function loadHighScore() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_HIGH_SCORE)
      if (saved) {
        highScore.value = parseInt(saved, 10) || 0
      }
    } catch (e) {
      highScore.value = 0
    }
  }

  function saveHighScore() {
    if (state.value.turn > highScore.value) {
      highScore.value = state.value.turn
      try {
        localStorage.setItem(STORAGE_KEY_HIGH_SCORE, String(highScore.value))
      } catch (e) {
        // ignore
      }
    }
  }

  function addLog(text: string, type: LogEntry['type'] = 'action') {
    state.value.logs.unshift({
      id: ++logIdCounter,
      text,
      type,
      turn: state.value.turn,
    })
    if (state.value.logs.length > 50) {
      state.value.logs.pop()
    }
  }

  function applyEffects(effects: ActionEffect) {
    state.value = applyEffectsToState(state.value, effects)
  }

  function getRandomEvent(): RandomEvent {
    const index = Math.floor(Math.random() * randomEvents.length)
    return randomEvents[index]
  }

  function checkGameOver() {
    if (isGameOverState(state.value)) {
      state.value.isGameOver = true
      saveHighScore()
      addLog('你没能在荒野中生存下来...', 'system')
    }
  }

  function canPerformAction(action: ActionType): boolean {
    return canPerformActionWithState(state.value, action)
  }

  function performAction(action: ActionType) {
    if (!canPerformAction(action)) return

    const effects = actionEffects[action]
    applyEffects(effects)
    state.value.turn++

    addLog(`第 ${state.value.turn} 回合：${actionNames[action]}`, 'action')

    const event = getRandomEvent()
    applyEffects(event.effects)

    const eventLogType = event.type === 'good' ? 'good' : event.type === 'bad' ? 'bad' : 'event'
    addLog(event.text, eventLogType)

    checkGameOver()
  }

  function gatherWood() {
    performAction('gatherWood')
  }

  function gatherStone() {
    performAction('gatherStone')
  }

  function hunt() {
    performAction('hunt')
  }

  function drink() {
    performAction('drink')
  }

  function restart() {
    state.value = createInitialState()
    logIdCounter = 0
    addLog('你醒来发现自己身处荒野中，需要想办法生存下去...', 'system')
  }

  loadHighScore()
  addLog('你醒来发现自己身处荒野中，需要想办法生存下去...', 'system')

  return {
    state,
    highScore,
    canAct,
    canPerformAction,
    gatherWood,
    gatherStone,
    hunt,
    drink,
    restart,
  }
}
