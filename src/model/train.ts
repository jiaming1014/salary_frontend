// ==========================================
// 純瀏覽器重新訓練（線上訓練分頁）
// 在瀏覽器端以 TypeScript 實作：
//   - 特徵編碼（Ordinal + OneHot，與 Python 端一致）
//   - 可重現的 train_test_split（mulberry32 假亂數）
//   - StandardScaler（僅以訓練集擬合）
//   - 線性迴歸求解（OLS / Ridge 用正規方程式，Lasso 用座標下降）
//   - R² 評估
// 備註：瀏覽器端數值與原始 sklearn 可能略有差異，供示範用途。
// ==========================================

import type { SalaryRow } from './dataset'
import { CITIES, EDU_LEVELS } from './params'

export type ModelKind = 'LinearRegression' | 'Lasso' | 'Ridge'

export const MODEL_TYPES: ModelKind[] = ['LinearRegression', 'Lasso', 'Ridge']

export interface TrainConfig {
  test_size: number // 0.1 ~ 0.5
  random_state: number
  model_type: ModelKind
  alpha: number
}

export interface TrainResult {
  status: string
  r2: number
  train_time: number // 秒
  coef: number[]
  intercept: number
  feature_coefs: Record<string, number>
  model_type: string
  alpha: number | null
  message: string
}

const FEATURE_NAMES = ['YearsExperience', 'EducationLevel', ...CITIES.map((c) => `City_${c}`)]

// ---- mulberry32：可重現假亂數 ----
function mulberry32(seed: number): () => number {
  let a = seed >>> 0
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

// 傳回打亂後的索引以進行 train/test 分割（可重現）
function shuffledIndices(n: number, seed: number): number[] {
  const idx = Array.from({ length: n }, (_, i) => i)
  const rand = mulberry32(seed)
  for (let i = n - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1))
    ;[idx[i], idx[j]] = [idx[j], idx[i]]
  }
  return idx
}

// ---- 特徵編碼：EducationLevel→序數、City→One-Hot ----
function encode(rows: SalaryRow[]): [number[][], number[]] {
  const X: number[][] = []
  const y: number[] = []
  for (const r of rows) {
    const eduIdx = EDU_LEVELS.indexOf(r.education)
    const cityOneHot = CITIES.map((c) => (c === r.city ? 1 : 0))
    X.push([r.years, eduIdx, ...cityOneHot])
    y.push(r.salary)
  }
  return [X, y]
}

// ---- StandardScaler（ddof=0，與 sklearn 一致，僅以 train 擬合）----
interface Scaler {
  mean: number[]
  std: number[]
  scaleRow: (row: number[]) => number[]
}

function fitScaler(X: number[][]): Scaler {
  const n = X.length
  const p = X[0].length
  const mean = new Array(p).fill(0)
  for (const row of X) for (let j = 0; j < p; j++) mean[j] += row[j]
  for (let j = 0; j < p; j++) mean[j] /= n

  const std = new Array(p).fill(0)
  for (const row of X) for (let j = 0; j < p; j++) std[j] += (row[j] - mean[j]) ** 2
  for (let j = 0; j < p; j++) std[j] = Math.sqrt(std[j] / n) || 1

  const scaleRow = (row: number[]) => row.map((v, j) => (v - mean[j]) / std[j])
  return { mean, std, scaleRow }
}

// ---- 矩陣基礎運算 ----
function matMulMat(a: number[][], b: number[][]): number[][] {
  const m = a.length
  const p = a[0].length
  const n2 = b[0].length
  const out: number[][] = Array.from({ length: m }, () => new Array(n2).fill(0))
  for (let i = 0; i < m; i++)
    for (let k = 0; k < p; k++) {
      const aik = a[i][k]
      if (aik === 0) continue
      for (let j = 0; j < n2; j++) out[i][j] += aik * b[k][j]
    }
  return out
}

function matMulVec(a: number[][], v: number[]): number[] {
  return a.map((row) => row.reduce((s, x, j) => s + x * v[j], 0))
}

function transpose(a: number[][]): number[][] {
  return a[0].map((_, j) => a.map((row) => row[j]))
}

function addIntercept(X: number[][]): number[][] {
  return X.map((row) => [1, ...row])
}

// ---- 高斯消去法解 (A + λI)w = b ----
function solveLinear(A: number[][], b: number[], lambda: number): number[] {
  const n = A.length
  const M: number[][] = A.map((row, i) => {
    const r = row.slice()
    r[i] += lambda
    r.push(b[i])
    return r
  })
  for (let col = 0; col < n; col++) {
    let best = col
    for (let r2 = col + 1; r2 < n; r2++)
      if (Math.abs(M[r2][col]) > Math.abs(M[best][col])) best = r2
    if (best !== col) {
      const t = M[best]
      M[best] = M[col]
      M[col] = t
    }
    const pivot = M[col][col]
    if (Math.abs(pivot) < 1e-12) continue
    for (let r2 = col + 1; r2 < n; r2++) {
      const f = M[r2][col] / pivot
      for (let c = col; c <= n; c++) M[r2][c] -= f * M[col][c]
    }
  }
  const w = new Array(n).fill(0)
  for (let r2 = n - 1; r2 >= 0; r2--) {
    let s = M[r2][n]
    for (let c = r2 + 1; c < n; c++) s -= M[r2][c] * w[c]
    w[r2] = Math.abs(M[r2][r2]) < 1e-12 ? 0 : s / M[r2][r2]
  }
  return w
}

