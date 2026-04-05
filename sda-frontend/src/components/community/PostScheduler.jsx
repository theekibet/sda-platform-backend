// src/components/community/PostScheduler.jsx
import React, { useState } from 'react';

const PostScheduler = ({ onSchedule, initialDate = null, onCancel }) => {
  const [scheduleDate, setScheduleDate] = useState(initialDate || '');
  const [scheduleTime, setScheduleTime] = useState('');
  const [error, setError] = useState('');

  const getMinDateTime = () => {
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    return now.toISOString().slice(0, 16);
  };

  const handleSubmit = () => {
    if (!scheduleDate) {
      setError('Please select a date');
      return;
    }

    const dateTime = new Date(`${scheduleDate}T${scheduleTime || '00:00'}`);
    const now = new Date();

    if (dateTime <= now) {
      setError('Schedule date must be in the future');
      return;
    }

    onSchedule(dateTime);
  };

  const handleNow = () => {
    onSchedule(null);
  };

  return (
    <div style={styles.container}>
      <h4 style={styles.title}>📅 Schedule Post</h4>
      
      <div style={styles.formGroup}>
        <label style={styles.label}>Date</label>
        <input
          type="date"
          value={scheduleDate}
          onChange={(e) => setScheduleDate(e.target.value)}
          min={getMinDateTime().split('T')[0]}
          style={styles.input}
        />
      </div>

      <div style={styles.formGroup}>
        <label style={styles.label}>Time (optional)</label>
        <input
          type="time"
          value={scheduleTime}
          onChange={(e) => setScheduleTime(e.target.value)}
          style={styles.input}
        />
      </div>

      {error && <div style={styles.error}>{error}</div>}

      <div style={styles.actions}>
        <button onClick={handleNow} style={styles.nowButton}>
          Publish Now
        </button>
        <button onClick={handleSubmit} style={styles.scheduleButton}>
          Schedule
        </button>
        <button onClick={onCancel} style={styles.cancelButton}>
          Cancel
        </button>
      </div>

      <p style={styles.note}>
        Scheduled posts will be automatically published at the selected time.
      </p>
    </div>
  );
};

const styles = {
  container: {
    padding: '16px',
    backgroundColor: '#f9f9f9',
    borderRadius: '8px',
    marginTop: '16px',
  },
  title: {
    margin: '0 0 12px 0',
    fontSize: '16px',
    fontWeight: '600',
  },
  formGroup: {
    marginBottom: '12px',
  },
  label: {
    display: 'block',
    marginBottom: '4px',
    fontSize: '13px',
    color: '#666',
  },
  input: {
    width: '100%',
    padding: '8px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    fontSize: '14px',
  },
  error: {
    padding: '8px',
    backgroundColor: '#fee',
    color: '#c33',
    borderRadius: '4px',
    fontSize: '12px',
    marginBottom: '12px',
  },
  actions: {
    display: 'flex',
    gap: '10px',
    marginBottom: '12px',
  },
  nowButton: {
    flex: 1,
    padding: '8px',
    backgroundColor: '#667eea',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '13px',
  },
  scheduleButton: {
    flex: 1,
    padding: '8px',
    backgroundColor: '#27ae60',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '13px',
  },
  cancelButton: {
    padding: '8px 16px',
    backgroundColor: '#95a5a6',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '13px',
  },
  note: {
    margin: 0,
    fontSize: '11px',
    color: '#999',
    fontStyle: 'italic',
  },
};

export default PostScheduler;