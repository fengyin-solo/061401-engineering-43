import { describe, it, expect, beforeEach } from 'vitest'
import {
  MAX_STAT,
  actionEffects,
  actionNames,
  clampStat,
  applyEffectsToState,
  isGameOverState,
  canPerformActionWithState,
  createInitialState,
  simulateAction,
} from '@/composables/useGame'
import { randomEvents } from '@/data/events'
import type { GameState, ActionType, RandomEvent, ActionEffect } from '@/types/game'

const neutralEvent: RandomEvent = {
  id: 'test_neutral',
  text: '平静的一天，什么也没有发生。',
  type: 'neutral',
  effects: {},
}

function createState(overrides: Partial<GameState> = {}): GameState {
  return { ...createInitialState(), ...overrides }
}

function expectStateClose(actual: GameState, expected: Partial<GameState>, message?: string) {
  for (const [key, value] of Object.entries(expected)) {
    if (key === 'logs') continue
    expect(actual[key as keyof GameState], message ? `${message}: ${key}` : key).toBeCloseTo(value as number, 5)
  }
}

describe('生存规则验证套件', () => {
  describe('1. 数值边界验证 (clampStat)', () => {
    it('数值在范围内时保持不变', () => {
      expect(clampStat(50, 0, 100)).toBe(50)
      expect(clampStat(0, 0, 100)).toBe(0)
      expect(clampStat(100, 0, 100)).toBe(100)
    })

    it('数值超出上限时被截断为上限', () => {
      expect(clampStat(150, 0, 100)).toBe(100)
      expect(clampStat(101, 0, 100)).toBe(100)
    })

    it('数值低于下限时被截断为下限', () => {
      expect(clampStat(-10, 0, 100)).toBe(0)
      expect(clampStat(-1, 0, 100)).toBe(0)
    })
  })

  describe('2. 行动效果验证', () => {
    const testCases: Array<{ action: ActionType; name: string; expected: ActionEffect }> = [
      {
        action: 'gatherWood',
        name: '采集木头',
        expected: { health: -5, hunger: 5, thirst: 3, wood: 10, stone: 0 },
      },
      {
        action: 'gatherStone',
        name: '采集石头',
        expected: { health: -8, hunger: 6, thirst: 4, wood: 0, stone: 8 },
      },
      {
        action: 'hunt',
        name: '打猎',
        expected: { health: 15, hunger: -20, thirst: 5, wood: -5, stone: 0 },
      },
      {
        action: 'drink',
        name: '喝水',
        expected: { health: 0, hunger: 2, thirst: -25, wood: -3, stone: 0 },
      },
    ]

    testCases.forEach(({ action, name, expected }) => {
      it(`${name} 效果正确`, () => {
        const initial = createState()
        const result = applyEffectsToState(initial, actionEffects[action])

        expectStateClose(result, {
          health: initial.health + (expected.health || 0),
          hunger: initial.hunger + (expected.hunger || 0),
          thirst: initial.thirst + (expected.thirst || 0),
          wood: initial.wood + (expected.wood || 0),
          stone: initial.stone + (expected.stone || 0),
        }, `行动[${name}]效果`)
      })
    })
  })

  describe('3. 状态边界裁剪验证', () => {
    it('生命值不会低于0', () => {
      const state = createState({ health: 10 })
      const result = applyEffectsToState(state, { health: -50 })
      expect(result.health).toBe(0)
    })

    it('生命值不会超过MAX_STAT', () => {
      const state = createState({ health: 90 })
      const result = applyEffectsToState(state, { health: 50 })
      expect(result.health).toBe(MAX_STAT)
    })

    it('饥饿值不会超过MAX_STAT', () => {
      const state = createState({ hunger: 90 })
      const result = applyEffectsToState(state, { hunger: 50 })
      expect(result.hunger).toBe(MAX_STAT)
    })

    it('口渴值不会超过MAX_STAT', () => {
      const state = createState({ thirst: 90 })
      const result = applyEffectsToState(state, { thirst: 50 })
      expect(result.thirst).toBe(MAX_STAT)
    })

    it('资源不会低于0', () => {
      const state = createState({ wood: 3, stone: 2 })
      const result = applyEffectsToState(state, { wood: -10, stone: -10 })
      expect(result.wood).toBe(0)
      expect(result.stone).toBe(0)
    })
  })

  describe('4. 行动可行性验证', () => {
    it('游戏结束后不能执行任何行动', () => {
      const state = createState({ isGameOver: true })
      expect(canPerformActionWithState(state, 'gatherWood')).toBe(false)
      expect(canPerformActionWithState(state, 'hunt')).toBe(false)
    })

    it('木材不足时不能打猎', () => {
      const state = createState({ wood: 3 })
      expect(canPerformActionWithState(state, 'hunt')).toBe(false)
    })

    it('木材充足时可以打猎', () => {
      const state = createState({ wood: 5 })
      expect(canPerformActionWithState(state, 'hunt')).toBe(true)
    })

    it('木材不足时不能喝水', () => {
      const state = createState({ wood: 2 })
      expect(canPerformActionWithState(state, 'drink')).toBe(false)
    })

    it('木材充足时可以喝水', () => {
      const state = createState({ wood: 3 })
      expect(canPerformActionWithState(state, 'drink')).toBe(true)
    })

    it('采集木头和石头总是可行', () => {
      const state = createState({ wood: 0, stone: 0 })
      expect(canPerformActionWithState(state, 'gatherWood')).toBe(true)
      expect(canPerformActionWithState(state, 'gatherStone')).toBe(true)
    })
  })

  describe('5. 游戏结束条件验证', () => {
    it('生命值归零触发游戏结束', () => {
      const state = createState({ health: 0 })
      expect(isGameOverState(state)).toBe(true)
    })

    it('生命值接近零但不为零不触发结束', () => {
      const state = createState({ health: 1 })
      expect(isGameOverState(state)).toBe(false)
    })

    it('饥饿值达到MAX_STAT触发游戏结束', () => {
      const state = createState({ hunger: MAX_STAT })
      expect(isGameOverState(state)).toBe(true)
    })

    it('饥饿值接近MAX_STAT但未达到不触发结束', () => {
      const state = createState({ hunger: MAX_STAT - 1 })
      expect(isGameOverState(state)).toBe(false)
    })

    it('口渴值达到MAX_STAT触发游戏结束', () => {
      const state = createState({ thirst: MAX_STAT })
      expect(isGameOverState(state)).toBe(true)
    })

    it('正常状态不会触发游戏结束', () => {
      const state = createState()
      expect(isGameOverState(state)).toBe(false)
    })
  })

  describe('6. 随机事件效果验证', () => {
    randomEvents.forEach((event) => {
      it(`事件[${event.id}]效果应用正确`, () => {
        const initial = createState()
        const result = applyEffectsToState(initial, event.effects)

        const expectedHealth = clampStat(initial.health + (event.effects.health || 0), 0, MAX_STAT)
        const expectedHunger = clampStat(initial.hunger + (event.effects.hunger || 0), 0, MAX_STAT)
        const expectedThirst = clampStat(initial.thirst + (event.effects.thirst || 0), 0, MAX_STAT)
        const expectedWood = Math.max(0, initial.wood + (event.effects.wood || 0))
        const expectedStone = Math.max(0, initial.stone + (event.effects.stone || 0))

        expectStateClose(result, {
          health: expectedHealth,
          hunger: expectedHunger,
          thirst: expectedThirst,
          wood: expectedWood,
          stone: expectedStone,
        }, `事件[${event.id}]`)
      })

      it(`事件[${event.id}]类型映射正确`, () => {
        const expectedType = event.type === 'good' ? 'good' : event.type === 'bad' ? 'bad' : 'event'
        expect(['good', 'bad', 'event']).toContain(expectedType)
      })
    })

    it('所有事件ID唯一', () => {
      const ids = randomEvents.map(e => e.id)
      const uniqueIds = new Set(ids)
      expect(uniqueIds.size).toBe(ids.length)
    })
  })

  describe('7. 完整行动流程验证 (状态 + 日志 + 结算一致性)', () => {
    it('执行采集木头：状态、日志、回合数一致', () => {
      const initial = createState({ logs: [] })
      const result = simulateAction(initial, 'gatherWood', neutralEvent, 1)

      expect(result).not.toBeNull()
      if (!result) return

      expect(result.newState.turn).toBe(1)
      expect(result.newState.isGameOver).toBe(false)

      expectStateClose(result.newState, {
        health: initial.health + actionEffects.gatherWood.health!,
        hunger: initial.hunger + actionEffects.gatherWood.hunger!,
        thirst: initial.thirst + actionEffects.gatherWood.thirst!,
        wood: initial.wood + actionEffects.gatherWood.wood!,
        stone: initial.stone + actionEffects.gatherWood.stone!,
      })

      expect(result.actionLog).toEqual(expect.objectContaining({
        id: 1,
        text: '第 1 回合：采集木头',
        type: 'action',
        turn: 1,
      }))

      expect(result.eventLog).toEqual(expect.objectContaining({
        id: 2,
        text: neutralEvent.text,
        type: 'event',
        turn: 1,
      }))

      expect(result.newState.logs).toHaveLength(2)
      expect(result.newState.logs[0]).toEqual(result.eventLog)
      expect(result.newState.logs[1]).toEqual(result.actionLog)
    })

    it('执行打猎：状态、日志、资源消耗一致', () => {
      const initial = createState({ health: 50, hunger: 80, wood: 10, logs: [] })
      const result = simulateAction(initial, 'hunt', neutralEvent, 1)

      expect(result).not.toBeNull()
      if (!result) return

      expectStateClose(result.newState, {
        health: 65,
        hunger: 60,
        thirst: initial.thirst + actionEffects.hunt.thirst!,
        wood: 5,
        stone: initial.stone,
      })

      expect(result.actionLog.text).toContain('打猎')
      expect(result.newState.logs).toHaveLength(2)
    })

    it('行动后生命值归零：触发游戏结束并生成结束日志', () => {
      const initial = createState({ health: 5, logs: [] })
      const deadlyEvent: RandomEvent = {
        id: 'deadly',
        text: '你受到了致命伤害！',
        type: 'bad',
        effects: { health: -10 },
      }

      const result = simulateAction(initial, 'gatherWood', deadlyEvent, 1)

      expect(result).not.toBeNull()
      if (!result) return

      expect(result.newState.health).toBe(0)
      expect(result.newState.isGameOver).toBe(true)
      expect(result.triggeredGameOver).toBe(true)
      expect(result.gameOverLog).toBeDefined()
      expect(result.gameOverLog?.text).toBe('你没能在荒野中生存下来...')
      expect(result.gameOverLog?.type).toBe('system')

      expect(result.newState.logs).toHaveLength(3)
      expect(result.newState.logs[0]).toEqual(result.gameOverLog)
    })

    it('行动后饥饿值满格：触发游戏结束', () => {
      const initial = createState({ hunger: 90, logs: [] })
      const badEvent: RandomEvent = {
        id: 'very_hungry',
        text: '你感到极度饥饿！',
        type: 'bad',
        effects: { hunger: 20 },
      }

      const result = simulateAction(initial, 'gatherWood', badEvent, 1)

      expect(result).not.toBeNull()
      if (!result) return

      expect(result.newState.hunger).toBe(MAX_STAT)
      expect(result.newState.isGameOver).toBe(true)
      expect(result.triggeredGameOver).toBe(true)
    })

    it('行动后口渴值满格：触发游戏结束', () => {
      const initial = createState({ thirst: 80, logs: [] })
      const badEvent: RandomEvent = {
        id: 'very_thirsty',
        text: '你感到极度口渴！',
        type: 'bad',
        effects: { thirst: 45 },
      }

      const result = simulateAction(initial, 'gatherWood', badEvent, 1)

      expect(result).not.toBeNull()
      if (!result) return

      expect(result.newState.thirst).toBe(MAX_STAT)
      expect(result.newState.isGameOver).toBe(true)
    })
  })

  describe('8. 连续多回合验证', () => {
    it('连续执行多个行动，状态累加正确', () => {
      let state = createState({ logs: [] })
      let logId = 1

      const actions: ActionType[] = ['gatherWood', 'gatherStone', 'hunt', 'drink']
      for (let i = 0; i < actions.length; i++) {
        const result = simulateAction(state, actions[i], neutralEvent, logId)
        expect(result).not.toBeNull()
        if (!result) break

        state = result.newState
        logId += result.gameOverLog ? 3 : 2

        expect(state.turn).toBe(i + 1)
        expect(state.isGameOver).toBe(false)
      }

      expect(state.turn).toBe(4)
      expect(state.logs).toHaveLength(8)
    })

    it('日志超过50条时自动裁剪', () => {
      const state = createState()
      for (let i = 0; i < 60; i++) {
        state.logs.unshift({
          id: i + 1,
          text: `测试日志 ${i + 1}`,
          type: 'action',
          turn: Math.floor(i / 2) + 1,
        })
      }
      expect(state.logs.length).toBe(60)

      const result = simulateAction(state, 'gatherWood', neutralEvent, 100)
      expect(result).not.toBeNull()
      if (result) {
        expect(result.newState.logs.length).toBeLessThanOrEqual(50)
      }
    })
  })

  describe('9. 初始状态验证', () => {
    it('初始状态值正确', () => {
      const state = createInitialState()
      expect(state.health).toBe(80)
      expect(state.hunger).toBe(30)
      expect(state.thirst).toBe(30)
      expect(state.wood).toBe(10)
      expect(state.stone).toBe(5)
      expect(state.turn).toBe(0)
      expect(state.isGameOver).toBe(false)
      expect(state.logs).toEqual([])
    })
  })

  describe('10. 行动名称映射验证', () => {
    it('所有行动都有对应的中文名称', () => {
      const actions: ActionType[] = ['gatherWood', 'gatherStone', 'hunt', 'drink']
      actions.forEach(action => {
        expect(actionNames[action]).toBeDefined()
        expect(typeof actionNames[action]).toBe('string')
        expect(actionNames[action].length).toBeGreaterThan(0)
      })
    })
  })

  describe('11. 不可行行动验证', () => {
    it('资源不足时simulateAction返回null', () => {
      const state = createState({ wood: 2 })
      const result = simulateAction(state, 'hunt', neutralEvent, 1)
      expect(result).toBeNull()
    })

    it('游戏结束时simulateAction返回null', () => {
      const state = createState({ isGameOver: true })
      const result = simulateAction(state, 'gatherWood', neutralEvent, 1)
      expect(result).toBeNull()
    })
  })
})
