import React from 'react';
import { FileText, Image, Edit3 } from 'lucide-react';
import { UsageMeter } from '../../types';

interface UsageMetersProps {
  meters: UsageMeter[];
}

const iconMap: { [key: string]: React.ElementType } = {
  text: Edit3,
  image: Image,
  pdf: FileText,
};

const colorMap: { [key: string]: string } = {
  text: 'bg-blue-500',
  image: 'bg-yellow-500',
  pdf: 'bg-red-500',
};

const nameMap: { [key: string]: string } = {
    text: 'Text Generation',
    image: 'Image Analysis',
    pdf: 'PDF Processing',
};

const UsageMeters: React.FC<UsageMetersProps> = ({ meters }) => {
  return (
    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
      <h3 className="text-lg font-semibold text-gray-800 mb-6">Usage by Type</h3>
      <div className="space-y-6">
        {meters.map((meter) => {
          const percentage = meter.limit > 0 ? (meter.used / meter.limit) * 100 : 0;
          const Icon = iconMap[meter.type];

          return (
            <div key={meter.type}>
              <div className="flex items-center mb-2">
                <Icon className="w-5 h-5 text-gray-500 mr-3" />
                <div className="flex-grow">
                  <div className="flex justify-between items-baseline">
                    <span className="text-sm font-medium text-gray-700">{nameMap[meter.type]}</span>
                    <span className="text-xs font-semibold text-gray-600">
                      {meter.used} / {meter.limit}
                    </span>
                  </div>
                </div>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-1.5">
                <div
                  className={`${colorMap[meter.type]} h-1.5 rounded-full`}
                  style={{ width: `${percentage}%` }}
                ></div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default UsageMeters;
