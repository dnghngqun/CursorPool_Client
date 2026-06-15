import { invoke } from '@tauri-apps/api/core'
import type {
  ApiResponse,
  LoginResponse,
  UserInfo,
  AccountPoolInfo,
  UsageInfo,
  PublicInfo,
  MachineInfo,
  HistoryRecord,
  HistoryAccountRecord,
  Article,
  CheckUserResponse,
  RegisterResponse,
} from './types'
import Logger from '../utils/logger'
import { apiClient } from '@/utils/apiClient'

// Xử lý lỗi
function handleApiResponse<T>(response: ApiResponse<T>): T {
  if (response.status === 200) {
    // Thành công时返回 data
    if (response.data) {
      return response.data
    }
    // Trả về đối tượng trống nếu không có dữ liệu
    return {} as T
  }

  // Gây lỗi khi mã trạng thái không phải 200，Ưu tiên sử dụng tin nhắn từ máy chủ
  throw new ApiError(response.msg || 'Kết nối máy chủ thất bại, vui lòng thử lại sau')
}

// API 错误类
export class ApiError extends Error {
  public statusCode?: number

  constructor(message: string, statusCode?: number) {
    super(message)
    this.name = 'ApiError'
    this.statusCode = statusCode
  }
}

// Liên quan đến xác thực người dùng API

/**
 * Kiểm tra trạng thái đăng nhập người dùng
 * @param email 用户邮箱
 * @returns 用户Đăng nhập状态信息
 */
export async function checkUser(email?: string): Promise<CheckUserResponse> {
  try {
    const response = await apiClient.request<ApiResponse<CheckUserResponse>>('check_user', {
      email: email || '',
    })
    // 直接返回原始响应中的字段，而不是通过handleApiResponse处理
    if (response.status === 200) {
      return {
        status: response.status,
        msg: response.msg,
        isLoggedIn: response.data?.isLoggedIn || false,
        userInfo: response.data?.userInfo,
      }
    }
    return handleApiResponse(response)
  } catch (error) {
    throw new ApiError(
      error instanceof Error ? error.message : 'Không thể xác minh trạng thái người dùng',
    )
  }
}

export async function sendCode(email: string, purpose: string): Promise<void> {
  try {
    const response = await apiClient.request<ApiResponse<void>>('send_code', {
      email,
      type: purpose,
    })
    return handleApiResponse(response)
  } catch (error) {
    throw new ApiError(error instanceof Error ? error.message : 'Gửi mã xác nhận thất bại')
  }
}

export async function register(
  email: string,
  code: string,
  password: string,
  spread: string,
): Promise<RegisterResponse> {
  try {
    const response = await apiClient.request<ApiResponse<RegisterResponse>>('register', {
      email,
      code,
      password,
      spread,
    })
    return handleApiResponse(response)
  } catch (error) {
    throw new ApiError(error instanceof Error ? error.message : 'Đăng ký thất bại')
  }
}

export async function login(
  account: string,
  password: string,
  spread: string,
): Promise<LoginResponse> {
  try {
    const response = await apiClient.request<ApiResponse<LoginResponse>>('login', {
      account,
      password,
      spread,
    })
    return handleApiResponse(response)
  } catch (error) {
    await Logger.error('Đăng nhập thất bại', { file: 'api/index.ts' })
    throw new ApiError(error instanceof Error ? error.message : 'Đăng nhập thất bại')
  }
}

// Liên quan đến thông tin người dùng API
export async function getUserInfo(): Promise<UserInfo> {
  try {
    const response = await apiClient.request<ApiResponse<UserInfo>>('get_user_info')
    return handleApiResponse(response)
  } catch (error) {
    if (error instanceof ApiError) {
      throw error
    }
    throw new ApiError(error instanceof Error ? error.message : 'Kết nối máy chủ thất bại')
  }
}

export async function getAccount(account?: string, usageCount?: string): Promise<AccountPoolInfo> {
  try {
    const response = await apiClient.request<ApiResponse<AccountPoolInfo>>('get_account', {
      account,
      usageCount,
    })
    return handleApiResponse(response)
  } catch (error) {
    throw new ApiError(error instanceof Error ? error.message : 'Lấy thông tin tài khoản thất bại')
  }
}

