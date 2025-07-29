import React from 'react';
import { Wallet, Calendar } from 'lucide-react';
import { BalanceInfoResponse } from '../../types';

interface BalanceCardProps {
  data: BalanceInfoResponse;
}

const BalanceCard: React.FC<BalanceCardProps> = ({ data }) => {
  const { currentCredits, totalCreditsInPeriod, periodStartDate, periodEndDate } = data;
  const balancePercentage = totalCreditsInPeriod > 0 ? (currentCredits / totalCreditsInPeriod) * 100 : 0;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-800">Your Balance</h3>
        <Wallet className="w-6 h-6 text-gray-400" />
      </div>

      <div className="text-center my-6">
        <p className="text-4xl font-bold text-gray-900">{currentCredits.toLocaleString()}</p>
        <p className="text-sm text-gray-500">Credits Remaining</p>
      </div>

      <div className="space-y-3">
        <div>
          <div className="flex justify-between items-center text-xs mb-1">
            <span className="font-medium text-gray-600">Monthly Usage</span>
            <span className="font-semibold text-gray-800">
              {currentCredits} / {totalCreditsInPeriod.toLocaleString()}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div
              className="bg-gradient-to-r from-blue-500 to-green-500 h-2.5 rounded-full"
              style={{ width: `${balancePercentage}%` }}
            ></div>
          </div>
        </div>
        
        <div className="flex items-center justify-center text-xs text-gray-500 pt-2">
          <Calendar className="w-4 h-4 mr-2" />
          <span>
            Period: {formatDate(periodStartDate)} - {formatDate(periodEndDate)}
          </span>
        </div>
      </div>
    </div>
  );
};

export default BalanceCard;
