// ==========================================
// 純瀏覽器薪資預測：
// 與 Python 端 (train_save.py / app_gradio.py) 邏輯一致
// 特徵順序: [YearsExperience, EducationLevel, City_城市A, City_城市B, City_城市C]
// ==========================================

import { COEF, CITIES, INTERCEPT, SCALER_MEAN, SCALER_SCALE, eduIndex } from './params'
import type { City } from './params'

export interface PredictResult {
  monthly: number // 千元/月
  annual: number // 千元/年（約 14 個月）
}

// 依序建構特徵向量
export function buildFeatureRow(years: number, education: string, city: City): number[] {
  const cityOneHot = CITIES.map((c) => (c === city ? 1 : 0))
  return [years, eduIndex(education), ...cityOneHot]
}

// 標準化後進行線性組合，回傳預測值（千元/月）
export function linearPredict(featureRow: number[]): number {
  let sum = INTERCEPT
  for (let i = 0; i < COEF.length; i++) {
    const centered = (featureRow[i] - SCALER_MEAN[i]) / SCALER_SCALE[i]
    sum += COEF[i] * centered
  }
  return sum
}

export function predictSalary(years: number, education: string, city: City): PredictResult {
  const row = buildFeatureRow(years, education, city)
  const monthly = linearPredict(row)
  return { monthly, annual: monthly * 14 }
}