// Cursor Liên quan đến nền tảng API
export async function getUsage(token: string): Promise<UsageInfo> {
  try {
    const response = await invoke<ApiResponse<UsageInfo>>('get_usage', {
      token,
    })
    return handleApiResponse(response)
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error)

    if (errorMsg === 'cursor_db_error') {
      throw new ApiError('cursor_db_error')
    } else if (errorMsg === 'cursor_network_error') {
      throw new ApiError('cursor_network_error')
    } else if (errorMsg === 'cursor_data_error') {
      throw new ApiError('cursor_data_error')
    } else {
      throw new ApiError('cursor_unknown_error')
    }
  }
}

// Liên quan đến thông tin hệ thống API
export async function getPublicInfo(): Promise<PublicInfo> {
  try {
    const response = await apiClient.request<ApiResponse<PublicInfo>>('get_public_info')
    return handleApiResponse(response)
  } catch (error) {
    throw new ApiError(error instanceof Error ? error.message : 'Lấy thông tin chung thất bại')
  }
}

export async function refreshInbound(): Promise<boolean> {
  try {
    return await invoke<boolean>('refresh_inbound')
  } catch (error) {
    await Logger.error('Làm mới đường truyền thất bại', { file: 'api/index.ts' })
    throw new ApiError(error instanceof Error ? error.message : 'Làm mới đường truyền thất bại')
  }
}

// Liên quan đến quản lý tài khoản API
export async function activate(code: string): Promise<void> {
  try {
    const response = await apiClient.request<ApiResponse<void>>('activate', { code })
    handleApiResponse(response)
  } catch (error) {
    throw new ApiError(error instanceof Error ? error.message : 'Kích hoạt thất bại')
  }
}

export async function changePassword(oldPassword: string, newPassword: string): Promise<void> {
  try {
    const response = await apiClient.request<ApiResponse<void>>('change_password', {
      oldPassword,
      newPassword,
    })
    handleApiResponse(response)
  } catch (error) {
    throw new ApiError(error instanceof Error ? error.message : 'Đổi mật khẩu thất bại')
  }
}

// Liên quan đến mã máy và chuyển đổi tài khoản API
export async function resetMachineId(
  params: {
    forceKill?: boolean
    machineId?: string
  } = {},
): Promise<boolean> {
  try {
    return await invoke<boolean>('reset_machine_id', {
      forceKill: params.forceKill || false,
      machineId: params.machineId,
    })
  } catch (error) {
    await Logger.error('Đặt lại mã máy thất bại', { file: 'api/index.ts' })
    throw new ApiError(error instanceof Error ? error.message : 'Đặt lại mã máy thất bại')
  }
}

export async function switchAccount(
  email: string,
  token: string,
  forceKill: boolean = false,
): Promise<void> {
  try {
    const result = await invoke<boolean>('switch_account', {
      email,
      token,
      forceKill,
    })
    if (result !== true) {
      await Logger.error(`Đổi tài khoản thất bại: ${email}`, { file: 'api/index.ts' })
      throw new Error('Đổi tài khoản thất bại')
    }
  } catch (error) {
    await Logger.error(`Đổi tài khoản thất bại: ${email}, ${error}`, {
      file: 'api/index.ts',
    })
    const errorMsg = error instanceof Error ? error.message : 'Đổi tài khoản thất bại'
    if (errorMsg.includes('Cursor进程正在运行')) {
      throw new Error('Vui lòng đóng Cursor hoặc chọn dừng tiến trình bắt buộc')
    }
    throw error
  }
}

export async function getMachineIds(): Promise<MachineInfo> {
  try {
    return await invoke<MachineInfo>('get_machine_ids')
  } catch (error) {
    await Logger.error('Lấy mã máy thất bại', { file: 'api/index.ts' })
    throw new ApiError(error instanceof Error ? error.message : 'Lấy mã máy thất bại')
  }
}

export async function checkCursorRunning(): Promise<boolean> {
  try {
    return await invoke<boolean>('check_cursor_running')
  } catch (error) {
    await Logger.error('Kiểm tra trạng thái Cursor thất bại', { file: 'api/index.ts' })
    throw new ApiError(
      error instanceof Error ? error.message : 'Kiểm tra trạng thái Cursor thất bại',
    )
  }
}

