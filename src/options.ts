// ==========================================
// 前端選項清單（例外保留，離線也能顯示選單）
// 與後端 salary_backend/app_gradio.py 的選項一致
// ==========================================

export const EDU_LEVELS = ['高中以下', '大學', '碩士以上'] as const

export const CITIES = ['城市A', '城市B', '城市C'] as const

export const MODEL_TYPES = ['LinearRegression', 'Lasso', 'Ridge'] as const

export type EduLevel = (typeof EDU_LEVELS)[number]
export type City = (typeof CITIES)[number]