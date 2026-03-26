import { motion } from 'framer-motion'

const TG_URL = 'https://t.me/Zhanibekov_AI_bot'

export default function TelegramButton() {
  return (
    <motion.a
      href={TG_URL}
      target="_blank"
      rel="noopener noreferrer"
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ delay: 0.8, type: 'spring', stiffness: 260, damping: 20 }}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.93 }}
      className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full shadow-xl flex items-center justify-center"
      style={{ background: '#29A8E0' }}
      title="Telegram AI бот"
    >
      {/* Telegram SVG icon */}
      <svg width="30" height="30" viewBox="0 0 240 240" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M120 0C53.73 0 0 53.73 0 120s53.73 120 120 120 120-53.73 120-120S186.27 0 120 0z" fill="#29A8E0"/>
        <path d="M54.17 118.72l37.12 13.86 14.36 46.18c.92 2.95 4.56 4.04 6.97 2.1l20.13-16.4a9.73 9.73 0 0111.63-.28l36.33 26.38c2.66 1.93 6.38.47 7.08-2.74l27.4-129.17c.75-3.53-2.77-6.48-6.13-5.15L54.13 111.1c-3.75 1.44-3.73 6.77.04 8.62z" fill="white"/>
        <path d="M91.29 132.58l-4.15 30.93c-.52 3.87 4.37 5.98 6.74 2.87l16.03-20.48-18.62-13.32z" fill="#C8DAEA"/>
        <path d="M91.29 132.58l56.63-35.86-33.5 48.11-23.13-12.25z" fill="#A9C6D4"/>
      </svg>

      {/* Pulse ring */}
      <span className="absolute inset-0 rounded-full animate-ping opacity-30" style={{ background: '#29A8E0' }} />
    </motion.a>
  )
}
