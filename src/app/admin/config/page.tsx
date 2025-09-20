'use client'

import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import Editor from '@monaco-editor/react'
import {
  Save,
  RotateCcw,
  FileText,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Download,
  Upload,
  History,
} from 'lucide-react'

interface ConfigMetadata {
  filePath: string;
  lastModified: string;
  size: number;
  backupCreated?: string;
}

interface BackupItem {
  filename: string;
  timestamp: string;
  created: string;
  size: number;
}

export default function ModelConfigPage() {
  const [config, setConfig] = useState<string>('')
  const [originalConfig, setOriginalConfig] = useState<string>('')
  const [metadata, setMetadata] = useState<ConfigMetadata | null>(null)
  const [backups, setBackups] = useState<BackupItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isValidating, setIsValidating] = useState(false)
  const [validationResult, setValidationResult] = useState<{
    isValid: boolean;
    error?: string;
  } | null>(null)
  const [saveResult, setSaveResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null)
  const [showBackups, setShowBackups] = useState(false)

  useEffect(() => {
    loadConfig()
    loadBackups()
  }, [])

  const loadConfig = async () => {
    try {
      const response = await fetch('/api/admin/config')
      const data = await response.json()

      if (data.success) {
        const configStr = JSON.stringify(data.config, null, 2)
        setConfig(configStr)
        setOriginalConfig(configStr)
        setMetadata(data.metadata)
      } else {
        console.error('Failed to load config:', data.error)
      }
    } catch (error) {
      console.error('Error loading config:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const loadBackups = async () => {
    try {
      const response = await fetch('/api/admin/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'backup-list' })
      })
      const data = await response.json()

      if (data.success) {
        setBackups(data.backups)
      }
    } catch (error) {
      console.error('Error loading backups:', error)
    }
  }

  const validateConfig = async (configToValidate: string = config) => {
    setIsValidating(true)
    try {
      const parsedConfig = JSON.parse(configToValidate)

      const response = await fetch('/api/admin/config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          config: parsedConfig,
          validateOnly: true
        })
      })

      const data = await response.json()
      setValidationResult({
        isValid: data.success,
        error: data.success ? undefined : data.error
      })

      return data.success
    } catch (error) {
      setValidationResult({
        isValid: false,
        error: error instanceof Error ? error.message : 'Invalid JSON format'
      })
      return false
    } finally {
      setIsValidating(false)
    }
  }

  const saveConfig = async () => {
    setIsSaving(true)
    setSaveResult(null)

    try {
      // First validate
      const isValid = await validateConfig()
      if (!isValid) {
        setSaveResult({
          success: false,
          message: 'Please fix validation errors before saving'
        })
        return
      }

      const parsedConfig = JSON.parse(config)

      const response = await fetch('/api/admin/config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ config: parsedConfig })
      })

      const data = await response.json()

      if (data.success) {
        setOriginalConfig(config)
        setMetadata(data.metadata)
        setSaveResult({
          success: true,
          message: 'Configuration saved successfully'
        })
        await loadBackups() // Refresh backup list
      } else {
        setSaveResult({
          success: false,
          message: data.error || 'Failed to save configuration'
        })
      }
    } catch (error) {
      setSaveResult({
        success: false,
        message: error instanceof Error ? error.message : 'Save failed'
      })
    } finally {
      setIsSaving(false)

      // Clear save result after 3 seconds
      setTimeout(() => setSaveResult(null), 3000)
    }
  }

  const resetConfig = () => {
    setConfig(originalConfig)
    setValidationResult(null)
    setSaveResult(null)
  }

  const restoreBackup = async (filename: string) => {
    try {
      const response = await fetch('/api/admin/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'restore-backup',
          filename
        })
      })

      const data = await response.json()

      if (data.success) {
        await loadConfig()
        await loadBackups()
        setSaveResult({
          success: true,
          message: `Configuration restored from ${filename}`
        })
        setShowBackups(false)
      } else {
        setSaveResult({
          success: false,
          message: data.error || 'Failed to restore backup'
        })
      }
    } catch (error) {
      setSaveResult({
        success: false,
        message: 'Restore failed'
      })
    }
  }

  const hasChanges = config !== originalConfig

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading configuration...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Model Configuration</h1>
          <p className="text-gray-400 mt-2">Edit AI model settings and pricing information</p>
        </div>

        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            onClick={() => setShowBackups(!showBackups)}
            className="border-gray-700 text-gray-300"
          >
            <History className="w-4 h-4 mr-2" />
            Backups ({backups.length})
          </Button>
        </div>
      </div>

      {/* File Info */}
      {metadata && (
        <Card className="bg-gray-800 border-gray-700 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <FileText className="w-5 h-5 text-blue-400" />
              <div>
                <p className="text-white font-medium">{metadata.filePath}</p>
                <p className="text-sm text-gray-400">
                  Last modified: {new Date(metadata.lastModified).toLocaleString()}
                  <span className="ml-4">Size: {metadata.size} bytes</span>
                </p>
              </div>
            </div>

            {hasChanges && (
              <Badge variant="secondary" className="bg-yellow-600/20 text-yellow-400">
                Unsaved Changes
              </Badge>
            )}
          </div>
        </Card>
      )}

      {/* Backups Panel */}
      {showBackups && (
        <Card className="bg-gray-800 border-gray-700 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">Configuration Backups</h3>
            <Button
              variant="ghost"
              onClick={() => setShowBackups(false)}
              className="text-gray-400"
            >
              ✕
            </Button>
          </div>

          <div className="space-y-2 max-h-60 overflow-y-auto">
            {backups.map((backup) => (
              <div
                key={backup.filename}
                className="flex items-center justify-between p-3 bg-gray-700/50 rounded-lg"
              >
                <div>
                  <p className="text-white text-sm">{backup.filename}</p>
                  <p className="text-xs text-gray-400">
                    {new Date(backup.created).toLocaleString()} • {backup.size} bytes
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => restoreBackup(backup.filename)}
                  className="border-gray-600 text-gray-300"
                >
                  Restore
                </Button>
              </div>
            ))}

            {backups.length === 0 && (
              <p className="text-gray-400 text-center py-4">No backups available</p>
            )}
          </div>
        </Card>
      )}

      {/* Actions */}
      <div className="flex items-center gap-4">
        <Button
          onClick={saveConfig}
          disabled={isSaving || !hasChanges}
          className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
        >
          {isSaving ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Saving...
            </>
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              Save Configuration
            </>
          )}
        </Button>

        <Button
          variant="outline"
          onClick={resetConfig}
          disabled={!hasChanges}
          className="border-gray-700 text-gray-300"
        >
          <RotateCcw className="w-4 h-4 mr-2" />
          Reset Changes
        </Button>

        <Button
          variant="outline"
          onClick={() => validateConfig()}
          disabled={isValidating}
          className="border-gray-700 text-gray-300"
        >
          {isValidating ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-300 mr-2"></div>
              Validating...
            </>
          ) : (
            <>
              <CheckCircle2 className="w-4 h-4 mr-2" />
              Validate
            </>
          )}
        </Button>
      </div>

      {/* Validation Result */}
      {validationResult && (
        <Card className={`border-l-4 p-4 ${
          validationResult.isValid
            ? 'bg-green-900/20 border-green-500'
            : 'bg-red-900/20 border-red-500'
        }`}>
          <div className="flex items-center gap-3">
            {validationResult.isValid ? (
              <CheckCircle2 className="w-5 h-5 text-green-400" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-red-400" />
            )}
            <div>
              <p className={validationResult.isValid ? 'text-green-400' : 'text-red-400'}>
                {validationResult.isValid ? 'Configuration is valid' : 'Validation failed'}
              </p>
              {validationResult.error && (
                <p className="text-sm text-gray-400 mt-1">{validationResult.error}</p>
              )}
            </div>
          </div>
        </Card>
      )}

      {/* Save Result */}
      {saveResult && (
        <Card className={`border-l-4 p-4 ${
          saveResult.success
            ? 'bg-green-900/20 border-green-500'
            : 'bg-red-900/20 border-red-500'
        }`}>
          <div className="flex items-center gap-3">
            {saveResult.success ? (
              <CheckCircle2 className="w-5 h-5 text-green-400" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-red-400" />
            )}
            <p className={saveResult.success ? 'text-green-400' : 'text-red-400'}>
              {saveResult.message}
            </p>
          </div>
        </Card>
      )}

      {/* Editor */}
      <Card className="bg-gray-800 border-gray-700">
        <div className="p-4 border-b border-gray-700">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-white">JSON Configuration</h3>
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <Clock className="w-4 h-4" />
              <span>Auto-validation on edit</span>
            </div>
          </div>
        </div>

        <div className="h-[600px]">
          <Editor
            height="100%"
            defaultLanguage="json"
            value={config}
            onChange={(value) => {
              setConfig(value || '')
              setValidationResult(null)
              setSaveResult(null)
            }}
            theme="vs-dark"
            options={{
              minimap: { enabled: false },
              scrollBeyondLastLine: false,
              fontSize: 14,
              lineNumbers: 'on',
              roundedSelection: false,
              automaticLayout: true,
              wordWrap: 'on',
              formatOnPaste: true,
              formatOnType: true,
              tabSize: 2,
              insertSpaces: true,
            }}
          />
        </div>
      </Card>

      {/* Help Text */}
      <Card className="bg-gray-800 border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Configuration Schema</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
          <div>
            <h4 className="font-medium text-gray-300 mb-2">Required Fields per Model:</h4>
            <ul className="space-y-1 text-gray-400">
              <li><code className="text-blue-400">inputPrice</code> - Price per input token ($)</li>
              <li><code className="text-blue-400">outputPrice</code> - Price per output token ($)</li>
              <li><code className="text-blue-400">contextWindow</code> - Maximum context size</li>
            </ul>
          </div>

          <div>
            <h4 className="font-medium text-gray-300 mb-2">Optional Fields:</h4>
            <ul className="space-y-1 text-gray-400">
              <li><code className="text-blue-400">name</code> - Display name</li>
              <li><code className="text-blue-400">description</code> - Model description</li>
              <li><code className="text-blue-400">maxTokens</code> - Max output tokens</li>
              <li><code className="text-blue-400">capabilities</code> - Feature array</li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  )
}