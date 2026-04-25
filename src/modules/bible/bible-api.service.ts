// src/modules/bible/bible-api.service.ts
import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';

export interface BibleVerseResponse {
  reference: string;
  book: string;
  chapter: number;
  verse: number;
  verseEnd?: number;
  text: string;
  translation: string;
  translationCode: string;
}

export interface BibleSearchResult {
  verses: BibleVerseResponse[];
  passage: string;
}

// Add these interfaces for API response types
interface ParameterizedVerse {
  verse: number;
  text: string;
}

interface ParameterizedAPIResponse {
  verses?: ParameterizedVerse[];
  translation?: any;
}

interface RandomVerseResponse {
  book_id: string;
  chapter: number;
  verse: number;
  text: string;
}

interface UserInputVerse {
  book_name?: string;
  book?: string;
  chapter: number;
  verse: number;
  text: string;
}

interface UserInputAPIResponse {
  verses?: UserInputVerse[];
  reference?: string;
  text?: string;
  translation?: {
    name?: string;
    abbreviation?: string;
  };
}

@Injectable()
export class BibleApiService {
  private readonly logger = new Logger(BibleApiService.name);
  private readonly baseUrl = 'https://bible-api.com';
  
  // Book ID mapping for Parameterized API
  private readonly bookIdMap: { [key: string]: string } = {
    // Old Testament
    'Genesis': 'GEN', 'Exodus': 'EXO', 'Leviticus': 'LEV', 'Numbers': 'NUM',
    'Deuteronomy': 'DEU', 'Joshua': 'JOS', 'Judges': 'JDG', 'Ruth': 'RUT',
    '1 Samuel': '1SA', '2 Samuel': '2SA', '1 Kings': '1KI', '2 Kings': '2KI',
    '1 Chronicles': '1CH', '2 Chronicles': '2CH', 'Ezra': 'EZR', 'Nehemiah': 'NEH',
    'Esther': 'EST', 'Job': 'JOB', 'Psalms': 'PSA', 'Proverbs': 'PRO',
    'Ecclesiastes': 'ECC', 'Song of Solomon': 'SNG', 'Isaiah': 'ISA',
    'Jeremiah': 'JER', 'Lamentations': 'LAM', 'Ezekiel': 'EZK', 'Daniel': 'DAN',
    'Hosea': 'HOS', 'Joel': 'JOL', 'Amos': 'AMO', 'Obadiah': 'OBA',
    'Jonah': 'JON', 'Micah': 'MIC', 'Nahum': 'NAM', 'Habakkuk': 'HAB',
    'Zephaniah': 'ZEP', 'Haggai': 'HAG', 'Zechariah': 'ZEC', 'Malachi': 'MAL',
    
    // New Testament
    'Matthew': 'MAT', 'Mark': 'MRK', 'Luke': 'LUK', 'John': 'JHN',
    'Acts': 'ACT', 'Romans': 'ROM', '1 Corinthians': '1CO', '2 Corinthians': '2CO',
    'Galatians': 'GAL', 'Ephesians': 'EPH', 'Philippians': 'PHP', 'Colossians': 'COL',
    '1 Thessalonians': '1TH', '2 Thessalonians': '2TH', '1 Timothy': '1TI',
    '2 Timothy': '2TI', 'Titus': 'TIT', 'Philemon': 'PHM', 'Hebrews': 'HEB',
    'James': 'JAS', '1 Peter': '1PE', '2 Peter': '2PE', '1 John': '1JN',
    '2 John': '2JN', '3 John': '3JN', 'Jude': 'JUD', 'Revelation': 'REV'
  };

  // Reverse mapping for book name from ID
  private readonly reverseBookIdMap: { [key: string]: string } = {
    'GEN': 'Genesis', 'EXO': 'Exodus', 'LEV': 'Leviticus', 'NUM': 'Numbers',
    'DEU': 'Deuteronomy', 'JOS': 'Joshua', 'JDG': 'Judges', 'RUT': 'Ruth',
    '1SA': '1 Samuel', '2SA': '2 Samuel', '1KI': '1 Kings', '2KI': '2 Kings',
    '1CH': '1 Chronicles', '2CH': '2 Chronicles', 'EZR': 'Ezra', 'NEH': 'Nehemiah',
    'EST': 'Esther', 'JOB': 'Job', 'PSA': 'Psalms', 'PRO': 'Proverbs',
    'ECC': 'Ecclesiastes', 'SNG': 'Song of Solomon', 'ISA': 'Isaiah',
    'JER': 'Jeremiah', 'LAM': 'Lamentations', 'EZK': 'Ezekiel', 'DAN': 'Daniel',
    'HOS': 'Hosea', 'JOL': 'Joel', 'AMO': 'Amos', 'OBA': 'Obadiah',
    'JON': 'Jonah', 'MIC': 'Micah', 'NAM': 'Nahum', 'HAB': 'Habakkuk',
    'ZEP': 'Zephaniah', 'HAG': 'Haggai', 'ZEC': 'Zechariah', 'MAL': 'Malachi',
    'MAT': 'Matthew', 'MRK': 'Mark', 'LUK': 'Luke', 'JHN': 'John',
    'ACT': 'Acts', 'ROM': 'Romans', '1CO': '1 Corinthians', '2CO': '2 Corinthians',
    'GAL': 'Galatians', 'EPH': 'Ephesians', 'PHP': 'Philippians', 'COL': 'Colossians',
    '1TH': '1 Thessalonians', '2TH': '2 Thessalonians', '1TI': '1 Timothy',
    '2TI': '2 Timothy', 'TIT': 'Titus', 'PHM': 'Philemon', 'HEB': 'Hebrews',
    'JAS': 'James', '1PE': '1 Peter', '2PE': '2 Peter', '1JN': '1 John',
    '2JN': '2 John', '3JN': '3 John', 'JUD': 'Jude', 'REV': 'Revelation'
  };
  
