// src/App.jsx
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import { NotificationProvider } from './contexts/NotificationContext';
import Layout from './components/layout/Layout';
import LandingPage from './pages/public/LandingPage';
import Auth from './pages/members/Auth';
import ForgotPassword from './components/auth/ForgotPassword';
import ResetPassword from './components/auth/ResetPassword';
import SetupUsername from './pages/auth/SetupUsername';
import Dashboard from './pages/members/Dashboard';

import AdminDashboard from './pages/admin/AdminDashboard';
import ModeratorDashboard from './pages/admin/ModeratorDashboard'; // ✅ Import moderator dashboard
import PrayerWall from './pages/members/PrayerWall';
import Profile from './pages/members/Profile';
import CreatePostModal from './components/community/CreatePostModal';
import GroupsList from './components/groups/GroupsList';
import GroupDetail from './components/groups/GroupDetail';
import GoogleCallback from './pages/auth/GoogleCallback';
import VerifyEmail from './pages/auth/VerifyEmail';
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

// Discussion Components
import CreateDiscussion from './pages/members/discussions/CreateDiscussion';
import DiscussionDetail from './pages/members/discussions/DiscussionDetail';

// Search Component
import SearchResults from './pages/members/SearchResults';

import About from './pages/public/About';
import Contact from './pages/public/Contact';
import Faq from './pages/public/Faq';

