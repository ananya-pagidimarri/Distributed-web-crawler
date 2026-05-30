import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Mic, Camera, TrendingUp, LogOut, Clock, Hash, Building2, FileText, Filter, ArrowUpDown, Loader2, ExternalLink } from 'lucide-react';
import { toast } from 'react-hot-toast';
import Tesseract from 'tesseract.js';
import { useVoiceSearch } from '../hooks/useVoiceSearch';

const TYPE_ICONS = {
  keyword: <Search className="h-3.5 w-3.5 text-slate-400" />,
  semantic: <Hash className="h-3.5 w-3.5 text-blue-400" />,
  entity: <Building2 className="h-3.5 w-3.5 text-purple-400" />,
  title: <FileText className="h-3.5 w-3.5 text-emerald-400" />
};

const TYPE_LABELS = {
  keyword: null,
  semantic: 'topic',
  entity: 'company / tech',
  title: 'page'
};

export default function Home({ user, logout }) {
  const [Query, setQuery] = useState('');
  const [Suggestions, setSuggestions] = useState([]);
  const [ShowSuggestions, setShowSuggestions] = useState(false);
  const [SuggestionsLoading, setSuggestionsLoading] = useState(false);
  const [Trending, setTrending] = useState([]);
  const [SearchHistory, setSearchHistory] = useState([]);
  const [RelatedSearches, setRelatedSearches] = useState([]);
  const [ActiveSuggestionIndex, setActiveSuggestionIndex] = useState(-1);
  const debounceRef = useRef(null);

  // Search Results State
  const [Results, setResults] = useState([]);
  const [TotalPages, setTotalPages] = useState(0);
  const [CurrentPage, setCurrentPage] = useState(1);
  const [TotalResults, setTotalResults] = useState(0);
  const [IsLoading, setIsLoading] = useState(false);
  const [HasSearched, setHasSearched] = useState(false);
  const [TimeTaken, setTimeTaken] = useState(0);

  // Filters
  const [AvailableDomains, setAvailableDomains] = useState([]);
  const [AvailableCategories, setAvailableCategories] = useState([]);
  const [CategoryFilter, setCategoryFilter] = useState('');
  const [DomainFilter, setDomainFilter] = useState('');
  const [SortBy, setSortBy] = useState('relevance');

  const navigate = useNavigate();
  const searchInputRef = useRef(null);
  const fileInputRef = useRef(null);
  const [isOcrProcessing, setIsOcrProcessing] = useState(false);

  const { isListening, startListening } = useVoiceSearch((transcript) => {
    // Speech-to-text often adds trailing periods or punctuation. Strip them out.
    const cleanTranscript = transcript.replace(/[.,!?]+$/, '').trim();
    setQuery(cleanTranscript);
    executeSearch(cleanTranscript, 1);
  });

  useEffect(() => {
    const savedHistory = JSON.parse(localStorage.getItem('crawlx_search_history') || '[]');
    setSearchHistory(savedHistory);

    axios.get('/api/search/trending')
      .then(res => setTrending(res.data))
      .catch(console.error);
  }, []);

  const saveHistory = (q) => {
    if (!q.trim()) return;
    const current = JSON.parse(localStorage.getItem('crawlx_search_history') || '[]');
    const updated = [q, ...current.filter(item => item !== q)].slice(0, 5);
    localStorage.setItem('crawlx_search_history', JSON.stringify(updated));
    setSearchHistory(updated);
  };

  const fetchSuggestions = async (q) => {
    if (q.length < 2) { setSuggestions([]); return; }
    setSuggestionsLoading(true);
    try {
      const res = await axios.get(`/api/search/suggest?q=${encodeURIComponent(q)}`);
      setSuggestions(res.data);
    } catch (e) {
      console.error('Suggestions error', e);
    } finally {
      setSuggestionsLoading(false);
    }
  };

  const handleQueryChange = (e) => {
    const val = e.target.value;
    setQuery(val);
    setShowSuggestions(true);
    setActiveSuggestionIndex(-1);
    
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      if (val.trim()) fetchSuggestions(val.trim());
      else setSuggestions([]);
    }, 250);
  };

  const executeSearch = async (searchQuery, page = 1) => {
    if (!user) {
      toast.error('You must sign in to search on CrawlX.');
      navigate('/login');
      return;
    }
    
    if (!searchQuery.trim()) return;
    setShowSuggestions(false);
    setIsLoading(true);
    setHasSearched(true);
    saveHistory(searchQuery);
    
    const startTime = performance.now();
    try {
      const url = `/api/search?q=${encodeURIComponent(searchQuery)}&page=${page}&limit=10&domain=${DomainFilter}&category=${CategoryFilter}&sortBy=${SortBy}`;
      const res = await axios.get(url);
      
      setResults(res.data.results);
      setTotalPages(res.data.totalPages);
      setCurrentPage(res.data.currentPage);
      setTotalResults(res.data.totalResults);
      setAvailableDomains(res.data.availableDomains || []);
      setAvailableCategories(res.data.availableCategories || []);

      const endTime = performance.now();
      setTimeTaken(((endTime - startTime) / 1000).toFixed(2));

      // Fetch related searches
      const related = await axios.get(`/api/search/related?q=${encodeURIComponent(searchQuery)}&limit=5`);
      setRelatedSearches(related.data);
    } catch (err) {
      console.error(err);
      toast.error('Search failed.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    executeSearch(Query, 1);
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsOcrProcessing(true);
    const toastId = toast.loading('Extracting text from image (Lens)...');
    
    try {
      const { data: { text } } = await Tesseract.recognize(file, 'eng');
      const cleanText = text.replace(/(\r\n|\n|\r)/gm, ' ').trim();
      
      if (!cleanText) {
        toast.error('No readable text found in this image.', { id: toastId });
        return;
      }
      
      // Use the first 50 chars for the search query to keep it clean
      const searchQuery = cleanText.substring(0, 50).trim();
      
      toast.success(`Extracted: "${searchQuery}"`, { id: toastId });
      setQuery(searchQuery);
      executeSearch(searchQuery, 1);
    } catch (err) {
      console.error(err);
      toast.error('Failed to extract text from image.', { id: toastId });
    } finally {
      setIsOcrProcessing(false);
      if (fileInputRef.current) fileInputRef.current.value = ''; // Reset input
    }
  };

  const handleKeyDown = (e) => {
    if (!ShowSuggestions || Suggestions.length === 0) {
      if (e.key === 'Enter') executeSearch(Query, 1);
      return;
    }
  
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveSuggestionIndex(prev => prev < Suggestions.length - 1 ? prev + 1 : 0);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveSuggestionIndex(prev => prev > 0 ? prev - 1 : Suggestions.length - 1);
    } else if (e.key === 'Enter') {
      if (ActiveSuggestionIndex >= 0) {
        e.preventDefault();
        suggestionClick(Suggestions[ActiveSuggestionIndex].text);
        setActiveSuggestionIndex(-1);
      } else {
        executeSearch(Query, 1);
      }
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
      setActiveSuggestionIndex(-1);
    }
  };

  const suggestionClick = (text) => {
    setQuery(text);
    executeSearch(text, 1);
  };

  return (
    <div className="min-h-screen bg-[#0a0f1c] text-white flex flex-col font-sans relative overflow-hidden">
      
      {/* Dynamic Background Effects */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-500/10 blur-[120px] rounded-full animate-pulse"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-cyan-500/10 blur-[120px] rounded-full animate-pulse" style={{ animationDelay: '2s' }}></div>
        <div className="absolute top-[40%] left-[50%] translate-x-[-50%] w-[60%] h-[20%] bg-indigo-500/5 blur-[100px] rounded-full"></div>
        {/* Subtle dot pattern */}
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMiIgY3k9IjIiIHI9IjEiIGZpbGw9InJnYmEoMjU1LDI1NSwyNTUsMC4wMykiLz48L3N2Zz4=')] [mask-image:radial-gradient(ellipse_at_center,black_40%,transparent_80%)]"></div>
      </div>
      
      {/* Top Navigation */}
      <header className="relative z-20 flex justify-end items-center p-6 gap-6 text-sm">
        <Link to="/about" className="hover:underline opacity-80 hover:opacity-100">About</Link>
        <Link to="/admin/login" className="hover:underline opacity-80 hover:opacity-100 mr-2 text-cyan-400">Admin</Link>
        
        {user ? (
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-cyan-700 flex items-center justify-center text-sm font-semibold uppercase cursor-pointer select-none" title={user.email}>
              {user.name.charAt(0)}
            </div>
            <button onClick={logout} className="text-slate-400 hover:text-white" title="Sign Out">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <Link to="/login" className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white px-7 py-2.5 rounded-full font-medium hover:shadow-[0_0_15px_rgba(34,211,238,0.4)] transition-all transform hover:scale-105">
            Sign in
          </Link>
        )}
      </header>

      <main className={`flex-1 flex flex-col w-full px-4 ${HasSearched ? 'mt-4 max-w-4xl mx-auto' : 'items-center justify-center mt-[-8vh]'}`}>
        
        {/* Logo */}
        <div className={`select-none transition-all duration-500 relative z-20 ${HasSearched ? 'mb-6 text-3xl' : 'mb-10 text-[96px] tracking-tight hover:scale-105 transform cursor-default'}`} style={{ fontFamily: "'Product Sans', 'Inter', sans-serif", fontWeight: 700 }}>
          <span className="text-blue-500 drop-shadow-[0_0_15px_rgba(59,130,246,0.3)]">C</span>
          <span className="text-red-500 drop-shadow-[0_0_15px_rgba(239,68,68,0.3)]">r</span>
          <span className="text-amber-500 drop-shadow-[0_0_15px_rgba(245,158,11,0.3)]">a</span>
          <span className="text-blue-500 drop-shadow-[0_0_15px_rgba(59,130,246,0.3)]">w</span>
          <span className="text-emerald-500 drop-shadow-[0_0_15px_rgba(16,185,129,0.3)]">l</span>
          <span className="text-red-500 drop-shadow-[0_0_15px_rgba(239,68,68,0.3)]">X</span>
        </div>

        {/* Search Bar Wrapper */}
        <div className={`w-full relative transition-all duration-500 ${HasSearched ? 'max-w-2xl' : 'max-w-[640px]'}`}>
          <form onSubmit={handleSearch} className="relative z-20 group">
            <div className={`flex flex-col w-full bg-slate-900/50 backdrop-blur-xl border border-slate-700/50 group-hover:bg-slate-800/80 group-hover:border-slate-600 focus-within:bg-slate-800 focus-within:border-cyan-500/50 focus-within:shadow-[0_0_30px_rgba(6,182,212,0.15)] ${ShowSuggestions ? 'rounded-t-3xl rounded-b-none border-b-transparent' : 'rounded-full'} transition-all relative z-20`}>
              <div className="flex items-center px-4 py-3">
                <Search className="w-5 h-5 text-[#9aa0a6] mr-3" />
                <input
                  ref={searchInputRef}
                  type="text"
                  className="flex-1 bg-transparent outline-none text-white text-[16px]"
                  value={Query}
                  onChange={handleQueryChange}
                  onKeyDown={handleKeyDown}
                  onFocus={() => { if (Suggestions.length > 0 || SearchHistory.length > 0) setShowSuggestions(true); }}
                  onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                  autoFocus={!HasSearched}
                />
                <div className="flex items-center gap-4 ml-3">
                  <Mic onClick={startListening} className={`w-5 h-5 cursor-pointer transition-colors ${isListening ? 'text-red-500 animate-pulse' : 'text-[#8ab4f8]'}`} />
                  
                  {isOcrProcessing ? (
                    <Loader2 className="w-5 h-5 text-[#8ab4f8] animate-spin" />
                  ) : (
                    <Camera 
                      className="w-5 h-5 text-[#8ab4f8] cursor-pointer hover:text-white transition-colors" 
                      onClick={() => fileInputRef.current?.click()}
                    />
                  )}
                  
                  {/* Hidden File Input for Visual Search */}
                  <input 
                    type="file" 
                    accept="image/*" 
                    ref={fileInputRef} 
                    className="hidden" 
                    onChange={handleImageUpload} 
                  />
                </div>
              </div>

              {/* Autocomplete Dropdown using Framer Motion */}
              <AnimatePresence>
                {ShowSuggestions && (
                  <motion.div
                    initial={{ opacity: 0, y: -8, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -8, scale: 0.98 }}
                    transition={{ duration: 0.15, ease: 'easeOut' }}
                    className="absolute left-[-1px] right-[-1px] top-full bg-[#303134] border border-t-0 border-[#5f6368] rounded-b-3xl shadow-2xl overflow-hidden z-50"
                  >

                    {/* RECENT SEARCHES — shown when input empty */}
                    {!Query.trim() && SearchHistory.length > 0 && (
                      <div className="py-2 bg-slate-800/95 backdrop-blur-xl">
                        <div className="px-5 py-2 flex items-center gap-2 text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                          <Clock className="h-3 w-3" />
                          Recent Searches
                        </div>
                        {SearchHistory.slice(0, 5).map((s, i) => (
                          <div
                            key={i}
                            onClick={() => suggestionClick(s)}
                            className="px-4 py-2.5 hover:bg-[#3c4043] cursor-pointer flex items-center justify-between group transition-colors"
                          >
                            <div className="flex items-center gap-3">
                              <Clock className="h-3.5 w-3.5 text-[#9aa0a6]" />
                              <span className="text-sm text-white">{s}</span>
                            </div>
                            <ExternalLink className="h-3 w-3 text-[#9aa0a6] opacity-0 group-hover:opacity-100 transition-opacity" />
                          </div>
                        ))}
                      </div>
                    )}

                    {/* TRENDING — shown when input empty and no history */}
                    {!Query.trim() && SearchHistory.length === 0 && Trending.length > 0 && (
                      <div className="py-2">
                        <div className="px-4 py-2 flex items-center gap-2 text-[10px] font-bold text-[#9aa0a6] uppercase tracking-widest">
                          <TrendingUp className="h-3 w-3" />
                          Trending
                        </div>
                        <div className="px-4 pb-3 flex flex-wrap gap-2">
                          {Trending.map((t, i) => (
                            <button
                              key={i}
                              type="button"
                              onClick={() => suggestionClick(t.keyword)}
                              className="px-2.5 py-1 text-xs bg-[#3c4043] hover:bg-[#4285f4]/20 hover:text-[#8ab4f8] border border-[#5f6368] hover:border-[#8ab4f8]/50 rounded-full transition-colors"
                            >
                              {t.keyword}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* LIVE SUGGESTIONS — shown when typing */}
                    {Query.trim() && (
                      <div className="py-2">
                        {SuggestionsLoading && (
                          <div className="px-4 py-3 flex items-center gap-2 text-sm text-[#9aa0a6]">
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            Finding suggestions...
                          </div>
                        )}

                        {!SuggestionsLoading && Suggestions.length > 0 && (
                          <>
                            {['keyword', 'semantic', 'entity', 'title'].map(type => {
                              const group = Suggestions.filter(s => s.type === type);
                              if (group.length === 0) return null;
                              return (
                                <div key={type}>
                                  {group.map((s, i) => {
                                    const globalIndex = Suggestions.indexOf(s);
                                    return (
                                      <div
                                        key={globalIndex}
                                        onClick={() => suggestionClick(s.text)}
                                        className={`px-4 py-2.5 cursor-pointer flex items-center justify-between group transition-colors ${globalIndex === ActiveSuggestionIndex ? 'bg-[#4285f4]/20' : 'hover:bg-[#3c4043]'}`}
                                      >
                                        <div className="flex items-center gap-3 min-w-0">
                                          {TYPE_ICONS[s.type]}
                                          <span className="text-sm text-white truncate">
                                            {(() => {
                                              const idx = s.text.toLowerCase().indexOf(Query.toLowerCase());
                                              if (idx === -1) return s.text;
                                              return (
                                                <>
                                                  <span className="text-white/60">{s.text.slice(0, idx)}</span>
                                                  <span className="text-white font-semibold">{s.text.slice(idx, idx + Query.length)}</span>
                                                  <span className="text-white/60">{s.text.slice(idx + Query.length)}</span>
                                                </>
                                              );
                                            })()}
                                          </span>
                                        </div>
                                        <div className="flex items-center gap-2 flex-shrink-0">
                                          {s.domain && (
                                            <span className="text-[10px] text-[#9aa0a6] hidden group-hover:block">
                                              {s.domain}
                                            </span>
                                          )}
                                          {TYPE_LABELS[s.type] && (
                                            <span className="text-[10px] px-1.5 py-0.5 bg-[#3c4043] rounded text-[#9aa0a6]">
                                              {TYPE_LABELS[s.type]}
                                            </span>
                                          )}
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              );
                            })}
                          </>
                        )}

                        {!SuggestionsLoading && Suggestions.length === 0 && Query.length >= 2 && (
                          <div className="px-4 py-3 text-sm text-[#9aa0a6]">
                            No suggestions. Press Enter to search.
                          </div>
                        )}
                        <div className="px-4 py-2 border-t border-[#5f6368] flex items-center gap-2 text-[11px] text-[#9aa0a6]">
                          <Search className="h-3 w-3" />
                          Press Enter to search for <span className="font-medium text-white">"{Query}"</span>
                        </div>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </form>

          {/* Quick Action Chips (Only shown before search) */}
          {!HasSearched && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }} 
              animate={{ opacity: 1, y: 0 }} 
              transition={{ delay: 0.2 }}
              className="flex justify-center flex-wrap gap-3 mt-8 relative z-20"
            >
              {['React Hooks', 'Machine Learning', 'Python Tutorials', 'System Design'].map(topic => (
                <button
                  key={topic}
                  type="button"
                  onClick={() => suggestionClick(topic)}
                  className="px-4 py-2 bg-slate-800/40 hover:bg-slate-700/60 border border-slate-700/50 hover:border-cyan-500/30 text-sm text-slate-300 rounded-full transition-all hover:-translate-y-0.5 backdrop-blur-md"
                >
                  <Search className="w-3.5 h-3.5 inline-block mr-2 opacity-50" />
                  {topic}
                </button>
              ))}
            </motion.div>
          )}
        </div>

        {/* SEARCH RESULTS SECTION */}
        {HasSearched && (
          <div className="w-full mt-6 relative z-20">
            {!IsLoading && (
              <p className="text-sm text-[#9aa0a6] mb-4">
                About {TotalResults} results ({TimeTaken} seconds)
              </p>
            )}

            {!IsLoading && Results.length > 0 && (
              <div className="flex flex-wrap items-center gap-3 mb-6 pb-4 border-b border-[#3c4043]">
                {/* Sort buttons */}
                <div className="flex items-center gap-1 text-xs">
                  <span className="text-[#9aa0a6] mr-1">Sort:</span>
                  {['relevance', 'date'].map(s => (
                    <button key={s}
                      onClick={() => { setSortBy(s); executeSearch(Query, 1); }}
                      className={`px-2.5 py-1 rounded-full border transition-colors ${
                        SortBy === s
                          ? 'bg-[#8ab4f8]/10 text-[#8ab4f8] border-[#8ab4f8]/30'
                          : 'border-[#5f6368] text-[#9aa0a6] hover:bg-[#303134]'
                      }`}>
                      {s.charAt(0).toUpperCase() + s.slice(1)}
                    </button>
                  ))}
                </div>

                {/* Category filter chips */}
                {AvailableCategories.length > 0 && (
                  <div className="flex items-center gap-1 flex-wrap">
                    <span className="text-xs text-[#9aa0a6]">Type:</span>
                    <button
                      onClick={() => { setCategoryFilter(''); executeSearch(Query, 1); }}
                      className={`px-2.5 py-1 rounded-full border text-xs transition-colors ${
                        !CategoryFilter
                          ? 'bg-[#8ab4f8]/10 text-[#8ab4f8] border-[#8ab4f8]/30'
                          : 'border-[#5f6368] text-[#9aa0a6] hover:bg-[#303134]'
                      }`}>
                      All
                    </button>
                    {AvailableCategories.slice(0, 5).map(cat => (
                      <button key={cat}
                        onClick={() => { setCategoryFilter(cat); executeSearch(Query, 1); }}
                        className={`px-2.5 py-1 rounded-full border text-xs transition-colors ${
                          CategoryFilter === cat
                            ? 'bg-[#8ab4f8]/10 text-[#8ab4f8] border-[#8ab4f8]/30'
                            : 'border-[#5f6368] text-[#9aa0a6] hover:bg-[#303134]'
                        }`}>
                        {cat}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {IsLoading ? (
              <div className="flex justify-center mt-12">
                <div className="w-8 h-8 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : (
              <div className="space-y-8 max-w-2xl">
                {Results.map((result) => {
                  let displayDomain = result.Domain;
                  try {
                    if (!displayDomain) displayDomain = new URL(result.url).hostname.replace('www.', '');
                  } catch(e) {}
                  
                  const displayTitle = (result.Title && result.Title !== 'Untitled') ? result.Title : result.url;

                  return (
                  <div key={result._id} className="group">
                    <div className="flex items-center gap-3 mb-1">
                      <div className="w-7 h-7 bg-[#303134] rounded-full flex items-center justify-center border border-[#3c4043] overflow-hidden">
                        {displayDomain && <img src={`https://www.google.com/s2/favicons?domain=${displayDomain}&sz=32`} alt="" className="w-4 h-4 rounded-full" />}
                      </div>
                      <div className="flex flex-col text-sm">
                        <span className="text-[#dadce0] truncate max-w-[400px] font-medium">{displayDomain}</span>
                        <a href={result.url} className="text-[#9aa0a6] hover:underline truncate max-w-[400px]">{result.url}</a>
                      </div>
                    </div>
                    <a href={result.url} target="_blank" rel="noopener noreferrer">
                      <h3 className="text-xl text-[#8ab4f8] hover:underline font-medium mb-1.5 truncate">{displayTitle}</h3>
                    </a>
                    
                    {/* Semantic Tags */}
                    {result.SemanticSearchTags && result.SemanticSearchTags.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mb-2">
                        {result.SemanticSearchTags.map((tag, idx) => (
                          <span key={idx} className="px-1.5 py-0.5 bg-[#8ab4f8]/10 text-[#8ab4f8] text-[10px] rounded">
                            {tag}
                          </span>
                        ))}
                        {result.CompanyCategory && result.CompanyCategory.map((cat, idx) => (
                          <span key={`cat-${idx}`} className="px-1.5 py-0.5 bg-purple-500/10 text-purple-400 text-[10px] rounded">
                            {cat}
                          </span>
                        ))}
                      </div>
                    )}
                    
                    <p className="text-[#bdc1c6] text-sm leading-relaxed">{result.Description}</p>

                    {/* Clickable Keywords */}
                    {result.Keywords && result.Keywords.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {result.Keywords.slice(0, 6).map((kw, idx) => (
                          <button
                            key={idx}
                            onClick={() => { setQuery(kw); executeSearch(kw, 1); }}
                            className="px-2 py-0.5 text-[10px] text-[#9aa0a6] bg-transparent border border-[#5f6368] rounded hover:border-[#8ab4f8]/40 hover:text-[#8ab4f8] hover:bg-[#8ab4f8]/5 transition-colors"
                          >
                            {kw}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  );
                })}
              </div>
            )}

            {/* No Results Fallback */}
            {Results.length === 0 && HasSearched && !IsLoading && (
              <div className="py-12 border border-dashed border-[#5f6368] rounded-2xl text-center px-6 max-w-2xl mt-4">
                <Search className="h-10 w-10 text-[#9aa0a6] mx-auto mb-4 opacity-40" />
                <p className="text-white font-medium mb-1">
                  No results found for "{Query}"
                </p>
                <p className="text-sm text-[#9aa0a6] mb-6">
                  Try adjusting your keywords or use broader terms.
                </p>

                {Query.split(' ').length > 1 && (
                  <div className="flex flex-wrap justify-center gap-2">
                    <span className="text-xs text-[#9aa0a6] mt-1">Try:</span>
                    {Query.split(' ').filter(w => w.length > 2).map((word, i) => (
                      <button key={i}
                        onClick={() => { setQuery(word); executeSearch(word, 1); }}
                        className="text-xs px-3 py-1 bg-[#8ab4f8]/10 text-[#8ab4f8] rounded-full hover:bg-[#8ab4f8]/20 transition-colors">
                        {word}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Related Searches */}
            {!IsLoading && RelatedSearches.length > 0 && (
              <div className="mt-8 pt-6 border-t border-[#3c4043] max-w-2xl mb-8">
                <p className="text-xs font-semibold text-[#9aa0a6] uppercase tracking-wider mb-3">
                  Related Searches
                </p>
                <div className="flex flex-wrap gap-2">
                  {RelatedSearches.map((r, i) => (
                    <button
                      key={i}
                      onClick={() => { setQuery(r); executeSearch(r, 1); }}
                      className="px-3 py-1.5 text-sm bg-[#303134] border border-[#5f6368] rounded-full hover:border-[#8ab4f8]/40 hover:bg-[#8ab4f8]/5 hover:text-[#8ab4f8] transition-colors flex items-center gap-1.5"
                    >
                      <Search className="h-3 w-3" />
                      {r}
                    </button>
                  ))}
                </div>
              </div>
            )}
            
            {/* Pagination */}
            {!IsLoading && TotalPages > 1 && (
              <div className="flex gap-2 mt-8 mb-16 max-w-2xl justify-center">
                {Array.from({ length: Math.min(TotalPages, 10) }, (_, i) => i + 1).map(page => (
                  <button
                    key={page}
                    onClick={() => { executeSearch(Query, page); window.scrollTo(0,0); }}
                    className={`w-8 h-8 flex items-center justify-center rounded-full text-sm font-medium transition-colors ${
                      CurrentPage === page 
                        ? 'bg-[#8ab4f8] text-[#202124]' 
                        : 'text-[#8ab4f8] hover:bg-[#303134]'
                    }`}
                  >
                    {page}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
