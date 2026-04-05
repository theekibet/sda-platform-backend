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

  // Weather fetch (enhanced)
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
      { name: 'Women’s Ministries Day', date: womensDay, icon: '🌹' },
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
  const glassPanel = 'bg-white/15 backdrop-blur-md border border-white/20 rounded-xl p-3';

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto_auto] gap-4 mb-8 p-5 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-2xl text-white shadow-glow">
      {/* Greeting */}
      <div className="flex items-center gap-4 min-w-0">
        <span className="text-5xl leading-none shrink-0">{holiday?.icon || icon}</span>
        <div className="min-w-0">
          <div className="flex items-center gap-3 flex-wrap mb-1">
            <h2 className="text-2xl font-bold font-display tracking-tight leading-tight">
              {holiday ? holiday.message : `${greeting}, ${user?.name?.split(' ')[0] || 'Friend'}!`}
            </h2>
            <span className="bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap">
              {dayMessage.emoji} {dayMessage.text}
            </span>
          </div>
          <p className="text-sm opacity-90">
            {new Date().toLocaleDateString('en-US', {
              weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
            })}
          </p>
        </div>
      </div>

      {/* Weather */}
      <div className={`${glassPanel} flex items-center justify-center min-w-[130px]`}>
        {loadingWeather ? (
          <div className="flex items-center gap-2 text-sm opacity-80">
            <span>⏳</span><span>Loading…</span>
          </div>
        ) : weather ? (
          <div className="flex flex-col items-center gap-1">
            <div className="flex items-center gap-3">
              <span className="text-4xl">{weather.icon}</span>
              <div className="flex flex-col">
                <span className="text-2xl font-bold leading-tight">{weather.temp}°C</span>
                {weather.feelsLike && (
                  <span className="text-xs opacity-80">Feels like {weather.feelsLike}°</span>
                )}
              </div>
            </div>
            {weather.precipProb !== null && weather.precipProb > 0 && (
              <div className="text-xs opacity-70 mt-1">☔ {weather.precipProb}% rain</div>
            )}
            {weather.forecast && (
              <div className="text-xs opacity-80 mt-1">
                H:{weather.forecast.max}° L:{weather.forecast.min}°
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-2 text-sm opacity-70">
            <span>⛅</span><span>Weather unavailable</span>
          </div>
        )}
      </div>

      {/* Upcoming events */}
      <div className={`${glassPanel} min-w-[220px]`}>
        <div className="flex items-center gap-2 mb-2 pb-2 border-b border-white/20">
          <span className="text-lg">📅</span>
          <span className="text-xs font-semibold uppercase tracking-wider opacity-90">Upcoming</span>
        </div>
        {loadingEvents ? (
          <div className="text-xs opacity-70 text-center py-2">Loading events…</div>
        ) : upcomingEvents.length > 0 ? (
          <div className="flex flex-col gap-2">
            {upcomingEvents.map((ev, i) => (
              <div key={i} className="grid grid-cols-[20px_1fr_auto] items-center gap-2 text-xs py-0.5">
                <span className="text-base">{ev.icon}</span>
                <div className="flex flex-col">
                  <span className="font-medium">{ev.name}</span>
                  <span className="opacity-70">{formatDate(ev.date)}</span>
                </div>
                <span className="bg-white/20 px-2 py-0.5 rounded-full whitespace-nowrap">
                  {ev.daysUntil === 0 ? 'Today!' : ev.daysUntil === 1 ? 'Tomorrow' : `${ev.daysUntil}d`}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-xs opacity-70 text-center py-2">No upcoming events</div>
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
    <div className="max-w-6xl mx-auto px-4 py-6 flex flex-col gap-8">
      {/* Greeting Card */}
      <Greeting />

      {/* Fact of the Day */}
      <FactOfTheDay />

      {/* Verse of the Day */}
      <VerseOfTheDay />

      {/* Quick Actions */}
      <section>
        <h3 className="text-lg font-bold font-display text-gray-800 mb-4">⚡ Quick Actions</h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {actions.map(({ icon, label, href }) => (
            <button
              key={label}
              onClick={() => (window.location.href = href)}
              className="glass-card p-5 flex flex-col items-center gap-3 hover:shadow-glow hover:-translate-y-1 transition-all duration-300 cursor-pointer group"
            >
              <span className="text-4xl leading-none group-hover:scale-110 transition-transform duration-200">
                {icon}
              </span>
              <span className="text-sm font-semibold text-gray-700 group-hover:text-primary-600 transition-colors">
                {label}
              </span>
            </button>
          ))}
        </div>
      </section>

      {/* Trending Posts */}
      <section>
        <h3 className="text-lg font-bold font-display text-gray-800 mb-4">
          🔥 Trending in Community
        </h3>
        <TrendingPosts limit={3} onPostClick={handlePostClick} />
        <div className="flex justify-end mt-4">
          <button
            onClick={() => (window.location.href = '/community')}
            className="py-2 px-5 text-sm font-semibold rounded-xl border border-primary-300 text-primary-600 hover:bg-primary-50 hover:border-primary-400 transition-all duration-200"
          >
            View All Community Posts →
          </button>
        </div>
      </section>
    </div>
  );
};

export default Dashboard;