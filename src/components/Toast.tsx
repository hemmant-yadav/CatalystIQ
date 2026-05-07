import { useApp } from '../context/AppContext'

export default function Toast() {
  const { toast } = useApp()
  if (!toast) return null

  const isSuccess = toast.type === 'success'

  return (
    <div
      key={toast.key}
      className="fixed bottom-6 right-6 z-[100] flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-2xl animate-[slideUp_0.3s_ease-out]"
      style={{
        background: isSuccess
          ? 'linear-gradient(135deg, rgba(34,197,94,0.15), rgba(34,197,94,0.05))'
          : 'linear-gradient(135deg, rgba(239,68,68,0.15), rgba(239,68,68,0.05))',
        border: `0.5px solid ${isSuccess ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)'}`,
        backdropFilter: 'blur(12px)',
      }}
    >
      <div
        className={`w-2 h-2 rounded-full shrink-0 ${isSuccess ? 'bg-green-500 shadow-[0_0_6px_rgba(34,197,94,0.5)]' : 'bg-red-500 shadow-[0_0_6px_rgba(239,68,68,0.5)]'}`}
      />
      <span className="text-sm text-foreground/85">{toast.message}</span>
    </div>
  )
}
