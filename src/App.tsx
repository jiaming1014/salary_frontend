import { useState } from 'react'
import { API_BASE } from './api'
import PredictTab from './components/PredictTab'
import TrainTab from './components/TrainTab'

type TabKey = 'predict' | 'train'

const TABS: { key: TabKey; label: string; icon: string }[] = [
  { key: 'predict', label: '即時預測', icon: '💰' },
  { key: 'train', label: '線上訓練', icon: '⚙️' },
]

function App() {
  const [tab, setTab] = useState<TabKey>('predict')

  return (
    <div className="min-h-svh bg-gradient-to-b from-slate-50 to-slate-100 text-slate-900 dark:from-slate-950 dark:to-slate-900 dark:text-slate-100">
      <div className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 sm:py-12">
        {/* Header */}
        <header className="mb-8 text-center">
          <h1 className="bg-gradient-to-r from-emerald-500 via-teal-500 to-indigo-500 bg-clip-text text-3xl font-extrabold tracking-tight text-transparent sm:text-4xl">
            💰 薪資預測系統
          </h1>
          <p className="mx-auto mt-3 max-w-2xl text-sm text-slate-500 dark:text-slate-400 sm:text-base">
            基於線性迴歸的完整機器學習生命週期展示：依據工作經驗、學歷與城市即時預測月薪，並可在瀏覽器端調整超參數重新訓練。
          </p>
        </header>

        {/* Tabs */}
        <div className="mb-8 flex justify-center">
          <div className="inline-flex gap-1 rounded-full border border-slate-200 bg-white p-1 shadow-sm dark:border-slate-700 dark:bg-slate-800">
            {TABS.map((t) => (
              <button
                key={t.key}
                type="button"
                onClick={() => setTab(t.key)}
                className={`rounded-full px-5 py-2 text-sm font-semibold transition sm:px-6 ${
                  tab === t.key
                    ? 'bg-gradient-to-r from-emerald-500 to-indigo-500 text-white shadow'
                    : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100'
                }`}
              >
                {t.icon} {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <main key={tab} className="animate-fade-in">
          {tab === 'predict' ? <PredictTab /> : <TrainTab />}
        </main>

        {/* Footer */}
        <footer className="mt-12 border-t border-slate-200 pt-6 text-center text-xs text-slate-400 dark:border-slate-700">
          <p>
            後端 API：
            <a
              href={API_BASE}
              target="_blank"
              rel="noreferrer"
              className="font-medium text-emerald-600 hover:underline dark:text-emerald-400"
            >
              {API_BASE.replace(/^https?:\/\//, '')}
            </a>
          </p>
          <p className="mt-1">
            Vite · React · TypeScript · Tailwind CSS ｜ 首次載入若後端休眠，喚醒約需 30~60 秒
          </p>
        </footer>
      </div>
    </div>
  )
}

export default App