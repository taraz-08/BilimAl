import { useLang } from '../../context/LangContext'
import { motion } from 'framer-motion'

const LANGS = [
  { code: 'kk', label: 'ҚАЗ' },
  { code: 'ru', label: 'РУС' },
  { code: 'en', label: 'ENG' },
]

export default function LangSwitcher() {
  const { lang, switchLang } = useLang()

  return (
    <div className="flex items-center gap-1 bg-surface-container-low rounded-xl p-1">
      {LANGS.map(({ code, label }) => (
        <motion.button
          key={code}
          onClick={() => switchLang(code)}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className={`
            px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all
            ${lang === code
              ? 'bg-primary text-white shadow-sm'
              : 'text-slate-500 hover:text-slate-900'}
          `}
        >
          {label}
        </motion.button>
      ))}
    </div>
  )
}
