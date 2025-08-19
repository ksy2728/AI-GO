'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Activity, Shield, Layers } from 'lucide-react'
import { useLanguage } from '@/contexts/LanguageContext'

export function MetricDescriptions() {
  const { t } = useLanguage()

  const metrics = [
    {
      icon: <Activity className="w-4 h-4 text-blue-600" />,
      title: t('dashboard.charts.activeModels.title'),
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
      textColor: 'text-blue-900',
      iconBg: 'bg-blue-100',
      points: [
        t('dashboard.charts.activeModels.help.0'),
        t('dashboard.charts.activeModels.help.1'),
        t('dashboard.charts.activeModels.help.2')
      ]
    },
    {
      icon: <Shield className="w-4 h-4 text-green-600" />,
      title: t('dashboard.charts.availability.title'),
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
      textColor: 'text-green-900',
      iconBg: 'bg-green-100',
      points: [
        t('dashboard.charts.availability.help.0'),
        t('dashboard.charts.availability.help.1'),
        t('dashboard.charts.availability.help.2')
      ]
    },
    {
      icon: <Layers className="w-4 h-4 text-purple-600" />,
      title: t('dashboard.charts.performance.title'),
      bgColor: 'bg-purple-50',
      borderColor: 'border-purple-200',
      textColor: 'text-purple-900',
      iconBg: 'bg-purple-100',
      points: [
        t('dashboard.charts.performance.help.0'),
        t('dashboard.charts.performance.help.1'),
        t('dashboard.charts.performance.help.2'),
        t('dashboard.charts.performance.help.3')
      ]
    }
  ]

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
      {metrics.map((metric, index) => (
        <Card 
          key={index} 
          className={`${metric.bgColor} ${metric.borderColor} border shadow-sm hover:shadow-md transition-shadow`}
        >
          <div className="p-3">
            <div className="flex items-center gap-2 mb-2">
              <div className={`p-1 rounded-lg ${metric.iconBg}`}>
                {metric.icon}
              </div>
              <h3 className={`text-xs font-semibold ${metric.textColor}`}>
                {metric.title}
              </h3>
            </div>
            <div className="space-y-0.5">
              {metric.points.map((point, idx) => (
                <p key={idx} className={`text-xs ${metric.textColor} opacity-90 leading-normal`}>
                  {idx === 0 ? (
                    <span>{point}</span>
                  ) : (
                    <span>• {point}</span>
                  )}
                </p>
              ))}
            </div>
          </div>
        </Card>
      ))}
    </div>
  )
}