// src/pages/members/Dashboard.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import VerseOfTheDay from '../../components/bible/VerseOfTheDay';
import TrendingPosts from '../../components/community/TrendingPosts';
import FactOfTheDay from '../../components/common/FactOfTheDay';
import { communityService } from '../../services/communityService';

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
      <div className="glass-card p-5 flex items-center gap-4">
        <span className="text-5xl leading-none">{holiday?.icon || icon}</span>
        <div>
          <div className="flex items-center gap-3 flex-wrap mb-1">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-800">
              {holiday ? holiday.message : `${greeting}, ${user?.name?.split(' ')[0] || 'Friend'}!`}
            </h2>
            <span className="bg-primary-100 text-primary-700 px-2 py-0.5 rounded-full text-xs font-medium">
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
      <div className="glass-card p-4 flex items-center justify-center min-w-[150px]">
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
            <span>⛅</span>
            <span>Weather unavailable</span>
          </div>
        )}
      </div>

      {/* Upcoming events */}
      <div className="glass-card p-4 min-w-[200px]">
        <div className="flex items-center gap-2 mb-3 pb-2 border-b border-gray-100">
          <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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

/* ══════════════════════════════════════════════════════════
   Dashboard
══════════════════════════════════════════════════════════ */
const Dashboard = () => {
  const handlePostClick = (postId) => {
    window.location.href = `/community/post/${postId}`;
  };

  const actions = [
    { icon: '🙏', label: 'Post Prayer', href: '/prayer-wall' },
    { icon: '📖', label: 'Read Bible', href: '/bible/reader' },
    { icon: '🤝', label: 'Join Group', href: '/groups' },
    { icon: '📝', label: 'Create Post', href: '/community/create' },
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-8">
      {/* Greeting Card */}
      <Greeting />

      {/* Fact of the Day */}
      <FactOfTheDay />

      {/* Verse of the Day */}
      <VerseOfTheDay />



      {/* Trending Posts */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
            <svg className="w-5 h-5 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
            Trending in Community
          </h3>
          <button
            onClick={() => (window.location.href = '/community')}
            className="text-sm text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1"
          >
            View All
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
        <TrendingPosts limit={3} onPostClick={handlePostClick} />
      </section>
    </div>
  );
};

export default Dashboard;