// src/pages/members/groups/GroupDetail.jsx
import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useParams, useNavigate } from 'react-router-dom';
import { groupsService } from '../../services/groupsService';
import TagList from '../../components/tags/TagList';
import GroupDiscussions from './GroupDiscussions';

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
    if (groupId) {
      fetchGroupData();
    } else {
      setLoading(false);
    }
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
      if (error.response?.status === 404) {
        setError('Group not found');
      } else if (error.response?.status === 403) {
        setError('You do not have access to this group');
      } else {
        setError('Failed to load group');
      }
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
      <div className="p-6 text-center">
        <div className="text-gray-500">No group selected</div>
        <button onClick={handleBackToGroups} className="mt-4 px-4 py-2 bg-primary-500 text-white rounded-md hover:bg-primary-600">
          ← Back to Groups
        </button>
      </div>
    );
  }

  if (loading) {
    return <div className="p-6 text-center text-gray-500">Loading group...</div>;
  }

  if (error) {
    return (
      <div className="p-6 text-center">
        <div className="text-red-500">{error}</div>
        <button onClick={handleBackToGroups} className="mt-4 px-4 py-2 bg-primary-500 text-white rounded-md hover:bg-primary-600">
          ← Back to Groups
        </button>
      </div>
    );
  }

  if (!group) {
    return <div className="p-6 text-center text-gray-500">No group data...</div>;
  }

  const isMember = group.userMembership?.status === 'approved';
  const isPending = group.userMembership?.status === 'pending';
  const isAdmin = group.userMembership?.role === 'admin';
  const canPost = group.canPost || isMember;

  return (
    <div className="max-w-4xl mx-auto p-5 space-y-5">
      {/* Header */}
      <div className="flex justify-between items-center">
        <button
          onClick={handleBackToGroups}
          className="px-4 py-2 text-primary-500 hover:bg-primary-50 rounded-md transition"
        >
          ← Back to Groups
        </button>
        {isMember && (
          <button
            onClick={handleLeaveGroup}
            className="px-4 py-2 text-red-500 hover:bg-red-50 rounded-md transition"
          >
            Leave Group
          </button>
        )}
      </div>

      {/* Group Info Card */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <div>
          {/* Tags */}
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            {group.tags?.length > 0 ? (
              <TagList tags={group.tags} interactive={true} size="sm" />
            ) : (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-sm">
                🏷️ No tags
              </span>
            )}
            {group.isPrivate && (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-sm">
                🔒 Private
              </span>
            )}
          </div>
          
          <h1 className="text-2xl font-bold text-gray-800 mb-2">{group.name}</h1>
          
          <div className="flex flex-wrap gap-3 text-sm text-gray-500">
            <span>👥 {group.memberCount || 0} members</span>
            {group.location && <span>📍 {group.location}</span>}
            {group.meetingType && (
              <span>
                {group.meetingType === 'online' && '💻 Online'}
                {group.meetingType === 'in-person' && '🤝 In-Person'}
                {group.meetingType === 'hybrid' && '🔄 Hybrid'}
              </span>
            )}
            <span>📅 Created {new Date(group.createdAt).toLocaleDateString()}</span>
            {discussionCount > 0 && (
              <span>📝 {discussionCount} discussions</span>
            )}
          </div>
        </div>

        {!isMember && !isPending && (
          <div className="mt-4 p-4 bg-gray-50 rounded-lg text-center">
            <p className="text-gray-600 mb-3">Want to join this group?</p>
            <button
              onClick={() => setShowJoinForm(true)}
              className="px-4 py-2 bg-primary-500 text-white rounded-md hover:bg-primary-600 transition"
            >
              Request to Join
            </button>
          </div>
        )}

        {isPending && (
          <div className="mt-4 p-3 bg-yellow-50 text-yellow-700 rounded-lg text-center">
            ⏳ Membership Pending Approval
          </div>
        )}
      </div>

      {/* Join Request Form */}
      {showJoinForm && (
        <div className="bg-white rounded-xl shadow-md p-5">
          <h3 className="text-lg font-semibold text-gray-800 mb-3">Request to Join</h3>
          <textarea
            value={joinMessage}
            onChange={(e) => setJoinMessage(e.target.value)}
            placeholder="Optional message to the group admins..."
            rows={3}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
          <div className="flex justify-end gap-3 mt-4">
            <button
              onClick={() => setShowJoinForm(false)}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition"
            >
              Cancel
            </button>
            <button
              onClick={handleJoinRequest}
              className="px-4 py-2 bg-primary-500 text-white rounded-md hover:bg-primary-600 transition"
            >
              Send Request
            </button>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <div className="flex gap-6 flex-wrap">
          <button
            onClick={() => setActiveTab('about')}
            className={`py-2 px-1 text-sm font-medium border-b-2 transition ${
              activeTab === 'about'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            📋 About
          </button>
          
          {/* Discussions Tab */}
          <button
            onClick={() => setActiveTab('discussions')}
            className={`py-2 px-1 text-sm font-medium border-b-2 transition ${
              activeTab === 'discussions'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            📝 Discussions
            {discussionCount > 0 && (
              <span className="ml-1 text-xs text-gray-400">({discussionCount})</span>
            )}
          </button>
          
          {isAdmin && (
            <button
              onClick={() => setActiveTab('members')}
              className={`py-2 px-1 text-sm font-medium border-b-2 transition ${
                activeTab === 'members'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              👥 Members ({group.members?.length || 0})
            </button>
          )}
        </div>
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === 'about' && (
          <div className="space-y-5">
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">About this Group</h3>
              <p className="text-gray-600">{group.description}</p>
            </div>

            {/* Tags Section */}
            {group.tags?.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">Tags</h3>
                <TagList tags={group.tags} interactive={true} size="md" />
              </div>
            )}

            {/* Recent Discussions Preview */}
            {group.recentDiscussions?.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-3">📝 Recent Discussions</h3>
                <div className="space-y-3">
                  {group.recentDiscussions.slice(0, 3).map(discussion => (
                    <div 
                      key={discussion.id}
                      onClick={() => navigate(`/discussions/${discussion.id}`)}
                      className="bg-gray-50 rounded-lg p-3 cursor-pointer hover:bg-gray-100 transition"
                    >
                      <h4 className="font-medium text-gray-800 mb-1">{discussion.title}</h4>
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <span>▲ {discussion.upvotes || 0}</span>
                        <span>💬 {discussion._count?.comments || 0}</span>
                        <span>by {discussion.author?.name || 'Unknown'}</span>
                      </div>
                    </div>
                  ))}
                </div>
                {group.recentDiscussions.length > 3 && (
                  <button
                    onClick={() => setActiveTab('discussions')}
                    className="mt-3 text-sm text-primary-500 hover:text-primary-600"
                  >
                    View all discussions →
                  </button>
                )}
              </div>
            )}

            {group.rules && (
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">Group Rules</h3>
                <p className="text-gray-600 whitespace-pre-wrap">{group.rules}</p>
              </div>
            )}

            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Created By</h3>
              <div className="flex items-center gap-3">
                {group.createdBy?.avatarUrl ? (
                  <img
                    src={group.createdBy.avatarUrl}
                    alt={group.createdBy.name}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-primary-500 text-white flex items-center justify-center text-lg font-semibold">
                    {group.createdBy?.name?.charAt(0) || '?'}
                  </div>
                )}
                <span className="text-gray-700 font-medium">{group.createdBy?.name}</span>
              </div>
            </div>

            {group.meetingType && (
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">Meeting Info</h3>
                <div className="bg-gray-50 p-4 rounded-lg space-y-1 text-sm text-gray-600">
                  <p>
                    <strong>Type:</strong>{' '}
                    {group.meetingType === 'online' && '💻 Online'}
                    {group.meetingType === 'in-person' && '🤝 In-Person'}
                    {group.meetingType === 'hybrid' && '🔄 Hybrid'}
                  </p>
                  {group.isLocationBased && (
                    <p><strong>Location Specific:</strong> Yes - This group serves a specific area</p>
                  )}
                  {group.location && (
                    <p><strong>Location:</strong> {group.location}</p>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Discussions Tab Content */}
        {activeTab === 'discussions' && (
          <GroupDiscussions groupId={groupId} />
        )}

        {/* Members Tab */}
        {activeTab === 'members' && isAdmin && (
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Members</h3>
            <div className="space-y-4">
              {/* Pending members */}
              {group.members?.filter(m => m.status === 'pending').length > 0 && (
                <>
                  <h4 className="text-md font-medium text-gray-600">⏳ Pending Approval</h4>
                  {group.members
                    .filter(m => m.status === 'pending')
                    .map(member => (
                      <div key={member.id} className="bg-white rounded-lg shadow-sm p-4 flex justify-between items-center">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-primary-500 text-white flex items-center justify-center text-sm font-semibold">
                            {member.member.avatarUrl ? (
                              <img src={member.member.avatarUrl} alt={member.member.name} className="w-full h-full rounded-full object-cover" />
                            ) : (
                              member.member.name?.charAt(0) || '?'
                            )}
                          </div>
                          <div>
                            <div className="font-medium text-gray-800">{member.member.name}</div>
                            <div className="text-xs text-gray-500">
                              {member.role === 'admin' ? '👑 Admin' : member.role === 'moderator' ? '🛡️ Moderator' : 'Member'}
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleApproveMember(member.memberId)}
                            className="px-3 py-1 bg-green-500 text-white text-sm rounded hover:bg-green-600 transition"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleRejectMember(member.memberId)}
                            className="px-3 py-1 bg-red-500 text-white text-sm rounded hover:bg-red-600 transition"
                          >
                            Reject
                          </button>
                        </div>
                      </div>
                    ))}
                </>
              )}

              {/* Approved members */}
              <h4 className="text-md font-medium text-gray-600 mt-4">✅ Members</h4>
              {group.members
                ?.filter(m => m.status === 'approved')
                .map(member => (
                  <div key={member.id} className="bg-white rounded-lg shadow-sm p-4 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-primary-500 text-white flex items-center justify-center text-sm font-semibold">
                        {member.member.avatarUrl ? (
                          <img src={member.member.avatarUrl} alt={member.member.name} className="w-full h-full rounded-full object-cover" />
                        ) : (
                          member.member.name?.charAt(0) || '?'
                        )}
                      </div>
                      <div>
                        <div className="font-medium text-gray-800">{member.member.name}</div>
                        <div className="text-xs text-gray-500">
                          {member.role === 'admin' ? '👑 Admin' : member.role === 'moderator' ? '🛡️ Moderator' : 'Member'}
                        </div>
                      </div>
                    </div>
                    <div className="text-xs text-gray-400">
                      Joined {new Date(member.joinedAt).toLocaleDateString()}
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default GroupDetail;