// src/pages/admin/Analytics.jsx
import { useState, useEffect } from 'react';
import {
  getUserGrowth,
  getDemographics,
  getContentAnalytics,
  getEngagementMetrics,
  getAuthAnalytics,          // ✅ Add this API function (see note below)
} from '../../services/api';

function Analytics() {
  const [userGrowth, setUserGrowth] = useState(null);
  const [demographics, setDemographics] = useState(null);
  const [contentStats, setContentStats] = useState(null);
  const [engagement, setEngagement] = useState(null);
  const [authAnalytics, setAuthAnalytics] = useState(null);      // ✅ New state
  const [dateRange, setDateRange] = useState({
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0],
  });
  const [period, setPeriod] = useState('daily');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAllAnalytics();
  }, [dateRange, period]);

  const fetchAllAnalytics = async () => {
    setLoading(true);
    try {
      const [growthRes, demoRes, contentRes, engagementRes, authRes] = await Promise.all([
        getUserGrowth(dateRange.start, dateRange.end, period),
        getDemographics(),
        getContentAnalytics(dateRange.start, dateRange.end),
        getEngagementMetrics(30),
        getAuthAnalytics(),                                   // ✅ New call
      ]);

      setUserGrowth(growthRes.data);
      setDemographics(demoRes.data);
      setContentStats(contentRes.data);
      setEngagement(engagementRes.data);
      setAuthAnalytics(authRes.data);                         // ✅ Store data
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const getMaxGrowthCount = () => {
    if (!userGrowth?.growth?.length) return 1;
    return Math.max(...userGrowth.growth.map(g => g.count));
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <div className="w-8 h-8 border-4 border-gray-200 border-t-primary-500 rounded-full animate-spin"></div>
        <p className="text-gray-500 mt-3">Loading analytics...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
          <svg className="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          Analytics Dashboard
        </h2>
        <div className="flex flex-wrap gap-3 items-center">
          <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1">
            <input
              type="date"
              value={dateRange.start}
              onChange={(e) => setDateRange({...dateRange, start: e.target.value})}
              className="px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
            <span className="text-gray-500">to</span>
            <input
              type="date"
              value={dateRange.end}
              onChange={(e) => setDateRange({...dateRange, end: e.target.value})}
              className="px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white"
          >
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
            <option value="yearly">Yearly</option>
          </select>
        </div>
      </div>

      {/* User Growth Section */}
      {userGrowth && (
        <div className="glass-card p-6">
          <h3 className="text-md font-semibold text-gray-800 mb-4 pb-2 border-b-2 border-primary-500 inline-block">
            User Growth
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            <div className="bg-gray-50 rounded-xl p-4 text-center">
              <div className="text-3xl font-bold text-primary-600 mb-1">
                {(userGrowth.total || 0).toLocaleString()}
              </div>
              <div className="text-sm text-gray-500">Total Users</div>
            </div>
            <div className="bg-gray-50 rounded-xl p-4 text-center">
              <div className="text-3xl font-bold text-green-600 mb-1">
                {(userGrowth.active30d || 0).toLocaleString()}
              </div>
              <div className="text-sm text-gray-500">Active (30d)</div>
            </div>
          </div>

          {/* Growth Chart */}
          {userGrowth.growth && userGrowth.growth.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-3">
                Growth Trend ({period})
              </h4>
              <div className="space-y-2">
                {userGrowth.growth.slice(-7).map((item, idx) => {
                  const maxCount = getMaxGrowthCount();
                  const widthPercent = maxCount > 0 ? (item.count / maxCount) * 100 : 0;
                  return (
                    <div key={idx} className="flex items-center gap-3 text-xs">
                      <div className="w-16 text-gray-500">{item.period}</div>
                      <div className="flex-1 h-6 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary-500 rounded-full transition-all duration-300 flex items-center justify-end px-2 text-white text-xs"
                          style={{ width: `${widthPercent}%` }}
                        >
                          {widthPercent > 15 && item.count}
                        </div>
                      </div>
                      {widthPercent <= 15 && (
                        <div className="w-10 text-right text-gray-500">{item.count}</div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Demographics Section */}
      {demographics && (
        <div className="glass-card p-6">
          <h3 className="text-md font-semibold text-gray-800 mb-4 pb-2 border-b-2 border-primary-500 inline-block">
            User Demographics
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {/* Age Groups */}
            <div className="bg-gray-50 rounded-xl p-4">
              <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <svg className="w-4 h-4 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Age Groups
              </h4>
              <div className="space-y-2">
                {Object.entries(demographics.ageGroups || {}).map(([group, count]) => (
                  <div key={group} className="flex justify-between items-center py-1 border-b border-gray-200 last:border-0">
                    <span className="text-sm text-gray-600">{group}</span>
                    <span className="font-semibold text-gray-800">{count.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Gender */}
            <div className="bg-gray-50 rounded-xl p-4">
              <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <svg className="w-4 h-4 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                Gender
              </h4>
              <div className="space-y-2">
                {Object.entries(demographics.gender || {}).map(([gender, count]) => (
                  <div key={gender} className="flex justify-between items-center py-1 border-b border-gray-200 last:border-0">
                    <span className="text-sm text-gray-600 capitalize">{gender}</span>
                    <span className="font-semibold text-gray-800">{count.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Top Cities */}
            {demographics.topCities && demographics.topCities.length > 0 && (
              <div className="bg-gray-50 rounded-xl p-4">
                <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <svg className="w-4 h-4 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  Top Cities
                </h4>
                <div className="space-y-2">
                  {demographics.topCities.slice(0, 5).map((city, idx) => (
                    <div key={idx} className="flex justify-between items-center py-1 border-b border-gray-200 last:border-0">
                      <span className="text-sm text-gray-600">{city.city}</span>
                      <span className="font-semibold text-gray-800">{city.count.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ✅ NEW: Authentication Analytics Section */}
      {authAnalytics && (
        <div className="glass-card p-6">
          <h3 className="text-md font-semibold text-gray-800 mb-4 pb-2 border-b-2 border-primary-500 inline-block">
            Authentication Methods
          </h3>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <div className="bg-gray-50 rounded-xl p-4 text-center">
              <div className="text-2xl font-bold text-primary-600 mb-1">
                {authAnalytics.summary?.emailUsers?.toLocaleString() || 0}
              </div>
              <div className="text-sm text-gray-500">Email/Password Users</div>
            </div>
            <div className="bg-gray-50 rounded-xl p-4 text-center">
              <div className="text-2xl font-bold text-blue-600 mb-1">
                {authAnalytics.summary?.googleUsers?.toLocaleString() || 0}
              </div>
              <div className="text-sm text-gray-500">Google Users</div>
            </div>
            <div className="bg-gray-50 rounded-xl p-4 text-center">
              <div className="text-2xl font-bold text-amber-600 mb-1">
                {authAnalytics.summary?.neverLoggedIn?.toLocaleString() || 0}
              </div>
              <div className="text-sm text-gray-500">Never Logged In</div>
            </div>
          </div>

          {/* Provider Distribution Bars */}
          {authAnalytics.providerDistribution && authAnalytics.providerDistribution.length > 0 && (
            <div className="mb-6">
              <h4 className="text-sm font-medium text-gray-700 mb-3">Provider Distribution</h4>
              <div className="space-y-2">
                {authAnalytics.providerDistribution.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-3 text-xs">
                    <div className="w-20 text-gray-500 capitalize">{item.provider}</div>
                    <div className="flex-1 h-6 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary-500 rounded-full flex items-center justify-end px-2 text-white text-xs"
                        style={{ width: `${item.percentage}%` }}
                      >
                        {item.percentage > 15 && `${item.percentage.toFixed(1)}%`}
                      </div>
                    </div>
                    {item.percentage <= 15 && (
                      <div className="w-16 text-right text-gray-500">
                        {item.count} ({item.percentage.toFixed(1)}%)
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recent Logins Table */}
          {authAnalytics.recentLogins && authAnalytics.recentLogins.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-3">Recent Logins</h4>
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 py-2 text-left text-gray-600">Name</th>
                      <th className="px-3 py-2 text-left text-gray-600">Email</th>
                      <th className="px-3 py-2 text-left text-gray-600">Last Login</th>
                      <th className="px-3 py-2 text-left text-gray-600">Method</th>
                    </tr>
                  </thead>
                  <tbody>
                    {authAnalytics.recentLogins.map((login, idx) => (
                      <tr key={idx} className="border-b border-gray-100">
                        <td className="px-3 py-2">{login.name}</td>
                        <td className="px-3 py-2 text-gray-500">{login.email}</td>
                        <td className="px-3 py-2 text-gray-500">
                          {login.lastLoginAt ? new Date(login.lastLoginAt).toLocaleString() : '-'}
                        </td>
                        <td className="px-3 py-2">
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${
                              login.lastLoginMethod === 'google'
                                ? 'bg-blue-100 text-blue-700'
                                : 'bg-green-100 text-green-700'
                            }`}
                          >
                            {login.lastLoginMethod === 'google' ? 'Google' : 'Email'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Content Stats Section */}
      {contentStats && (
        <div className="glass-card p-6">
          <h3 className="text-md font-semibold text-gray-800 mb-4 pb-2 border-b-2 border-primary-500 inline-block">
            Content Statistics
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <div className="bg-gray-50 rounded-xl p-4 text-center">
              <div className="text-2xl font-bold text-primary-600 mb-1">
                {(contentStats.totals?.prayerRequests || 0).toLocaleString()}
              </div>
              <div className="text-sm text-gray-500">Prayer Requests</div>
            </div>
            <div className="bg-gray-50 rounded-xl p-4 text-center">
              <div className="text-2xl font-bold text-green-600 mb-1">
                {(contentStats.totals?.testimonies || 0).toLocaleString()}
              </div>
              <div className="text-sm text-gray-500">Testimonies</div>
            </div>
            <div className="bg-gray-50 rounded-xl p-4 text-center">
              <div className="text-2xl font-bold text-purple-600 mb-1">
                {(contentStats.totals?.groups || 0).toLocaleString()}
              </div>
              <div className="text-sm text-gray-500">Groups</div>
            </div>
          </div>

          {/* Top Prayed Content */}
          {contentStats.topContent?.prayers && contentStats.topContent.prayers.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                <svg className="w-4 h-4 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
                Most Prayed For
              </h4>
              <div className="space-y-3">
                {contentStats.topContent.prayers.slice(0, 3).map((prayer, idx) => (
                  <div key={idx} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center font-bold text-sm">
                      #{idx + 1}
                    </div>
                    <div className="flex-1 text-sm text-gray-700">
                      {prayer.content.substring(0, 80)}...
                    </div>
                    <div className="flex-shrink-0 text-sm font-semibold text-primary-600">
                      {prayer.prayedCount.toLocaleString()} prayers
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Engagement Section */}
      {engagement && (
        <div className="glass-card p-6">
          <h3 className="text-md font-semibold text-gray-800 mb-4 pb-2 border-b-2 border-primary-500 inline-block">
            Engagement Metrics
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-gray-50 rounded-xl p-4 text-center">
              <div className="text-2xl font-bold text-primary-600 mb-1">
                {(engagement.dailyActive?.reduce((sum, day) => sum + day.activeUsers, 0) || 0).toLocaleString()}
              </div>
              <div className="text-sm text-gray-500">Total Active (period)</div>
            </div>
            <div className="bg-gray-50 rounded-xl p-4 text-center">
              <div className="text-2xl font-bold text-green-600 mb-1">
                {engagement.dailyActive?.length > 0
                  ? Math.round(engagement.dailyActive.reduce((sum, day) => sum + day.activeUsers, 0) / engagement.dailyActive.length)
                  : 0}
              </div>
              <div className="text-sm text-gray-500">Avg Daily Active</div>
            </div>
            <div className="bg-gray-50 rounded-xl p-4 text-center">
              <div className="text-2xl font-bold text-yellow-600 mb-1">
                {engagement.retention?.retentionRate?.toFixed(1) || 0}%
              </div>
              <div className="text-sm text-gray-500">Retention Rate</div>
            </div>
            <div className="bg-gray-50 rounded-xl p-4 text-center">
              <div className="text-2xl font-bold text-purple-600 mb-1">
                {typeof engagement.avgSessionDuration === 'object'
                  ? engagement.avgSessionDuration.average
                  : engagement.avgSessionDuration || 0}{' '}
                min
              </div>
              <div className="text-sm text-gray-500">Avg Session</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Analytics;