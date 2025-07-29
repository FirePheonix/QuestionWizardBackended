import React from 'react';
import { AlertTriangle, Info, Wallet, Calendar } from 'lucide-react';
import { SourceType, UsageMeter } from '../types';

interface BalanceSidebarProps {
  showCostWarning?: boolean;
  showProcessingStatus?: boolean;
  showGenerationSummary?: boolean;
  highlightTextGeneration?: boolean;

  balanceData?: {
    currentBalance: number;
    totalBalance: number;
    balanceAfterGeneration?: number;
    periodStartDate?: string;
    periodEndDate?: string;
  };
  usageMetersData?: UsageMeter[];
  costData?: {
    cost: number;
    sourceType: SourceType;
  };
  processingData?: {
    cost: number;
    sessionId: string | null;
  };
  summaryData?: {
    questionsGenerated: number;
    questionsAccepted: number;
    creditsConsumed: number;
    averageQuality: number;
    qualityBreakdown: {
      excellent: number;
      good: number;
      fair: number;
    };
  };
}

const BalanceSidebar: React.FC<BalanceSidebarProps> = ({ 
  showCostWarning = false,
  showProcessingStatus = false,
  showGenerationSummary = false,
  highlightTextGeneration = false,
  balanceData,
  usageMetersData = [],
  costData,
  processingData,
  summaryData,
}) => {
  const { currentBalance = 0, totalBalance = 1000, balanceAfterGeneration, periodStartDate, periodEndDate } = balanceData || {};
  const balancePercentage = totalBalance > 0 ? (currentBalance / totalBalance) * 100 : 0;

  const getSourceName = (sourceType?: SourceType) => {
    if (sourceType === SourceType.Image) return 'Image analysis';
    if (sourceType === SourceType.PDF) return 'PDF processing';
    return 'Text generation';
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <div className="bg-white border-l border-gray-200 h-full p-6 flex flex-col">
      <h2 className="text-lg font-semibold text-gray-900 mb-6 flex-shrink-0">
        {showProcessingStatus ? 'Processing Status' : showGenerationSummary ? 'Generation Summary' : 'AI Balance & Usage'}
      </h2>
      
      <div className="flex-grow overflow-y-auto pr-2 -mr-2">
        {/* Generation Summary */}
        {showGenerationSummary && summaryData && (
          <div className="space-y-4 mb-8">
            <div className="bg-gray-50 rounded-lg p-4"><div className="flex justify-between items-center"><span className="text-sm text-gray-600">Questions Generated:</span><span className="text-lg font-bold text-gray-900">{summaryData.questionsGenerated}</span></div></div>
            <div className="bg-gray-50 rounded-lg p-4"><div className="flex justify-between items-center"><span className="text-sm text-gray-600">Currently Accepted:</span><span className="text-lg font-bold text-gray-900">{summaryData.questionsAccepted}</span></div></div>
            <div className="bg-gray-50 rounded-lg p-4"><div className="flex justify-between items-center"><span className="text-sm text-gray-600">Avg Quality Score:</span><span className="text-lg font-bold text-gray-900">{summaryData.averageQuality}%</span></div></div>
            <div className="bg-gray-50 rounded-lg p-4"><div className="flex justify-between items-center"><span className="text-sm text-gray-600">Credits Consumed:</span><span className="text-lg font-bold text-gray-900">{summaryData.creditsConsumed}</span></div></div>
          </div>
        )}

        {/* Quality Breakdown */}
        {showGenerationSummary && summaryData && summaryData.questionsGenerated > 0 && (
          <div className="mb-8">
            <h3 className="text-sm font-medium text-gray-700 mb-4">Quality Breakdown</h3>
            <div className="space-y-3">
              <div>
                <div className="flex justify-between items-center mb-1"><span className="text-xs text-gray-600">Excellent (90%+)</span><span className="text-xs font-medium text-gray-900">{summaryData.qualityBreakdown.excellent}</span></div>
                <div className="w-full bg-gray-200 rounded-full h-2"><div className="bg-green-500 h-2 rounded-full" style={{ width: `${(summaryData.qualityBreakdown.excellent / summaryData.questionsGenerated) * 100}%` }}></div></div>
              </div>
              <div>
                <div className="flex justify-between items-center mb-1"><span className="text-xs text-gray-600">Good (80-89%)</span><span className="text-xs font-medium text-gray-900">{summaryData.qualityBreakdown.good}</span></div>
                <div className="w-full bg-gray-200 rounded-full h-2"><div className="bg-blue-500 h-2 rounded-full" style={{ width: `${(summaryData.qualityBreakdown.good / summaryData.questionsGenerated) * 100}%` }}></div></div>
              </div>
              <div>
                <div className="flex justify-between items-center mb-1"><span className="text-xs text-gray-600">Fair (70-79%)</span><span className="text-xs font-medium text-gray-900">{summaryData.qualityBreakdown.fair}</span></div>
                <div className="w-full bg-gray-200 rounded-full h-2"><div className="bg-yellow-500 h-2 rounded-full" style={{ width: `${(summaryData.qualityBreakdown.fair / summaryData.questionsGenerated) * 100}%` }}></div></div>
              </div>
            </div>
          </div>
        )}
        
        {/* Processing Status Box */}
        {showProcessingStatus && processingData && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-center space-x-2 mb-3"><Info className="w-5 h-5 text-blue-600" /><div><p className="text-sm font-medium text-blue-800">Processing questions</p><p className="text-sm text-blue-700">Cost: {processingData.cost} credits</p></div></div>
          </div>
        )}
        
        {/* Cost Warning */}
        {showCostWarning && costData && costData.cost > 0 && !showProcessingStatus && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <div className="flex items-center space-x-2"><AlertTriangle className="w-5 h-5 text-yellow-600" /><div><p className="text-sm font-medium text-yellow-800">{getSourceName(costData.sourceType)} will cost {costData.cost} credits</p></div></div>
          </div>
        )}
        
        {/* Current Balance - only show if not showing generation summary */}
        {!showGenerationSummary && (
          <div className="mb-8">
            <div className="flex justify-between items-center mb-2"><span className="text-sm font-medium text-gray-700">Current Balance</span><span className="text-sm font-bold text-gray-900">{currentBalance}/{totalBalance}</span></div>
            <div className="w-full bg-gray-200 rounded-full h-2"><div className="bg-gradient-to-r from-green-400 to-green-600 h-2 rounded-full" style={{ width: `${balancePercentage}%` }}></div></div>
            
            {showProcessingStatus && balanceAfterGeneration !== undefined && (
              <div className="mt-3 pt-3 border-t border-gray-200">
                <div className="flex justify-between items-center mb-1"><span className="text-xs font-medium text-gray-600">Credits After Generation</span><span className="text-xs font-bold text-gray-800">{balanceAfterGeneration}/{totalBalance}</span></div>
                <div className="w-full bg-gray-200 rounded-full h-1.5"><div className="bg-gradient-to-r from-green-400 to-green-600 h-1.5 rounded-full" style={{ width: `${(balanceAfterGeneration / totalBalance) * 100}%` }}></div></div>
              </div>
            )}
          </div>
        )}

        {/* Usage Meters - only show if not showing generation summary */}
        {!showGenerationSummary && usageMetersData.length > 0 && (
          <div className="mb-8">
            <h3 className="text-sm font-medium text-gray-700 mb-4">Usage Meters</h3>
            <div className="space-y-4">
              {usageMetersData.map((meter) => {
                const percentage = (meter.used / meter.limit) * 100;
                const isDisabled = highlightTextGeneration && meter.type !== 'text';
                return (
                  <div key={meter.type} className={isDisabled ? 'opacity-50' : ''}>
                    <div className="flex justify-between items-center mb-1"><span className={`text-xs ${highlightTextGeneration && meter.type === 'text' ? 'font-semibold text-gray-900' : 'text-gray-600'}`}>{getSourceName(meter.type as SourceType)}</span><span className={`text-xs font-medium text-gray-900`}>{meter.used}/{meter.limit}</span></div>
                    <div className="w-full bg-gray-200 rounded-full h-1.5"><div className={`${highlightTextGeneration && meter.type === 'text' ? 'bg-green-500' : 'bg-gray-300'} h-1.5 rounded-full`} style={{ width: `${percentage}%` }}></div></div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Generation Details */}
        {showProcessingStatus && processingData && (
          <div className="mb-6">
            <h3 className="text-sm font-medium text-gray-700 mb-3">Generation Details</h3>
            <div className="space-y-2 text-xs"><div className="flex justify-between"><span className="text-gray-600">Model:</span><span className="text-gray-900 font-medium">GPT-4</span></div><div className="flex justify-between"><span className="text-gray-600">Session ID:</span><span className="text-gray-900 font-mono">{processingData.sessionId?.substring(0, 6)}</span></div></div>
          </div>
        )}
      </div>

      {/* Period */}
      <div className="text-xs text-gray-500 mt-auto pt-4 border-t border-gray-200 flex-shrink-0">
        {periodStartDate && periodEndDate && (
          <div className="flex items-center justify-center">
            <Calendar className="w-4 h-4 mr-2" />
            Period: {formatDate(periodStartDate)} - {formatDate(periodEndDate)}
          </div>
        )}
      </div>
    </div>
  );
};

export default BalanceSidebar;
