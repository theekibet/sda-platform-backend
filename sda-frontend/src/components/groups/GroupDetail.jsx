// src/pages/members/groups/GroupDetail.jsx
import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useParams, useNavigate } from 'react-router-dom';
import { groupsService } from '../../services/groupsService';
import TagList from '../../components/tags/TagList';
import GroupDiscussions from './GroupDiscussions';
import Avatar from '../../components/common/Avatar';

function GroupDetail({ groupId: propGroupId, onBack }) {
  const { user } = useAuth();
  const params = useParams();
  const navigate = useNavigate();

  const groupId = propGroupId || params?.id || params?.groupId;

  const [group, setGroup] = useState(null);
  const [activeTab, setActiveTab] = useState('about');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showJoinForm, setShowJoinForm] = useState(false);
  const [joinMessage, setJoinMessage] = useState('');
  const [discussionCount, setDiscussionCount] = useState(0);

  useEffect(() => {
    if (groupId) fetchGroupData();
    else setLoading(false);
  }, [groupId]);

  const fetchGroupData = async () => {
    if (!groupId) return;
    setLoading(true);
    setError(null);
    try {
      const response = await groupsService.getGroupById(groupId);
      const actualGroupData = response.data?.data || response.data;
      setGroup(actualGroupData);
      if (actualGroupData.discussionCount !== undefined) {
        setDiscussionCount(actualGroupData.discussionCount);
      }
    } catch (error) {
      console.error('Error fetching group:', error);
      if (error.response?.status === 404) setError('Group not found');
      else if (error.response?.status === 403) setError('You do not have access to this group');
      else setError('Failed to load group');
    } finally {
      setLoading(false);
    }
  };

  const handleLeaveGroup = async () => {
    if (!groupId) return;
    if (window.confirm('Are you sure you want to leave this group?')) {
      try {
        await groupsService.leaveGroup(groupId);
        if (onBack) onBack();
        else navigate('/groups');
      } catch (error) {
        alert(error.response?.data?.message || 'Error leaving group');
      }
    }
  };

  const handleApproveMember = async (memberId) => {
    if (!groupId) return;
    try {
      await groupsService.approveMember(groupId, memberId);
      fetchGroupData();
    } catch (error) {
      alert('Error approving member');
    }
  };

  const handleRejectMember = async (memberId) => {
    if (!groupId) return;
    try {
      await groupsService.rejectMember(groupId, memberId);
      fetchGroupData();
    } catch (error) {
      alert('Error rejecting member');
    }
  };

  const handleJoinRequest = async () => {
    if (!groupId) return;
    try {
      await groupsService.joinGroup(groupId, joinMessage);
      setShowJoinForm(false);
      fetchGroupData();
    } catch (error) {
      alert('Error sending request');
    }
  };

  const handleBackToGroups = () => {
    if (onBack) onBack();
    else navigate('/groups');
  };

  if (!groupId) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="glass-card p-8 text-center max-w-md">
          <div className="text-5xl mb-4">🏠</div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">No group selected</h2>
          <button onClick={handleBackToGroups} className="btn-primary mt-4">
            ← Back to Groups
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-4 sm:p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="h-32 bg-gray-200 rounded-xl"></div>
          <div className="h-10 bg-gray-200 rounded w-full"></div>
          <div className="h-40 bg-gray-200 rounded-xl"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto p-4 sm:p-6">
        <div className="glass-card p-8 text-center">
          <div className="text-5xl mb-4">😕</div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Oops!</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button onClick={handleBackToGroups} className="btn-primary">
            Back to Groups
          </button>
        </div>
      </div>
    );
  }

  if (!group) return null;

  const isMember = group.userMembership?.status === 'approved';
  const isPending = group.userMembership?.status === 'pending';
  const isAdmin = group.userMembership?.role === 'admin';

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <div className="max-w-4xl mx-auto p-4 sm:p-6 pb-20">
        {/* Back button */}
        <button
          onClick={handleBackToGroups}
          className="group flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition-colors"
        >
          <svg className="w-5 h-5 transform group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          <span className="font-medium">Back to Groups</span>
        </button>

        {/* Group Header Card */}
        <div className="glass-card p-6 sm:p-8 mb-6 animate-slide-up">
          {/* Tags & Privacy */}
          <div className="flex items-center gap-2 flex-wrap mb-4">
            {group.tags?.length > 0 ? (
              <TagList tags={group.tags} interactive={true} size="sm" />
            ) : (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
                </svg>
                No tags
              </span>
            )}
            {group.isPrivate && (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                Private
              </span>
            )}
          </div>

          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4">{group.name}</h1>

          {/* Group Stats */}
          <div className="flex flex-wrap gap-4 text-sm text-gray-600 mb-6">
            <span className="flex items-center gap-1.5">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
              {group.memberCount || 0} members
            </span>
            <span className="flex items-center gap-1.5">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Created {new Date(group.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </span>
            {discussionCount > 0 && (
              <span className="flex items-center gap-1.5">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                {discussionCount} discussions
              </span>
            )}
          </div>

          {/* Join/Leave Actions */}
          {!isMember && !isPending && (
            <div className="mt-4 pt-4 border-t border-gray-100">
              <button
                onClick={() => setShowJoinForm(true)}
                className="w-full sm:w-auto px-6 py-2.5 bg-primary-600 text-white rounded-full font-medium hover:bg-primary-700 transition-all hover:shadow-md"
              >
                Request to Join
              </button>
            </div>
          )}
          {isPending && (
            <div className="mt-4 pt-4 border-t border-gray-100">
              <div className="flex items-center gap-2 text-yellow-700 bg-yellow-50 rounded-full px-4 py-2 text-sm">
                <svg className="w-5 h-5 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Membership Pending Approval
              </div>
            </div>
          )}
          {isMember && (
            <div className="mt-4 pt-4 border-t border-gray-100 flex justify-end">
              <button
                onClick={handleLeaveGroup}
                className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-full transition-colors flex items-center gap-2 text-sm font-medium"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Leave Group
              </button>
            </div>
          )}
        </div>

        {/* Join Request Form Modal (inline) */}
        {showJoinForm && (
          <div className="glass-card p-6 mb-6 animate-slide-up">
            <h3 className="text-lg font-semibold text-gray-800 mb-3">Request to Join</h3>
            <textarea
              value={joinMessage}
              onChange={(e) => setJoinMessage(e.target.value)}
              placeholder="Optional message to the group admins..."
              rows={3}
              className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none bg-gray-50 focus:bg-white transition"
            />
            <div className="flex justify-end gap-3 mt-4">
              <button
                onClick={() => setShowJoinForm(false)}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-full transition"
              >
                Cancel
              </button>
              <button
                onClick={handleJoinRequest}
                className="px-4 py-2 bg-primary-600 text-white rounded-full hover:bg-primary-700 transition"
              >
                Send Request
              </button>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="border-b border-gray-200 mb-6">
          <div className="flex gap-6">
            <button
              onClick={() => setActiveTab('about')}
              className={`pb-3 px-1 text-sm font-medium transition-all ${
                activeTab === 'about'
                  ? 'text-primary-600 border-b-2 border-primary-600'
                  : 'text-gray-500 hover:text-gray-700 border-b-2 border-transparent'
              }`}
            >
              <span className="flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                About
              </span>
            </button>
            <button
              onClick={() => setActiveTab('discussions')}
              className={`pb-3 px-1 text-sm font-medium transition-all ${
                activeTab === 'discussions'
                  ? 'text-primary-600 border-b-2 border-primary-600'
                  : 'text-gray-500 hover:text-gray-700 border-b-2 border-transparent'
              }`}
            >
              <span className="flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                Discussions
                {discussionCount > 0 && (
                  <span className="ml-1 text-xs text-gray-400">({discussionCount})</span>
                )}
              </span>
            </button>
            {isAdmin && (
              <button
                onClick={() => setActiveTab('members')}
                className={`pb-3 px-1 text-sm font-medium transition-all ${
                  activeTab === 'members'
                    ? 'text-primary-600 border-b-2 border-primary-600'
                    : 'text-gray-500 hover:text-gray-700 border-b-2 border-transparent'
                }`}
              >
                <span className="flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                  Members
                  <span className="ml-1 text-xs text-gray-400">({group.members?.length || 0})</span>
                </span>
              </button>
            )}
          </div>
        </div>

        {/* Tab Content */}
        <div className="animate-fade-in">
          {activeTab === 'about' && (
            <div className="space-y-6">
              {/* Description */}
              <div className="glass-card p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
                  <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  About this Group
                </h3>
                <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{group.description}</p>
              </div>

              {/* Tags */}
              {group.tags?.length > 0 && (
                <div className="glass-card p-6">
                  <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
                    <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
                    </svg>
                    Tags
                  </h3>
                  <TagList tags={group.tags} interactive={true} size="md" />
                </div>
              )}

              {/* Recent Discussions */}
              {group.recentDiscussions?.length > 0 && (
                <div className="glass-card p-6">
                  <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
                    <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                    Recent Discussions
                  </h3>
                  <div className="space-y-3">
                    {group.recentDiscussions.slice(0, 3).map(discussion => (
                      <div
                        key={discussion.id}
                        onClick={() => navigate(`/discussions/${discussion.id}`)}
                        className="group/item bg-gray-50 hover:bg-gray-100 rounded-xl p-4 cursor-pointer transition-all"
                      >
                        <h4 className="font-medium text-gray-800 group-hover/item:text-primary-600 transition mb-1">
                          {discussion.title}
                        </h4>
                        <div className="flex items-center gap-3 text-xs text-gray-500">
                          <span className="flex items-center gap-1">▲ {discussion.upvotes || 0}</span>
                          <span className="flex items-center gap-1">💬 {discussion._count?.comments || 0}</span>
                          <span>by {discussion.author?.name || 'Unknown'}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                  {group.recentDiscussions.length > 3 && (
                    <button
                      onClick={() => setActiveTab('discussions')}
                      className="mt-4 text-sm text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1"
                    >
                      View all discussions
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  )}
                </div>
              )}

              {/* Rules */}
              {group.rules && (
                <div className="glass-card p-6">
                  <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
                    <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                    Group Rules
                  </h3>
                  <p className="text-gray-700 whitespace-pre-wrap">{group.rules}</p>
                </div>
              )}

              {/* Created By with badges */}
              <div className="glass-card p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
                  <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  Created By
                </h3>
                <div className="flex items-center gap-3">
                  <Avatar user={group.createdBy} size="medium" />
                  <div>
                    <div className="flex items-center flex-wrap gap-1">
                      <p className="font-medium text-gray-900">{group.createdBy?.name}</p>
                      {group.createdBy?.isSuperAdmin && (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-purple-100 text-purple-700 rounded-full text-xs font-medium">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                          </svg>
                          Super Admin
                        </span>
                      )}
                      {group.createdBy?.isModerator && !group.createdBy?.isSuperAdmin && (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-amber-100 text-amber-700 rounded-full text-xs font-medium">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                          </svg>
                          Moderator
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500">Group Creator</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'discussions' && (
            <GroupDiscussions groupId={groupId} />
          )}

          {activeTab === 'members' && isAdmin && (
            <div className="space-y-6">
              {/* Pending Members with badges */}
              {group.members?.filter(m => m.status === 'pending').length > 0 && (
                <div className="glass-card p-6">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Pending Approval
                  </h3>
                  <div className="space-y-3">
                    {group.members
                      .filter(m => m.status === 'pending')
                      .map(member => (
                        <div key={member.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                          <div className="flex items-center gap-3">
                            <Avatar user={member.member} size="small" />
                            <div>
                              <div className="flex items-center flex-wrap gap-1">
                                <p className="font-medium text-gray-800">{member.member.name}</p>
                                {member.member?.isSuperAdmin && (
                                  <span className="inline-flex items-center gap-0.5 px-1 py-0.5 bg-purple-100 text-purple-700 rounded-full text-[10px] font-medium">
                                    <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                    </svg>
                                    Super Admin
                                  </span>
                                )}
                                {member.member?.isModerator && !member.member?.isSuperAdmin && (
                                  <span className="inline-flex items-center gap-0.5 px-1 py-0.5 bg-amber-100 text-amber-700 rounded-full text-[10px] font-medium">
                                    <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                    </svg>
                                    Moderator
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-gray-500 capitalize">{member.role}</p>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleApproveMember(member.memberId)}
                              className="px-3 py-1.5 bg-green-600 text-white text-sm rounded-full hover:bg-green-700 transition"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => handleRejectMember(member.memberId)}
                              className="px-3 py-1.5 bg-red-600 text-white text-sm rounded-full hover:bg-red-700 transition"
                            >
                              Reject
                            </button>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {/* Approved Members with badges */}
              <div className="glass-card p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Members ({group.members?.filter(m => m.status === 'approved').length})
                </h3>
                <div className="grid gap-3">
                  {group.members
                    ?.filter(m => m.status === 'approved')
                    .map(member => (
                      <div key={member.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                        <div className="flex items-center gap-3">
                          <Avatar user={member.member} size="small" />
                          <div>
                            <div className="flex items-center flex-wrap gap-1">
                              <p className="font-medium text-gray-800">{member.member.name}</p>
                              {member.member?.isSuperAdmin && (
                                <span className="inline-flex items-center gap-0.5 px-1 py-0.5 bg-purple-100 text-purple-700 rounded-full text-[10px] font-medium">
                                  <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                  </svg>
                                  Super Admin
                                </span>
                              )}
                              {member.member?.isModerator && !member.member?.isSuperAdmin && (
                                <span className="inline-flex items-center gap-0.5 px-1 py-0.5 bg-amber-100 text-amber-700 rounded-full text-[10px] font-medium">
                                  <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                  </svg>
                                  Moderator
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-gray-500 capitalize">{member.role}</p>
                          </div>
                        </div>
                        <div className="text-xs text-gray-400">
                          Joined {new Date(member.joinedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default GroupDetail;