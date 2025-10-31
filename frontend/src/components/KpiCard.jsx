import React from 'react';

const KpiCard = ({ title, value, icon, color }) => {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-2xl font-bold text-gray-900">
            {typeof value === 'number' ? value.toLocaleString() : value}
          </p>
          <p className="text-gray-600 text-sm mt-1">
            {title}
          </p>
        </div>
        <div className={`w-12 h-12 bg-gradient-to-r ${color} rounded-lg flex items-center justify-center shadow-lg`}>
          <i className={`bx ${icon} text-white text-2xl`}></i>
        </div>
      </div>
    </div>
  );
};

export default KpiCard;