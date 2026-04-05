// src/components/common/FactOfTheDay.jsx
import { facts } from '../../constants/factsOfTheDay';

const FactOfTheDay = () => {
  // Use the current day of the year to get a stable fact for the day
  const today = new Date();
  const start = new Date(today.getFullYear(), 0, 0);
  const dayOfYear = Math.floor((today - start) / 86400000);
  const index = dayOfYear % facts.length;
  const fact = facts[index];

  return (
    <div className="bg-white rounded-xl p-5 shadow-sm border border-primary-100">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-2xl">💡</span>
        <h3 className="text-lg font-bold text-primary-600">Did You Know?</h3>
      </div>
      <p className="text-gray-700">{fact.fact}</p>
      <span className="text-xs text-gray-400 mt-2 inline-block">{fact.category}</span>
    </div>
  );
};

export default FactOfTheDay;