export interface OperationRecord {
  id: number
  type: string
  detail: string
  timestamp: string
  operator: string
}

export type HistoryRecords = OperationRecord[]

export interface HistoryAccount {
  email: string
  token: string
  machineCode: string // 机器码字段
  gpt4Count: number // Model cao cấp使用次数
  gpt35Count: number // Model cơ bản使用次数
  lastUsed: number // 最后使用时间戳
  gpt4MaxUsage?: number | null // Model cao cấp最大使用量
  gpt35MaxUsage?: number | null // Model cơ bản最大使用量
}
