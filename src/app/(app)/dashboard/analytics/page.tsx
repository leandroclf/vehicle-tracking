/**
 * Analytics Dashboard Page
 * @description Página principal do dashboard analytics
 */

import { Metadata } from 'next';
import { AnalyticsDashboard } from '@/components/analytics/analytics-dashboard';

export const metadata: Metadata = {
  title: 'Dashboard Analytics | Yukz',
  description: 'Análise completa da performance da sua frota',
};

export default function AnalyticsPage() {
  return (
    <div className="container mx-auto py-6">
      <AnalyticsDashboard />
    </div>
  );
}