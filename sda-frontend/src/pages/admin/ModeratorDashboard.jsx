// src/pages/admin/ModeratorDashboard.jsx
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import {
  getReportStats,
  getModerationLogs,
} from '../../services/api';
import { bibleService } from '../../services/bibleService';

function ModeratorDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    pendingReports: 0,
    highPriority: 0,
    pendingVerses: 0,
    approvedVerses: 0,
    scheduledVerses: 0,
  });
  const [recentActivity, setRecentActivity] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch report stats
      const reportStatsRes = await getReportStats();
      const reportStats = reportStatsRes.data;
      
      // Fetch pending verse submissions count
      const versesRes = await bibleService.getQueueStatus();
      const verseStats = versesRes.data.data;
      
      // Fetch recent moderation logs (last 10)
      const logsRes = await getModerationLogs({ limit: 10, page: 1 });
      const logs = logsRes.data.logs || [];
      
      setStats({
        pendingReports: reportStats.total || 0,
        highPriority: reportStats.highPriority || 0,
        pendingVerses: verseStats.pending || 0,
        approvedVerses: verseStats.approved || 0,
        scheduledVerses: verseStats.scheduled || 0,
      });
      setRecentActivity(logs);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3 text-primary-500">
          <div className="w-10 h-10 border-4 border-primary-200 border-t-primary-500 rounded-full animate-spin" />
          <p className="text-sm font-medium">Loading dashboard…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Welcome Header */}
      <div className="mb-8 bg-white rounded-xl shadow-sm p-6">
        <h1 className="text-3xl font-bold text-blue-600 mb-1">🛡️ Moderator Dashboard</h1>
        <p className="text-gray-500">Welcome back, {user?.name}</p>
        <p className="text-sm text-gray-400 mt-2">Here you can review flagged content, manage verse submissions, and keep the community safe.</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5 mb-8">
        <div className="bg-white rounded-xl shadow-sm p-5 flex items-center gap-4">
          <span className="text-4xl">📋</span>
          <div>
            <h3 className="text-sm text-gray-500 mb-1">Pending Reports</h3>
            <p className="text-2xl font-bold text-gray-800">{stats.pendingReports}</p>
            {stats.highPriority > 0 && (
              <p className="text-xs text-red-500 mt-1">{stats.highPriority} high priority</p>
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-5 flex items-center gap-4">
          <span className="text-4xl">📖</span>
          <div>
            <h3 className="text-sm text-gray-500 mb-1">Pending Verses</h3>
            <p className="text-2xl font-bold text-gray-800">{stats.pendingVerses}</p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-5 flex items-center gap-4">
          <span className="text-4xl">✅</span>
          <div>
            <h3 className="text-sm text-gray-500 mb-1">Approved Verses</h3>
            <p className="text-2xl font-bold text-gray-800">{stats.approvedVerses}</p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-5 flex items-center gap-4">
          <span className="text-4xl">⏳</span>
          <div>
            <h3 className="text-sm text-gray-500 mb-1">Scheduled Verses</h3>
            <p className="text-2xl font-bold text-gray-800">{stats.scheduledVerses}</p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-5 flex items-center gap-4">
          <span className="text-4xl">⚡</span>
          <div>
            <h3 className="text-sm text-gray-500 mb-1">Quick Actions</h3>
            <div className="flex gap-2 mt-1">
              <Link to="/admin/moderation" className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-md">Reports</Link>
              <Link to="/admin/bible/queue" className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-md">Verses</Link>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Moderation Activity */}
      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-800">Recent Moderation Activity</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Content Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Moderator</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reason</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {recentActivity.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-8 text-center text-gray-500">
                    No recent activity
                   </td>
                </tr>
              ) : (
                recentActivity.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                        log.action === 'remove' ? 'bg-red-100 text-red-700' :
                        log.action === 'approve' ? 'bg-green-100 text-green-700' :
                        log.action === 'warn' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{log.contentType}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{log.moderator?.name || 'System'}</td>
                    <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">{log.reason || '—'}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
           </table>
        </div>
        <div className="px-6 py-3 bg-gray-50 border-t border-gray-200 text-right">
          <Link to="/admin/moderation/logs" className="text-sm text-primary-600 hover:text-primary-700">
            View all logs →
          </Link>
        </div>
      </div>

      {/* Quick Links Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
        <Link
          to="/admin/moderation"
          className="bg-gradient-to-r from-red-50 to-red-100 p-6 rounded-xl hover:shadow-md transition border border-red-200"
        >
          <div className="flex items-center gap-4">
            <span className="text-4xl">📝</span>
            <div>
              <h3 className="font-semibold text-gray-800">Content Moderation</h3>
              <p className="text-sm text-gray-600">Review reports, flag inappropriate content, and take action</p>
            </div>
          </div>
        </Link>

        <Link
          to="/admin/bible/queue"
          className="bg-gradient-to-r from-blue-50 to-blue-100 p-6 rounded-xl hover:shadow-md transition border border-blue-200"
        >
          <div className="flex items-center gap-4">
            <span className="text-4xl">📖</span>
            <div>
              <h3 className="font-semibold text-gray-800">Verse Moderation</h3>
              <p className="text-sm text-gray-600">Approve, schedule, or reject user-submitted Bible verses</p>
            </div>
          </div>
        </Link>

        <Link
          to="/admin/announcements"
          className="bg-gradient-to-r from-green-50 to-green-100 p-6 rounded-xl hover:shadow-md transition border border-green-200"
        >
          <div className="flex items-center gap-4">
            <span className="text-4xl">📢</span>
            <div>
              <h3 className="font-semibold text-gray-800">Announcements</h3>
              <p className="text-sm text-gray-600">Create and manage community announcements</p>
            </div>
          </div>
        </Link>

        <Link
          to="/admin/analytics"
          className="bg-gradient-to-r from-purple-50 to-purple-100 p-6 rounded-xl hover:shadow-md transition border border-purple-200"
        >
          <div className="flex items-center gap-4">
            <span className="text-4xl">📈</span>
            <div>
              <h3 className="font-semibold text-gray-800">Analytics</h3>
              <p className="text-sm text-gray-600">View user growth, engagement, and content metrics</p>
            </div>
          </div>
        </Link>
      </div>
    </div>
  );
}

export default ModeratorDashboard;