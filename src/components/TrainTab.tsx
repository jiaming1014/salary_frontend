import { useEffect, useState } from 'react'
import { trainModel, getMeta } from '../api'
import type { AppMeta, TrainResult } from '../api'
import { MODEL_TYPES } from '../options'
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
  const [modelType, setModelType] = useState('LinearRegression')
  const [alpha, setAlpha] = useState(1.0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<TrainResult | null>(null)
  const [meta, setMeta] = useState<AppMeta | null>(null)

  // 載入後端提供的資料筆數與目前模型摘要
  useEffect(() => {
    getMeta()
      .then(setMeta)
      .catch(() => setMeta(null))
  }, [])

  async function handleTrain() {
    setLoading(true)
    setError(null)
    try {
      const res = await trainModel({
        test_size: testSize,
        random_state: randomState,
        model_type: modelType as 'LinearRegression' | 'Lasso' | 'Ridge',
        alpha,
      })
      setResult(res)
    } catch (e) {
      setError(e instanceof Error ? e.message : '訓練失敗')
    } finally {
      setLoading(false)
    }
  }

  const coefRows = result ? result.coef_table : []
  const maxAbs = result
    ? Math.max(...coefRows.map((row) => Math.abs(parseFloat(row[1]) || 0)), 1)
    : 1

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      {/* 左：超參數 */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800/60">
        <h3 className="mb-1 flex items-center gap-2 text-lg font-bold text-slate-800 dark:text-slate-100">
          <span>⚙️</span> 線性迴歸超參數
        </h3>
        <p className="mb-5 text-sm text-slate-500 dark:text-slate-400">
          調整參數後，由後端重新訓練模型
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
          {error ? (
            <span>⚠️ 無法取得後端資料資訊</span>
          ) : meta ? (
            <>
              內建資料：{meta.data_size} 筆｜目前模型：{meta.model_summary['目前模型']}（R²{' '}
              {meta.model_summary['R² 決定係數']}）
            </>
          ) : (
            <span>載入後端資料資訊中…</span>
          )}
        </p>
      </div>

      {/* 右：結果 */}
      <div className="flex flex-col gap-6">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800/60">
          <h3 className="mb-4 flex items-center gap-2 text-lg font-bold text-slate-800 dark:text-slate-100">
            <span>📈</span> 評估指標
          </h3>

          {error ? (
            <div className="rounded-lg bg-red-50 p-4 text-sm text-red-600 dark:bg-red-950/40 dark:text-red-300">
              ⚠️ {error}
            </div>
          ) : result ? (
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
                  value={modelType}
                  color="#8b5cf6"
                />
              </div>
              {result.markdown && (
                <p className="mt-3 rounded-lg bg-emerald-50 px-4 py-2 text-sm text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
                  ✅ {result.markdown}
                </p>
              )}
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
          {result && coefRows.length ? (
            <div className="flex animate-fade-in flex-col gap-4">
              {coefRows.map(([feature, valStr], idx) => {
                const val = parseFloat(valStr) || 0
                const color = COEF_COLORS[idx % COEF_COLORS.length]
                const pct = (Math.abs(val) / maxAbs) * 100
                return (
                  <div key={feature}>
                    <div className="mb-1.5 flex justify-between text-sm font-semibold text-slate-700 dark:text-slate-200">
                      <span>{feature}</span>
                      <span className="font-mono tabular-nums">{valStr}</span>
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