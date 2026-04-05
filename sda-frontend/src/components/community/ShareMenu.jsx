// src/components/community/ShareMenu.jsx
import React, { useState } from 'react';

const ShareMenu = ({ post, onClose }) => {
  const [copied, setCopied] = useState(false);
  const [showEmbed, setShowEmbed] = useState(false);

  const postUrl = `${window.location.origin}/community/post/${post.id}`;
  const embedCode = `<iframe src="${window.location.origin}/embed/post/${post.id}" width="600" height="400" frameborder="0"></iframe>`;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(postUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleShare = (platform) => {
    const text = encodeURIComponent(`${post.title} - Check out this post!`);
    const url = encodeURIComponent(postUrl);
    
    const shareUrls = {
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${url}`,
      twitter: `https://twitter.com/intent/tweet?text=${text}&url=${url}`,
      whatsapp: `https://wa.me/?text=${text}%20${url}`,
      telegram: `https://t.me/share/url?url=${url}&text=${text}`,
    };

    if (shareUrls[platform]) {
      window.open(shareUrls[platform], '_blank', 'width=600,height=400');
    }
  };

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.menu} onClick={e => e.stopPropagation()}>
        <div style={styles.header}>
          <h3 style={styles.title}>📤 Share Post</h3>
          <button style={styles.closeButton} onClick={onClose}>✕</button>
        </div>

        {/* Social Media Buttons */}
        <div style={styles.socialGrid}>
          <button onClick={() => handleShare('facebook')} style={styles.socialButton}>
            <span style={styles.socialIcon}>📘</span>
            <span>Facebook</span>
          </button>
          <button onClick={() => handleShare('twitter')} style={styles.socialButton}>
            <span style={styles.socialIcon}>🐦</span>
            <span>Twitter</span>
          </button>
          <button onClick={() => handleShare('whatsapp')} style={styles.socialButton}>
            <span style={styles.socialIcon}>💬</span>
            <span>WhatsApp</span>
          </button>
          <button onClick={() => handleShare('telegram')} style={styles.socialButton}>
            <span style={styles.socialIcon}>📱</span>
            <span>Telegram</span>
          </button>
        </div>

        {/* Copy Link */}
        <div style={styles.copySection}>
          <div style={styles.copyContainer}>
            <input type="text" value={postUrl} readOnly style={styles.copyInput} />
            <button onClick={handleCopyLink} style={styles.copyButton}>
              {copied ? '✓ Copied!' : '📋 Copy'}
            </button>
          </div>
        </div>

        {/* Embed Code (toggle) */}
        <div style={styles.embedSection}>
          <button
            onClick={() => setShowEmbed(!showEmbed)}
            style={styles.embedToggle}
          >
            {showEmbed ? '▼ Hide Embed Code' : '▶ Show Embed Code'}
          </button>
          {showEmbed && (
            <div style={styles.embedContainer}>
              <textarea
                value={embedCode}
                readOnly
                rows="3"
                style={styles.embedTextarea}
              />
              <button
                onClick={() => {
                  navigator.clipboard.writeText(embedCode);
                  alert('Embed code copied!');
                }}
                style={styles.embedCopyButton}
              >
                Copy Code
              </button>
            </div>
          )}
        </div>

        {/* QR Code (optional) */}
        <div style={styles.qrSection}>
          <button style={styles.qrButton}>
            📱 Show QR Code
          </button>
        </div>
      </div>
    </div>
  );
};

const styles = {
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  menu: {
    backgroundColor: 'white',
    borderRadius: '12px',
    padding: '20px',
    width: '90%',
    maxWidth: '450px',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px',
  },
  title: {
    margin: 0,
    fontSize: '18px',
    fontWeight: '600',
  },
  closeButton: {
    background: 'none',
    border: 'none',
    fontSize: '20px',
    cursor: 'pointer',
    color: '#999',
  },
  socialGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '10px',
    marginBottom: '20px',
  },
  socialButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '10px',
    border: '1px solid #e0e0e0',
    borderRadius: '8px',
    backgroundColor: 'white',
    cursor: 'pointer',
    transition: 'all 0.2s',
    ':hover': {
      backgroundColor: '#f5f5f5',
    },
  },
  socialIcon: {
    fontSize: '20px',
  },
  copySection: {
    marginBottom: '15px',
  },
  copyContainer: {
    display: 'flex',
    gap: '10px',
  },
  copyInput: {
    flex: 1,
    padding: '10px',
    border: '1px solid #ddd',
    borderRadius: '6px',
    fontSize: '12px',
    backgroundColor: '#f9f9f9',
  },
  copyButton: {
    padding: '10px 16px',
    backgroundColor: '#667eea',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
  },
  embedSection: {
    marginBottom: '15px',
  },
  embedToggle: {
    width: '100%',
    padding: '10px',
    backgroundColor: '#f0f0f0',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '13px',
    textAlign: 'left',
  },
  embedContainer: {
    marginTop: '10px',
  },
  embedTextarea: {
    width: '100%',
    padding: '8px',
    border: '1px solid #ddd',
    borderRadius: '6px',
    fontSize: '11px',
    fontFamily: 'monospace',
    marginBottom: '8px',
  },
  embedCopyButton: {
    padding: '6px 12px',
    backgroundColor: '#27ae60',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '12px',
  },
  qrSection: {
    textAlign: 'center',
  },
  qrButton: {
    padding: '8px 16px',
    backgroundColor: '#f0f0f0',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '13px',
  },
};

export default ShareMenu;