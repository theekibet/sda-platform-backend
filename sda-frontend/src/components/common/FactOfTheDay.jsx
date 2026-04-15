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
    <div className="glass-card p-5 border border-primary-100/50">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center">
          <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
        </div>
        <h3 className="text-md font-semibold text-gray-800">Did You Know?</h3>
      </div>
      <p className="text-gray-700 text-sm leading-relaxed mb-3">
        {fact.fact}
      </p>
      <div className="flex items-center gap-2">
        <span className="text-xs font-medium text-primary-600 bg-primary-50 px-2 py-0.5 rounded-full">
          {fact.category}
        </span>
      </div>
    </div>
  );
};

export default FactOfTheDay;