import React from 'react';
import ReactECharts from 'echarts-for-react';
import { GenerationHistoryItem } from '../../types';
import { BarChart } from 'lucide-react';

interface UsageAnalyticsChartProps {
  history: GenerationHistoryItem[];
}

const UsageAnalyticsChart: React.FC<UsageAnalyticsChartProps> = ({ history }) => {
  // Process data for the chart
  const processDataForChart = () => {
    const dataMap = new Map<string, number>();
    
    // Initialize last 7 days with 0 cost
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toLocaleDateString('en-CA'); // YYYY-MM-DD format
      dataMap.set(key, 0);
    }
    
    history.forEach(item => {
      const date = new Date(item.date);
      const key = date.toLocaleDateString('en-CA');
      if (dataMap.has(key)) {
        dataMap.set(key, (dataMap.get(key) || 0) + item.cost);
      }
    });

    const labels = Array.from(dataMap.keys()).map(dateStr => 
      new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    );
    const data = Array.from(dataMap.values());

    return { labels, data };
  };

  const { labels, data } = processDataForChart();

  const option = {
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow',
      },
      formatter: '{b}: {c} credits'
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true,
    },
    xAxis: {
      type: 'category',
      data: labels,
      axisTick: {
        alignWithLabel: true,
      },
    },
    yAxis: {
      type: 'value',
      name: 'Credits Used',
      nameTextStyle: {
        align: 'left'
      }
    },
    series: [
      {
        name: 'Credits Used',
        type: 'bar',
        barWidth: '60%',
        data: data,
        itemStyle: {
          color: '#2563eb',
          borderRadius: [4, 4, 0, 0]
        },
      },
    ],
    dataZoom: [
        {
          type: 'inside',
          start: 0,
          end: 100,
        },
    ],
  };

  return (
    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-800">Usage Analytics</h3>
        <BarChart className="w-6 h-6 text-gray-400" />
      </div>
      <div style={{ height: '350px' }}>
        <ReactECharts option={option} style={{ height: '100%', width: '100%' }} />
      </div>
    </div>
  );
};

export default UsageAnalyticsChart;
