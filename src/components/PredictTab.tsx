import { useCallback, useEffect, useRef, useState } from 'react'
import { predictSalary } from '../api'
import type { PredictResult } from '../api'
import { CITIES, EDU_LEVELS, FEATURE_COEFS } from '../model/params'
import type { City, EduLevel } from '../model/params'
import Slider from './Slider'

// 常見範例，方便一鍵套用
const PRESETS: { name: string; emoji: string; years: number; edu: EduLevel; city: City }[] = [
  { name: '新鮮人', emoji: '🎓', years: 0, edu: '大學', city: '城市A' },
  { name: '職場中堅', emoji: '💼', years: 5, edu: '大學', city: '城市A' },
  { name: '資深主管', emoji: '🏆', years: 10, edu: '碩士以上', city: '城市C' },
  { name: '天選之人', emoji: '🌟', years: 15, edu: '碩士以上', city: '城市B' },
]

export default function PredictTab() {
  const [years, setYears] = useState(5)
  const [edu, setEdu] = useState<EduLevel>('大學')
  const [city, setCity] = useState<City>('城市A')
  const [result, setResult] = useState<PredictResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const runPredict = useCallback(async (y: number, e: EduLevel, c: City) => {
    setLoading(true)
    setError(null)
    try {
      const res = await predictSalary({ years_experience: y, education_level: e, city: c })
      setResult(res)
    } catch (e) {
      setError(e instanceof Error ? e.message : '預測失敗')
    } finally {
      setLoading(false)
    }
  }, [])

  // 條件變動後 400ms 自動預測（防抖）
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => runPredict(years, edu, city), 400)
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [years, edu, city, runPredict])

  const coefs = FEATURE_COEFS

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      {/* 左：輸入 */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800/60">
        <h3 className="mb-1 flex items-center gap-2 text-lg font-bold text-slate-800 dark:text-slate-100">
          <span>📏</span> 輸入條件
        </h3>
        <p className="mb-5 text-sm text-slate-500 dark:text-slate-400">
          調整條件即時預測，由後端模型計算
        </p>

        <div className="flex flex-col gap-5">
          <Slider
            label="工作經驗"
            sublabel="YearsExperience"
            value={years}
            min={0}
            max={30}
            step={0.5}
            color="#10b981"
            unit=" 年"
            onChange={setYears}
          />

          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-200">
              教育程度
              <span className="ml-1 text-xs font-normal text-slate-400">EducationLevel</span>
            </label>
            <div className="grid grid-cols-3 gap-2">
              {EDU_LEVELS.map((e) => (
                <button
                  key={e}
                  type="button"
                  onClick={() => setEdu(e)}
                  className={`rounded-xl border px-2 py-2.5 text-sm font-semibold transition ${
                    edu === e
                      ? 'border-indigo-500 bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300'
                      : 'border-slate-200 bg-white text-slate-600 hover:border-indigo-300 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300'
                  }`}
                >
                  {e}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-200">
              工作城市
              <span className="ml-1 text-xs font-normal text-slate-400">City</span>
            </label>
            <div className="grid grid-cols-3 gap-2">
              {CITIES.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setCity(c)}
                  className={`rounded-xl border px-2 py-2.5 text-sm font-semibold transition ${
                    city === c
                      ? 'border-emerald-500 bg-emerald-50 text-emerald-700 dark:bg-emerald-500/40 dark:text-emerald-300'
                      : 'border-slate-200 bg-white text-slate-600 hover:border-emerald-300 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300'
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-6 border-t border-slate-100 pt-4 dark:border-slate-700">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
            快速套用範例
          </p>
          <div className="flex flex-wrap gap-2">
            {PRESETS.map((p) => (
              <button
                key={p.name}
                type="button"
                onClick={() => {
                  setYears(p.years)
                  setEdu(p.edu)
                  setCity(p.city)
                }}
                className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm font-medium text-slate-600 transition hover:border-emerald-400 hover:bg-emerald-50 hover:text-emerald-700 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200 dark:hover:bg-slate-600"
              >
                {p.emoji} {p.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 右：結果 */}
      <div className="flex flex-col gap-6">
        {/* 預測卡片 */}
        <div className="animate-fade-in rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-teal-50 p-6 text-center shadow-sm dark:border-emerald-800/60 dark:from-emerald-950/40 dark:to-teal-950/40">
          <span className="text-xs font-bold uppercase tracking-widest text-emerald-600 opacity-80 dark:text-emerald-400">
            預測月薪
          </span>
          <h2 className="my-2 text-4xl font-extrabold tabular-nums text-emerald-700 sm:text-5xl dark:text-emerald-300">
            {result ? (
              result.monthly.toLocaleString('zh-TW', { maximumFractionDigits: 1 })
            ) : (
              '—'
            )}{' '}
            K
          </h2>
          <p className="font-medium text-emerald-600/90 dark:text-emerald-400/90">
            （千元 / 月）
          </p>
          {loading && (
            <span className="mt-2 inline-flex items-center gap-1.5 text-xs font-medium text-emerald-600">
              <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
              更新中
            </span>
          )}
        </div>

        {/* 年薪 + 細節 */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800/60">
          <div className="rounded-xl bg-slate-50 p-4 text-center dark:bg-slate-900/40">
            <div className="text-[11px] font-bold uppercase tracking-wide text-slate-400">
              預估年薪（約 14 個月）
            </div>
            <div className="mt-1 text-2xl font-extrabold tabular-nums text-indigo-600 dark:text-indigo-300">
              {result ? result.annual.toFixed(1) : '—'} K
            </div>
          </div>

          {error ? (
            <div className="mt-4 rounded-lg bg-red-50 p-4 text-sm text-red-600 dark:bg-red-950/40 dark:text-red-300">
              ⚠️ {error}
            </div>
          ) : (
            <div className="mt-4 flex flex-col gap-2 text-sm">
              <div className="flex justify-between rounded-lg border border-slate-200 px-3 py-2 dark:border-slate-700">
                <span className="text-slate-500 dark:text-slate-400">🧠 教育程度</span>
                <span className="font-semibold tabular-nums text-slate-700 dark:text-slate-200">
                  {edu}（係數 {coefs.EducationLevel.toFixed(4)}）
                </span>
              </div>
              <div className="flex justify-between rounded-lg border border-slate-200 px-3 py-2 dark:border-slate-700">
                <span className="text-slate-500 dark:text-slate-400">🏙️ 工作城市</span>
                <span className="font-semibold tabular-nums text-slate-700 dark:text-slate-200">
                  {city}（係數 {(coefs[`City_${city}`] ?? 0).toFixed(4)}）
                </span>
              </div>
              <div className="flex justify-between rounded-lg border border-slate-200 px-3 py-2 dark:border-slate-700">
                <span className="text-slate-500 dark:text-slate-400">📈 工作經驗</span>
                <span className="font-semibold tabular-nums text-slate-700 dark:text-slate-200">
                  {years.toFixed(1)} 年（係數 {coefs.YearsExperience.toFixed(4)}）
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}