  // List of popular verses to use as fallback for random endpoint
  private readonly popularVerses = [
    'John 3:16',
    'Psalm 23:1',
    'Romans 8:28',
    'Philippians 4:13',
    'Jeremiah 29:11',
    'Proverbs 3:5',
    'Isaiah 40:31',
    'Psalm 119:105',
    'Joshua 1:9',
    'Ephesians 2:8',
    'Matthew 11:28',
    '2 Corinthians 5:17',
    'Psalm 46:1',
    'Romans 12:2',
    'Galatians 5:22',
    'Philippians 4:6',
    '1 Peter 5:7',
    'Psalm 34:18',
    'Isaiah 41:10',
    'Romans 15:13'
  ];
  
  // Available translations (from documentation)
  private readonly availableTranslations = [
    { code: 'kjv', name: 'King James Version' },
    { code: 'esv', name: 'English Standard Version' },
    { code: 'web', name: 'World English Bible' },
    { code: 'bbe', name: 'Bible in Basic English' },
    { code: 'asv', name: 'American Standard Version' },
    { code: 'ylt', name: "Young's Literal Translation" },
    { code: 'darby', name: 'Darby Translation' },
  ];

  /**
   * Fetch a single verse by reference
   * Example: getVerse('John 3:16', 'kjv')
   */
  async getVerse(reference: string, translation: string = 'kjv'): Promise<BibleVerseResponse> {
    try {
      // Decode the reference first (in case it's already encoded)
      const cleanReference = decodeURIComponent(reference);
      // Encode the reference for URL
      const encodedRef = encodeURIComponent(cleanReference);
      const url = `${this.baseUrl}/${encodedRef}?translation=${translation}`;
      
      this.logger.log(`Fetching verse: ${url}`);
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new HttpException(
          `Bible API error: ${response.statusText}`,
          response.status
        );
      }
      
      const data = await response.json() as UserInputAPIResponse;
      
      // Parse the response
      return this.parseVerseResponse(data);
    } catch (error) {
      this.logger.error(`Error fetching verse: ${error.message}`);
      throw new HttpException(
        'Failed to fetch Bible verse',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Fetch multiple verses (passage)
   * Example: getPassage('John 3:16-18', 'kjv')
   */
  async getPassage(reference: string, translation: string = 'kjv'): Promise<BibleSearchResult> {
    try {
      const cleanReference = decodeURIComponent(reference);
      const encodedRef = encodeURIComponent(cleanReference);
      const url = `${this.baseUrl}/${encodedRef}?translation=${translation}`;
      
      this.logger.log(`Fetching passage: ${url}`);
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new HttpException(
          `Bible API error: ${response.statusText}`,
          response.status
        );
      }
      
      const data = await response.json() as UserInputAPIResponse;
      
      return this.parsePassageResponse(data);
    } catch (error) {
      this.logger.error(`Error fetching passage: ${error.message}`);
      throw new HttpException(
        'Failed to fetch Bible passage',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Fetch a complete chapter using the Parameterized API (more reliable)
   * Example: getCompleteChapter('kjv', 'LUK', 1) - returns all 80 verses of Luke 1
   */
  async getCompleteChapter(translation: string, bookId: string, chapter: number): Promise<BibleVerseResponse[]> {
    try {
      // Parameterized API: /data/TRANSLATION_ID/BOOK_ID/CHAPTER
      const url = `${this.baseUrl}/data/${translation}/${bookId}/${chapter}`;
      
      this.logger.log(`Fetching complete chapter: ${url}`);
      
      const response = await fetch(url);
      
      if (!response.ok) {
        // If chapter not found, try without chapter (for single-chapter books)
        if (response.status === 404) {
          this.logger.log(`Chapter ${chapter} not found, trying book-level fetch for single-chapter book`);
          return this.getSingleChapterBook(translation, bookId);
        }
        
        throw new HttpException(
          `Bible API error: ${response.statusText}`,
          response.status
        );
      }
      
      const data = await response.json() as ParameterizedAPIResponse;
      
      // The Parameterized API returns an object with a 'verses' array
      // Structure: { translation: {...}, verses: [...] }
      if (!data.verses || !Array.isArray(data.verses)) {
        this.logger.error('Invalid API response format - missing verses array');
        throw new Error('Invalid API response format');
      }
      
      this.logger.log(`API returned ${data.verses.length} verses for ${bookId} chapter ${chapter}`);
      
      // Parse the verses from the response
      return this.parseParameterizedResponse(data.verses, bookId, chapter);
      
    } catch (error) {
      this.logger.error(`Error fetching complete chapter: ${error.message}`);
      throw new HttpException(
        'Failed to fetch complete chapter',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Handle single-chapter books (Obadiah, Philemon, 2 John, 3 John, Jude)
   */
  private async getSingleChapterBook(translation: string, bookId: string): Promise<BibleVerseResponse[]> {
    try {
      // For single-chapter books, fetch the entire book
      const url = `${this.baseUrl}/data/${translation}/${bookId}`;
      
      this.logger.log(`Fetching single-chapter book: ${url}`);
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new HttpException(
          `Bible API error: ${response.statusText}`,
          response.status
        );
      }
      
      const data = await response.json() as ParameterizedAPIResponse;
      
      // The Parameterized API returns an object with a 'verses' array
      if (!data.verses || !Array.isArray(data.verses)) {
        this.logger.error('Invalid API response format - missing verses array');
        throw new Error('Invalid API response format');
      }
      
      this.logger.log(`API returned ${data.verses.length} verses for single-chapter book ${bookId}`);
      
      // For single-chapter books, all verses are chapter 1
      return this.parseParameterizedResponse(data.verses, bookId, 1);
      
    } catch (error) {
      this.logger.error(`Error fetching single-chapter book: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get random verse using Parameterized API (more reliable)
   */
  async getRandomVerseParameterized(translation: string = 'kjv', bookIds?: string): Promise<BibleVerseResponse> {
    try {
      let url = `${this.baseUrl}/data/${translation}/random`;
      if (bookIds) {
        url += `/${bookIds}`;
      }
      
      this.logger.log(`Fetching random verse (parameterized): ${url}`);
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new HttpException(
          `Bible API error: ${response.statusText}`,
          response.status
        );
      }
      
      const data = await response.json() as RandomVerseResponse;
      
      // The random endpoint returns a single verse object directly (not wrapped in verses array)
      return {
        reference: `${this.getBookNameFromId(data.book_id)} ${data.chapter}:${data.verse}`,
        book: this.getBookNameFromId(data.book_id),
        chapter: data.chapter,
        verse: data.verse,
        text: data.text,
        translation: this.getTranslationName(translation),
        translationCode: translation,
      };
    } catch (error) {
      this.logger.error(`Error fetching random verse (parameterized): ${error.message}`);
      throw error;
    }
  }

  /**
   * Get a random verse with fallback (keeping original for compatibility)
   */
  async getRandomVerse(translation: string = 'kjv'): Promise<BibleVerseResponse> {
    // Try the parameterized API first
    try {
      return await this.getRandomVerseParameterized(translation);
    } catch (error) {
      this.logger.warn(`Parameterized random API failed, trying original: ${error.message}`);
    }
    
    // Try the original random API
    try {
      const url = `${this.baseUrl}/random?translation=${translation}`;
      this.logger.log(`Fetching random verse (original): ${url}`);
      
      const response = await fetch(url);
      
      if (response.ok) {
        const data = await response.json() as UserInputAPIResponse;
        return this.parseVerseResponse(data);
      } else {
        this.logger.warn(`Random API returned ${response.status}, using fallback`);
      }
    } catch (error) {
      this.logger.warn(`Random API failed, using fallback: ${error.message}`);
    }
    
    // Fallback: pick a random verse from popular list
    const randomIndex = Math.floor(Math.random() * this.popularVerses.length);
    const randomReference = this.popularVerses[randomIndex];
    
    this.logger.log(`Using fallback random verse: ${randomReference}`);
    
    try {
      return await this.getVerse(randomReference, translation);
    } catch (fallbackError) {
      this.logger.error(`Fallback also failed: ${fallbackError.message}`);
      
      // Ultimate fallback - return hardcoded data
      return {
        reference: "John 3:16",
        book: "John",
        chapter: 3,
        verse: 16,
        text: "For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life.",
        translation: "King James Version",
        translationCode: "kjv"
      };
    }
  }

  /**
   * Search for verses by book, chapter, and verse range
   */
  async searchVerses(book: string, chapter: number, verseStart: number, verseEnd?: number, translation: string = 'kjv'): Promise<BibleSearchResult> {
    let reference = `${book} ${chapter}:${verseStart}`;
    if (verseEnd) {
      reference += `-${verseEnd}`;
    }
    
    return this.getPassage(reference, translation);
  }

  /**
   * Validate if a verse reference exists
   */
  async validateVerse(reference: string, translation: string = 'kjv'): Promise<boolean> {
    try {
      await this.getVerse(reference, translation);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get available translations
   */
  getTranslations() {
    return this.availableTranslations;
  }

  /**
   * Get book ID from book name
   */
  getBookId(bookName: string): string {
    // Handle common variations
    const normalizedBookName = bookName.trim();
    
    // Special cases
    if (normalizedBookName === 'Psalm' || normalizedBookName === 'Psalm ') {
      return 'PSA';
    }
    if (normalizedBookName === 'Song of Solomon' || normalizedBookName === 'Song of Songs') {
      return 'SNG';
    }
    if (normalizedBookName === 'Psalms') {
      return 'PSA';
    }
    
    return this.bookIdMap[normalizedBookName] || normalizedBookName.toUpperCase();
  }

  /**
   * Get book name from book ID
   */
  getBookNameFromId(bookId: string): string {
    return this.reverseBookIdMap[bookId] || bookId;
  }

  /**
   * Get translation name from code
   */
  private getTranslationName(code: string): string {
    const translation = this.availableTranslations.find(t => t.code === code);
    return translation?.name || 'King James Version';
  }

  /**
   * Parse response from Parameterized API
   * @param verses - The verses array from the API response
   * @param bookId - The book ID
   * @param chapter - The chapter number
   */
  private parseParameterizedResponse(verses: ParameterizedVerse[], bookId: string, chapter: number): BibleVerseResponse[] {
    this.logger.log(`Parsing ${verses.length} verses from Parameterized API`);
    
    // Log first few verses for debugging
    if (verses.length > 0) {
      this.logger.debug(`First verse: ${verses[0].verse} - ${verses[0].text.substring(0, 50)}...`);
      if (verses.length > 1) {
        this.logger.debug(`Last verse: ${verses[verses.length-1].verse} - ${verses[verses.length-1].text.substring(0, 50)}...`);
      }
    }
    
    return verses.map(verse => ({
      reference: `${this.getBookNameFromId(bookId)} ${chapter}:${verse.verse}`,
      book: this.getBookNameFromId(bookId),
      chapter: chapter,
      verse: verse.verse,
      text: verse.text,
      translation: 'King James Version',
      translationCode: 'kjv',
    }));
  }

  /**
   * Parse single verse response from User Input API
   */
  private parseVerseResponse(data: UserInputAPIResponse): BibleVerseResponse {
    // Handle different response formats
    let firstVerse: UserInputVerse;
    
    if (data.verses && Array.isArray(data.verses) && data.verses.length > 0) {
      // If we have a verses array, use the first one
      firstVerse = data.verses[0];
    } else {
      // Otherwise, treat the data itself as a verse object
      firstVerse = data as unknown as UserInputVerse;
    }
    
    return {
      reference: data.reference || `${firstVerse.book_name || firstVerse.book} ${firstVerse.chapter}:${firstVerse.verse}`,
      book: firstVerse.book_name || firstVerse.book || '',
      chapter: typeof firstVerse.chapter === 'number' ? firstVerse.chapter : parseInt(firstVerse.chapter as any),
      verse: typeof firstVerse.verse === 'number' ? firstVerse.verse : parseInt(firstVerse.verse as any),
      text: data.text || firstVerse.text,
      translation: data.translation?.name || 'King James Version',
      translationCode: data.translation?.abbreviation?.toLowerCase() || 'kjv',
    };
  }

  /**
   * Parse passage response from User Input API (multiple verses)
   */
  private parsePassageResponse(data: UserInputAPIResponse): BibleSearchResult {
    const verses = data.verses || [];
    
    const parsedVerses = verses.map((v: UserInputVerse) => ({
      reference: `${v.book_name || v.book} ${v.chapter}:${v.verse}`,
      book: v.book_name || v.book || '',
      chapter: typeof v.chapter === 'number' ? v.chapter : parseInt(v.chapter as any),
      verse: typeof v.verse === 'number' ? v.verse : parseInt(v.verse as any),
      text: v.text,
      translation: data.translation?.name || 'King James Version',
      translationCode: data.translation?.abbreviation?.toLowerCase() || 'kjv',
    }));
    
    return {
      verses: parsedVerses,
      passage: data.text || parsedVerses.map(v => v.text).join(' '),
    };
  }
}