import { ComprehensiveMonitoringDashboard } from '../../components/organisms/comprehensive-monitoring-dashboard'
import { Navigation } from '../../components/molecules/navigation'

export default function ComprehensivePage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <div className="container mx-auto py-8 px-4">
        <ComprehensiveMonitoringDashboard />
      </div>
    </div>
  )
}