import { useState } from 'react'
import { useApp } from '../context/AppContext'

function SettingsContent() {
  const { user } = useApp()
  const [groqKey, setGroqKey] = useState(localStorage.getItem('user_groq_api_key') || '')
  
  const saveKey = () => {
    localStorage.setItem('user_groq_api_key', groqKey)
    alert('API key saved locally!')
  }

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-headline font-semibold mb-1">Settings</h1>
      <p className="text-foreground/60 text-sm mb-8">Manage your account and preferences.</p>

      <div className="space-y-6">

        <div className="liquid-glass rounded-xl p-6">
          <h2 className="text-lg font-medium mb-4">Profile</h2>
          <div className="flex items-center gap-4">
            {user?.photoURL ? (
              <img src={user.photoURL} alt="Profile" className="w-16 h-16 rounded-full object-cover" />
            ) : (
              <div className="w-16 h-16 rounded-full bg-blue-600 flex items-center justify-center text-xl font-bold text-white">
                {user?.displayName?.charAt(0).toUpperCase() || 'U'}
              </div>
            )}
            <div>
              <div className="text-lg font-semibold">{user?.displayName || 'Guest User'}</div>
              <div className="text-sm text-foreground/60">{user?.email || 'Sign in to sync your profile'}</div>
            </div>
          </div>
        </div>


        <div className="liquid-glass rounded-xl p-6">
          <h2 className="text-lg font-medium mb-4">API Configuration</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground/80 mb-1">Groq API Key (Override)</label>
              <p className="text-xs text-foreground/50 mb-3">Provide your own Groq API key to bypass the default rate limits. This is stored securely in your browser's local storage.</p>
              <div className="flex gap-3">
                <input
                  type="password"
                  value={groqKey}
                  onChange={(e) => setGroqKey(e.target.value)}
                  placeholder="gsk_..."
                  className="flex-1 bg-black/20 border border-white/10 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-blue-500 transition"
                />
                <button
                  onClick={saveKey}
                  className="px-6 py-2 rounded-lg text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 transition"
                >
                  Save Key
                </button>
              </div>
            </div>
          </div>
        </div>


        <div className="liquid-glass rounded-xl p-6">
          <h2 className="text-lg font-medium mb-4">Preferences</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium text-sm">Theme Mode</div>
                <div className="text-xs text-foreground/50">Automatically matches your system theme</div>
              </div>
              <select className="bg-black/20 border border-white/10 rounded-lg px-3 py-1.5 text-sm outline-none">
                <option>System (Dark)</option>
                <option>Light</option>
                <option>Dark</option>
              </select>
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium text-sm">Email Notifications</div>
                <div className="text-xs text-foreground/50">Receive alerts when long-running analyses complete</div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" defaultChecked />
                <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SettingsContent
