<script setup lang="ts">
interface Props {
  show: boolean
  finalTurn: number
  highScore: number
  isNewRecord: boolean
}

defineProps<Props>()

const emit = defineEmits<{
  restart: []
}>()
</script>

<template>
  <Teleport to="body">
    <Transition name="modal">
      <div
        v-if="show"
        class="fixed inset-0 z-50 flex items-center justify-center p-4"
      >
        <div class="absolute inset-0 bg-black/70 backdrop-blur-sm"></div>
        <div class="relative bg-game-card rounded-3xl p-8 max-w-md w-full border border-game-border shadow-2xl animate-slide-up">
          <div class="text-center">
            <div class="text-6xl mb-4">💀</div>
            <h2 class="text-3xl font-bold text-white mb-2">游戏结束</h2>
            <p class="text-gray-400 mb-6">你没能在荒野中生存下来...</p>

            <div class="bg-gray-800/50 rounded-2xl p-5 mb-6 space-y-3">
              <div class="flex justify-between items-center">
                <span class="text-gray-400">生存回合</span>
                <span class="text-2xl font-bold text-white">{{ finalTurn }}</span>
              </div>
              <div class="border-t border-gray-700"></div>
              <div class="flex justify-between items-center">
                <span class="text-gray-400">最高纪录</span>
                <span class="text-xl font-bold" :class="isNewRecord ? 'text-yellow-400' : 'text-gray-300'">
                  {{ highScore }}
                  <span v-if="isNewRecord" class="text-sm ml-1">🏆 新纪录！</span>
                </span>
              </div>
            </div>

            <button
              @click="emit('restart')"
              class="w-full py-4 px-6 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white font-bold text-lg rounded-xl transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] shadow-lg hover:shadow-green-500/25"
            >
              🔄 重新开始
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.modal-enter-active,
.modal-leave-active {
  transition: all 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-from .relative,
.modal-leave-to .relative {
  transform: scale(0.9);
}
</style>
