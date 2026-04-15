// src/components/layout/Footer.jsx
import { Link } from 'react-router-dom';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gray-900 text-white pt-12 pb-6 mt-auto">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
          
          {/* About Section */}
          <div>
            <h4 className="text-lg font-semibold mb-3 text-white">Imani Hub</h4>
            <p className="text-gray-400 text-sm leading-relaxed">
              Building a stronger community across Kenya through faith, fellowship, 
              and meaningful connections.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-lg font-semibold mb-3 text-white">Quick Links</h4>
            <ul className="space-y-2">
              <li><Link to="/" className="text-gray-400 hover:text-primary-400 transition text-sm">Home</Link></li>
              <li><Link to="/about" className="text-gray-400 hover:text-primary-400 transition text-sm">About Us</Link></li>
              <li><Link to="/contact" className="text-gray-400 hover:text-primary-400 transition text-sm">Contact</Link></li>
              <li><Link to="/faq" className="text-gray-400 hover:text-primary-400 transition text-sm">FAQ</Link></li>
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h4 className="text-lg font-semibold mb-3 text-white">Resources</h4>
            <ul className="space-y-2">
              <li><Link to="/bible" className="text-gray-400 hover:text-primary-400 transition text-sm">Bible Reader</Link></li>
              <li><Link to="/prayer-wall" className="text-gray-400 hover:text-primary-400 transition text-sm">Prayer Wall</Link></li>
              <li><Link to="/groups" className="text-gray-400 hover:text-primary-400 transition text-sm">Fellowship Circles</Link></li>
              <li><Link to="/community" className="text-gray-400 hover:text-primary-400 transition text-sm">Community Board</Link></li>
            </ul>
          </div>

          {/* Connect With Us */}
          <div>
            <h4 className="text-lg font-semibold mb-3 text-white">Connect With Us</h4>
            <div className="flex gap-4 mb-4">
              {/* Facebook */}
              <a 
                href="https://facebook.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-gray-800 hover:bg-primary-600 flex items-center justify-center transition-all duration-300 hover:scale-110"
                aria-label="Facebook"
              >
                <svg className="w-5 h-5 text-gray-300 hover:text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z" />
                </svg>
              </a>
              
              {/* Instagram */}
              <a 
                href="https://instagram.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-gray-800 hover:bg-primary-600 flex items-center justify-center transition-all duration-300 hover:scale-110"
                aria-label="Instagram"
              >
                <svg className="w-5 h-5 text-gray-300 hover:text-white" fill="currentColor" viewBox="0 0 24 24">
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5" stroke="currentColor" strokeWidth="2" fill="none" />
                  <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="2" fill="none" />
                  <line x1="17" y1="7" x2="17" y2="7" stroke="currentColor" strokeWidth="2" />
                </svg>
              </a>
              
              {/* Twitter/X */}
              <a 
                href="https://twitter.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-gray-800 hover:bg-primary-600 flex items-center justify-center transition-all duration-300 hover:scale-110"
                aria-label="Twitter"
              >
                <svg className="w-5 h-5 text-gray-300 hover:text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M23 3a10.9 10.9 0 01-3.14 1.53 4.48 4.48 0 00-7.86 3v1A10.66 10.66 0 013 4s-4 9 5 13a11.64 11.64 0 01-7 2c9 5 20 0 20-11.5a4.5 4.5 0 00-.08-.83A7.72 7.72 0 0023 3z" />
                </svg>
              </a>
              
              {/* WhatsApp */}
              <a 
                href="https://wa.me/254781024762" 
                target="_blank" 
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-gray-800 hover:bg-green-600 flex items-center justify-center transition-all duration-300 hover:scale-110"
                aria-label="WhatsApp"
              >
                <svg className="w-5 h-5 text-gray-300 hover:text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C6.48 2 2 6.48 2 12c0 2.17.62 4.22 1.75 6.01L2 22l4.09-1.12c1.74.99 3.72 1.54 5.91 1.54 5.52 0 10-4.48 10-10S17.52 2 12 2zm0 18c-1.73 0-3.34-.5-4.72-1.35l-3.22.88.96-3.05C4.33 15.34 4 13.74 4 12c0-4.41 3.59-8 8-8s8 3.59 8 8-3.59 8-8 8z" />
                  <path d="M16.25 14.15c-.15-.25-.55-.4-.95-.55s-1.25-.6-1.45-.65c-.2-.05-.35-.05-.5.15s-.6.65-.75.85c-.15.2-.3.2-.55.05-.75-.3-1.5-.8-2-1.4-.15-.2-.2-.35-.1-.55.05-.1.15-.25.25-.4.1-.1.15-.2.2-.35.05-.15 0-.3-.05-.4-.05-.1-.45-1.05-.65-1.45-.15-.35-.3-.3-.45-.3-.15 0-.35 0-.55 0-.2 0-.5.1-.75.45-.25.35-1.05 1-1.05 2.45s1.05 2.85 1.2 3.05c.15.2 2 3.15 4.95 4.15.7.25 1.25.4 1.7.5.7.15 1.35.1 1.85.05.6-.05 1.3-.55 1.5-1.05.2-.5.2-.95.15-1.05-.05-.1-.2-.2-.45-.35z" />
                </svg>
              </a>
            </div>
            
            {/* Contact Info */}
            <div className="space-y-2 text-gray-400 text-sm">
              <p className="flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <a href="mailto:allankibet1820@gmail.com" className="hover:text-primary-400 transition">
                  allankibet1820@gmail.com
                </a>
              </p>
              <p className="flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                <a href="tel:+254781024762" className="hover:text-primary-400 transition">
                  +254 781 024 762
                </a>
              </p>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-6 border-t border-gray-800 flex flex-col sm:flex-row justify-between items-center gap-3 text-sm text-gray-500">
          <p>© {currentYear} Imani Hub. All rights reserved.</p>
          <div className="flex gap-4 flex-wrap justify-center">
            <Link to="/privacy" className="hover:text-primary-400 transition">Privacy Policy</Link>
            <Link to="/terms" className="hover:text-primary-400 transition">Terms of Service</Link>
            <Link to="/guidelines" className="hover:text-primary-400 transition">Community Guidelines</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;