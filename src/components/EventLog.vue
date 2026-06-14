<script setup lang="ts">
import { ref, watch, nextTick } from 'vue'
import type { LogEntry } from '@/types/game'

interface Props {
  logs: LogEntry[]
}

const props = defineProps<Props>()

const logContainer = ref<HTMLElement | null>(null)

function getLogColor(type: LogEntry['type']): string {
  switch (type) {
    case 'good':
      return 'text-green-400'
    case 'bad':
      return 'text-red-400'
    case 'system':
      return 'text-purple-400'
    case 'event':
      return 'text-yellow-400'
    default:
      return 'text-gray-300'
  }
}

function getLogIcon(type: LogEntry['type']): string {
  switch (type) {
    case 'good':
      return '✨'
    case 'bad':
      return '⚠️'
    case 'system':
      return '📢'
    case 'event':
      return '🎲'
    default:
      return '▶️'
  }
}

watch(
  () => props.logs.length,
  async () => {
    await nextTick()
    if (logContainer.value) {
      logContainer.value.scrollTop = 0
    }
  }
)
</script>

<template>
  <div class="bg-game-card rounded-2xl p-6 border border-game-border shadow-xl flex flex-col h-full">
    <h2 class="text-xl font-bold text-white mb-4 flex items-center gap-2">
      <span>📜</span>
      <span>事件日志</span>
    </h2>
    <div
      ref="logContainer"
      class="flex-1 overflow-y-auto space-y-2 pr-2 scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent"
      style="max-height: 400px;"
    >
      <div
        v-for="log in logs"
        :key="log.id"
        :class="[getLogColor(log.type), 'animate-slide-up text-sm leading-relaxed flex items-start gap-2']"
      >
        <span class="flex-shrink-0">{{ getLogIcon(log.type) }}</span>
        <span>{{ log.text }}</span>
      </div>
      <div v-if="logs.length === 0" class="text-gray-500 text-sm text-center py-8">
        暂无日志...
      </div>
    </div>
  </div>
</template>

<style scoped>
.scrollbar-thin::-webkit-scrollbar {
  width: 6px;
}

.scrollbar-thin::-webkit-scrollbar-track {
  background: transparent;
}

.scrollbar-thin::-webkit-scrollbar-thumb {
  background-color: #374151;
  border-radius: 3px;
}

.scrollbar-thin::-webkit-scrollbar-thumb:hover {
  background-color: #4b5563;
}
</style>
