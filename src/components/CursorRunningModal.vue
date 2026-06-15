<script setup lang="ts">
  import { ref, watch } from 'vue'
  import { NModal, NSpace, NButton } from 'naive-ui'

  /**
   * 定义组件属性
   */
  const props = defineProps({
    // 是否Hiển thịModal
    show: {
      type: Boolean,
      required: true,
    },
    // Modal标题
    title: {
      type: String,
      default: 'Cursor 正在运行',
    },
    // Modal内容
    content: {
      type: String,
      default:
        'Phát hiện Cursor 正在运行, 请保存尚未更改的项目再继续操作! 不保存会导致Cursor报错! 报错了请别联系客服!',
    },
    // Xác nhận按钮文本
    confirmButtonText: {
      type: String,
      default: '我已保存, Bắt buộc关闭',
    },
    // Xác nhận按钮类型
    confirmButtonType: {
      type: String as () =>
        | 'default'
        | 'tertiary'
        | 'primary'
        | 'info'
        | 'success'
        | 'warning'
        | 'error',
      default: 'warning',
    },
  })

  /**
   * 定义组件事件
   */
  const emit = defineEmits([
    // 关闭Modal事件
    'update:show',
    // Xác nhận操作事件
    'confirm',
    // Hủy操作事件
    'cancel',
  ])

  // 内部Modal状态
  const modalVisible = ref(props.show)

  // Lắng ngheprops.show的变化，更新内部状态
  watch(
    () => props.show,
    (newValue) => {
      modalVisible.value = newValue
    },
  )

  // Lắng nghe内部状态变化，更新父组件状态
  watch(modalVisible, (newValue) => {
    if (newValue !== props.show) {
      emit('update:show', newValue)
    }
  })

  /**
   * 处理关闭Modal
   */
  const handleClose = () => {
    modalVisible.value = false
    emit('cancel')
  }

  /**
   * Xử lý nhấn nút xác nhận
   */
  const handleConfirm = () => {
    emit('confirm')
    modalVisible.value = false
  }
</script>

<template>
  <n-modal
    v-model:show="modalVisible"
    preset="dialog"
    :title="title"
    :closable="true"
    :mask-closable="false"
    @close="handleClose"
  >
    <template #default>
      {{ content }}
    </template>
    <template #action>
      <n-space justify="end">
        <n-button
          :type="confirmButtonType"
          @click="handleConfirm"
        >
          {{ confirmButtonText }}
        </n-button>
      </n-space>
    </template>
  </n-modal>
</template>