// Liên quan đến quyền Admin API
export async function checkAdminPrivileges(): Promise<boolean> {
  try {
    return await invoke<boolean>('check_admin_privileges')
  } catch (error) {
    throw new ApiError(error instanceof Error ? error.message : 'Kiểm tra quyền Admin thất bại')
  }
}

// Hook 相关 API
export async function checkHookStatus(): Promise<boolean> {
  try {
    return await invoke<boolean>('is_hook', {})
  } catch (error) {
    Logger.error(`检查hook状态错误: ${error}`)

    const errorMsg = error instanceof Error ? error.message : String(error)
    if (
      errorMsg.includes('MAIN_JS_NOT_FOUND') ||
      errorMsg.includes('创建应用路径Thất bại') ||
      errorMsg.includes('main.js 路径Không tồn tại')
    ) {
      Logger.warn('Không tìm thấy main.js, mặc định trạng thái hook là false')
      return false
    }

    throw error
  }
}

export async function applyHook(forceKill: boolean = false): Promise<void> {
  try {
    await invoke<void>('hook_main_js', {
      forceKill,
    })
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error)
    await Logger.error(`Áp dụng hook thất bại: ${errorMsg}`, { file: 'api/index.ts' })

    if (errorMsg.includes('Cursor进程正在运行')) {
      throw new Error('Vui lòng đóng Cursor hoặc chọn dừng tiến trình bắt buộc')
    }

    throw error
  }
}

export async function findCursorPath(selectedPath: string): Promise<boolean> {
  try {
    return await invoke<boolean>('find_cursor_path', { selectedPath })
  } catch (error) {
    Logger.error(`Lỗi tìm đường dẫn Cursor: ${error}`)
    throw error
  }
}

export async function restoreHook(forceKill: boolean = false): Promise<void> {
  try {
    await invoke<void>('restore_hook', {
      forceKill,
    })
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error)
    await Logger.error(`Khôi phục hook thất bại: ${errorMsg}`, { file: 'api/index.ts' })

    if (errorMsg.includes('Cursor进程正在运行')) {
      throw new Error('Vui lòng đóng Cursor hoặc chọn dừng tiến trình bắt buộc')
    }

    throw error
  }
}

export async function resetPassword(email: string, code: string, password: string): Promise<void> {
  try {
    const response = await apiClient.request<ApiResponse<void>>('reset_password', {
      email,
      code,
      password,
    })
    return handleApiResponse(response)
  } catch (error) {
    throw new ApiError(error instanceof Error ? error.message : 'Đặt lại mật khẩu thất bại')
  }
}

// Thêm đóng và khởi độngCursor的API
export async function closeCursor(): Promise<boolean> {
  return await invoke('close_cursor')
}

export async function launchCursor(): Promise<boolean> {
  return await invoke('launch_cursor')
}

// 登出
export async function logout(): Promise<void> {
  try {
    const response = await apiClient.request<ApiResponse<void>>('logout')
    return handleApiResponse(response)
  } catch (error) {
    throw new ApiError(error instanceof Error ? error.message : 'Đăng xuất thất bại')
  }
}

// Sử dụng lưu trữ key-value cho chức năng lịch sử

/**
 * Lưu lịch sử
 * @param record 历史记录
 */
export async function saveHistoryRecord(record: HistoryRecord): Promise<void> {
  try {
    const records = await getHistoryRecords()

    records.push(record)

    await setUserData('user.history', JSON.stringify(records))
  } catch (error) {
    Logger.error(`Lưu lịch sử thất bại: ${error}`)
    throw new ApiError(error instanceof Error ? error.message : 'Lưu lịch sử thất bại')
  }
}

/**
 * 批量Lưu lịch sử
 * @param records 历史记录数组
 */
export async function saveHistoryRecords(records: HistoryRecord[]): Promise<void> {
  try {
    let existingRecords = await getHistoryRecords()

    existingRecords = [...existingRecords, ...records]

    await setUserData('user.history', JSON.stringify(existingRecords))
  } catch (error) {
    Logger.error(`批量Lưu lịch sử thất bại: ${error}`)
    throw new ApiError(error instanceof Error ? error.message : 'Lưu lịch sử thất bại')
  }
}

