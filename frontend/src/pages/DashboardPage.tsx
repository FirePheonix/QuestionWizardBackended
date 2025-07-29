import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@clerk/clerk-react';
import axios from 'axios';
import { BalanceInfoResponse, HistoryResponse, GenerationHistoryItem, PaginationInfo } from '../types';
import { useNavigate } from 'react-router-dom';

import BalanceCard from '../components/dashboard/BalanceCard';
import UsageMeters from '../components/dashboard/UsageMeters';
import UsageAnalyticsChart from '../components/dashboard/UsageAnalyticsChart';
import GenerationHistoryTable from '../components/dashboard/GenerationHistoryTable';
import { Loader2, PlusCircle } from 'lucide-react';

const DashboardPage: React.FC = () => {
  const { getToken } = useAuth();
  const navigate = useNavigate();
  const [balanceInfo, setBalanceInfo] = useState<BalanceInfoResponse | null>(null);
  const [historyData, setHistoryData] = useState<GenerationHistoryItem[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboardData = useCallback(async (page = 1, limit = 10) => {
    setIsLoading(true);
    setError(null);
    try {
      const token = await getToken();
      const config = {
        headers: { 'Authorization': `Bearer ${token}` }
      };
      
      const [balanceRes, historyRes] = await Promise.all([
        axios.get('/api/v1/ai-generation/balance', config),
        axios.get(`/api/v1/ai-generation/balance/history?page=${page}&limit=${limit}`, config)
      ]);

      setBalanceInfo(balanceRes.data);
      
      const history: HistoryResponse = historyRes.data;
      setHistoryData(history.history);
      setPagination(history.pagination);

    } catch (err) {
      console.error('Failed to fetch dashboard data:', err);
      setError('Could not load dashboard data. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  }, [getToken]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const handlePageChange = (newPage: number) => {
    if (pagination && newPage > 0 && newPage <= pagination.totalPages) {
      fetchDashboardData(newPage);
    }
  };

  if (isLoading && !balanceInfo) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
        <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-4rem)] text-red-600">
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <header className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-gray-600 mt-1">
              Welcome back! Here's an overview of your AI generation activity.
            </p>
          </div>
          <button
            onClick={() => navigate('/wizard')}
            className="flex items-center space-x-2 bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <PlusCircle className="w-5 h-5" />
            <span>New Generation</span>
          </button>
        </header>

        <main className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            {historyData.length > 0 && <UsageAnalyticsChart history={historyData} />}
            <GenerationHistoryTable 
              history={historyData}
              pagination={pagination}
              onPageChange={handlePageChange}
              isLoading={isLoading}
            />
          </div>

          <aside className="space-y-8">
            {balanceInfo && <BalanceCard data={balanceInfo} />}
            {balanceInfo && <UsageMeters meters={balanceInfo.usageMeters} />}
          </aside>
        </main>
      </div>
    </div>
  );
};

export default DashboardPage;
