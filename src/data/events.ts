import type { RandomEvent } from '@/types/game'

export const randomEvents: RandomEvent[] = [
  {
    id: 'beast_attack',
    text: '一只野兽突然袭击了你！',
    type: 'bad',
    effects: { health: -15 },
  },
  {
    id: 'find_berries',
    text: '你发现了一丛野生浆果！',
    type: 'good',
    effects: { hunger: -12 },
  },
  {
    id: 'find_spring',
    text: '你找到了一处清澈的泉水！',
    type: 'good',
    effects: { thirst: -18 },
  },
  {
    id: 'cold_weather',
    text: '天气突然变冷，你消耗了更多体力和木材取暖。',
    type: 'bad',
    effects: { health: -5, wood: -4 },
  },
  {
    id: 'abandoned_camp',
    text: '你发现了一个废弃的营地，找到了一些物资！',
    type: 'good',
    effects: { wood: 8, stone: 5 },
  },
  {
    id: 'trap',
    text: '你不小心踩到了一个陷阱！',
    type: 'bad',
    effects: { health: -10 },
  },
  {
    id: 'food_cache',
    text: '你找到了一个隐藏的食物储藏点！',
    type: 'good',
    effects: { hunger: -20 },
  },
  {
    id: 'rain',
    text: '下起了雨，你收集了一些雨水。',
    type: 'good',
    effects: { thirst: -12 },
  },
  {
    id: 'find_stone_vein',
    text: '你发现了一处石矿脉！',
    type: 'good',
    effects: { stone: 10 },
  },
  {
    id: 'fall',
    text: '你在行走时不小心摔倒了。',
    type: 'bad',
    effects: { health: -6 },
  },
  {
    id: 'sunny',
    text: '今天阳光明媚，你感觉精神焕发。',
    type: 'good',
    effects: { health: 5 },
  },
  {
    id: 'find_dead_tree',
    text: '你发现了一棵枯死的大树。',
    type: 'good',
    effects: { wood: 12 },
  },
  {
    id: 'food_poisoning',
    text: '你吃了不干净的东西，感觉有些不适。',
    type: 'bad',
    effects: { health: -8, hunger: 8 },
  },
  {
    id: 'peaceful_night',
    text: '平静的一天，什么也没有发生。',
    type: 'neutral',
    effects: {},
  },
  {
    id: 'find_cave',
    text: '你发现了一个山洞，里面有一些石头和木材。',
    type: 'good',
    effects: { stone: 6, wood: 4 },
  },
]
