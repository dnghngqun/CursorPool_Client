<script setup lang="ts">
  import { NModal, NRadioGroup, NRadio, NSpace, NFormItem, useMessage, NCheckbox } from 'naive-ui'
  import { useAppCloseStore } from '@/stores'

  const message = useMessage()
  const appCloseStore = useAppCloseStore()

  // Xử lý nhấn nút xác nhận
  const handleConfirm = async () => {
    try {
      await appCloseStore.confirmClose()
    } catch (error) {
      message.error('Thao tác thất bại，请重试')
    }
  }
</script>

<template>
  <n-modal
    v-model:show="appCloseStore.showConfirmModal"
    preset="dialog"
    title="Xác nhận đóng"
    positive-text="Xác nhận"
    negative-text="Hủy"
    :mask-closable="false"
    @positive-click="handleConfirm"
    @negative-click="appCloseStore.cancelClose"
  >
    <div style="margin-bottom: 12px">Vui lòng chọn cách đóng：</div>

    <n-form-item>
      <n-radio-group v-model:value="appCloseStore.closeType">
        <n-space vertical>
          <n-radio value="minimize">Thu nhỏ xuống thanh hệ thống</n-radio>
          <n-radio value="exit">Thoát程序</n-radio>
        </n-space>
      </n-radio-group>
    </n-form-item>

    <n-form-item>
      <n-checkbox v-model:checked="appCloseStore.savePreference"
        >Ghi nhớ lựa chọn của tôi</n-checkbox
      >
    </n-form-item>
  </n-modal>
</template>
