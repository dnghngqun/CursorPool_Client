import { ref, computed } from 'vue'
import type { NLocale, NDateLocale } from 'naive-ui'
import {
  zhCN,
  dateZhCN,
  enUS,
  dateEnUS,
  viVN,
  dateViVN,
  jaJP,
  dateJaJP,
  frFR,
  dateFrFR,
  deDE,
  dateDeDE,
  koKR,
  dateKoKR,
  ruRU,
  dateRuRU,
  esAR,
  dateEsAR,
} from 'naive-ui'
import { messages } from './messages'
import { getUserData, setUserData } from '@/api'
import Logger from '@/utils/logger'

export type Language =
  | 'vi-VN'
  | 'zh-CN'
  | 'en-US'
  | 'ja-JP'
  | 'fr-FR'
  | 'de-DE'
  | 'ko-KR'
  | 'ru-RU'
  | 'es-AR'

interface LocaleConfig {
  name: string
  locale: NLocale
  dateLocale: NDateLocale
}

export const locales: Record<Language, LocaleConfig> = {
  'vi-VN': {
    name: 'Tiếng Việt',
    locale: viVN,
    dateLocale: dateViVN,
  },
  'zh-CN': {
    name: '简体中文',
    locale: zhCN,
    dateLocale: dateZhCN,
  },
  'en-US': {
    name: 'English',
    locale: enUS,
    dateLocale: dateEnUS,
  },
  'ja-JP': {
    name: '日本語',
    locale: jaJP,
    dateLocale: dateJaJP,
  },
  'fr-FR': {
    name: 'Français',
    locale: frFR,
    dateLocale: dateFrFR,
  },
  'de-DE': {
    name: 'Deutsch',
    locale: deDE,
    dateLocale: dateDeDE,
  },
  'ko-KR': {
    name: '한국어',
    locale: koKR,
    dateLocale: dateKoKR,
  },
  'ru-RU': {
    name: 'Русский',
    locale: ruRU,
    dateLocale: dateRuRU,
  },
  'es-AR': {
    name: 'Español',
    locale: esAR,
    dateLocale: dateEsAR,
  },
}

// Force sử dụng tiếng Việt
export const currentLang = ref<Language>('vi-VN')

// Khởi tạo ngôn ngữ (ép buộc tiếng Việt)
export async function initLanguage() {
  currentLang.value = 'vi-VN'
  try {
    await setUserData('user.info.lang', 'vi-VN')
  } catch (error) {
    // Ignore error
  }
}

export function useI18n() {
  const setLanguage = async (lang: Language) => {
    // Luôn giữ tiếng Việt
    currentLang.value = 'vi-VN'
  }

  // 添加t函数用于翻译
  const t = (key: string, params?: Record<string, any>) => {
    const keys = key.split('.')
    let result: any = messages[currentLang.value]

    // 遍历键路径获取翻译
    for (const k of keys) {
      if (result && typeof result === 'object' && k in result) {
        result = result[k]
      } else {
        // 如果找不到翻译，返回键名
        return key
      }
    }

    // 如果结果是字符串且有参数，替换参数
    if (typeof result === 'string' && params) {
      return result.replace(/{([^}]+)}/g, (match, name) => {
        return params[name] !== undefined ? String(params[name]) : match
      })
    }

    return result as string
  }

  return {
    currentLang,
    setLanguage,
    i18n: computed(() => messages[currentLang.value]),
    t,
  }
}
