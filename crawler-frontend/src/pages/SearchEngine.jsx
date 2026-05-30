import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import MainLayout from '../layouts/MainLayout';
import ResultCard from '../components/search/ResultCard';
import UrlSubmit from '../components/search/UrlSubmit';
import Pagination from '../components/search/Pagination';
import { SkeletonCard } from '../components/common/Loader';
import { updateSearchFilters, setSearchQuery } from '../redux/crawlerSlice';
import { Search, SlidersHorizontal, Trash2, HelpCircle, FileSearch, Sparkles, Download } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { downloadCSV } from '../utils/csvExporter';

const SUGGESTIONS = [
  'Googlebot rules',
  'Distributed systems',
  'Redis BullMQ queue',
  'Robots.txt Crawl-Delay',
  'Sitemaps validation schema',
  'Bloom Filter deduplication'
];

export default function SearchEngine({ user, logout }) {
  const dispatch = useDispatch();
  const searchQuery = useSelector((state) => state.crawler.searchQuery);
  const searchFilters = useSelector((state) => state.crawler.searchFilters);

  const [inputVal, setInputVal] = useState(searchQuery);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const resultsPerPage = 3;

  const [searchResults, setSearchResults] = useState([]);
  const [totalResults, setTotalResults] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // Fetch real data from backend
  const fetchSearchResults = async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams({
        q: searchQuery,
        domain: searchFilters.domain,
        type: searchFilters.type,
        sortBy: searchFilters.sortBy,
        page: page,
        limit: resultsPerPage
      });
      const res = await fetch(`/api/admin/indexed-pages?${queryParams.toString()}`, {
        headers: { 'Authorization': `Bearer ${user?.token}` }
      });
      const data = await res.json();
      if (data.success) {
        setSearchResults(data.results);
        setTotalResults(data.total);
        setTotalPages(data.totalPages || 1);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSearchResults();
  }, [searchQuery, searchFilters, page, user]);

  // Sync state if searchQuery is cleared globally
  useEffect(() => {
    setInputVal(searchQuery);
  }, [searchQuery]);

  // Handle autocomplete matching
  const matchingSuggestions = SUGGESTIONS.filter(item =>
    item.toLowerCase().includes(inputVal.toLowerCase()) && 
    inputVal.trim() !== '' &&
    item.toLowerCase() !== inputVal.toLowerCase()
  );

  const handleSearchSubmit = (e) => {
    if (e) e.preventDefault();
    setLoading(true);
    dispatch(setSearchQuery(inputVal.trim()));
    setPage(1);
    
    // Simulate high-speed index search delay (500ms)
    setTimeout(() => {
      setLoading(false);
      setShowSuggestions(false);
    }, 500);
  };

  const handleSuggestionClick = (val) => {
    setInputVal(val);
    dispatch(setSearchQuery(val));
    setPage(1);
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setShowSuggestions(false);
    }, 500);
  };

  const clearFilters = () => {
    dispatch(updateSearchFilters({
      domain: '',
      type: 'All',
      sortBy: 'score'
    }));
    setPage(1);
    toast.success('Search filters successfully reset.');
  };

  const handleExportCSV = () => {
    if (!searchResults.length) return toast.error('No results to export.');
    downloadCSV(searchResults, `crawlx_search_results_${Date.now()}.csv`);
    toast.success('Search results exported to CSV.');
  };

  return (
    <MainLayout user={user} logout={logout}>
      
      {/* Page Title Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
          <FileSearch className="text-cyan-400 w-7 h-7" />
          <span>Indexed Database Search Engine</span>
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Scrutinize and retrieve all sitemaps, domains, documents and URLs processed by the CrawlX nodes mesh.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Side: Search Bar and Results List */}
        <div className="lg:col-span-2 space-y-4">
          
          {/* Main Search Panel */}
          <div className="card-premium p-6 relative">
            <form onSubmit={handleSearchSubmit} className="space-y-4">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Enter keywords, domains, or URL matching paths..."
                  value={inputVal}
                  onChange={(e) => {
                    setInputVal(e.target.value);
                    setShowSuggestions(true);
                  }}
                  onFocus={() => setShowSuggestions(true)}
                  className="w-full bg-slate-950/80 border border-slate-800 text-white rounded-xl py-3.5 pl-4 pr-12 text-sm focus:outline-none focus:border-cyan-500 transition-all placeholder:text-slate-500 font-medium"
                />
                
                <button
                  type="submit"
                  className="absolute right-3 top-2.5 p-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 transition-colors cursor-pointer"
                >
                  <Search className="w-4 h-4" />
                </button>
              </div>

              {/* Autocomplete suggestions popup */}
              {showSuggestions && matchingSuggestions.length > 0 && (
                <>
                  <div 
                    className="fixed inset-0 z-10"
                    onClick={() => setShowSuggestions(false)}
                  ></div>
                  <div className="absolute left-6 right-6 mt-1.5 bg-slate-900 border border-slate-800 rounded-xl shadow-xl z-20 overflow-hidden divide-y divide-slate-950/20">
                    <div className="px-4 py-2 bg-slate-950/30 text-[9px] font-bold text-cyan-400 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                      <span>RECOMMENDED AUTOCOMPLETE MATCHES</span>
                    </div>
                    {matchingSuggestions.map((item, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleSuggestionClick(item)}
                        className="w-full text-left px-4 py-2.5 text-xs text-slate-300 hover:bg-slate-950/30 hover:text-white transition-colors cursor-pointer block font-medium"
                      >
                        {item}
                      </button>
                    ))}
                  </div>
                </>
              )}

              {/* Toggles and controls line */}
              <div className="flex items-center justify-between pt-1">
                <button
                  type="button"
                  onClick={() => setShowFilters(!showFilters)}
                  className={`flex items-center gap-1.5 text-xs font-semibold transition-colors cursor-pointer ${
                    showFilters || searchFilters.domain || searchFilters.type !== 'All' || searchFilters.sortBy !== 'score'
                      ? 'text-cyan-400' 
                      : 'text-slate-500 hover:text-slate-300'
                  }`}
                >
                  <SlidersHorizontal className="w-3.5 h-3.5" />
                  <span>Advanced Parameters</span>
                </button>

                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => {
                      setInputVal('');
                      dispatch(setSearchQuery(''));
                    }}
                    className="text-xs text-slate-500 hover:text-rose-400 font-semibold cursor-pointer"
                  >
                    Clear Query
                  </button>
                )}
              </div>

              {/* Advanced Parameter Filters Panel */}
              {showFilters && (
                <div className="p-4 bg-slate-950/40 border border-slate-800/80 rounded-xl grid grid-cols-1 sm:grid-cols-3 gap-4 animate-slide-down">
                  {/* Domain Restricted filter */}
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-500 mb-1.5 uppercase tracking-wider">Domain restrict</label>
                    <input
                      type="text"
                      placeholder="e.g. wikipedia.org"
                      value={searchFilters.domain}
                      onChange={(e) => dispatch(updateSearchFilters({ domain: e.target.value }))}
                      className="w-full bg-slate-900 border border-slate-800 text-slate-300 rounded-lg p-2 text-xs focus:outline-none focus:border-cyan-500"
                    />
                  </div>

                  {/* Document Type filter */}
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-500 mb-1.5 uppercase tracking-wider">Content type</label>
                    <select
                      value={searchFilters.type}
                      onChange={(e) => dispatch(updateSearchFilters({ type: e.target.value }))}
                      className="w-full bg-slate-900 border border-slate-800 text-slate-300 rounded-lg p-2 text-xs focus:outline-none focus:border-cyan-500"
                    >
                      <option value="All">All Formats</option>
                      <option value="HTML">HTML Documents</option>
                      <option value="PDF">PDF Documents</option>
                      <option value="Text">Plain Text Files</option>
                    </select>
                  </div>

                  {/* Sort filters */}
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-500 mb-1.5 uppercase tracking-wider">Sort indices by</label>
                    <select
                      value={searchFilters.sortBy}
                      onChange={(e) => dispatch(updateSearchFilters({ sortBy: e.target.value }))}
                      className="w-full bg-slate-900 border border-slate-800 text-slate-300 rounded-lg p-2 text-xs focus:outline-none focus:border-cyan-500"
                    >
                      <option value="score">Relevance Score</option>
                      <option value="date">Indexing Date</option>
                      <option value="size">Document Size</option>
                    </select>
                  </div>

                  {/* Reset Filters */}
                  <div className="sm:col-span-3 flex items-center justify-end border-t border-slate-900 pt-3">
                    <button
                      type="button"
                      onClick={clearFilters}
                      className="flex items-center gap-1 text-[10px] font-bold text-slate-500 hover:text-rose-400 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Reset Filters</span>
                    </button>
                  </div>
                </div>
              )}
            </form>
          </div>

          {/* Results List */}
          <div className="space-y-4">
            <div className="flex items-center justify-between text-xs text-slate-500 font-semibold px-2">
              <span>SEARCH RESULTS</span>
              <div className="flex items-center gap-3">
                <span>
                  Found {totalResults} records{' '}
                  {searchQuery ? `for "${searchQuery}"` : ''}
                </span>
                <button
                  onClick={handleExportCSV}
                  className="flex items-center gap-1 bg-slate-900 border border-slate-700 hover:bg-slate-800 text-cyan-400 px-2.5 py-1 rounded-md transition-colors cursor-pointer disabled:opacity-50"
                  disabled={searchResults.length === 0}
                >
                  <Download className="w-3.5 h-3.5" />
                  Export CSV
                </button>
              </div>
            </div>

            {loading ? (
              // Display skeleton cards when search executes
              <div className="space-y-4">
                <SkeletonCard />
                <SkeletonCard />
              </div>
            ) : searchResults.length === 0 ? (
              // Empty state
              <div className="card-premium p-12 text-center space-y-3">
                <HelpCircle className="w-12 h-12 text-slate-600 mx-auto" />
                <h3 className="text-sm font-bold text-slate-300">No matching search records discovered</h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Verify your query keywords, remove restricting filters, or seed a sitemap URL on the right panel to test live indexing.
                </p>
              </div>
            ) : (
              // Results cards list
              <div className="space-y-4">
                {searchResults.map((item, index) => (
                  <ResultCard key={index} data={item} />
                ))}

                {/* Paginations links */}
                <Pagination
                  currentPage={page}
                  totalPages={totalPages}
                  onPageChange={setPage}
                />
              </div>
            )}
          </div>

        </div>

        {/* Right Side: Url Frontier submission injector */}
        <div className="space-y-4">
          <UrlSubmit />
          
          {/* Helpful Tips Panel */}
          <div className="card-premium p-6 space-y-4 border border-cyan-900/10">
            <h3 className="text-xs font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-4 h-4" />
              <span>Indexing Sandbox Tips</span>
            </h3>
            
            <div className="space-y-3 text-xs text-slate-400 leading-relaxed font-medium">
              <p>
                1. <span className="font-semibold text-slate-300">Seed Injection:</span> Submit sitemaps URL to parse and crawl recursively. Sitemaps allow high-speed bulk discovery.
              </p>
              <p>
                2. <span className="font-semibold text-slate-300">Bloom deduplication:</span> Our simulator automatically flags duplicated hashes to prevent double crawling indices.
              </p>
              <p>
                3. <span className="font-semibold text-slate-300">Autocomplete triggers:</span> Try clicking autocomplete suggestions to view immediate sitemap indexing data in real-time.
              </p>
            </div>
          </div>
        </div>

      </div>

    </MainLayout>
  );
}