// ============ GUARD: Require Username ============
// Redirects authenticated users without a username to /setup-username
const RequireUsername = ({ children }) => {
  const { user, isAuthenticated, loading } = useAuth();

  if (loading) return null;

  if (isAuthenticated && !user?.username) {
    return <Navigate to="/setup-username" replace />;
  }

  return children;
};

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
        <Route path="/auth" element={<Auth />} />
        <Route path="/login" element={<Navigate to="/auth" replace />} />
        <Route path="/register" element={<Navigate to="/auth" replace />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        
        {/* Username Setup (no layout, public but only accessible if logged in & missing username) */}
        <Route path="/setup-username" element={<SetupUsername />} />

        {/* Bible full-screen routes */}
        <Route path="/bible/read/:book/:chapter?" element={<BibleReader mode="fullscreen" />} />
        <Route path="/bible/read" element={<Navigate to="/bible/read/Genesis/1" replace />} />

        {/* ===== PROTECTED ROUTES (require username) ===== */}
        <Route path="/discussions/create" element={
          <RequireUsername>
            <Layout>
              <CreateDiscussion />
            </Layout>
          </RequireUsername>
        } />
        <Route path="/discussions/:id" element={
          <RequireUsername>
            <Layout>
              <DiscussionDetail />
            </Layout>
          </RequireUsername>
        } />
        <Route path="/search" element={
          <RequireUsername>
            <Layout>
              <SearchResults />
            </Layout>
          </RequireUsername>
        } />

        {/* ===== DASHBOARD ROUTE WITH ROLE-BASED COMPONENT ===== */}
        <Route path="/dashboard" element={
          <RequireUsername>
            <Layout>
              {user?.isSuperAdmin ? (
                <AdminDashboard />
              ) : user?.isModerator ? (
                <ModeratorDashboard />
              ) : (
                <Dashboard />
              )}
            </Layout>
          </RequireUsername>
        } />

        <Route path="/prayer-wall" element={
          <RequireUsername>
            <Layout>
              <PrayerWall />
            </Layout>
          </RequireUsername>
        } />
        <Route path="/profile" element={
          <RequireUsername>
            <Layout>
              <Profile />
            </Layout>
          </RequireUsername>
        } />
        <Route path="/settings/notifications" element={
          <RequireUsername>
            <Layout>
              <NotificationSettings />
            </Layout>
          </RequireUsername>
        } />
        <Route path="/groups" element={
          <RequireUsername>
            <Layout>
              <GroupsList />
            </Layout>
          </RequireUsername>
        } />
        <Route path="/groups/:groupId" element={
          <RequireUsername>
            <Layout>
              <GroupDetail />
            </Layout>
          </RequireUsername>
        } />
        <Route path="/bible/reader" element={
          <RequireUsername>
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
          </RequireUsername>
        } />
        <Route path="/bible/verse-of-day" element={
          <RequireUsername>
            <Layout>
              <VerseOfTheDay />
            </Layout>
          </RequireUsername>
        } />
        <Route path="/bible/search" element={
          <RequireUsername>
            <Layout>
              <VerseBrowser />
            </Layout>
          </RequireUsername>
        } />
        <Route path="/bible/queue" element={
          <RequireUsername>
            <Layout>
              <VerseQueueStatus />
            </Layout>
          </RequireUsername>
        } />
        <Route path="/my-submissions" element={
          <RequireUsername>
            <Layout>
              <MySubmissions />
            </Layout>
          </RequireUsername>
        } />
        <Route path="/bookmarks" element={
          <RequireUsername>
            <Layout>
              <Bookmarks />
            </Layout>
          </RequireUsername>
        } />
        <Route path="/bible/bookmarks" element={<Navigate to="/bookmarks" replace />} />
        <Route path="/community" element={
          <RequireUsername>
            <Layout>
              <CommunityBoard />
            </Layout>
          </RequireUsername>
        } />
        <Route path="/community/create" element={
          <RequireUsername>
            <Layout>
              <CreatePostModal
                onClose={() => window.history.back()}
                onPostCreated={() => window.location.href = '/community'}
              />
            </Layout>
          </RequireUsername>
        } />
        <Route path="/community/post/:postId" element={
          <RequireUsername>
            <Layout>
              <PostDetail />
            </Layout>
          </RequireUsername>
        } />
        <Route path="/learning" element={
          <RequireUsername>
            <Layout>
              <LearningHub />
            </Layout>
          </RequireUsername>
        } />

        {/* Admin Routes – also require username (admins must have one) */}
        <Route path="/admin/dashboard" element={
          <RequireUsername>
            <Layout>
              <AdminDashboard />
            </Layout>
          </RequireUsername>
        } />
        <Route path="/admin/users" element={
          <RequireUsername>
            <Layout>
              <UserManagement />
            </Layout>
          </RequireUsername>
        } />
        <Route path="/admin/moderation" element={
          <RequireUsername>
            <Layout>
              <ModerationQueue />
            </Layout>
          </RequireUsername>
        } />
        <Route path="/admin/bible/queue" element={
          <RequireUsername>
            <Layout>
              <AdminVerseQueue />
            </Layout>
          </RequireUsername>
        } />
        <Route path="/admin/announcements" element={
          <RequireUsername>
            <Layout>
              <AnnouncementList />
            </Layout>
          </RequireUsername>
        } />
        <Route path="/admin/analytics" element={
          <RequireUsername>
            <Layout>
              <Analytics />
            </Layout>
          </RequireUsername>
        } />
        <Route path="/admin/settings" element={
          <RequireUsername>
            <Layout>
              <SettingsPanel />
            </Layout>
          </RequireUsername>
        } />
        <Route path="/admin/security/ip" element={
          <RequireUsername>
            <Layout>
              <IPBlocking />
            </Layout>
          </RequireUsername>
        } />
        <Route path="/admin/security/sessions" element={
          <RequireUsername>
            <Layout>
              <Sessions />
            </Layout>
          </RequireUsername>
        } />
        <Route path="/admin/security/attempts" element={
          <RequireUsername>
            <Layout>
              <LoginAttempts />
            </Layout>
          </RequireUsername>
        } />
        <Route path="/admin/backups" element={
          <RequireUsername>
            <Layout>
              <BackupManager />
            </Layout>
          </RequireUsername>
        } />
        <Route path="/admin/health" element={
          <RequireUsername>
            <Layout>
              <SystemHealth />
            </Layout>
          </RequireUsername>
        } />
        <Route path="/auth/google/callback" element={<GoogleCallback />} />
        <Route path="/verify-email" element={<VerifyEmail />} />
        {/* Public info pages */}
        <Route path="/about" element={<About />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/faq" element={<Faq />} />

        {/* Catch all */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </NotificationProvider>
  );
}

// Add spin animation keyframes
const styleElement = document.createElement('style');
styleElement.textContent = `
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;
document.head.appendChild(styleElement);

export default App;