// ---- soft-threshold（Lasso）----
function softThreshold(z: number, gamma: number): number {
  return Math.abs(z) <= gamma ? 0 : Math.sign(z) * (Math.abs(z) - gamma)
}

// ---- Lasso 座標下降：輸入含截距欄的設計矩陣，回傳完整權重 ----
function lassoFit(Xt: number[][], y: number[], alpha: number): number[] {
  const n = Xt.length
  const p = Xt[0].length
  const w: number[] = new Array(p).fill(0)
  const resid: number[] = y.slice()
  const alphaN = alpha / n
  const maxIter = 2000
  const tol = 1e-8
  for (let iter = 0; iter < maxIter; iter++) {
    let maxDelta = 0
    for (let j = 0; j < p; j++) {
      const col: number[] = Xt.map((row) => row[j])
      const rho = col.reduce((s, x, i) => s + x * resid[i], 0) / n
      const old = w[j]
      let fresh: number
      if (j === 0) fresh = rho // 截距不受懲罰
      else fresh = softThreshold(rho, alphaN)
      const delta = fresh - old
      if (delta !== 0) {
        for (let i = 0; i < n; i++) resid[i] -= delta * col[i]
        w[j] = fresh
        maxDelta = Math.max(maxDelta, Math.abs(delta))
      }
    }
    if (maxDelta < tol) break
  }
  return w
}

// ---- R² ----
function r2Score(yTrue: number[], yPred: number[]): number {
  const n = yTrue.length
  if (n === 0) return 0
  const meanY = yTrue.reduce((a, b) => a + b, 0) / n
  let ssTot = 0
  let ssRes = 0
  for (let i = 0; i < n; i++) {
    ssTot += (yTrue[i] - meanY) ** 2
    ssRes += (yTrue[i] - yPred[i]) ** 2
  }
  return ssTot === 0 ? 0 : 1 - ssRes / ssTot
}

// ---- 主訓練函式 ----
export function trainModel(rows: SalaryRow[], cfg: TrainConfig): TrainResult {
  const start = performance.now()
  const n = rows.length
  const order = shuffledIndices(n, cfg.random_state)
  const nTest = Math.max(1, Math.round(n * cfg.test_size))
  const trainIdx = order.slice(0, n - nTest)
  const testIdx = order.slice(n - nTest)

  const trainRows = trainIdx.map((i) => rows[i])
  const testRows = testIdx.map((i) => rows[i])

  const [XTrain, yTrain] = encode(trainRows)
  const [XTest, yTest] = encode(testRows)

  const scaler = fitScaler(XTrain)
  const XTrainS = XTrain.map((r) => scaler.scaleRow(r))
  const XTestS = XTest.map((r) => scaler.scaleRow(r))

  const Xt = addIntercept(XTrainS)
  const A = matMulMat(transpose(Xt), Xt)
  const b = matMulVec(transpose(Xt), yTrain)

  let w: number[]
  if (cfg.model_type === 'Lasso') {
    w = lassoFit(Xt, yTrain, cfg.alpha)
  } else {
    const lambda = cfg.model_type === 'Ridge' ? cfg.alpha : 0
    w = solveLinear(A, b, lambda)
  }

  const intercept = w[0]
  const coef = w.slice(1)

  const yPred = XTestS.map((row) => {
    let s = intercept
    for (let j = 0; j < coef.length; j++) s += coef[j] * row[j]
    return s
  })
  const r2 = r2Score(yTest, yPred)
  const train_time = (performance.now() - start) / 1000

  const featureCoefs: Record<string, number> = {}
  FEATURE_NAMES.forEach((name, i) => (featureCoefs[name] = coef[i]))

  const modelTypeLabel =
    cfg.model_type === 'Lasso'
      ? `Lasso（α=${cfg.alpha}）`
      : cfg.model_type === 'Ridge'
        ? `Ridge（α=${cfg.alpha}）`
        : 'LinearRegression'

  return {
    status: 'success',
    r2,
    train_time,
    coef,
    intercept,
    feature_coefs: featureCoefs,
    model_type: cfg.model_type,
    alpha: cfg.model_type === 'LinearRegression' ? null : cfg.alpha,
    message: `${modelTypeLabel} 訓練完成（瀏覽器端，僅供示範）`,
  }
}