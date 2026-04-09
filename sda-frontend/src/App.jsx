// src/App.jsx
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import { NotificationProvider } from './contexts/NotificationContext';
import Layout from './components/layout/Layout';
import LandingPage from './pages/public/LandingPage';
import Login from './components/members/Login';
import Register from './components/members/Register';
import ForgotPassword from './components/auth/ForgotPassword';
import ResetPassword from './components/auth/ResetPassword';
import Dashboard from './pages/members/Dashboard';

import AdminDashboard from './pages/admin/AdminDashboard';
import PrayerWall from './pages/members/PrayerWall';
import Profile from './pages/members/Profile';
import CreatePostModal from './components/community/CreatePostModal';
import GroupsList from './components/groups/GroupsList';
import GroupDetail from './components/groups/GroupDetail';

// Bible Components
import BibleReader from './components/bible/BibleReader';
import VerseOfTheDay from './components/bible/VerseOfTheDay';
import VerseBrowser from './components/bible/VerseBrowser';
import VerseQueueStatus from './components/bible/VerseQueueStatus';
import MySubmissions from './pages/members/MySubmissions';

// Community Components
import CommunityBoard from './components/community/CommunityBoard';
import PostDetail from './components/community/PostDetail';

// Admin Components
import ModerationQueue from './pages/admin/moderation/ModerationQueue';
import AnnouncementList from './pages/admin/announcements/AnnouncementList';
import SettingsPanel from './pages/admin/settings/SettingsPanel';
import IPBlocking from './pages/admin/security/IPBlocking';
import Sessions from './pages/admin/security/Sessions';
import LoginAttempts from './pages/admin/security/LoginAttempts';
import BackupManager from './pages/admin/maintenance/BackupManager';
import SystemHealth from './pages/admin/maintenance/SystemHealth';
import UserManagement from './pages/admin/UserManagement';
import Analytics from './pages/admin/Analytics';
import AdminVerseQueue from './pages/admin/bible/AdminVerseQueue';

import LearningHub from './pages/members/LearningHub';
import Bookmarks from './pages/members/Bookmarks';
import NotificationSettings from './components/settings/NotificationSettings';
// ============ Discussion Components ============
import DiscussionsFeed from './pages/members/discussions/DiscussionsFeed';
import CreateDiscussion from './pages/members/discussions/CreateDiscussion';
import DiscussionDetail from './pages/members/discussions/DiscussionDetail';

// ============ Search Component ============
import SearchResults from './pages/members/SearchResults';

