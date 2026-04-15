// src/components/groups/GroupCard.jsx
import Avatar from '../common/Avatar';

const GroupCard = ({ group, isMember, onJoin, onView }) => {
  if (!group || !group.id) return null;

  const userMembership = group.userMembership;

  const handleViewClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (onView && group.id) onView();
  };

  const handleJoinClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (onJoin && group.id) onJoin();
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    const now = new Date();
    const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <div
      className="group glass-card hover:shadow-xl transition-all duration-300 cursor-pointer hover:-translate-y-1"
      onClick={handleViewClick}
    >
      <div className="p-5">
        {/* Header: Tags & Privacy */}
        <div className="flex justify-between items-start mb-3">
          <div className="flex flex-wrap gap-1.5">
            {group.tags && group.tags.slice(0, 2).map(tag => (
              <span
                key={tag.id}
                className="inline-flex items-center gap-1 px-2 py-1 bg-primary-50 text-primary-700 rounded-full text-xs font-medium group-hover:bg-primary-100 transition-colors"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
                </svg>
                #{tag.name}
              </span>
            ))}
            {group.tags && group.tags.length > 2 && (
              <span className="inline-flex items-center px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs">
                +{group.tags.length - 2}
              </span>
            )}
          </div>
          {group.isPrivate && (
            <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              Private
            </span>
          )}
        </div>

        {/* Group Name */}
        <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-primary-600 transition-colors line-clamp-1">
          {group.name}
        </h3>

        {/* Description */}
        <p className="text-gray-600 text-sm mb-4 line-clamp-2 leading-relaxed">
          {group.description?.length > 100
            ? group.description.substring(0, 100) + '...'
            : group.description}
        </p>

        {/* Stats */}
        <div className="flex flex-wrap gap-4 text-xs text-gray-500 mb-4">
          <span className="flex items-center gap-1.5">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
            {group.memberCount || 0} members
          </span>
          <span className="flex items-center gap-1.5">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            {group.discussionCount || 0} discussions
          </span>
          <span className="flex items-center gap-1.5">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            {formatDate(group.createdAt)}
          </span>
        </div>

        {/* Footer */}
        <div className="flex justify-between items-center pt-3 border-t border-gray-100">
          <div className="flex items-center gap-2">
            <Avatar user={group.createdBy} size="small" />
            <span className="text-xs text-gray-500 truncate max-w-[120px]">
              {group.createdBy?.name}
            </span>
          </div>

          {isMember ? (
            <button
              onClick={handleViewClick}
              className="px-4 py-1.5 bg-primary-600 text-white text-sm rounded-full hover:bg-primary-700 transition-all hover:shadow-md flex items-center gap-1.5"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              View
            </button>
          ) : userMembership ? (
            userMembership.status === 'pending' ? (
              <span className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-yellow-700 bg-yellow-50 rounded-full">
                <svg className="w-3.5 h-3.5 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Pending
              </span>
            ) : (
              <button
                onClick={handleViewClick}
                className="px-4 py-1.5 bg-primary-600 text-white text-sm rounded-full hover:bg-primary-700 transition"
              >
                View
              </button>
            )
          ) : (
            <button
              onClick={handleJoinClick}
              className="px-4 py-1.5 border-2 border-primary-600 text-primary-600 text-sm rounded-full hover:bg-primary-50 transition-all hover:shadow-sm flex items-center gap-1.5 font-medium"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
              </svg>
              Join
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default GroupCard;