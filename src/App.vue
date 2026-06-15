<script setup lang="ts">
  import { NConfigProvider, NMessageProvider, NGlobalStyle, NDialogProvider } from 'naive-ui'
  import { useTheme } from './composables/theme'
  import { themeOverrides } from './styles/theme'
  import { useI18n, initLanguage } from './locales'
  import { locales } from './locales'
  import { computed, onMounted, onUnmounted } from 'vue'
  import { useHistoryStore, useUpdaterStore, useInboundStore, useAppCloseStore } from './stores'
  import UpdateOverlay from './components/UpdateOverlay.vue'
  import CloseConfirmModal from './components/CloseConfirmModal.vue'
  import { Window } from '@tauri-apps/api/window'
  import { initializeDevToolsProtection } from './utils/devtools'
  import { initEventListeners, destroyEventListeners } from './utils/eventBus'
  import { apiClient } from './utils/apiClient'

  const { currentTheme } = useTheme()
  const { currentLang } = useI18n()
  const historyStore = useHistoryStore()
  const updaterStore = useUpdaterStore()
  const inboundStore = useInboundStore()
  const appCloseStore = useAppCloseStore()

  const locale = computed(() => locales[currentLang.value].locale)
  const dateLocale = computed(() => locales[currentLang.value].dateLocale)

  // Khởi tạo khi ứng dụng bắt đầu
  onMounted(async () => {
    // Khởi tạo cài đặt ngôn ngữ
    await initLanguage()

    // Khởi tạo cấu hình API Client
    apiClient.configure({
      maxRetries: 2,
      refreshInboundOnMaxRetries: true,
      showRetryNotification: true,
    })

    // Sử dụng phương pháp khởi tạo thống nhất
    await historyStore.init()

    // Khởi tạo cấu hình đường truyền
    await inboundStore.fetchInboundList()

    // Tự động kiểm tra cập nhật
    await updaterStore.checkForUpdates()

    // Thêm bộ lắng nghe sự kiện đóng
    const appWindow = Window.getCurrent()
    appWindow.onCloseRequested(async (event) => {
      event.preventDefault()
      appCloseStore.handleCloseRequest()
    })

    // Khởi tạo công cụ nhà phát triển
    initializeDevToolsProtection()

    // Khởi tạo bộ lắng nghe sự kiện
    await initEventListeners()
  })

  // Dọn dẹp khi gỡ bỏ ứng dụng
  onUnmounted(() => {
    // Dọn dẹp bộ lắng nghe sự kiện
    destroyEventListeners()

    // Dọn dẹp tài nguyên API Client
    apiClient.cleanup()
  })
</script>

<template>
  <n-config-provider
    :theme="currentTheme"
    :theme-overrides="themeOverrides"
    :locale="locale"
    :date-locale="dateLocale"
  >
    <n-dialog-provider>
      <n-message-provider>
        <router-view />
        <n-global-style />
        <update-overlay v-if="updaterStore.isUpdating || updaterStore.hasUpdate" />
        <close-confirm-modal />
      </n-message-provider>
    </n-dialog-provider>
  </n-config-provider>
</template>
