// src/components/groups/GroupCard.jsx
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
  
    const getMeetingTypeBadge = () => {
      if (!group.meetingType) return null;
      const badges = {
        online: '💻 Online',
        'in-person': '🤝 In-Person',
        hybrid: '🔄 Hybrid',
      };
      return badges[group.meetingType] || null;
    };
  
    return (
      <div
        className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition cursor-pointer"
        onClick={handleViewClick}
      >
        <div className="p-5">
          <div className="flex justify-between items-start mb-3">
            <div className="flex flex-wrap gap-1">
              {group.tags && group.tags.slice(0, 2).map(tag => (
                <span key={tag.id} className="inline-flex items-center gap-1 px-2 py-1 bg-primary-100 text-primary-700 rounded-full text-xs font-medium">
                  #{tag.name}
                </span>
              ))}
            </div>
            {group.isPrivate && (
              <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">🔒 Private</span>
            )}
          </div>
  
          <h3 className="text-lg font-bold text-gray-800 mb-2">
            {group.name}
          </h3>
  
          <p className="text-gray-600 text-sm mb-4 line-clamp-2">
            {group.description?.length > 100
              ? group.description.substring(0, 100) + '...'
              : group.description}
          </p>
  
          <div className="flex flex-wrap gap-3 text-xs text-gray-500 mb-4">
            <span>👥 {group.memberCount || 0} members</span>
            {getMeetingTypeBadge() && <span>{getMeetingTypeBadge()}</span>}
            {group.location && group.meetingType !== 'online' && <span>📍 {group.location}</span>}
            <span>📝 {group.discussionCount || 0} discussions</span>
          </div>
  
          <div className="flex justify-between items-center pt-3 border-t border-gray-100">
            <span className="text-xs text-gray-400">Created by {group.createdBy?.name}</span>
            {isMember ? (
              <button
                onClick={handleViewClick}
                className="px-3 py-1.5 bg-primary-500 text-white text-sm rounded-md hover:bg-primary-600 transition"
              >
                View Group
              </button>
            ) : userMembership ? (
              userMembership.status === 'pending' ? (
                <span className="text-xs text-yellow-600 bg-yellow-50 px-3 py-1.5 rounded-md">⏳ Pending</span>
              ) : (
                <button onClick={handleViewClick} className="px-3 py-1.5 bg-primary-500 text-white text-sm rounded-md hover:bg-primary-600 transition">
                  View Group
                </button>
              )
            ) : (
              <button
                onClick={handleJoinClick}
                className="px-3 py-1.5 border border-primary-500 text-primary-500 text-sm rounded-md hover:bg-primary-50 transition"
              >
                Join Group
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };
  
  export default GroupCard;