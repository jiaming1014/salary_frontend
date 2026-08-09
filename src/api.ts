// ==========================================
// 後端 API 客戶端
// 後端服務：FastAPI + Gradio（salary_backend），部署於 Render
// 呼叫流程：POST /gradio_api/call/<fn> 取得 event_id，再 GET 取結果(SSE)
// 可透過 VITE_API_BASE 覆寫（例如本地測試後端）
// ==========================================

export const API_BASE =
  import.meta.env.VITE_API_BASE?.replace(/\/$/, '') ||
  'https://salary-backend-qdsq.onrender.com'

const API_PREFIX = '/gradio_api'

async function callGradioFn<T>(fn: string, inputs: unknown[]): Promise<T[]> {
  let res: Response
  try {
    res = await fetch(`${API_BASE}${API_PREFIX}/call/${fn}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ inputs }),
    })
  } catch {
    throw new Error(
      '無法連線到後端服務。若服務閒置（Render 免費方案會休眠），首次喚醒約需 30~60 秒，請稍候再試。',
    )
  }

  if (!res.ok) {
    let detail = `HTTP ${res.status}`
    try {
      const data = await res.json()
      if (data?.detail) detail = typeof data.detail === 'string' ? data.detail : JSON.stringify(data.detail)
    } catch {
      /* 忽略解析錯誤 */
    }
    throw new Error(detail)
  }

  const { event_id } = (await res.json()) as { event_id: string }

  let stream: Response
  try {
    stream = await fetch(`${API_BASE}${API_PREFIX}/call/${fn}/${event_id}`, {
      method: 'GET',
    })
  } catch {
    throw new Error('取得預測結果失敗，請稍候再試。')
  }
  if (!stream.ok) {
    throw new Error(`後端回應錯誤：HTTP ${stream.status}`)
  }

  const body = await stream.text()
  // SSE 格式：event: complete\ndata: <json>
  const dataLine = body.split('\n').find((line) => line.startsWith('data:'))
  if (!dataLine) throw new Error('後端未回傳預測結果。')
  try {
    return JSON.parse(dataLine.slice(5).trim()) as T[]
  } catch {
    throw new Error('後端回傳資料格式錯誤。')
  }
}

// ---- 應用程式後端資訊 ----
export interface AppMeta {
  data_size: number
  model_summary: Record<string, string>
}

export function getMeta(): Promise<AppMeta> {
  return callGradioFn<AppMeta>('get_meta', []).then((data) => data[0])
}

// ---- 薪資預測 ----
export interface PredictResult {
  markdown: string
  monthly: number
  annual: number
}

export function predictSalary(input: {
  years_experience: number
  education_level: string
  city: string
}): Promise<PredictResult> {
  return callGradioFn('format_prediction', [
    input.years_experience,
    input.education_level,
    input.city,
  ]).then((data) => ({
    markdown: data[0] as string,
    monthly: data[1] as number,
    annual: data[2] as number,
  }))
}

// ---- 模型訓練 ----
export interface TrainConfig {
  test_size: number
  random_state: number
  model_type: 'LinearRegression' | 'Lasso' | 'Ridge'
  alpha: number
}

export interface TrainResult {
  markdown: string
  r2: number
  train_time: number
  coef_table: string[][]
  summary: Record<string, string>
}

export function trainModel(config: TrainConfig): Promise<TrainResult> {
  return callGradioFn('train_model', [
    config.test_size,
    config.random_state,
    config.model_type,
    config.alpha,
  ]).then((data) => ({
    markdown: data[0] as string,
    r2: data[1] as number,
    train_time: data[2] as number,
    coef_table: (data[3] as { data: string[][] }).data,
    summary: data[4] as Record<string, string>,
  }))
}