/**
 * Auto-detect and render clickable links in text
 * @param {string} text - The text to process
 * @returns {Array|string} - Array of text and link elements or original string
 */
export const renderLinks = (text) => {
    if (!text || typeof text !== 'string') return text;
  
    // URL regex pattern - matches http://, https://, and www.
    const urlPattern = /(\b(https?|ftp|file):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/gi;
    const wwwPattern = /(^|\s)(www\.[\S]+(\b|$))/gi;
    
    let parts = [];
    let lastIndex = 0;
    let match;
  
    // First, find http/https URLs
    urlPattern.lastIndex = 0;
    while ((match = urlPattern.exec(text)) !== null) {
      // Add text before the URL
      if (match.index > lastIndex) {
        parts.push({ type: 'text', content: text.substring(lastIndex, match.index) });
      }
      
      // Add the URL as a link
      const url = match[0];
      parts.push({ type: 'link', url: url });
      
      lastIndex = match.index + url.length;
    }
    
    // Then, find www. URLs that weren't caught
    if (lastIndex < text.length) {
      const remainingText = text.substring(lastIndex);
      wwwPattern.lastIndex = 0;
      let wwwLastIndex = 0;
      
      while ((match = wwwPattern.exec(remainingText)) !== null) {
        // Add text before the URL
        if (match.index > wwwLastIndex) {
          parts.push({ 
            type: 'text', 
            content: remainingText.substring(wwwLastIndex, match.index) 
          });
        }
        
        // Add the URL as a link (prepend https://)
        const url = match[2];
        parts.push({ type: 'link', url: `https://${url}` });
        
        wwwLastIndex = match.index + match[0].length;
      }
      
      // Add remaining text
      if (wwwLastIndex < remainingText.length) {
        parts.push({ type: 'text', content: remainingText.substring(wwwLastIndex) });
      }
    }
    
    // If no URLs found, return the original text
    if (parts.length === 0) {
      return text;
    }
    
    return parts;
  };
  
  /**
   * Get platform badge for meeting links
   * @param {string} url - The URL to check
   * @returns {Object|null} - Platform info or null
   */
  export const getMeetingPlatform = (url) => {
    if (!url) return null;
    
    const lowerUrl = url.toLowerCase();
    
    if (lowerUrl.includes('zoom.us') || lowerUrl.includes('zoom.com')) {
      return { platform: 'zoom', icon: '🔗', label: 'Zoom', color: '#0b5c8e' };
    }
    if (lowerUrl.includes('meet.google.com')) {
      return { platform: 'google-meet', icon: '🎥', label: 'Google Meet', color: '#1a73e8' };
    }
    if (lowerUrl.includes('teams.microsoft.com')) {
      return { platform: 'teams', icon: '💬', label: 'Teams', color: '#6264a7' };
    }
    if (lowerUrl.includes('whatsapp.com') || lowerUrl.includes('wa.me')) {
      return { platform: 'whatsapp', icon: '💬', label: 'WhatsApp', color: '#25d366' };
    }
    if (lowerUrl.includes('t.me') || lowerUrl.includes('telegram')) {
      return { platform: 'telegram', icon: '📱', label: 'Telegram', color: '#0088cc' };
    }
    
    return null;
  };