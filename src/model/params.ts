// ==========================================
// 已訓練模型參數（經 salary_model.joblib 匯出）
// 前端純瀏覽器計算，不需任何後端
// ==========================================

export const MODEL_META = {
  model_type: 'Lasso' as const,
  alpha: 2.691,
  r2: 0.9035676449309604,
  train_time: 0.03,
}

// 特徵順序（與 Python 端一致：
// YearsExperience, EducationLevel, City_城市A, City_城市B, City_城市C）
export const FEATURE_NAMES = [
  'YearsExperience',
  'EducationLevel',
  'City_城市A',
  'City_城市B',
  'City_城市C',
] as const

export type FeatureName = (typeof FEATURE_NAMES)[number]

// 標準化 (StandardScaler)：z = (x - mean) / scale
export const SCALER_MEAN = [5.371428571428572, 1.1785714285714286, 0.5714285714285714, 0.07142857142857142, 0.35714285714285715]

export const SCALER_SCALE = [2.5258459888092295, 0.8041664463712646, 0.49487165930539356, 0.25753937681885636, 0.47915742374995496]

// 線性迴歸權重與截距
export const COEF = [1.9198765147442345, 12.880405507124888, -0.0, -0.0, 0.7038663227714946]

export const INTERCEPT = 51.228571428571435

export const FEATURE_COEFS: Record<string, number> = {
  YearsExperience: 1.9198765147442345,
  EducationLevel: 12.880405507124888,
  'City_城市A': -0.0,
  'City_城市B': -0.0,
  'City_城市C': 0.7038663227714946,
}

// 學歷 OrdinalEncoder：高中以下=0、大學=1、碩士以上=2
export const EDU_LEVELS = ['高中以下', '大學', '碩士以上'] as const

// 城市 OneHotEncoder
export const CITIES = ['城市A', '城市B', '城市C'] as const

export type EduLevel = (typeof EDU_LEVELS)[number]
export type City = (typeof CITIES)[number]

export function eduIndex(edu: string): number {
  const i = EDU_LEVELS.indexOf(edu as EduLevel)
  return i === -1 ? 1 : i
}