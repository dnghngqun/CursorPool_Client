import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { getArticleList, isArticleRead, markArticleRead } from '../api'
import type { Article } from '../api/types'
import Logger from '@/utils/logger'

export const useArticleStore = defineStore('article', () => {
  // 状态
  const articles = ref<Article[]>([])
  const loading = ref(false)
  const initialized = ref(false)
  const readArticleIds = ref<number[]>([])

  // Thuộc tính tính toán
  const hasArticles = computed(() => articles.value.length > 0)
  const hasUnreadArticles = computed(() =>
    articles.value.some((article) => !readArticleIds.value.includes(article.id)),
  )

  // Lấy danh sách thông báo
  async function fetchArticles() {
    if (loading.value) return

    try {
      loading.value = true
      const data = await getArticleList()
      articles.value = data
      initialized.value = true

      // 检查每篇文章的已读状态
      await updateReadStatus()
    } catch (error) {
      Logger.error(`Error fetching articles: ${error}`)
    } finally {
      loading.value = false
    }
  }

  // 更新文章已读状态
  async function updateReadStatus() {
    try {
      // 先清空已读ID列表
      readArticleIds.value = []

      // 获取所有已读ID
      for (const article of articles.value) {
        const isRead = await isArticleRead(article.id)
        if (isRead) {
          readArticleIds.value.push(article.id)
        }
      }
    } catch (error) {
      Logger.error(`更新已读状态出错: ${error}`)
    }
  }

  // Kiểm tra bài viết đã đọc chưa
  function isRead(id: number): boolean {
    return readArticleIds.value.includes(id)
  }

  // Đánh dấu bài viết đã đọc
  async function markAsRead(id: number) {
    await markArticleRead(id)
    // 更新本地已读状态
    if (!readArticleIds.value.includes(id)) {
      readArticleIds.value.push(id)
    }
  }

  // 初始化
  async function init() {
    if (!initialized.value) {
      await fetchArticles()
    }
  }

  return {
    articles,
    loading,
    hasArticles,
    hasUnreadArticles,
    fetchArticles,
    isRead,
    markAsRead,
    init,
    readArticleIds,
  }
})
