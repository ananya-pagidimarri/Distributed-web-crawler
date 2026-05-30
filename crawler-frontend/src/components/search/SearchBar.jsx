import { useState } from 'react';
import { toast } from 'react-hot-toast';
import API from '../../services/api';
import ResultCard from './ResultCard';

function SearchBar() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);

  const searchData = async () => {
    if (!query.trim()) {
      toast.error('Enter a search query first.');
      return;
    }

    try {
      const response = await API.get(`/search?q=${encodeURIComponent(query)}`);
      setResults(response.data);
    } catch (error) {
      setResults([]);
      toast.error('Search endpoint is currently unreachable. Ensure the backend is online.');
    }
  };

  return (
    <div className='space-y-6'>
      <div className='flex flex-col gap-4 lg:flex-row'>
        <input
          type='text'
          placeholder='Search indexed pages'
          className='flex-1 rounded-3xl border border-slate-800 bg-slate-900/90 px-4 py-3 text-slate-100 outline-none focus:border-cyan-400'
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <button
          onClick={searchData}
          className='btn-primary rounded-3xl px-6 py-3 text-sm font-semibold'
        >
          Search
        </button>
      </div>

      <div className='rounded-3xl border border-slate-800 bg-slate-900/80 p-4 text-sm text-slate-400'>
        Tip: Add domain and date filters using the search toolbar once the backend is connected.
      </div>

      <div className='space-y-4'>
        {results.map((item, index) => (
          <ResultCard key={index} data={item} />
        ))}
      </div>
    </div>
  );
}

export default SearchBar;