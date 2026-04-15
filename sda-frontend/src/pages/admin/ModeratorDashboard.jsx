// src/pages/admin/ModeratorDashboard.jsx
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import {
  getReportStats,
  getModerationLogs,
} from '../../services/api';
import { bibleService } from '../../services/bibleService';
import VerseOfTheDay from '../../components/bible/VerseOfTheDay';
import FactOfTheDay from '../../components/common/FactOfTheDay';

/* ══════════════════════════════════════════════════════════
   Greeting Component (enhanced with weather & events)
══════════════════════════════════════════════════════════ */
const Greeting = () => {
  const { user } = useAuth();
  const [greeting, setGreeting] = useState('');
  const [icon, setIcon] = useState('');
  const [weather, setWeather] = useState(null);
  const [loadingWeather, setLoadingWeather] = useState(false);
  const [holiday, setHoliday] = useState(null);
  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [loadingEvents, setLoadingEvents] = useState(true);

  // Weather fetch
  useEffect(() => {
    if (!navigator.geolocation) return;
    setLoadingWeather(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          const response = await fetch(
            `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true&daily=temperature_2m_max,temperature_2m_min,weathercode,apparent_temperature_max,precipitation_probability_mean&timezone=auto&forecast_days=3`
          );
          const data = await response.json();
          if (data.current_weather) {
            const temp = Math.round(data.current_weather.temperature);
            const weatherCode = data.current_weather.weathercode;
            const weatherIcons = {
              0: '☀️', 1: '🌤️', 2: '⛅', 3: '☁️', 45: '🌫️', 48: '🌫️',
              51: '🌧️', 53: '🌧️', 55: '🌧️', 61: '🌧️', 63: '🌧️', 65: '🌧️',
              71: '🌨️', 73: '🌨️', 75: '🌨️', 77: '🌨️', 80: '🌧️', 81: '🌧️',
              82: '🌧️', 85: '🌨️', 86: '🌨️', 95: '⛈️', 96: '⛈️', 99: '⛈️',
            };
            setWeather({
              temp,
              icon: weatherIcons[weatherCode] || '☁️',
              feelsLike: data.daily?.apparent_temperature_max?.[0] ? Math.round(data.daily.apparent_temperature_max[0]) : null,
              precipProb: data.daily?.precipitation_probability_mean?.[0] ?? null,
              forecast: data.daily ? {
                max: Math.round(data.daily.temperature_2m_max[0]),
                min: Math.round(data.daily.temperature_2m_min[0]),
              } : null,
            });
          }
        } catch (e) { console.error('Weather error:', e); }
        finally { setLoadingWeather(false); }
      },
      () => { setLoadingWeather(false); }
    );
  }, []);

  // Upcoming events: public holidays + Christian feasts + SDA events
  const getEasterDate = (year) => {
    const f = Math.floor;
    const G = year % 19;
    const C = f(year / 100);
    const H = (C - f(C / 4) - f((8 * C + 13) / 25) + 19 * G + 15) % 30;
    const I = H - f(H / 28) * (1 - f(29 / (H + 1)) * f((21 - G) / 11));
    const J = (year + f(year / 4) + I + 2 - C + f(C / 4)) % 7;
    const L = I - J;
    const month = 3 + f((L + 40) / 44);
    const day = L + 28 - 31 * f(month / 4);
    return new Date(year, month - 1, day);
  };

  const getHolidayIcon = (name) => {
    const lower = name.toLowerCase();
    if (lower.includes('christmas')) return '🎄';
    if (lower.includes('easter')) return '🐣';
    if (lower.includes('new year')) return '🎉';
    if (lower.includes('good friday')) return '✝️';
    if (lower.includes('pathfinder')) return '⛺';
    if (lower.includes('youth')) return '👥';
    if (lower.includes('women')) return '🌹';
    return '📅';
  };

  const fetchPublicHolidays = async (year, countryCode = 'KE') => {
    try {
      const res = await fetch(`https://date.nager.at/api/v3/PublicHolidays/${year}/${countryCode}`);
      if (!res.ok) return [];
      const data = await res.json();
      return data.map(h => ({
        name: h.name,
        date: new Date(h.date),
        icon: getHolidayIcon(h.name),
        isPublicHoliday: true,
      }));
    } catch (err) {
      console.error('Failed to fetch public holidays:', err);
      return [];
    }
  };

  const getChurchEvents = (year) => {
    const pathfinderDay = new Date(year, 8, 21);
    const youthDay = new Date(year, 2, 15);
    const womensDay = new Date(year, 2, 8);
    return [
      { name: 'World Pathfinder Day', date: pathfinderDay, icon: '⛺' },
      { name: 'Adventist Youth Day', date: youthDay, icon: '👥' },
      { name: "Women's Ministries Day", date: womensDay, icon: '🌹' },
    ].filter(e => e.date >= new Date());
  };

  const getChristianFeasts = (year) => {
    const now = new Date();
    const easter = getEasterDate(year);
    const goodFriday = new Date(easter);
    goodFriday.setDate(easter.getDate() - 2);
    const christmas = new Date(year, 11, 25);
    const newYear = new Date(year, 0, 1);
    const events = [];
    if (easter >= now) events.push({ name: 'Easter', date: easter, icon: '🐣' });
    if (goodFriday >= now) events.push({ name: 'Good Friday', date: goodFriday, icon: '✝️' });
    if (christmas >= now) events.push({ name: 'Christmas', date: christmas, icon: '🎄' });
    if (newYear >= now) events.push({ name: 'New Year', date: newYear, icon: '🎉' });
    return events;
  };

  useEffect(() => {
    const now = new Date();
    const year = now.getFullYear();

    Promise.all([
      fetchPublicHolidays(year),
      fetchPublicHolidays(year + 1),
    ]).then(([currentYearHolidays, nextYearHolidays]) => {
      const allHolidays = [...currentYearHolidays, ...nextYearHolidays];
      const christianFeasts = getChristianFeasts(year).concat(getChristianFeasts(year + 1));
      const churchEvents = getChurchEvents(year).concat(getChurchEvents(year + 1));
      const allEvents = [...allHolidays, ...christianFeasts, ...churchEvents];
      const unique = [];
      const seen = new Set();
      for (const e of allEvents) {
        const key = `${e.date.toDateString()}-${e.name}`;
        if (!seen.has(key)) {
          seen.add(key);
          unique.push(e);
        }
      }
      const upcoming = unique
        .filter(e => e.date > now)
        .sort((a, b) => a.date - b.date)
        .slice(0, 3)
        .map(e => ({
          ...e,
          daysUntil: Math.ceil((e.date - now) / (1000 * 60 * 60 * 24)),
        }));
      setUpcomingEvents(upcoming);
      setLoadingEvents(false);
    });
  }, []);

  // Greeting based on time of day or holiday
  useEffect(() => {
    const now = new Date();
    const hour = now.getHours();
    const month = now.getMonth();
    const date = now.getDate();

    const easterDate = getEasterDate(now.getFullYear());
    const goodFridayDate = new Date(easterDate);
    goodFridayDate.setDate(easterDate.getDate() - 2);

    const isChristmas = month === 11 && date === 25;
    const isEaster = now.toDateString() === easterDate.toDateString();
    const isGoodFriday = now.toDateString() === goodFridayDate.toDateString();
    const isNewYear = month === 0 && date === 1;

    if (isChristmas) {
      setHoliday({ message: 'Merry Christmas! 🎄', icon: '🎄' });
      setGreeting('Merry Christmas'); setIcon('🎄');
    } else if (isEaster) {
      setHoliday({ message: 'He is Risen! ✝️', icon: '✝️' });
      setGreeting('Happy Easter'); setIcon('✝️');
    } else if (isGoodFriday) {
      setHoliday({ message: 'A day of reflection ✝️', icon: '✝️' });
      setGreeting('Good Friday'); setIcon('✝️');
    } else if (isNewYear) {
      setHoliday({ message: 'Happy New Year! 🎉', icon: '🎉' });
      setGreeting('Happy New Year'); setIcon('🎉');
    } else {
      if (hour < 12) { setGreeting('Good Morning'); setIcon('🌅'); }
      else if (hour < 17) { setGreeting('Good Afternoon'); setIcon('☀️'); }
      else if (hour < 20) { setGreeting('Good Evening'); setIcon('🌆'); }
      else { setGreeting('Good Night'); setIcon('🌙'); }
    }
  }, []);

  const getDayMessage = () => {
    const msgs = {
      0: { emoji: '🙏', text: 'Blessed Sunday' },
      1: { emoji: '💪', text: 'Make it a great Monday' },
      2: { emoji: '🌟', text: 'Trust His plan Tuesday' },
      3: { emoji: '📖', text: 'Wisdom Wednesday' },
      4: { emoji: '🙌', text: 'Thankful Thursday' },
      5: { emoji: '✨', text: 'Faith-filled Friday' },
      6: { emoji: '🕊️', text: 'Sabbath Saturday' },
    };
    return msgs[new Date().getDay()] || { emoji: '🙏', text: 'Blessed day' };
  };

  const dayMessage = getDayMessage();
  const formatDate = (d) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto_auto] gap-4 mb-8">
      {/* Greeting */}
      <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-sm border border-white/50 p-5 flex items-center gap-4">
        <span className="text-5xl leading-none">{holiday?.icon || icon}</span>
        <div>
          <div className="flex items-center gap-3 flex-wrap mb-1">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-800">
              {holiday ? holiday.message : `${greeting}, ${user?.name?.split(' ')[0] || 'Friend'}!`}
            </h2>
            <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full text-xs font-medium">
              {dayMessage.emoji} {dayMessage.text}
            </span>
          </div>
          <p className="text-sm text-gray-500">
            {new Date().toLocaleDateString('en-US', {
              weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
            })}
          </p>
          {user?.id && (
            <p className="text-xs text-gray-400 mt-1 font-mono">
              ID: {user.id}
            </p>
          )}
        </div>
      </div>

      {/* Weather */}
      <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-sm border border-white/50 p-4 flex items-center justify-center min-w-[150px]">
        {loadingWeather ? (
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span>Loading...</span>
          </div>
        ) : weather ? (
          <div className="text-center">
            <div className="flex items-center justify-center gap-2">
              <span className="text-3xl">{weather.icon}</span>
              <div>
                <span className="text-2xl font-bold text-gray-800">{weather.temp}°C</span>
                {weather.feelsLike && (
                  <div className="text-xs text-gray-500">Feels like {weather.feelsLike}°</div>
                )}
              </div>
            </div>
            {weather.precipProb !== null && weather.precipProb > 0 && (
              <div className="text-xs text-gray-500 mt-1">☔ {weather.precipProb}% rain</div>
            )}
            {weather.forecast && (
              <div className="text-xs text-gray-500 mt-1">
                H:{weather.forecast.max}° L:{weather.forecast.min}°
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
            </svg>
            <span>Weather unavailable</span>
          </div>
        )}
      </div>

      {/* Upcoming events */}
      <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-sm border border-white/50 p-4 min-w-[200px]">
        <div className="flex items-center gap-2 mb-3 pb-2 border-b border-gray-100">
          <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">Upcoming</span>
        </div>
        {loadingEvents ? (
          <div className="text-xs text-gray-400 text-center py-4">Loading events...</div>
        ) : upcomingEvents.length > 0 ? (
          <div className="space-y-2">
            {upcomingEvents.map((ev, i) => (
              <div key={i} className="flex items-center gap-3 text-sm">
                <span className="text-lg">{ev.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-gray-800 truncate">{ev.name}</div>
                  <div className="text-xs text-gray-400">{formatDate(ev.date)}</div>
                </div>
                <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full whitespace-nowrap">
                  {ev.daysUntil === 0 ? 'Today!' : ev.daysUntil === 1 ? 'Tomorrow' : `${ev.daysUntil}d`}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-xs text-gray-400 text-center py-4">No upcoming events</div>
        )}
      </div>
    </div>
  );
};

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
        <div className="flex flex-col items-center gap-3 text-blue-500">
          <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-500 rounded-full animate-spin" />
          <p className="text-sm font-medium">Loading dashboard…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Enhanced Greeting Card with Weather & Events */}
      <Greeting />

      {/* Fact of the Day */}
      <FactOfTheDay />

      {/* Verse of the Day */}
      <VerseOfTheDay />


      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 flex items-center gap-4 hover:shadow-md transition-shadow duration-200">
          <div className="w-14 h-14 bg-red-100 rounded-xl flex items-center justify-center">
            <svg className="w-7 h-7 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
            </svg>
          </div>
          <div>
            <h3 className="text-sm text-gray-500 mb-1">Pending Reports</h3>
            <p className="text-2xl font-bold text-gray-800">{stats.pendingReports}</p>
            {stats.highPriority > 0 && (
              <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                {stats.highPriority} high priority
              </p>
            )}
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 flex items-center gap-4 hover:shadow-md transition-shadow duration-200">
          <div className="w-14 h-14 bg-amber-100 rounded-xl flex items-center justify-center">
            <svg className="w-7 h-7 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
          <div>
            <h3 className="text-sm text-gray-500 mb-1">Pending Verses</h3>
            <p className="text-2xl font-bold text-gray-800">{stats.pendingVerses}</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 flex items-center gap-4 hover:shadow-md transition-shadow duration-200">
          <div className="w-14 h-14 bg-green-100 rounded-xl flex items-center justify-center">
            <svg className="w-7 h-7 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <h3 className="text-sm text-gray-500 mb-1">Approved Verses</h3>
            <p className="text-2xl font-bold text-gray-800">{stats.approvedVerses}</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 flex items-center gap-4 hover:shadow-md transition-shadow duration-200">
          <div className="w-14 h-14 bg-purple-100 rounded-xl flex items-center justify-center">
            <svg className="w-7 h-7 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <h3 className="text-sm text-gray-500 mb-1">Scheduled Verses</h3>
            <p className="text-2xl font-bold text-gray-800">{stats.scheduledVerses}</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 flex items-center gap-4 hover:shadow-md transition-shadow duration-200">
          <div className="w-14 h-14 bg-blue-100 rounded-xl flex items-center justify-center">
            <svg className="w-7 h-7 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <div>
            <h3 className="text-sm text-gray-500 mb-1">Quick Actions</h3>
            <div className="flex gap-2 mt-1">
              <Link to="/admin/moderation" className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-md hover:bg-red-200 transition-colors">Reports</Link>
              <Link to="/admin/bible/queue" className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-md hover:bg-blue-200 transition-colors">Verses</Link>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Moderation Activity */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h2 className="text-lg font-semibold text-gray-800">Recent Moderation Activity</h2>
          </div>
          <Link to="/admin/moderation/logs" className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1">
            View all logs
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-100">
            <thead className="bg-gray-50/50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Content Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Moderator</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reason</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {recentActivity.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-8 text-center text-gray-500">
                    <div className="flex flex-col items-center gap-2">
                      <svg className="w-12 h-12 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                      <span>No recent activity</span>
                    </div>
                  </td>
                </tr>
              ) : (
                recentActivity.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                        log.action === 'remove' ? 'bg-red-100 text-red-700' :
                        log.action === 'approve' ? 'bg-green-100 text-green-700' :
                        log.action === 'warn' ? 'bg-amber-100 text-amber-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {log.action === 'remove' && (
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        )}
                        {log.action === 'approve' && (
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                        {log.action === 'warn' && (
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                          </svg>
                        )}
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
      </div>

      {/* Quick Links Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Link
          to="/admin/moderation"
          className="group bg-gradient-to-br from-red-50 to-red-100/50 p-6 rounded-2xl hover:shadow-lg transition-all duration-200 border border-red-200 hover:border-red-300"
        >
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-white rounded-2xl shadow-sm flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
              </svg>
            </div>
            <div>
              <h3 className="font-semibold text-gray-800 text-lg">Content Moderation</h3>
              <p className="text-sm text-gray-600 mt-1">Review reports, flag inappropriate content, and take action</p>
            </div>
          </div>
        </Link>

        <Link
          to="/admin/bible/queue"
          className="group bg-gradient-to-br from-blue-50 to-blue-100/50 p-6 rounded-2xl hover:shadow-lg transition-all duration-200 border border-blue-200 hover:border-blue-300"
        >
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-white rounded-2xl shadow-sm flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
              <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <div>
              <h3 className="font-semibold text-gray-800 text-lg">Verse Moderation</h3>
              <p className="text-sm text-gray-600 mt-1">Approve, schedule, or reject user-submitted Bible verses</p>
            </div>
          </div>
        </Link>

        <Link
          to="/admin/announcements"
          className="group bg-gradient-to-br from-green-50 to-green-100/50 p-6 rounded-2xl hover:shadow-lg transition-all duration-200 border border-green-200 hover:border-green-300"
        >
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-white rounded-2xl shadow-sm flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
              </svg>
            </div>
            <div>
              <h3 className="font-semibold text-gray-800 text-lg">Announcements</h3>
              <p className="text-sm text-gray-600 mt-1">Create and manage community announcements</p>
            </div>
          </div>
        </Link>

        <Link
          to="/admin/analytics"
          className="group bg-gradient-to-br from-purple-50 to-purple-100/50 p-6 rounded-2xl hover:shadow-lg transition-all duration-200 border border-purple-200 hover:border-purple-300"
        >
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-white rounded-2xl shadow-sm flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
              <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <div>
              <h3 className="font-semibold text-gray-800 text-lg">Analytics</h3>
              <p className="text-sm text-gray-600 mt-1">View user growth, engagement, and content metrics</p>
            </div>
          </div>
        </Link>
      </div>
    </div>
  );
}

export default ModeratorDashboard;