/**
 * Lấy toàn bộ lịch sử
 * @returns 历史记录数组
 */
export async function getHistoryRecords(): Promise<HistoryRecord[]> {
  try {
    const data = await getUserData('user.history')
    if (!data) {
      return []
    }

    try {
      return JSON.parse(data) as HistoryRecord[]
    } catch (e) {
      Logger.error(`Giải mã lịch sửThất bại: ${e}`)
      return []
    }
  } catch (error) {
    Logger.error(`Lấy lịch sử thất bại: ${error}`)
    throw new ApiError(error instanceof Error ? error.message : 'Lấy lịch sử thất bại')
  }
}

/**
 * Xóa sạch lịch sử
 */
export async function clearHistoryRecords(): Promise<void> {
  try {
    await delUserData('user.history')
  } catch (error) {
    Logger.error(`Xóa lịch sử thất bại: ${error}`)
    throw new ApiError(error instanceof Error ? error.message : 'Xóa lịch sử thất bại')
  }
}

/**
 * Lấy danh sách tài khoản lịch sử
 */
export async function getHistoryAccounts(): Promise<HistoryAccountRecord[]> {
  try {
    const data = await getUserData('user.history.accounts')
    if (!data) {
      return []
    }

    try {
      return JSON.parse(data) as HistoryAccountRecord[]
    } catch (e) {
      Logger.error(`历史账户解析Thất bại: ${e}`)
      return []
    }
  } catch (error) {
    throw new ApiError(error instanceof Error ? error.message : 'Lấy lịch sử tài khoản thất bại')
  }
}

/**
 * Xóa tài khoản lịch sử
 * @param email 要删除的账户邮箱
 */
export async function removeHistoryAccount(email: string): Promise<void> {
  try {
    let accounts = await getHistoryAccounts()

    accounts = accounts.filter((a) => a.email !== email)

    await setUserData('user.history.accounts', JSON.stringify(accounts))
  } catch (error) {
    throw new ApiError(error instanceof Error ? error.message : 'Xóa lịch sử tài khoản thất bại')
  }
}

/**
 * Xóa sạch tài khoản lịch sử
 */
export async function clearHistoryAccounts(): Promise<void> {
  try {
    await delUserData('user.history.accounts')
  } catch (error) {
    Logger.error(`Xóa toàn bộ lịch sử tài khoản thất bại: ${error}`)
    throw new ApiError(
      error instanceof Error ? error.message : 'Xóa toàn bộ lịch sử tài khoản thất bại',
    )
  }
}

/**
 * Lưu Token API người dùng
 * @param token API Token
 */
export async function saveUserApiToken(token: string): Promise<void> {
  try {
    await setUserData('user.info.token', token)
  } catch (error) {
    Logger.error(`Lưu API Token thất bại: ${error}`)
    throw new ApiError(error instanceof Error ? error.message : 'Lưu API Token thất bại')
  }
}

/**
 * Lấy Token API người dùng
 * @returns API Token，如果Không tồn tại则返回null
 */
export async function getUserApiToken(): Promise<string | null> {
  try {
    return await getUserData('user.info.token')
  } catch (error) {
    Logger.error(`Lấy API Token thất bại: ${error}`)
    throw new ApiError(error instanceof Error ? error.message : 'Lấy API Token thất bại')
  }
}

/**
 * Xóa Token API người dùng
 */
export async function clearUserApiToken(): Promise<void> {
  try {
    await delUserData('user.info.token')
  } catch (error) {
    Logger.error(`清除API TokenThất bại: ${error}`)
    throw new ApiError(error instanceof Error ? error.message : '清除API TokenThất bại')
  }
}

// 添加通用的键值存储 API 方法

/**
 * Cài đặt dữ liệu người dùng
 * @param key 键名
 * @param value 值
 */
export async function setUserData(key: string, value: string): Promise<void> {
  try {
    await invoke<ApiResponse<any>>('set_user_data', { key, value })
  } catch (error) {
    throw new ApiError(
      error instanceof Error ? error.message : 'Cài đặt dữ liệu người dùng thất bại',
    )
  }
}

