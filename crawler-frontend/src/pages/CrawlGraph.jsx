import React, { useState, useEffect, useRef, useCallback } from 'react';
import ForceGraph2D from 'react-force-graph-2d';
import { useSelector } from 'react-redux';
import MainLayout from '../layouts/MainLayout';
import { Network, ZoomIn, ZoomOut, Maximize } from 'lucide-react';

const depthColors = {
  0: '#00ffff', // cyan-400
  1: '#a855f7', // purple-500
  2: '#f97316', // orange-500
  3: '#3b82f6', // blue-500
  4: '#94a3b8'  // slate-400
};

export default function CrawlGraph({ user, logout }) {
  const [graphData, setGraphData] = useState({ nodes: [], links: [] });
  const [loading, setLoading] = useState(true);
  const [selectedNode, setSelectedNode] = useState(null);
  const [highlightNodes, setHighlightNodes] = useState(new Set());
  const [highlightLinks, setHighlightLinks] = useState(new Set());
  const fgRef = useRef();

  const fetchGraphData = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/graph', {
        headers: { 'Authorization': `Bearer ${user?.token}` }
      });
      const data = await res.json();
      if (data.success && data.pages) {
        const nodes = data.pages.map(page => ({
          id: page.url,
          depth: page.depth || 0,
          val: page.depth === 0 ? 3 : 1
        }));

        const nodeIds = new Set(nodes.map(n => n.id));
        
        // Find the root (shallowest) node for each domain
        const domainRoots = {}; 
        nodes.forEach(n => {
           try {
             const domain = new URL(n.id).hostname.replace('www.', '');
             if (!domainRoots[domain] || n.depth < domainRoots[domain].depth) {
                domainRoots[domain] = { id: n.id, depth: n.depth };
             }
           } catch(e) {}
        });

        const links = [];
        data.pages.forEach(page => {
          let hasLink = false;
          if (page.parentUrl && nodeIds.has(page.parentUrl) && nodeIds.has(page.url)) {
            links.push({ source: page.parentUrl, target: page.url });
            hasLink = true;
          }
          
          // Artificially connect orphaned pages to their domain root so they cluster together
          if (!hasLink) {
             try {
               const domain = new URL(page.url).hostname.replace('www.', '');
               // Connect to the domain root, unless this node IS the domain root
               if (domainRoots[domain] && domainRoots[domain].id !== page.url) {
                  links.push({ source: domainRoots[domain].id, target: page.url });
               }
             } catch(e) {}
          }
        });

        setGraphData({ nodes, links });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchGraphData();
  }, [fetchGraphData]);

  // Adjust d3 forces for a tight, neat structural cluster
  useEffect(() => {
    if (fgRef.current && !loading) {
      fgRef.current.d3Force('charge').strength(-50);
      fgRef.current.d3Force('link').distance(40);
    }
  }, [graphData, loading]);

  const handleZoomIn = () => {
    const currentZoom = fgRef.current.zoom();
    fgRef.current.zoom(currentZoom * 1.5, 400);
  };

  const handleZoomOut = () => {
    const currentZoom = fgRef.current.zoom();
    fgRef.current.zoom(currentZoom / 1.5, 400);
  };

  const handleFitView = () => {
    fgRef.current.zoomToFit(400, 50);
  };

  return (
    <MainLayout user={user} logout={logout}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <Network className="text-cyan-400 w-7 h-7" />
            <span>Crawl Depth Graph</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            {graphData.nodes.length} nodes • {graphData.links.length} edges
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <button onClick={handleZoomIn} className="p-2 rounded bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition-colors" title="Zoom In">
            <ZoomIn className="w-4 h-4" />
          </button>
          <button onClick={handleZoomOut} className="p-2 rounded bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition-colors" title="Zoom Out">
            <ZoomOut className="w-4 h-4" />
          </button>
          <button onClick={handleFitView} className="p-2 rounded bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition-colors" title="Fit View">
            <Maximize className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="mb-4 flex items-center gap-6 text-[10px] font-bold uppercase tracking-wider text-slate-400">
        <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full" style={{ background: depthColors[0] }}></span> Depth 0 (Seed)</div>
        <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full" style={{ background: depthColors[1] }}></span> Depth 1</div>
        <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full" style={{ background: depthColors[2] }}></span> Depth 2</div>
        <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full" style={{ background: depthColors[3] }}></span> Depth 3</div>
        <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full" style={{ background: depthColors[4] }}></span> Depth 4+</div>
      </div>

      <div className="card-premium overflow-hidden h-[600px] relative border border-slate-800/60 rounded-2xl bg-[#0f172a]">
        {loading && graphData.nodes.length === 0 ? (
          <div className="absolute inset-0 flex items-center justify-center text-slate-500 gap-3">
            <div className="w-5 h-5 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
            Loading cluster topology...
          </div>
        ) : (
          <ForceGraph2D
            ref={fgRef}
            graphData={graphData}
            onNodeClick={(node) => {
              // Calculate immediate neighborhood for highlighting
              const newHighlightNodes = new Set([node.id]);
              const newHighlightLinks = new Set();
              
              graphData.links.forEach(link => {
                const sourceId = typeof link.source === 'object' ? link.source.id : link.source;
                const targetId = typeof link.target === 'object' ? link.target.id : link.target;
                if (sourceId === node.id || targetId === node.id) {
                  newHighlightLinks.add(link);
                  newHighlightNodes.add(sourceId);
                  newHighlightNodes.add(targetId);
                }
              });

              setHighlightNodes(newHighlightNodes);
              setHighlightLinks(newHighlightLinks);
              setSelectedNode(node);
              
              // View the structure by zooming into the specific node's local cluster
              fgRef.current.centerAt(node.x, node.y, 800);
              fgRef.current.zoom(6, 800);
            }}
            onBackgroundClick={() => {
              setSelectedNode(null);
              setHighlightNodes(new Set());
              setHighlightLinks(new Set());
              fgRef.current.zoomToFit(400, 50);
            }}
            nodeLabel="id"
            nodeCanvasObject={(node, ctx, globalScale) => {
              const d = node.depth;
              const color = d >= 4 ? depthColors[4] : depthColors[d] || depthColors[4];
              const size = node.val + 2;
              
              // Fade out nodes that are not highlighted (if a selection exists)
              const isHighlighted = highlightNodes.size === 0 || highlightNodes.has(node.id);
              ctx.globalAlpha = isHighlighted ? 1 : 0.1;

              // Draw Node
              ctx.beginPath();
              ctx.arc(node.x, node.y, size, 0, 2 * Math.PI, false);
              ctx.fillStyle = color;
              ctx.fill();

              // Neat Structured Label (Plain text, no background)
              let displayLabel = node.id;
              try {
                displayLabel = displayLabel.replace(/^https?:\/\//, '');
                if (d !== 0) {
                  const url = new URL(node.id);
                  const pathParts = url.pathname.split('/').filter(Boolean);
                  displayLabel = pathParts.length > 0 ? pathParts[pathParts.length - 1] : url.hostname;
                }
                if (displayLabel.length > 30) displayLabel = displayLabel.substring(0, 30) + '...';
              } catch(e) {}

              const isSelected = selectedNode?.id === node.id;
              const fontSize = (isSelected ? 11 : 9) / globalScale;
              ctx.font = `${fontSize}px Sans-Serif`;
              ctx.textAlign = 'center';
              ctx.textBaseline = 'middle';
              
              // Plain text, white if selected, gray otherwise
              ctx.fillStyle = isSelected ? '#ffffff' : '#94a3b8';
              ctx.fillText(displayLabel, node.x, node.y + size + (2/globalScale) + fontSize/2);

              ctx.globalAlpha = 1; // Reset alpha for other draws
            }}
            nodeRelSize={4}
            linkColor={(link) => {
              if (highlightLinks.size === 0) return 'rgba(148, 163, 184, 0.2)';
              return highlightLinks.has(link) ? 'rgba(34, 211, 238, 0.6)' : 'rgba(148, 163, 184, 0.05)';
            }}
            linkWidth={1}
            linkDirectionalArrowLength={3.5}
            linkDirectionalArrowRelPos={1}
            backgroundColor="#0f172a"
            width={undefined}
            height={600}
          />
        )}
      </div>
    </MainLayout>
  );
}
