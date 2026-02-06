'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { 
  Share2, 
  Search, 
  ZoomIn, 
  ZoomOut, 
  Maximize2,
  ArrowLeft,
  Sparkles,
  Image as ImageIcon,
  X
} from 'lucide-react';
import Link from 'next/link';
import * as d3 from 'd3';
import { 
  getAllCreativeItems,
  searchCreativeItems,
  type CreativeItem
} from '@/lib/storage';

// Types
interface Node extends d3.SimulationNodeDatum {
  id: string;
  name: string;
  count: number;
}

interface Link extends d3.SimulationLinkDatum<Node> {
  value: number;
}

interface GraphData {
  nodes: Node[];
  links: Link[];
}

export default function NetworkPage() {
  const [items, setItems] = useState<CreativeItem[]>([]);
  const [graphData, setGraphData] = useState<GraphData>({ nodes: [], links: [] });
  const [isLoading, setIsLoading] = useState(true);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [relatedItems, setRelatedItems] = useState<CreativeItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const svgRef = useRef<SVGSVGElement>(null);
  const simulationRef = useRef<d3.Simulation<Node, Link> | null>(null);

  // Extract keywords from text
  const extractKeywords = (text: string): string[] => {
    if (!text) return [];
    
    // Remove common stop words and split
    const stopWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'being']);
    
    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 2 && !stopWords.has(word));
  };

  // Build co-occurrence graph
  const buildGraph = useCallback((creativeItems: CreativeItem[]): GraphData => {
    const wordCounts = new Map<string, number>();
    const coOccurrences = new Map<string, number>();

    creativeItems.forEach(item => {
      const text = item.naturalPrompt + ' ' + Object.values(item.prompt).join(' ');
      const words = [...new Set(extractKeywords(text))]; // Unique words per item

      // Count individual words
      words.forEach(word => {
        wordCounts.set(word, (wordCounts.get(word) || 0) + 1);
      });

      // Count co-occurrences
      for (let i = 0; i < words.length; i++) {
        for (let j = i + 1; j < words.length; j++) {
          const pair = [words[i], words[j]].sort().join('|');
          coOccurrences.set(pair, (coOccurrences.get(pair) || 0) + 1);
        }
      }
    });

    // Filter to top words (min count 2)
    const minCount = 2;
    const topWords = Array.from(wordCounts.entries())
      .filter(([, count]) => count >= minCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 50); // Top 50 words

    const wordSet = new Set(topWords.map(([word]) => word));

    const nodes: Node[] = topWords.map(([word, count]) => ({
      id: word,
      name: word,
      count
    }));

    const links: Link[] = Array.from(coOccurrences.entries())
      .filter(([pair, count]) => {
        const [w1, w2] = pair.split('|');
        return wordSet.has(w1) && wordSet.has(w2) && count >= 2;
      })
      .map(([pair, value]) => {
        const [source, target] = pair.split('|');
        return { source, target, value };
      });

    return { nodes, links };
  }, []);

  // Load data
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        const allItems = await getAllCreativeItems();
        setItems(allItems);
        const graph = buildGraph(allItems);
        setGraphData(graph);
      } catch (err) {
        console.error('Failed to load data:', err);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, [buildGraph]);

  // Initialize D3 force simulation
  useEffect(() => {
    if (!svgRef.current || graphData.nodes.length === 0) return;

    const width = svgRef.current.clientWidth;
    const height = svgRef.current.clientHeight || 600;

    // Clear previous simulation
    if (simulationRef.current) {
      simulationRef.current.stop();
    }

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    // Create zoom behavior
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.1, 4])
      .on('zoom', (event) => {
        g.attr('transform', event.transform);
      });

    svg.call(zoom);

    const g = svg.append('g');

    // Color scale
    const colorScale = d3.scaleOrdinal(d3.schemeCategory10);

    // Create simulation
    const simulation = d3.forceSimulation<Node>(graphData.nodes)
      .force('link', d3.forceLink<Node, Link>(graphData.links).id(d => d.id).distance(100))
      .force('charge', d3.forceManyBody().strength(-300))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide<Node>().radius(d => Math.sqrt(d.count) * 5 + 10));

    simulationRef.current = simulation;

    // Draw links
    const link = g.append('g')
      .selectAll('line')
      .data(graphData.links)
      .enter()
      .append('line')
      .attr('stroke', 'rgba(255,255,255,0.2)')
      .attr('stroke-width', d => Math.sqrt(d.value) * 2);

    // Draw nodes
    const node = g.append('g')
      .selectAll('g')
      .data(graphData.nodes)
      .enter()
      .append('g')
      .style('cursor', 'pointer')
      .call(d3.drag<SVGGElement, Node>()
        .on('start', (event, d) => {
          if (!event.active) simulation.alphaTarget(0.3).restart();
          d.fx = d.x;
          d.fy = d.y;
        })
        .on('drag', (event, d) => {
          d.fx = event.x;
          d.fy = event.y;
        })
        .on('end', (event, d) => {
          if (!event.active) simulation.alphaTarget(0);
          d.fx = null;
          d.fy = null;
        }));

    // Node circles
    node.append('circle')
      .attr('r', d => Math.sqrt(d.count) * 5 + 5)
      .attr('fill', d => colorScale(String(d.name.charCodeAt(0) % 10)))
      .attr('stroke', '#fff')
      .attr('stroke-width', d => selectedNode === d.id ? 3 : 1)
      .attr('stroke-opacity', 0.8);

    // Node labels
    node.append('text')
      .text(d => d.name)
      .attr('x', d => Math.sqrt(d.count) * 5 + 10)
      .attr('y', 4)
      .attr('fill', 'rgba(255,255,255,0.9)')
      .attr('font-size', '12px')
      .attr('font-weight', '500');

    // Click handler
    node.on('click', (event, d) => {
      event.stopPropagation();
      setSelectedNode(d.id);
      
      // Find related items
      const related = items.filter(item => {
        const text = (item.naturalPrompt + ' ' + Object.values(item.prompt).join(' ')).toLowerCase();
        return text.includes(d.name.toLowerCase());
      });
      setRelatedItems(related);
    });

    // Double click to search
    node.on('dblclick', (event, d) => {
      event.stopPropagation();
      window.location.href = `/library?search=${encodeURIComponent(d.name)}`;
    });

    // Background click to deselect
    svg.on('click', () => {
      setSelectedNode(null);
      setRelatedItems([]);
    });

    // Update positions on tick
    simulation.on('tick', () => {
      link
        .attr('x1', d => (d.source as Node).x!)
        .attr('y1', d => (d.source as Node).y!)
        .attr('x2', d => (d.target as Node).x!)
        .attr('y2', d => (d.target as Node).y!);

      node.attr('transform', d => `translate(${d.x},${d.y})`);
    });

    return () => {
      simulation.stop();
      // Remove all event listeners
      svg.on('.zoom', null);
      node.on('click', null).on('dblclick', null);
      svg.on('click', null);
    };
  }, [graphData, items, selectedNode]);

  // Handle zoom controls
  const handleZoomIn = () => {
    if (!svgRef.current) return;
    const svg = d3.select(svgRef.current);
    svg.transition().call(
      (d3.zoom() as any).transform,
      d3.zoomTransform(svgRef.current).scale(1.3)
    );
  };

  const handleZoomOut = () => {
    if (!svgRef.current) return;
    const svg = d3.select(svgRef.current);
    svg.transition().call(
      (d3.zoom() as any).transform,
      d3.zoomTransform(svgRef.current).scale(0.7)
    );
  };

  const handleReset = () => {
    if (!svgRef.current) return;
    const svg = d3.select(svgRef.current);
    svg.transition().call(
      (d3.zoom() as any).transform,
      d3.zoomIdentity
    );
  };

  // Format date
  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0a0f] via-[#12121a] to-[#1a1a25]">
      {/* Header */}
      <header className="border-b border-white/10 backdrop-blur-xl bg-black/20 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link href="/library" className="p-2 rounded-lg hover:bg-white/10 transition-colors">
                <ArrowLeft className="w-5 h-5 text-white/70" />
              </Link>
              <div className="p-2 rounded-lg bg-gradient-to-br from-cyan-400/20 to-purple-500/20">
                <Share2 className="w-5 h-5 text-cyan-400" />
              </div>
              <h1 className="text-xl font-semibold text-white">Word Network</h1>
            </div>

            {/* Controls */}
            <div className="flex items-center gap-2">
              <button
                onClick={handleZoomOut}
                className="p-2 rounded-lg bg-white/5 text-white/70 hover:bg-white/10 transition-colors"
                title="Zoom out"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <button
                onClick={handleReset}
                className="p-2 rounded-lg bg-white/5 text-white/70 hover:bg-white/10 transition-colors"
                title="Reset view"
              >
                <Maximize2 className="w-4 h-4" />
              </button>
              <button
                onClick={handleZoomIn}
                className="p-2 rounded-lg bg-white/5 text-white/70 hover:bg-white/10 transition-colors"
                title="Zoom in"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Graph */}
          <div className="lg:col-span-3">
            <div className="rounded-xl border border-white/10 bg-white/5 overflow-hidden" style={{ height: '600px' }}>
              {isLoading ? (
                <div className="flex items-center justify-center h-full">
                  <div className="animate-spin w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full" />
                </div>
              ) : graphData.nodes.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <Share2 className="w-16 h-16 text-white/20 mb-4" />
                  <p className="text-white/50 mb-2">No data yet</p>
                  <p className="text-sm text-white/30">
                    Add some creative items to see the word network
                  </p>
                </div>
              ) : (
                <svg
                  ref={svgRef}
                  className="w-full h-full"
                  style={{ cursor: 'grab' }}
                />
              )}
            </div>

            {/* Legend */}
            <div className="mt-4 flex items-center gap-6 text-sm text-white/50">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-cyan-400" />
                <span>Node size = frequency</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-0.5 bg-white/20" />
                <span>Line thickness = co-occurrence</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-cyan-400">Click</span>
                <span>to see related items</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-cyan-400">Double-click</span>
                <span>to search</span>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Selected Node Info */}
            {selectedNode && (
              <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-medium text-white">"{selectedNode}"</h3>
                  <button
                    onClick={() => {
                      setSelectedNode(null);
                      setRelatedItems([]);
                    }}
                    className="p-1 rounded hover:bg-white/10 text-white/50"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <p className="text-sm text-white/50 mb-4">
                  Found in {relatedItems.length} {relatedItems.length === 1 ? 'item' : 'items'}
                </p>
                
                {relatedItems.length > 0 && (
                  <div className="space-y-3 max-h-[300px] overflow-y-auto">
                    {relatedItems.slice(0, 5).map(item => (
                      <div key={item.id} className="flex gap-3 p-2 rounded-lg bg-white/5">
                        <img
                          src={item.thumbnailUrl}
                          alt=""
                          className="w-12 h-12 rounded object-cover"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-white/70 line-clamp-2">
                            {item.naturalPrompt.slice(0, 60)}...
                          </p>
                          <p className="text-xs text-white/40 mt-1">
                            {formatDate(item.createdAt)}
                          </p>
                        </div>
                      </div>
                    ))}
                    {relatedItems.length > 5 && (
                      <p className="text-xs text-center text-white/40">
                        +{relatedItems.length - 5} more
                      </p>
                    )}
                  </div>
                )}

                <Link
                  href={`/library?search=${encodeURIComponent(selectedNode)}`}
                  className="mt-4 flex items-center justify-center gap-2 w-full py-2 rounded-lg bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500/30 transition-colors text-sm"
                >
                  <Search className="w-4 h-4" />
                  Search in Library
                </Link>
              </div>
            )}

            {/* Stats */}
            <div className="p-4 rounded-xl bg-white/5 border border-white/10">
              <h3 className="font-medium text-white mb-4">Statistics</h3>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-white/50">Total items</span>
                  <span className="text-white">{items.length}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-white/50">Unique words</span>
                  <span className="text-white">{graphData.nodes.length}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-white/50">Connections</span>
                  <span className="text-white">{graphData.links.length}</span>
                </div>
              </div>
            </div>

            {/* Top Words */}
            {graphData.nodes.length > 0 && (
              <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                <h3 className="font-medium text-white mb-4">Top Words</h3>
                <div className="flex flex-wrap gap-2">
                  {graphData.nodes
                    .sort((a, b) => b.count - a.count)
                    .slice(0, 15)
                    .map(node => (
                      <button
                        key={node.id}
                        onClick={() => {
                          setSelectedNode(node.id);
                          const related = items.filter(item => {
                            const text = (item.naturalPrompt + ' ' + Object.values(item.prompt).join(' ')).toLowerCase();
                            return text.includes(node.name.toLowerCase());
                          });
                          setRelatedItems(related);
                        }}
                        className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
                          selectedNode === node.id
                            ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                            : 'bg-white/5 text-white/70 hover:bg-white/10 border border-white/10'
                        }`}
                      >
                        {node.name} ({node.count})
                      </button>
                    ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