/**
 * Lấy dữ liệu người dùng
 * @param key 键名
 * @returns 获取的值，如果Không tồn tại则返回 null
 */
export async function getUserData(key: string): Promise<string | null> {
  try {
    const response = await invoke<
      ApiResponse<{
        value: string | null
      }>
    >('get_user_data', { key })
    const result = handleApiResponse(response)
    return result.value
  } catch (error) {
    throw new ApiError(error instanceof Error ? error.message : 'Lấy dữ liệu người dùng thất bại')
  }
}

/**
 * Xóa dữ liệu người dùng
 * @param key 键名
 */
export async function delUserData(key: string): Promise<void> {
  try {
    await invoke<ApiResponse<any>>('del_user_data', { key })
  } catch (error) {
    throw new ApiError(error instanceof Error ? error.message : 'Xóa dữ liệu người dùng thất bại')
  }
}

// 使用通用 API 实现的特定功能

/**
 * Kiểm tra người dùng đã chấp nhận miễn trừ trách nhiệm chưa
 * @returns 是否已接受
 */
export async function checkDisclaimerAccepted(): Promise<boolean> {
  try {
    const value = await getUserData('user.disclaimer.accepted')
    return value === 'true'
  } catch (error) {
    Logger.error(`Kiểm tra miễn trừ trách nhiệm thất bại: ${error}`)
    return false
  }
}

/**
 * Cài đặt người dùng đã chấp nhận miễn trừ trách nhiệm
 */
export async function setDisclaimerAccepted(): Promise<void> {
  try {
    await setUserData('user.disclaimer.accepted', 'true')
  } catch (error) {
    Logger.error(`设置Miễn trừ trách nhiệm状态Thất bại: ${error}`)
    throw error
  }
}

/**
 * Xóa trạng thái chấp nhận miễn trừ trách nhiệm
 */
export async function clearDisclaimerAccepted(): Promise<void> {
  try {
    await delUserData('user.disclaimer.accepted')
  } catch (error) {
    Logger.error(`清除Miễn trừ trách nhiệm状态Thất bại: ${error}`)
    throw error
  }
}

// Lấy danh sách thông báo
export async function getArticleList(): Promise<Article[]> {
  try {
    const response = await apiClient.request<ApiResponse<Article[]>>('get_article_list')
    return handleApiResponse(response)
  } catch (error) {
    Logger.error(`Lấy danh sách thông báoThất bại: ${error}`)
    return []
  }
}

// Kiểm tra bài viết đã đọc chưa
export async function isArticleRead(articleId: number): Promise<boolean> {
  try {
    const valueStr = await getUserData('system.articles')
    if (!valueStr) return false

    try {
      const readIds = JSON.parse(valueStr) as number[]

      if (Array.isArray(readIds)) {
        const result = readIds.includes(articleId)
        return result
      } else {
        Logger.error('已读文章ID不是一个数组:', readIds)
        return false
      }
    } catch (parseError) {
      Logger.error(`解析已读文章IDThất bại: ${parseError}, 原始数据: ${valueStr}`)
      return false
    }
  } catch (error) {
    Logger.error(`获取已读文章状态Thất bại: ${error}`)
    return false
  }
}

// Đánh dấu bài viết đã đọc
export async function markArticleRead(articleId: number): Promise<void> {
  try {
    const response = await apiClient.request<ApiResponse<void>>('mark_article_read', { articleId })
    handleApiResponse(response)
  } catch (error) {
    throw new ApiError(error instanceof Error ? error.message : 'Đánh dấu bài viết đã đọc thất bại')
  }
}

/**
 * Mở công cụ nhà phát triển
 */
export const openDevTools = () => {
  return invoke('open_devtools')
}

// Lấy đường dẫn Cursor đang chạy
export async function getRunningCursorPath(): Promise<string> {
  try {
    return await invoke<string>('get_running_cursor_path')
  } catch (error) {
    Logger.error(`Lấy đường dẫn Cursor đang chạy thất bại: ${error}`)
    throw new ApiError(
      error instanceof Error ? error.message : 'Không có Cursor nào đang chạy, vui lòng mở Cursor',
    )
  }
}
