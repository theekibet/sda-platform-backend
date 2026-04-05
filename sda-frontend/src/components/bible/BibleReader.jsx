// src/components/bible/BibleReader.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { bibleService } from '../../services/bibleService';
import { 
  getBookNames, 
  getChapterArray,
  BOOK_CHAPTERS_MAP,
} from '../../constants/bibleData';
import ShareVerseModal from './ShareVerseModal';

const BibleReader = ({ 
  mode = 'fullscreen',
  initialBook = 'Genesis',
  initialChapter = 1,
  onClose,
  onVerseSelect 
}) => {
  const navigate = useNavigate();
  const params = useParams();
  const versesContainerRef = useRef(null);
  
  const [selectedBook, setSelectedBook] = useState(params.book || initialBook);
  const [selectedChapter, setSelectedChapter] = useState(
    params.chapter ? parseInt(params.chapter) : initialChapter
  );
  
  const [verses, setVerses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fontSize, setFontSize] = useState(
    parseInt(localStorage.getItem('bibleFontSize')) || 20
  );
  const [darkMode, setDarkMode] = useState(
    localStorage.getItem('bibleDarkMode') === 'true' || false
  );
  const [showSettings, setShowSettings] = useState(false);
  const [showNotes, setShowNotes] = useState(false);
  const [currentNote, setCurrentNote] = useState('');
  const [savedNotes, setSavedNotes] = useState({});

  // Selection menu state
  const [selectionMenu, setSelectionMenu] = useState({
    show: false,
    x: 0,
    y: 0,
    text: '',
    verses: []
  });
  const [showCopyToast, setShowCopyToast] = useState(false);

  // Share modal state
  const [showShareModal, setShowShareModal] = useState(false);
  const [selectedVerse, setSelectedVerse] = useState(null);

  const books = getBookNames();
  const chapterOptions = getChapterArray(selectedBook);

  useEffect(() => {
    if (mode === 'fullscreen' && !params.book) {
      const savedPosition = localStorage.getItem('bibleReadingPosition');
      if (savedPosition) {
        const { book, chapter } = JSON.parse(savedPosition);
        setSelectedBook(book);
        setSelectedChapter(chapter);
      }
    }
  }, [mode, params.book]);

  useEffect(() => {
    if (selectedBook && selectedChapter && mode === 'fullscreen') {
      localStorage.setItem('bibleReadingPosition', JSON.stringify({
        book: selectedBook,
        chapter: selectedChapter,
        timestamp: new Date().toISOString()
      }));
    }
  }, [selectedBook, selectedChapter, mode]);

  useEffect(() => {
    const notes = localStorage.getItem('bibleNotes');
    if (notes) {
      setSavedNotes(JSON.parse(notes));
    }
  }, []);

  useEffect(() => {
    if (mode === 'fullscreen' && navigate) {
      navigate(`/bible/read/${selectedBook}/${selectedChapter}`, { replace: true });
    }
  }, [selectedBook, selectedChapter, mode, navigate]);

  useEffect(() => {
    fetchChapter();
  }, [selectedBook, selectedChapter]);

  useEffect(() => {
    localStorage.setItem('bibleFontSize', fontSize);
  }, [fontSize]);

  useEffect(() => {
    localStorage.setItem('bibleDarkMode', darkMode);
  }, [darkMode]);

  // Handle text selection
  useEffect(() => {
    const handleSelection = () => {
      const selection = window.getSelection();
      const selectedText = selection.toString().trim();
      
      if (selectedText.length > 0 && versesContainerRef.current?.contains(selection.anchorNode)) {
        const range = selection.getRangeAt(0);
        const rect = range.getBoundingClientRect();
        
        const selectedVerses = [];
        verses.forEach(verse => {
          if (selectedText.includes(verse.text.substring(0, 20))) {
            selectedVerses.push(verse);
          }
        });
        
        setSelectionMenu({
          show: true,
          x: rect.left + rect.width / 2,
          y: rect.top - 10,
          text: selectedText,
          verses: selectedVerses.length > 0 ? selectedVerses : [verses[0]]
        });
      } else {
        setSelectionMenu({ show: false, x: 0, y: 0, text: '', verses: [] });
      }
    };

    document.addEventListener('mouseup', handleSelection);
    document.addEventListener('touchend', handleSelection);

    return () => {
      document.removeEventListener('mouseup', handleSelection);
      document.removeEventListener('touchend', handleSelection);
    };
  }, [verses]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (selectionMenu.show && !e.target.closest('.selection-menu')) {
        setSelectionMenu({ show: false, x: 0, y: 0, text: '', verses: [] });
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [selectionMenu.show]);

  const fetchChapter = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await bibleService.getChapter(selectedBook, selectedChapter, 'kjv');
      let versesData = response.data?.data || response.data || response.verses || [];
      versesData.sort((a, b) => a.verse - b.verse);
      setVerses(versesData);
      
      const noteKey = `${selectedBook}_${selectedChapter}`;
      if (savedNotes[noteKey]) {
        setCurrentNote(savedNotes[noteKey]);
      } else {
        setCurrentNote('');
      }
    } catch (err) {
      setError('Failed to load chapter');
    } finally {
      setLoading(false);
    }
  };

  const handlePrevChapter = () => {
    if (selectedChapter > 1) {
      setSelectedChapter(selectedChapter - 1);
    } else {
      const bookIndex = books.indexOf(selectedBook);
      if (bookIndex > 0) {
        const prevBook = books[bookIndex - 1];
        setSelectedBook(prevBook);
        setSelectedChapter(BOOK_CHAPTERS_MAP[prevBook]);
      }
    }
  };

  const handleNextChapter = () => {
    if (selectedChapter < BOOK_CHAPTERS_MAP[selectedBook]) {
      setSelectedChapter(selectedChapter + 1);
    } else {
      const bookIndex = books.indexOf(selectedBook);
      if (bookIndex < books.length - 1) {
        setSelectedBook(books[bookIndex + 1]);
        setSelectedChapter(1);
      }
    }
  };

  const handleSaveNote = () => {
    const key = `${selectedBook}_${selectedChapter}`;
    const updatedNotes = {
      ...savedNotes,
      [key]: currentNote
    };
    setSavedNotes(updatedNotes);
    localStorage.setItem('bibleNotes', JSON.stringify(updatedNotes));
    setShowNotes(false);
  };

  const increaseFontSize = () => setFontSize(prev => Math.min(prev + 2, 32));
  const decreaseFontSize = () => setFontSize(prev => Math.max(prev - 2, 14));

  const handleVerseClick = (verse) => {
    if (onVerseSelect) {
      onVerseSelect(verse);
    }
  };

  const handleCopy = async () => {
    try {
      let textToCopy = selectionMenu.text;
      
      if (selectionMenu.verses.length > 0) {
        const verseRefs = selectionMenu.verses.map(v => v.verse).join(', ');
        textToCopy = `"${selectionMenu.text}"\n\n${selectedBook} ${selectedChapter}:${verseRefs} (KJV)`;
      }
      
      await navigator.clipboard.writeText(textToCopy);
      setShowCopyToast(true);
      setSelectionMenu({ show: false, x: 0, y: 0, text: '', verses: [] });
      
      setTimeout(() => setShowCopyToast(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleShare = () => {
    const primaryVerse = selectionMenu.verses[0] || verses[0];
    
    const verseToShare = {
      id: primaryVerse.id,
      reference: `${selectedBook} ${selectedChapter}:${primaryVerse.verse}`,
      text: selectionMenu.text || primaryVerse.text,
      book: selectedBook,
      chapter: selectedChapter,
      verse: primaryVerse.verse
    };
    
    setSelectedVerse(verseToShare);
    setShowShareModal(true);
    setSelectionMenu({ show: false, x: 0, y: 0, text: '', verses: [] });
  };

  if (mode === 'modal') {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-5" onClick={onClose}>
        <div 
          className={`relative bg-white rounded-xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl ${darkMode ? 'dark' : ''}`}
          onClick={e => e.stopPropagation()}
        >
          <div className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-bold text-gray-800 dark:text-white">📖 Bible Reader</h2>
            <div className="flex gap-2">
              <button
                onClick={() => window.open(`/bible/read/${selectedBook}/${selectedChapter}`, '_blank')}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                title="Open in Full Screen"
              >
                ⛶
              </button>
              <button
                onClick={() => setDarkMode(!darkMode)}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition"
              >
                {darkMode ? '☀️' : '🌙'}
              </button>
              <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition">
                ✕
              </button>
            </div>
          </div>

          <div className="flex flex-wrap gap-3 p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
            <select
              value={selectedBook}
              onChange={(e) => setSelectedBook(e.target.value)}
              className="flex-1 min-w-[120px] px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              {books.map(book => (
                <option key={book} value={book}>{book}</option>
              ))}
            </select>
            
            <select
              value={selectedChapter}
              onChange={(e) => setSelectedChapter(Number(e.target.value))}
              className="flex-1 min-w-[100px] px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              {chapterOptions.map(ch => (
                <option key={ch} value={ch}>Chapter {ch}</option>
              ))}
            </select>

            <div className="flex items-center gap-2 bg-white dark:bg-gray-700 rounded-lg px-3 py-1 border border-gray-300 dark:border-gray-600">
              <button onClick={decreaseFontSize} className="px-2 py-1 hover:bg-gray-100 dark:hover:bg-gray-600 rounded">A-</button>
              <span className="text-sm text-gray-600 dark:text-gray-300">{fontSize}px</span>
              <button onClick={increaseFontSize} className="px-2 py-1 hover:bg-gray-100 dark:hover:bg-gray-600 rounded">A+</button>
            </div>
          </div>

          <div
            ref={versesContainerRef}
            className="flex-1 overflow-y-auto p-6"
            style={{ fontSize: `${fontSize}px` }}
          >
            {loading ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
              </div>
            ) : error ? (
              <div className="text-center text-red-500 py-12">{error}</div>
            ) : (
              verses.map(verse => (
                <div
                  key={verse.verse}
                  className="mb-4 leading-relaxed hover:bg-gray-50 dark:hover:bg-gray-800 rounded p-2 transition cursor-pointer"
                  onClick={() => handleVerseClick(verse)}
                >
                  <span className="inline-block w-8 font-bold text-primary-500 dark:text-primary-400 mr-2">{verse.verse}</span>
                  <span className="text-gray-800 dark:text-gray-200">{verse.text}</span>
                </div>
              ))
            )}
          </div>

          {selectionMenu.show && (
            <div
              className="selection-menu fixed z-50 flex gap-1 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-1"
              style={{
                left: `${selectionMenu.x}px`,
                top: `${selectionMenu.y}px`,
                transform: 'translate(-50%, -100%)'
              }}
            >
              <button
                onClick={handleCopy}
                className="px-3 py-1 text-sm rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition"
              >
                📋 Copy
              </button>
              <button
                onClick={handleShare}
                className="px-3 py-1 text-sm rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition"
              >
                📤 Share
              </button>
            </div>
          )}

          {showCopyToast && (
            <div className="fixed bottom-5 left-1/2 -translate-x-1/2 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg z-50 animate-fade-in-out">
              ✓ Copied to clipboard!
            </div>
          )}

          {showShareModal && selectedVerse && (
            <ShareVerseModal
              verse={selectedVerse}
              onClose={() => {
                setShowShareModal(false);
                setSelectedVerse(null);
              }}
              onSuccess={(data) => {
                console.log('Verse shared successfully:', data);
                setShowShareModal(false);
                setSelectedVerse(null);
              }}
            />
          )}
        </div>
      </div>
    );
  }

  // Fullscreen mode
  return (
    <div className={`min-h-screen ${darkMode ? 'dark bg-gray-900 text-white' : 'bg-white text-gray-900'}`}>
      <header className="sticky top-0 z-10 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="flex justify-between items-center p-4 max-w-7xl mx-auto">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/dashboard')}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition"
              title="Back to Dashboard"
            >
              ←
            </button>
            <select
              value={selectedBook}
              onChange={(e) => setSelectedBook(e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              {books.map(book => (
                <option key={book} value={book}>{book}</option>
              ))}
            </select>
            <select
              value={selectedChapter}
              onChange={(e) => setSelectedChapter(Number(e.target.value))}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              {chapterOptions.map(ch => (
                <option key={ch} value={ch}>Chapter {ch}</option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition"
              title="Settings"
            >
              ⚙️
            </button>
            <button
              onClick={() => setShowNotes(!showNotes)}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition"
              title="Notes"
            >
              📝
            </button>
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition"
              title="Toggle Theme"
            >
              {darkMode ? '☀️' : '🌙'}
            </button>
            <button
              onClick={() => navigate('/dashboard')}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition"
              title="Close"
            >
              ✕
            </button>
          </div>
        </div>

        {showSettings && (
          <div className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-4">
            <div className="max-w-7xl mx-auto flex justify-between items-center">
              <span>Font Size: {fontSize}px</span>
              <div className="flex gap-2">
                <button onClick={decreaseFontSize} className="px-3 py-1 bg-gray-200 dark:bg-gray-700 rounded hover:bg-gray-300 dark:hover:bg-gray-600 transition">A-</button>
                <button onClick={increaseFontSize} className="px-3 py-1 bg-gray-200 dark:bg-gray-700 rounded hover:bg-gray-300 dark:hover:bg-gray-600 transition">A+</button>
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                Chapter {selectedChapter} of {BOOK_CHAPTERS_MAP[selectedBook]}
              </div>
            </div>
          </div>
        )}

        {showNotes && (
          <div className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-4">
            <div className="max-w-7xl mx-auto">
              <div className="flex justify-between items-center mb-3">
                <h3 className="font-semibold">Notes for {selectedBook} {selectedChapter}</h3>
                <button onClick={() => setShowNotes(false)} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">✕</button>
              </div>
              <textarea
                value={currentNote}
                onChange={(e) => setCurrentNote(e.target.value)}
                placeholder="Write your reflections here..."
                rows={6}
                className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
              <div className="flex justify-end mt-3">
                <button onClick={handleSaveNote} className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition">
                  Save Note
                </button>
              </div>
            </div>
          </div>
        )}
      </header>

      <main className="max-w-7xl mx-auto p-6">
        <div className="mb-6 flex justify-between items-center">
          <h1 className="text-3xl font-bold">{selectedBook} {selectedChapter}</h1>
          <div className="flex gap-3">
            <button onClick={handlePrevChapter} className="px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition">
              ← Previous
            </button>
            <button onClick={handleNextChapter} className="px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition">
              Next →
            </button>
          </div>
        </div>

        <div
          ref={versesContainerRef}
          className="space-y-4"
          style={{ fontSize: `${fontSize}px` }}
        >
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
            </div>
          ) : error ? (
            <div className="text-center text-red-500 py-12">{error}</div>
          ) : (
            verses.map(verse => (
              <div
                key={verse.verse}
                className="leading-relaxed hover:bg-gray-50 dark:hover:bg-gray-800 rounded p-2 transition cursor-pointer"
                onClick={() => handleVerseClick(verse)}
              >
                <span className="inline-block w-8 font-bold text-primary-500 dark:text-primary-400 mr-2">{verse.verse}</span>
                <span className="text-gray-800 dark:text-gray-200">{verse.text}</span>
              </div>
            ))
          )}
        </div>
      </main>

      {selectionMenu.show && (
        <div
          className="selection-menu fixed z-50 flex gap-1 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-1"
          style={{
            left: `${selectionMenu.x}px`,
            top: `${selectionMenu.y}px`,
            transform: 'translate(-50%, -100%)'
          }}
        >
          <button
            onClick={handleCopy}
            className="px-3 py-1 text-sm rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition"
          >
            📋 Copy
          </button>
          <button
            onClick={handleShare}
            className="px-3 py-1 text-sm rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition"
          >
            📤 Share
          </button>
        </div>
      )}

      {showCopyToast && (
        <div className="fixed bottom-5 left-1/2 -translate-x-1/2 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg z-50 animate-fade-in-out">
          ✓ Copied to clipboard!
        </div>
      )}

      {showShareModal && selectedVerse && (
        <ShareVerseModal
          verse={selectedVerse}
          onClose={() => {
            setShowShareModal(false);
            setSelectedVerse(null);
          }}
          onSuccess={(data) => {
            console.log('Verse shared successfully:', data);
            setShowShareModal(false);
            setSelectedVerse(null);
          }}
        />
      )}
    </div>
  );
};

export default BibleReader;