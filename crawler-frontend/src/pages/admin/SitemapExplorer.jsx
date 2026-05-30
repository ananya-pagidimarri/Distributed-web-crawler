import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FolderTree, ExternalLink, Link as LinkIcon, FileText, ChevronRight, ChevronDown } from 'lucide-react';
import MainLayout from '../../layouts/MainLayout';

const TreeNode = ({ node, level = 0 }) => {
  const [isOpen, setIsOpen] = useState(level < 2);
  const isFile = !!node.url;

  return (
    <div className="ml-4">
      <div 
        className={`flex items-center gap-2 py-1.5 cursor-pointer hover:bg-[#303134] rounded px-2 ${isFile ? 'text-[#8ab4f8]' : 'text-white'}`}
        onClick={() => !isFile && setIsOpen(!isOpen)}
      >
        {!isFile ? (
          isOpen ? <ChevronDown className="w-4 h-4 text-gray-400" /> : <ChevronRight className="w-4 h-4 text-gray-400" />
        ) : (
          <span className="w-4" /> // spacer
        )}
        
        {isFile ? <FileText className="w-4 h-4 text-[#8ab4f8]" /> : <FolderTree className="w-4 h-4 text-amber-500" />}
        
        <span className="text-sm font-medium">{node.name || '/'}</span>
        
        {isFile && (
          <a href={node.url} target="_blank" rel="noopener noreferrer" className="ml-auto opacity-0 hover:opacity-100 transition-opacity">
            <ExternalLink className="w-3 h-3 text-gray-400" />
          </a>
        )}
      </div>
      
      {isOpen && node.children && node.children.length > 0 && (
        <div className="border-l border-[#3c4043] ml-2 pl-2 mt-1">
          {node.children.map((child, idx) => (
            <TreeNode key={idx} node={child} level={level + 1} />
          ))}
        </div>
      )}
    </div>
  );
};

export default function SitemapExplorer({ user, logout }) {
  const [sitemaps, setSitemaps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeSitemap, setActiveSitemap] = useState(null);

  const fetchSitemaps = async () => {
    try {
      const token = localStorage.getItem('crawlx_admin_token');
      const res = await fetch('/api/admin/sitemaps', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setSitemaps(data.sitemaps);
        if (data.sitemaps.length > 0) setActiveSitemap(data.sitemaps[0]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSitemaps();
  }, []);

  if (loading) return <div className="p-8 text-gray-400">Loading sitemaps...</div>;

  return (
    <MainLayout user={user} logout={logout}>
      <div className="p-8 max-w-7xl mx-auto h-[calc(100vh-64px)] flex flex-col">
        <div className="flex items-center gap-3 mb-6">
        <FolderTree className="w-8 h-8 text-emerald-500" />
        <h1 className="text-2xl font-bold text-white">Sitemap Explorer</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 flex-1 min-h-0">
        {/* Sidebar: List of submitted sitemaps */}
        <div className="bg-[#202124] border border-[#3c4043] rounded-xl overflow-hidden flex flex-col">
          <div className="p-4 border-b border-[#3c4043] bg-[#2a2b2e]">
            <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wider">Submitted Sitemaps</h2>
          </div>
          <div className="overflow-y-auto flex-1 p-2">
            {sitemaps.length === 0 ? (
              <p className="p-4 text-sm text-gray-500 text-center">No sitemaps found. Submit a .xml seed URL.</p>
            ) : (
              sitemaps.map(sm => (
                <div 
                  key={sm._id}
                  onClick={() => setActiveSitemap(sm)}
                  className={`p-3 rounded-lg cursor-pointer mb-2 border transition-colors ${activeSitemap?._id === sm._id ? 'bg-[#303134] border-[#8ab4f8]/50' : 'bg-transparent border-transparent hover:bg-[#303134]/50'}`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-white font-medium">{sm.domain}</span>
                    <span className="text-xs bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded-full">{sm.totalUrls} URLs</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-gray-400">
                    <LinkIcon className="w-3 h-3" />
                    <span className="truncate">{sm.sitemapUrl}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Main Area: Tree View */}
        <div className="md:col-span-2 bg-[#202124] border border-[#3c4043] rounded-xl overflow-hidden flex flex-col">
          <div className="p-4 border-b border-[#3c4043] bg-[#2a2b2e] flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wider">
              {activeSitemap ? `Tree View: ${activeSitemap.domain}` : 'Select a sitemap'}
            </h2>
            {activeSitemap && (
              <a href={activeSitemap.sitemapUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-[#8ab4f8] hover:underline flex items-center gap-1">
                View Original XML <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>
          <div className="overflow-y-auto flex-1 p-6 font-mono bg-[#1e1e1e]">
            {activeSitemap ? (
              <TreeNode node={activeSitemap.tree} />
            ) : (
              <div className="h-full flex items-center justify-center text-gray-500">
                <FolderTree className="w-16 h-16 opacity-20 mb-4 mx-auto" />
              </div>
            )}
          </div>
        </div>
      </div>
      </div>
    </MainLayout>
  );
}
