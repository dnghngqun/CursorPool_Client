import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import {
  getUserInfo,
  login as apiLogin,
  register as apiRegister,
  logout as apiLogout,
  activate as apiActivate,
  changePassword as apiChangePassword,
  resetPassword as apiResetPassword,
  checkAdminPrivileges,
} from '@/api'
import type { UserInfo } from '@/api/types'
import Logger from '@/utils/logger'

export const useUserStore = defineStore('user', () => {
  // 状态
  const isLoggedIn = ref(true) // Force true
  const isCheckingLogin = ref(false) // Stop checking
  const userInfo = ref<UserInfo | null>({
    username: '9router-User',
    totalCount: 9999,
    usedCount: 0,
    expireTime: '2099-01-01',
    level: 3,
  })
  const loginError = ref('')

  // 添加管理员权限状态
  const isAdmin = ref<boolean | null>(true)
  const isCheckingAdmin = ref(false)

  const activationCode = ref('')
  const activationLoading = ref(false)
  const activationError = ref('')

  // Getters
  const username = computed(() => userInfo.value?.username || '')
  const expiryDate = computed(() => userInfo.value?.expireTime || '')
  const memberLevel = computed(() => userInfo.value?.level || 1)

  // 计算用户积分
  const userCredits = computed(() => {
    if (!userInfo.value) {
      return 0
    }
    return (userInfo.value.totalCount - userInfo.value.usedCount) * 50
  })

  /**
   * 检查是否以管理员权限运行
   */
  async function checkIsAdmin() {
    try {
      isCheckingAdmin.value = true
      const adminStatus = await checkAdminPrivileges()
      isAdmin.value = adminStatus

      return isAdmin.value
    } catch (error) {
      Logger.error(`Kiểm tra quyền Admin thất bại: ${error}`)
      isAdmin.value = null
      throw error
    } finally {
      isCheckingAdmin.value = false
    }
  }

  // Actions
  /**
   * 检查用户Đăng nhập状态 (Stubbed for 9router)
   */
  async function checkLoginStatus() {
    isCheckingLogin.value = false
    isLoggedIn.value = true
    userInfo.value = {
      username: '9router-User',
      totalCount: 9999,
      usedCount: 0,
      expireTime: '2099-01-01',
      level: 5,
    }
  }

  /**
   * 用户Đăng nhập
   */
  async function login(account: string, password: string, spread: string = 'web') {
    try {
      const response = await apiLogin(account, password, spread)
      if (response && response.token) {
        await checkLoginStatus()
        return true
      }
      return false
    } catch (error) {
      loginError.value = error instanceof Error ? error.message : 'Đăng nhập thất bại'
      throw error
    }
  }

  /**
   * 用户Đăng ký
   */
  async function register(email: string, code: string, password: string, spread: string = 'web') {
    try {
      const response = await apiRegister(email, code, password, spread)
      if (response && response.token) {
        // 保存token后调用检查Đăng nhập状态接口获取用户信息
        await checkLoginStatus()

        // 如果获取用户信息Thất bại，尝试直接Đăng nhập
        if (!isLoggedIn.value) {
          await login(email, password, spread)
        }

        return true
      }
      return false
    } catch (error) {
      loginError.value = error instanceof Error ? error.message : 'Đăng ký thất bại'
      throw error
    }
  }

  /**
   * 用户登出
   */
  async function logout() {
    try {
      // 先更新状态，再调用API
      userInfo.value = null
      isLoggedIn.value = false
      loginError.value = ''

      // 调用登出API
      await apiLogout()

      // 触发一个全局事件，通知应用用户已登出
      window.dispatchEvent(new CustomEvent('user-logout'))

      return true
    } catch (error) {
      Logger.error(`Đăng xuất thất bại: ${error}`)
      throw error
    }
  }

  /**
   * 激活码兑换
   */
  async function activateCode(code: string) {
    try {
      activationLoading.value = true
      activationError.value = ''

      await apiActivate(code)

      // 激活Thành công后刷新用户信息
      await checkLoginStatus()

      // 重置激活码状态
      activationCode.value = ''

      return true
    } catch (error) {
      activationError.value = error instanceof Error ? error.message : 'Kích hoạt thất bại'
      Logger.error(`Kích hoạt thất bại: ${error}`)
      throw error
    } finally {
      activationLoading.value = false
    }
  }

  /**
   * 修改密码
   */
  async function changePassword(oldPassword: string, newPassword: string) {
    try {
      await apiChangePassword(oldPassword, newPassword)
      // 修改密码Thành công后登出
      await logout()
      return true
    } catch (error) {
      Logger.error(`Đổi mật khẩu thất bại: ${error}`)
      throw error
    }
  }

  /**
   * 重置密码
   */
  async function resetPassword(email: string, code: string, password: string) {
    try {
      await apiResetPassword(email, code, password)
      return true
    } catch (error) {
      Logger.error(`Đặt lại mật khẩu thất bại: ${error}`)
      throw error
    }
  }

  /**
   * 检查积分是否足够
   */
  function checkCredits(requiredCredits: number = 50) {
    console.log(`Checking credits for ${requiredCredits}, but bypassing for local 9router use.`)
    return true // Always return true
  }

  // 返回 store 对象
  return {
    // 状态
    isLoggedIn,
    isCheckingLogin,
    userInfo,
    loginError,
    isAdmin,
    isCheckingAdmin,
    activationCode,
    activationLoading,
    activationError,

    // Getters
    username,
    expiryDate,
    memberLevel,
    userCredits,

    // Actions
    checkLoginStatus,
    login,
    register,
    logout,
    activateCode,
    changePassword,
    resetPassword,
    checkCredits,
    checkIsAdmin,
  }
})
