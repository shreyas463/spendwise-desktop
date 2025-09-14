import React from 'react'
import { useTheme } from '../contexts/ThemeContext'
import { 
  Palette, 
  Database, 
  Bell, 
  Download, 
  Upload,
  Trash2,
  Save,
  RefreshCw
} from 'lucide-react'

export default function Settings() {
  const { theme, setTheme } = useTheme()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-foreground">Settings</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Appearance */}
        <div className="card p-6">
          <div className="flex items-center space-x-3 mb-6">
            <Palette className="h-6 w-6 text-primary" />
            <h2 className="text-xl font-semibold text-foreground">Appearance</h2>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="label block mb-2">Theme</label>
              <select
                value={theme}
                onChange={(e) => setTheme(e.target.value as 'light' | 'dark')}
                className="input w-full"
              >
                <option value="light">Light</option>
                <option value="dark">Dark</option>
              </select>
            </div>
            
            <div>
              <label className="label block mb-2">Accent Color</label>
              <div className="flex space-x-2">
                {['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'].map((color) => (
                  <button
                    key={color}
                    className="w-8 h-8 rounded-full border-2 border-transparent hover:border-foreground"
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Data Management */}
        <div className="card p-6">
          <div className="flex items-center space-x-3 mb-6">
            <Database className="h-6 w-6 text-primary" />
            <h2 className="text-xl font-semibold text-foreground">Data Management</h2>
          </div>
          
          <div className="space-y-4">
            <button className="btn btn-outline w-full justify-start">
              <Upload className="h-4 w-4 mr-2" />
              Import Data
            </button>
            
            <button className="btn btn-outline w-full justify-start">
              <Download className="h-4 w-4 mr-2" />
              Export Data
            </button>
            
            <button className="btn btn-outline w-full justify-start">
              <RefreshCw className="h-4 w-4 mr-2" />
              Sync Data
            </button>
            
            <button className="btn btn-outline w-full justify-start text-danger hover:text-danger">
              <Trash2 className="h-4 w-4 mr-2" />
              Clear All Data
            </button>
          </div>
        </div>

        {/* Notifications */}
        <div className="card p-6">
          <div className="flex items-center space-x-3 mb-6">
            <Bell className="h-6 w-6 text-primary" />
            <h2 className="text-xl font-semibold text-foreground">Notifications</h2>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-foreground">Budget Alerts</p>
                <p className="text-sm text-muted-foreground">Get notified when approaching spending limits</p>
              </div>
              <input type="checkbox" className="toggle" defaultChecked />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-foreground">Weekly Reports</p>
                <p className="text-sm text-muted-foreground">Receive weekly spending summaries</p>
              </div>
              <input type="checkbox" className="toggle" />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-foreground">Large Transactions</p>
                <p className="text-sm text-muted-foreground">Alert for transactions over $500</p>
              </div>
              <input type="checkbox" className="toggle" defaultChecked />
            </div>
          </div>
        </div>

        {/* Preferences */}
        <div className="card p-6">
          <div className="flex items-center space-x-3 mb-6">
            <Save className="h-6 w-6 text-primary" />
            <h2 className="text-xl font-semibold text-foreground">Preferences</h2>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="label block mb-2">Default Currency</label>
              <select className="input w-full">
                <option value="USD">USD - US Dollar</option>
                <option value="EUR">EUR - Euro</option>
                <option value="GBP">GBP - British Pound</option>
                <option value="CAD">CAD - Canadian Dollar</option>
              </select>
            </div>
            
            <div>
              <label className="label block mb-2">Date Format</label>
              <select className="input w-full">
                <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                <option value="YYYY-MM-DD">YYYY-MM-DD</option>
              </select>
            </div>
            
            <div>
              <label className="label block mb-2">Default Chart Period</label>
              <select className="input w-full">
                <option value="3">3 months</option>
                <option value="6">6 months</option>
                <option value="12">12 months</option>
                <option value="24">24 months</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Advanced Settings */}
      <div className="card p-6">
        <h2 className="text-xl font-semibold text-foreground mb-6">Advanced Settings</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <label className="label block mb-2">Auto-categorization</label>
              <div className="flex items-center space-x-2">
                <input type="checkbox" className="toggle" defaultChecked />
                <span className="text-sm text-muted-foreground">Automatically categorize new transactions</span>
              </div>
            </div>
            
            <div>
              <label className="label block mb-2">LLM Model</label>
              <select className="input w-full">
                <option value="mistral">Mistral 7B (Recommended)</option>
                <option value="llama3">LLaMA 3 8B</option>
                <option value="phi3">Phi-3 (Lightweight)</option>
              </select>
            </div>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="label block mb-2">Database Connection</label>
              <div className="text-sm text-muted-foreground">
                <p>Host: localhost:5432</p>
                <p>Database: spendwise_dev</p>
                <p>Status: <span className="text-success">Connected</span></p>
              </div>
            </div>
            
            <div>
              <label className="label block mb-2">Ollama Connection</label>
              <div className="text-sm text-muted-foreground">
                <p>URL: http://localhost:11434</p>
                <p>Status: <span className="text-success">Connected</span></p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <button className="btn btn-primary">
          <Save className="h-4 w-4 mr-2" />
          Save Settings
        </button>
      </div>
    </div>
  )
}
