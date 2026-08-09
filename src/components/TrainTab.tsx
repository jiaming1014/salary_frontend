import { useMemo, useState } from 'react'
import { MODEL_TYPES, trainModel } from '../model/train'
import type { ModelKind, TrainResult } from '../model/train'
import { MODEL_META } from '../model/params'
import { SALARY_ROWS } from '../model/dataset'
import Slider from './Slider'

const COEF_COLORS = ['#10b981', '#6366f1', '#8b5cf6', '#0ea5e9', '#f59e0b']

function MetricCard({
  label,
  value,
  color,
}: {
  label: string
  value: string
  color: string
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-center dark:border-slate-700 dark:bg-slate-900/40">
      <div className="text-[11px] font-bold uppercase tracking-wide text-slate-400">
        {label}
      </div>
      <div className="mt-1 text-2xl font-extrabold tabular-nums" style={{ color }}>
        {value}
      </div>
    </div>
  )
}

export default function TrainTab() {
  const [testSize, setTestSize] = useState(0.2)
  const [randomState, setRandomState] = useState(76)
  const [modelType, setModelType] = useState<ModelKind>('LinearRegression')
  const [alpha, setAlpha] = useState(1.0)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<TrainResult | null>(null)

  const maxAbsCoef = useMemo(
    () =>
      result
        ? Math.max(...Object.values(result.feature_coefs).map((v) => Math.abs(v)), 1)
        : 1,
    [result],
  )

  function handleTrain() {
    setLoading(true)
    setResult(null)
    // 使用 requestAnimationFrame 讓介面先更新再計算
    requestAnimationFrame(() => {
      const res = trainModel(SALARY_ROWS, {
        test_size: testSize,
        random_state: randomState,
        model_type: modelType,
        alpha,
      })
      setResult(res)
      setLoading(false)
    })
  }

  const coefEntries = result
    ? Object.entries(result.feature_coefs).sort((a, b) => b[1] - a[1])
    : []

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      {/* 左：超參數 */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800/60">
        <h3 className="mb-1 flex items-center gap-2 text-lg font-bold text-slate-800 dark:text-slate-100">
          <span>⚙️</span> 線性迴歸超參數
        </h3>
        <p className="mb-5 text-sm text-slate-500 dark:text-slate-400">
          調整參數後，於瀏覽器端即時重新訓練模型（純前端）
        </p>

        <div className="flex flex-col gap-5">
          <Slider
            label="測試集比例"
            sublabel="test_size"
            value={testSize}
            min={0.1}
            max={0.5}
            step={0.05}
            decimals={2}
            color="#6366f1"
            onChange={setTestSize}
          />
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-200">
              隨機種子
              <span className="ml-1 text-xs font-normal text-slate-400">random_state</span>
            </label>
            <input
              type="number"
              min={0}
              value={randomState}
              onChange={(e) => setRandomState(Number(e.target.value) || 0)}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 font-mono text-sm text-slate-800 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-200">
              模型演算法
            </label>
            <div className="grid grid-cols-3 gap-2">
              {MODEL_TYPES.map((mt) => (
                <button
                  key={mt}
                  type="button"
                  onClick={() => setModelType(mt)}
                  className={`rounded-xl border px-2 py-2.5 text-sm font-semibold transition ${
                    modelType === mt
                      ? 'border-indigo-500 bg-indigo-50 text-indigo-700 dark:bg-indigo-500/40 dark:text-indigo-300'
                      : 'border-slate-200 bg-white text-slate-600 hover:border-indigo-300 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300'
                  }`}
                >
                  {mt}
                </button>
              ))}
            </div>
          </div>
          <Slider
            label="正則化強度 Alpha"
            sublabel="Lasso / Ridge"
            value={alpha}
            min={0.001}
            max={100}
            step={0.01}
            decimals={3}
            color="#8b5cf6"
            onChange={setAlpha}
          />
        </div>

        <button
          type="button"
          onClick={handleTrain}
          disabled={loading}
          className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-indigo-500 px-4 py-3 font-bold text-white shadow-md transition hover:from-emerald-600 hover:to-indigo-600 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? (
            <>
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
              訓練中…
            </>
          ) : (
            <>🚀 開始訓練模型</>
          )}
        </button>

        <p className="mt-3 text-center text-xs text-slate-400">
          內建資料：{SALARY_ROWS.length} 筆｜既有模型：{MODEL_META.model_type}（R² {MODEL_META.r2.toFixed(4)}）
        </p>
      </div>

      {/* 右：結果 */}
      <div className="flex flex-col gap-6">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800/60">
          <h3 className="mb-4 flex items-center gap-2 text-lg font-bold text-slate-800 dark:text-slate-100">
            <span>📈</span> 評估指標
          </h3>

          {result ? (
            <div className="animate-fade-in">
              <div className="grid grid-cols-3 gap-3">
                <MetricCard
                  label="測試集 R²"
                  value={result.r2.toFixed(4)}
                  color="#10b981"
                />
                <MetricCard
                  label="訓練耗時"
                  value={`${result.train_time.toFixed(3)}s`}
                  color="#6366f1"
                />
                <MetricCard
                  label="演算法"
                  value={result.model_type}
                  color="#8b5cf6"
                />
              </div>
              {result.message && (
                <p className="mt-3 rounded-lg bg-emerald-50 px-4 py-2 text-sm text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
                  ✅ {result.message}
                </p>
              )}
              <p className="mt-2 text-xs text-slate-400 dark:text-slate-500">
                瀏覽器端結果僅供示範，與 sklearn 可能略有差異。
              </p>
            </div>
          ) : (
            <p className="py-6 text-center text-sm text-slate-400">
              尚未訓練，點擊左側按鈕開始
            </p>
          )}
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800/60">
          <h3 className="mb-4 flex items-center gap-2 text-lg font-bold text-slate-800 dark:text-slate-100">
            <span>💡</span> 特徵權重
          </h3>
          {result && coefEntries.length ? (
            <div className="flex animate-fade-in flex-col gap-4">
              {coefEntries.map(([feature, val], idx) => {
                const color = COEF_COLORS[idx % COEF_COLORS.length]
                const pct = (Math.abs(val) / maxAbsCoef) * 100
                return (
                  <div key={feature}>
                    <div className="mb-1.5 flex justify-between text-sm font-semibold text-slate-700 dark:text-slate-200">
                      <span>{feature}</span>
                      <span className="font-mono tabular-nums">
                        {val >= 0 ? '+' : ''}
                        {val.toFixed(4)}
                      </span>
                    </div>
                    <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-700">
                      <div
                        className="h-full rounded-full transition-[width] duration-700 ease-out"
                        style={{ width: `${pct}%`, backgroundColor: val >= 0 ? color : '#94a3b8' }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <p className="py-6 text-center text-sm text-slate-400">尚無權重資料</p>
          )}
        </div>
      </div>
    </div>
  )
}