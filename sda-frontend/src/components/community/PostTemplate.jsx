// src/components/community/PostTemplate.jsx
import React, { useState } from 'react';

const PostTemplate = ({ onSelectTemplate, onClose }) => {
  const [selectedTemplate, setSelectedTemplate] = useState(null);

  const templates = [
    {
      id: 'event',
      name: '📅 Event Template',
      description: 'Promote an upcoming event or meeting',
      fields: {
        title: 'Youth Gathering - [Date]',
        description: 'Join us for an evening of fellowship and worship...',
        type: 'event',
        location: 'Church Hall',
      },
    },
    {
      id: 'donation',
      name: '🎁 Donation Drive',
      description: 'Raise funds for a cause',
      fields: {
        title: 'Donation Drive: [Purpose]',
        description: 'We are raising funds for...',
        type: 'donation',
        goalAmount: 0,
        itemsNeeded: '',
      },
    },
    {
      id: 'announcement',
      name: '📢 Announcement',
      description: 'Make an important announcement',
      fields: {
        title: 'Important Announcement: [Title]',
        description: 'Please be advised that...',
        type: 'announcement',
      },
    },
    {
      id: 'support',
      name: '🤝 Support Needed',
      description: 'Request support or help',
      fields: {
        title: 'Support Needed: [Type of Support]',
        description: 'I need assistance with...',
        type: 'support',
        itemsNeeded: '',
      },
    },
  ];

  const handleSelect = (template) => {
    setSelectedTemplate(template.id);
  };

  const handleUse = () => {
    const template = templates.find(t => t.id === selectedTemplate);
    if (template) {
      onSelectTemplate(template.fields);
    }
  };

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={e => e.stopPropagation()}>
        <div style={styles.header}>
          <h3 style={styles.title}>📋 Post Templates</h3>
          <button style={styles.closeButton} onClick={onClose}>✕</button>
        </div>

        <div style={styles.templateGrid}>
          {templates.map(template => (
            <div
              key={template.id}
              style={{
                ...styles.templateCard,
                ...(selectedTemplate === template.id ? styles.templateSelected : {}),
              }}
              onClick={() => handleSelect(template)}
            >
              <div style={styles.templateIcon}>{template.name[0]}</div>
              <div style={styles.templateInfo}>
                <h4 style={styles.templateName}>{template.name}</h4>
                <p style={styles.templateDescription}>{template.description}</p>
              </div>
              {selectedTemplate === template.id && (
                <div style={styles.checkMark}>✓</div>
              )}
            </div>
          ))}
        </div>

        <div style={styles.actions}>
          <button
            onClick={handleUse}
            disabled={!selectedTemplate}
            style={{
              ...styles.useButton,
              ...(!selectedTemplate ? styles.disabledButton : {}),
            }}
          >
            Use Template
          </button>
          <button onClick={onClose} style={styles.cancelButton}>
            Cancel
          </button>
        </div>

        <p style={styles.note}>
          Templates help you get started quickly. You can edit all fields after selection.
        </p>
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
  modal: {
    backgroundColor: 'white',
    borderRadius: '12px',
    padding: '24px',
    width: '90%',
    maxWidth: '500px',
    maxHeight: '80vh',
    overflowY: 'auto',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px',
  },
  title: {
    margin: 0,
    fontSize: '20px',
    fontWeight: '600',
  },
  closeButton: {
    background: 'none',
    border: 'none',
    fontSize: '20px',
    cursor: 'pointer',
    color: '#999',
  },
  templateGrid: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    marginBottom: '20px',
  },
  templateCard: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '12px',
    border: '2px solid #e0e0e0',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'all 0.2s',
    position: 'relative',
  },
  templateSelected: {
    borderColor: '#667eea',
    backgroundColor: '#f0f4ff',
  },
  templateIcon: {
    width: '40px',
    height: '40px',
    borderRadius: '8px',
    backgroundColor: '#f0f0f0',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '20px',
  },
  templateInfo: {
    flex: 1,
  },
  templateName: {
    margin: 0,
    fontSize: '14px',
    fontWeight: '600',
  },
  templateDescription: {
    margin: '4px 0 0',
    fontSize: '12px',
    color: '#666',
  },
  checkMark: {
    position: 'absolute',
    top: '8px',
    right: '8px',
    width: '20px',
    height: '20px',
    borderRadius: '50%',
    backgroundColor: '#667eea',
    color: 'white',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '12px',
  },
  actions: {
    display: 'flex',
    gap: '10px',
    marginBottom: '12px',
  },
  useButton: {
    flex: 1,
    padding: '10px',
    backgroundColor: '#667eea',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500',
  },
  disabledButton: {
    opacity: 0.5,
    cursor: 'not-allowed',
  },
  cancelButton: {
    padding: '10px 20px',
    backgroundColor: '#f0f0f0',
    color: '#666',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
  },
  note: {
    margin: 0,
    fontSize: '11px',
    color: '#999',
    fontStyle: 'italic',
    textAlign: 'center',
  },
};

export default PostTemplate;