import { useState } from 'react'
import { Button } from '@components/ui/button'
import { Input } from '@components/ui/input'
import { Label } from '@components/ui/label'
import { Textarea } from '@components/ui/textarea'
import { Badge } from '@components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@components/ui/select'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@components/ui/tabs'
import { Plus, Trash2, Play, Save, Copy, Check, ChevronDown, ChevronRight } from 'lucide-react'

interface Rule {
  id: string
  name: string
  status: number
  headers: Record<string, string>
  body: string
  delay: number
  isActive: boolean
}

interface ApiConfig {
  name: string
  description: string
  method: string
  endpoint: string
  rules: Rule[]
}

export function MockApiPanel() {
  const [copied, setCopied] = useState(false)
  const [expandedRules, setExpandedRules] = useState<Set<string>>(new Set())
  const [config, setConfig] = useState<ApiConfig>({
    name: 'Get User Info',
    description: '获取用户基本信息',
    method: 'GET',
    endpoint: '/api/user',
    rules: [
      {
        id: '1',
        name: '正常返回',
        status: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: 1, name: 'Leo', email: 'leo@example.com' }, null, 2),
        delay: 0,
        isActive: true,
      },
      {
        id: '2',
        name: 'Token 过期',
        status: 401,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Token expired' }, null, 2),
        delay: 300,
        isActive: false,
      },
    ],
  })

  const [activeRuleId, setActiveRuleId] = useState('1')
  const activeRule = config.rules.find((r) => r.id === activeRuleId)

  const toggleRuleExpand = (id: string) => {
    setExpandedRules((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  const addRule = () => {
    const newRule: Rule = {
      id: Date.now().toString(),
      name: 'New Rule',
      status: 200,
      headers: { 'Content-Type': 'application/json' },
      body: '{}',
      delay: 0,
      isActive: false,
    }
    setConfig((prev) => ({
      ...prev,
      rules: [...prev.rules, newRule],
    }))
  }

  const deleteRule = (id: string) => {
    setConfig((prev) => ({
      ...prev,
      rules: prev.rules.filter((r) => r.id !== id),
    }))
    if (activeRuleId === id && config.rules.length > 1) {
      setActiveRuleId(config.rules[0].id)
    }
  }

  const updateRule = (id: string, updates: Partial<Rule>) => {
    setConfig((prev) => ({
      ...prev,
      rules: prev.rules.map((r) => (r.id === id ? { ...r, ...updates } : r)),
    }))
  }

  const setActiveRule = (id: string) => {
    setConfig((prev) => ({
      ...prev,
      rules: prev.rules.map((r) => ({ ...r, isActive: r.id === id })),
    }))
    setActiveRuleId(id)
  }

  const generateYaml = () => {
    const yaml = `name: ${config.name}
description: ${config.description}
method: ${config.method}
endpoint: ${config.endpoint}
rules:
${config.rules
  .map(
    (rule) => `  - name: ${rule.name}
    status: ${rule.status}
    headers:
${Object.entries(rule.headers)
  .map(([key, value]) => `      ${key}: ${value}`)
  .join('\n')}
    body: ${rule.body.replace(/\n/g, '\n      ')}
    delay: ${rule.delay}`
  )
  .join('\n')}`
    return yaml
  }

  const copyYaml = () => {
    navigator.clipboard.writeText(generateYaml())
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="flex h-screen flex-col bg-background text-foreground">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border bg-card px-4 py-3">
        <div className="flex items-center gap-3">
          <Select value={config.method} onValueChange={(value) => setConfig({ ...config, method: value })}>
            <SelectTrigger className="w-24 bg-secondary text-secondary-foreground">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="GET">GET</SelectItem>
              <SelectItem value="POST">POST</SelectItem>
              <SelectItem value="PUT">PUT</SelectItem>
              <SelectItem value="PATCH">PATCH</SelectItem>
              <SelectItem value="DELETE">DELETE</SelectItem>
            </SelectContent>
          </Select>
          <Input
            value={config.endpoint}
            onChange={(e) => setConfig({ ...config, endpoint: e.target.value })}
            className="w-96 bg-secondary font-mono text-sm"
            placeholder="/api/endpoint"
          />
          <Button size="sm" variant="default" className="gap-2">
            <Play className="h-4 w-4" />
            Test
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="ghost" className="gap-2">
            <Save className="h-4 w-4" />
            Save
          </Button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Main Content */}
        <div className="flex flex-1 flex-col overflow-hidden">
          {/* API Info */}
          <div className="border-b border-border bg-card p-4">
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="name" className="text-muted-foreground">
                  API Name
                </Label>
                <Input
                  id="name"
                  value={config.name}
                  onChange={(e) => setConfig({ ...config, name: e.target.value })}
                  className="bg-secondary"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="description" className="text-muted-foreground">
                  Description
                </Label>
                <Input
                  id="description"
                  value={config.description}
                  onChange={(e) => setConfig({ ...config, description: e.target.value })}
                  className="bg-secondary"
                />
              </div>
            </div>
          </div>

          {/* Rules Section */}
          <div className="flex flex-1 flex-col overflow-hidden">
            <div className="border-b border-border bg-card px-4 py-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium">Response Rules</h3>
                <Button size="sm" variant="outline" onClick={addRule} className="gap-2">
                  <Plus className="h-4 w-4" />
                  Add Rule
                </Button>
              </div>
            </div>

            {/* Rules List */}
            <div className="flex-1 overflow-auto">
              <div className="divide-y divide-border">
                {config.rules.map((rule) => {
                  const isExpanded = expandedRules.has(rule.id)
                  return (
                    <div
                      key={rule.id}
                      className={`border-l-4 transition-colors ${
                        rule.isActive
                          ? 'border-l-primary bg-primary/5'
                          : 'border-l-transparent hover:bg-accent/50'
                      }`}
                    >
                      {/* Rule Header */}
                      <div
                        className="flex cursor-pointer items-center justify-between px-4 py-3"
                        onClick={() => toggleRuleExpand(rule.id)}
                      >
                        <div className="flex flex-1 items-center gap-3">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                          >
                            {isExpanded ? (
                              <ChevronDown className="h-4 w-4" />
                            ) : (
                              <ChevronRight className="h-4 w-4" />
                            )}
                          </Button>
                          <div className="flex items-center gap-3">
                            <span className="font-medium">{rule.name}</span>
                            {rule.isActive && (
                              <Badge className="bg-success text-white">Active</Badge>
                            )}
                            <Badge variant="outline" className="font-mono text-xs">
                              {rule.status}
                            </Badge>
                            {rule.delay > 0 && (
                              <span className="text-xs text-muted-foreground">
                                {rule.delay}ms delay
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant={rule.isActive ? 'default' : 'outline'}
                            onClick={(e) => {
                              e.stopPropagation()
                              setActiveRule(rule.id)
                            }}
                            className={rule.isActive ? 'bg-success hover:bg-success/90' : ''}
                          >
                            {rule.isActive ? 'Active' : 'Set Active'}
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={(e) => {
                              e.stopPropagation()
                              setActiveRuleId(rule.id)
                            }}
                          >
                            Edit
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={(e) => {
                              e.stopPropagation()
                              deleteRule(rule.id)
                            }}
                            disabled={config.rules.length === 1}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      {/* Rule Details - Collapsible */}
                      {isExpanded && (
                        <div className="border-t border-border bg-card/50 px-4 py-4">
                          <div className="space-y-4">
                            {/* Headers Preview */}
                            <div>
                              <h4 className="mb-2 text-xs font-medium text-muted-foreground">
                                Headers
                              </h4>
                              <div className="space-y-1">
                                {Object.entries(rule.headers).map(([key, value]) => (
                                  <div
                                    key={key}
                                    className="flex gap-2 text-xs font-mono text-muted-foreground"
                                  >
                                    <span className="text-foreground">{key}:</span>
                                    <span>{value}</span>
                                  </div>
                                ))}
                              </div>
                            </div>

                            {/* Body Preview */}
                            <div>
                              <h4 className="mb-2 text-xs font-medium text-muted-foreground">
                                Response Body
                              </h4>
                              <pre className="max-h-40 overflow-auto rounded border border-border bg-secondary p-2 text-xs font-mono text-foreground">
                                {rule.body}
                              </pre>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Right Sidebar - YAML Preview */}
        <div className="w-96 border-l border-border bg-card">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <h3 className="text-sm font-medium">YAML Preview</h3>
            <Button size="sm" variant="ghost" onClick={copyYaml}>
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            </Button>
          </div>
          <pre className="overflow-auto p-4 font-mono text-xs text-muted-foreground">
            {generateYaml()}
          </pre>
        </div>
      </div>
    </div>
  )
}
