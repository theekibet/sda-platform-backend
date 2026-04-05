// src/components/layout/Footer.jsx
import { Link } from 'react-router-dom';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer style={styles.footer}>
      <div style={styles.container}>
        <div style={styles.grid}>
          {/* About Section */}
          <div style={styles.section}>
            <h4 style={styles.title}>Imani</h4>
            <p style={styles.description}>
              Building a stronger youth community across Kenya through faith, 
              fellowship, and meaningful connections.
            </p>
          </div>

          {/* Quick Links */}
          <div style={styles.section}>
            <h4 style={styles.title}>Quick Links</h4>
            <ul style={styles.list}>
              <li><Link to="/" style={styles.link}>Home</Link></li>
              <li><Link to="/about" style={styles.link}>About Us</Link></li>
              <li><Link to="/contact" style={styles.link}>Contact</Link></li>
              <li><Link to="/faq" style={styles.link}>FAQ</Link></li>
            </ul>
          </div>

          {/* Resources */}
          <div style={styles.section}>
            <h4 style={styles.title}>Resources</h4>
            <ul style={styles.list}>
              <li><Link to="/bible" style={styles.link}>Bible Reader</Link></li>
              <li><Link to="/devotional" style={styles.link}>Daily Devotional</Link></li>
              <li><Link to="/hymns" style={styles.link}>Hymns</Link></li>
              <li><Link to="/events" style={styles.link}>Events</Link></li>
            </ul>
          </div>

          {/* Connect */}
          <div style={styles.section}>
            <h4 style={styles.title}>Connect With Us</h4>
            <div style={styles.socialLinks}>
              <a href="#" style={styles.socialLink}>📘</a>
              <a href="#" style={styles.socialLink}>📷</a>
              <a href="#" style={styles.socialLink}>🐦</a>
              <a href="#" style={styles.socialLink}>📧</a>
            </div>
            <p style={styles.contactInfo}>
              ✉️ allankibet1820@gmail.com<br />
              📞 +254 781 024 762
            </p>
          </div>
        </div>

        <div style={styles.bottomBar}>
          <p style={styles.copyright}>
            © {currentYear} SDA Youth Connect. All rights reserved.
          </p>
          <div style={styles.legalLinks}>
            <Link to="/privacy" style={styles.legalLink}>Privacy Policy</Link>
            <Link to="/terms" style={styles.legalLink}>Terms of Service</Link>
            <Link to="/guidelines" style={styles.legalLink}>Community Guidelines</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

const styles = {
  footer: {
    backgroundColor: '#1a1a1a',
    color: '#fff',
    padding: '60px 20px 20px',
    marginTop: 'auto',
  },
  container: {
    maxWidth: '1200px',
    margin: '0 auto',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '40px',
    marginBottom: '40px',
  },
  section: {
    display: 'flex',
    flexDirection: 'column',
    gap: '15px',
  },
  title: {
    color: '#fff',
    fontSize: '18px',
    fontWeight: '600',
    marginBottom: '10px',
  },
  description: {
    color: '#9ca3af',
    lineHeight: '1.6',
    fontSize: '14px',
  },
  list: {
    listStyle: 'none',
    padding: 0,
    margin: 0,
  },
  link: {
    color: '#9ca3af',
    textDecoration: 'none',
    fontSize: '14px',
    lineHeight: '2',
    transition: 'color 0.3s',
    ':hover': {
      color: '#667eea',
    },
  },
  socialLinks: {
    display: 'flex',
    gap: '15px',
  },
  socialLink: {
    color: '#fff',
    textDecoration: 'none',
    fontSize: '24px',
    transition: 'transform 0.3s',
    ':hover': {
      transform: 'translateY(-3px)',
    },
  },
  contactInfo: {
    color: '#9ca3af',
    fontSize: '14px',
    lineHeight: '1.8',
  },
  bottomBar: {
    paddingTop: '20px',
    borderTop: '1px solid #333',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '15px',
  },
  copyright: {
    color: '#9ca3af',
    fontSize: '13px',
    margin: 0,
  },
  legalLinks: {
    display: 'flex',
    gap: '20px',
    flexWrap: 'wrap',
  },
  legalLink: {
    color: '#9ca3af',
    textDecoration: 'none',
    fontSize: '13px',
    transition: 'color 0.3s',
    ':hover': {
      color: '#667eea',
    },
  },
};

export default Footer;