function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-primary-500 to-secondary-500 gap-5">
        <div className="w-12 h-12 border-4 border-white/30 border-t-white rounded-full animate-spin"></div>
        <div className="text-white text-lg font-medium">Loading...</div>
      </div>
    );
  }

  return (
    <NotificationProvider>
      <Routes>
        {/* Public Routes - NO Layout */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        
        {/* Password Reset Routes */}
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        


        {/* ===== BIBLE READER FULL-SCREEN ROUTES ===== */}
        <Route path="/bible/read/:book/:chapter?" element={
          <BibleReader mode="fullscreen" />
        } />
        <Route path="/bible/read" element={
          <Navigate to="/bible/read/Genesis/1" replace />
        } />

        {/* ============ DISCUSSION ROUTES (WITH LAYOUT) ============ */}
        <Route path="/discussions" element={
          <Layout>
            <DiscussionsFeed />
          </Layout>
        } />
        <Route path="/discussions/create" element={
          <Layout>
            <CreateDiscussion />
          </Layout>
        } />
        <Route path="/discussions/:id" element={
          <Layout>
            <DiscussionDetail />
          </Layout>
        } />

        {/* ============ SEARCH ROUTE ============ */}
        <Route path="/search" element={
          <Layout>
            <SearchResults />
          </Layout>
        } />

        {/* Protected Member Routes - WITH Layout */}
        <Route path="/dashboard" element={
          <Layout>
            <Dashboard />
          </Layout>
        } />
        
        <Route path="/prayer-wall" element={
          <Layout>
            <PrayerWall />
          </Layout>
        } />
        
        <Route path="/profile" element={
          <Layout>
            <Profile />
          </Layout>
        } />
        <Route path="/settings/notifications" element={
          <Layout>
            <NotificationSettings />
          </Layout>
        } />
        
        <Route path="/groups" element={
          <Layout>
            <GroupsList />
          </Layout>
        } />
        
        <Route path="/groups/:groupId" element={
          <Layout>
            <GroupDetail />
          </Layout>
        } />

        {/* Bible Routes - WITH Layout (these are dashboard views) */}
        <Route path="/bible/reader" element={
          <Layout>
            <div className="p-5 text-center">
              <h2 className="text-2xl font-bold text-gray-800 mb-2">📖 Bible Reader</h2>
              <p className="text-gray-600 mb-5">Click the button below to open the full-screen Bible reader</p>
              <button
                onClick={() => window.location.href = '/bible/read'}
                className="px-6 py-3 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition"
              >
                Open Full-Screen Bible Reader
              </button>
            </div>
          </Layout>
        } />

        <Route path="/bible/verse-of-day" element={
          <Layout>
            <VerseOfTheDay />
          </Layout>
        } />

        <Route path="/bible/search" element={
          <Layout>
            <VerseBrowser />
          </Layout>
        } />

        <Route path="/bible/queue" element={
          <Layout>
            <VerseQueueStatus />
          </Layout>
        } />
        
        <Route path="/my-submissions" element={
          <Layout>
            <MySubmissions />
          </Layout>
        } />

        {/* Bookmarks Route */}
        <Route path="/bookmarks" element={
          <Layout>
            <Bookmarks />
          </Layout>
        } />

        {/* Bible Bookmarks - Redirect to main bookmarks */}
        <Route path="/bible/bookmarks" element={
          <Navigate to="/bookmarks" replace />
        } />

        {/* Community Board */}
        <Route path="/community" element={
          <Layout>
            <CommunityBoard />
          </Layout>
        } />
       
        <Route path="/community/create" element={
          <Layout>
            <CreatePostModal
              onClose={() => window.history.back()}
              onPostCreated={() => window.location.href = '/community'}
            />
          </Layout>
        } />

        {/* Post Detail Route */}
        <Route path="/community/post/:postId" element={
          <Layout>
            <PostDetail />
          </Layout>
        } />

        {/* Learning Hub */}
        <Route path="/learning" element={
          <Layout>
            <LearningHub />
          </Layout>
        } />

        {/* Admin Routes - All with Layout and admin protection */}
        <Route path="/admin/dashboard" element={
          <Layout>
            <AdminDashboard />
          </Layout>
        } />

        <Route path="/admin/users" element={
          <Layout>
            <UserManagement />
          </Layout>
        } />

        <Route path="/admin/moderation" element={
          <Layout>
            <ModerationQueue />
          </Layout>
        } />

        <Route path="/admin/bible/queue" element={
          <Layout>
            <AdminVerseQueue />
          </Layout>
        } />

        <Route path="/admin/announcements" element={
          <Layout>
            <AnnouncementList />
          </Layout>
        } />

        <Route path="/admin/analytics" element={
          <Layout>
            <Analytics />
          </Layout>
        } />

        <Route path="/admin/settings" element={
          <Layout>
            <SettingsPanel />
          </Layout>
        } />

        <Route path="/admin/security/ip" element={
          <Layout>
            <IPBlocking />
          </Layout>
        } />

        <Route path="/admin/security/sessions" element={
          <Layout>
            <Sessions />
          </Layout>
        } />

        <Route path="/admin/security/attempts" element={
          <Layout>
            <LoginAttempts />
          </Layout>
        } />
        
        <Route path="/admin/backups" element={
          <Layout>
            <BackupManager />
          </Layout>
        } />

        <Route path="/admin/health" element={
          <Layout>
            <SystemHealth />
          </Layout>
        } />

        {/* Catch all - redirect to home */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </NotificationProvider>
  );
}

// Add spin animation keyframes safely
const styleElement = document.createElement('style');
styleElement.textContent = `
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;
document.head.appendChild(styleElement);

export default App;