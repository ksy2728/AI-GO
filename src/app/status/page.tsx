import { RealTimeStatusDashboard } from '@/components/monitoring/RealTimeStatusDashboard'

export default function StatusPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Real-Time Server Status
        </h1>
        <p className="text-gray-600">
          Monitor the real-time status of AI models across different regions. 
          This page uses hybrid monitoring combining Vercel Edge Functions with 5-minute polling.
        </p>
      </div>
      
      <RealTimeStatusDashboard />
    </div>
  )
}

export const metadata = {
  title: 'Real-Time Status | AI Server Information',
  description: 'Monitor real-time status of AI models and servers across regions',
}