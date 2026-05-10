import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, MapPin, Store, TrendingUp, Compass, ChevronRight, Activity, Zap, CheckCircle2, AlertTriangle, ArrowRightLeft, PieChart, Target } from 'lucide-react';
import { runGeoAgent } from './services/aiService';
import { cn } from './lib/utils';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Cell, Tooltip as RechartsTooltip } from 'recharts';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import iconUrl from 'leaflet/dist/images/marker-icon.png';
import iconShadowUrl from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl,
    shadowUrl: iconShadowUrl
});

L.Marker.prototype.options.icon = DefaultIcon;

type Mode = 'profile' | 'compare' | 'business' | 'trajectory' | 'portfolio' | 'collections';

const Sidebar = ({ activeMode, setActiveMode }: { activeMode: Mode; setActiveMode: (m: Mode) => void }) => {
  const menuItems: { id: Mode; label: string; icon: React.ElementType; desc: string }[] = [
    { id: 'profile', label: 'Neighborhood Profile', icon: Compass, desc: 'A-F grades & vibe check' },
    { id: 'compare', label: 'Compare Locations', icon: ArrowRightLeft, desc: 'Head-to-head match up' },
    { id: 'business', label: 'Business Viability', icon: Store, desc: 'Score your retail concept' },
    { id: 'trajectory', label: '5-Year Trajectory', icon: TrendingUp, desc: 'Future outlook & analogs' },
    { id: 'portfolio', label: 'Portfolio Analyst', icon: PieChart, desc: 'Macro risk assessment' },
    { id: 'collections', label: 'Collections Config', icon: Target, desc: 'Predictive prioritization' }
  ];

  return (
    <aside className="w-20 lg:w-72 bg-[#0a0a0a] text-zinc-100 flex flex-col flex-shrink-0 border-r border-zinc-800/80 shadow-2xl relative z-30">
      <div className="p-6 border-b border-zinc-800/80 hidden lg:block">
        <h1 className="text-xl font-bold font-sans tracking-tight text-zinc-100 flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-blue-600 flex items-center justify-center shrink-0">
            <Compass className="w-4 h-4 text-white" />
          </div>
          GeoAnalog <span className="font-light text-zinc-500 font-mono text-sm uppercase tracking-widest pl-2">v2</span>
        </h1>
        <p className="text-xs text-zinc-500 mt-2 font-mono tracking-wide uppercase">Geographic Intelligence</p>
      </div>
      
      <nav className="flex-1 py-6 px-4 space-y-2">
        <div className="hidden lg:block text-[10px] uppercase font-bold text-zinc-600 tracking-widest mb-4 px-2 font-mono">Analysis Modes</div>
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveMode(item.id)}
            className={cn(
              "w-full flex items-center gap-4 px-3 py-3 rounded-xl text-left transition-all outline-none group",
              activeMode === item.id 
                ? "bg-blue-500/10 border border-blue-500/30 shadow-lg shadow-blue-900/10" 
                : "border border-transparent hover:bg-zinc-900 hover:border-zinc-800"
            )}
          >
            <div className={cn(
              "p-2 rounded-lg transition-colors ring-1",
              activeMode === item.id ? "bg-blue-600 text-white ring-blue-500/50" : "bg-zinc-900 text-zinc-400 group-hover:bg-zinc-800 group-hover:text-zinc-200 ring-zinc-800 border-zinc-800"
            )}>
              <item.icon className="w-5 h-5" />
            </div>
            <div className="hidden lg:block overflow-hidden">
              <p className={cn("text-sm font-semibold transition-colors font-sans", activeMode === item.id ? "text-blue-400" : "text-zinc-300 group-hover:text-zinc-100")}>{item.label}</p>
              <p className="text-[11px] text-zinc-500 truncate mt-0.5">{item.desc}</p>
            </div>
          </button>
        ))}
      </nav>
      
      <div className="p-4 border-t border-zinc-800/80 hidden lg:block bg-zinc-900/20">
        <div className="bg-zinc-900/80 rounded-xl p-4 border border-zinc-800 flex items-start gap-3 shadow-inner">
          <Zap className="w-5 h-5 text-yellow-500 shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-bold text-zinc-300 font-mono tracking-wider uppercase mb-1">Powered by AI</p>
            <p className="text-[10px] text-zinc-500 leading-relaxed font-sans">
              Analyzing real world signals from OSM and Open-Meteo.
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
};

const LocationMap = ({ lat, lon, name }: { lat: number, lon: number, name: string }) => {
  if (!lat && !lon) return null;
  return (
    <div className="w-full h-64 md:h-80 rounded-2xl overflow-hidden shadow-2xl border border-zinc-800 relative mb-6 z-0 ring-1 ring-white/5">
      <MapContainer center={[lat, lon]} zoom={13} scrollWheelZoom={false} className="w-full h-full z-0">
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />
        <Marker position={[lat, lon]}>
          <Popup className="text-zinc-900 font-bold">{name}</Popup>
        </Marker>
      </MapContainer>
    </div>
  );
};

// --- Renderers ---
const parseScore = (s: string) => {
  if (s.includes('A')) return 90;
  if (s.includes('B')) return 75;
  if (s.includes('C')) return 60;
  if (s.includes('D')) return 40;
  return 20;
};

const ProfileResults = ({ data }: { data: any, key?: string }) => {
  const chartData = data.scores?.map((s: any) => ({
    name: s.category,
    value: parseScore(s.score),
    label: s.score
  })) || [];

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      {data._meta?.lat && <LocationMap lat={data._meta.lat} lon={data._meta.lon} name={data._meta.display_name} />}
      
      <div className="bg-zinc-900 border text-center border-zinc-800 rounded-2xl p-8 shadow-2xl relative overflow-hidden group">
        <div className="absolute inset-0 bg-gradient-to-tr from-blue-500/5 to-purple-500/5 group-hover:opacity-100 opacity-50 transition-opacity"></div>
        <h3 className="text-sm font-bold text-zinc-500 uppercase tracking-widest mb-4 relative z-10 font-mono">The Vibe</h3>
        <p className="text-lg md:text-xl text-zinc-200 leading-relaxed font-semibold font-sans relative z-10">"{data.summary}"</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-2xl">
          <h3 className="text-sm font-bold text-zinc-500 uppercase tracking-widest mb-6 font-mono">Score Metrics</h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#27272a" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#a1a1aa', fontSize: 12 }} />
                <YAxis hide domain={[0, 100]} />
                <RechartsTooltip cursor={{ fill: '#27272a' }} contentStyle={{ backgroundColor: '#18181b', color: '#f4f4f5', borderRadius: '12px', border: '1px solid #27272a', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.5)' }} />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {chartData.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={entry.value > 85 ? '#10b981' : entry.value > 70 ? '#3b82f6' : entry.value > 50 ? '#f59e0b' : '#ef4444'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="space-y-4">
          {data.scores?.map((s: any, i: number) => (
            <div key={i} className="bg-zinc-900/50 rounded-xl p-4 border border-zinc-800 flex items-center gap-4 transition-colors hover:bg-zinc-800/80">
              <div className={cn(
                "w-12 h-12 rounded-full flex items-center justify-center text-lg font-black shrink-0 ring-1",
                ['A', 'A+', 'A-'].includes(s.score) ? "bg-emerald-500/10 text-emerald-400 ring-emerald-500/30" :
                ['B', 'B+', 'B-'].includes(s.score) ? "bg-blue-500/10 text-blue-400 ring-blue-500/30" :
                ['C', 'C+', 'C-'].includes(s.score) ? "bg-amber-500/10 text-amber-400 ring-amber-500/30" :
                "bg-rose-500/10 text-rose-400 ring-rose-500/30"
              )}>
                {s.score}
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 mb-1 block font-mono">{s.category}</span>
                <p className="text-xs text-zinc-300 font-medium leading-snug">{s.reason}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-2xl">
        <h3 className="text-sm font-bold text-zinc-500 uppercase tracking-widest mb-6 font-mono flex items-center gap-2">
          <MapPin className="w-4 h-4 text-emerald-500" /> Global Analogs
        </h3>
        <div className="grid md:grid-cols-2 gap-4">
          {data.similarNeighborhoods?.map((sim: any, i: number) => (
            <div key={i} className="flex flex-col gap-2 p-4 border border-zinc-800/80 bg-zinc-900/50 rounded-xl hover:bg-zinc-800/50 transition-colors">
              <div className="flex justify-between items-start">
                <span className="font-bold text-zinc-100">{sim.name}</span>
                <span className="text-[10px] font-bold text-zinc-400 bg-zinc-800 px-2 py-1 rounded uppercase tracking-wider border border-zinc-700">{sim.country}</span>
              </div>
              <p className="text-sm text-zinc-400 leading-snug">{sim.similarityReason}</p>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
};

const CompareResults = ({ data }: { data: any, key?: string }) => (
  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
    {data._meta?.lat && <LocationMap lat={data._meta.lat} lon={data._meta.lon} name={data._meta.display_name} />}
    <div className="bg-gradient-to-br from-indigo-900 to-zinc-900 text-white rounded-2xl p-8 shadow-2xl relative overflow-hidden border border-zinc-800">
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
      <h3 className="text-indigo-400 font-semibold text-xs uppercase tracking-widest mb-3 relative z-10 font-mono">Verdict</h3>
      <p className="text-lg md:text-xl font-medium leading-relaxed relative z-10 text-zinc-100">{data.recommendation}</p>
    </div>

    <div className="grid lg:grid-cols-2 gap-6">
      <div className="space-y-4">
        <h3 className="font-bold text-zinc-100 px-1 font-mono text-sm uppercase tracking-widest">Head-to-Head</h3>
        {data.comparisonPoints?.map((cp: any, i: number) => (
          <div key={i} className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 shadow-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-zinc-700 transition-colors">
            <div>
              <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-1 font-mono">{cp.category}</p>
              <p className="text-sm text-zinc-400">{cp.rationale}</p>
            </div>
            <div className="bg-emerald-500/10 text-emerald-400 font-bold px-3 py-1.5 rounded-lg text-sm ring-1 ring-emerald-500/30 shrink-0 flex items-center justify-center">
              Winner: {cp.winner}
            </div>
          </div>
        ))}
      </div>

      <div className="space-y-4">
        <h3 className="font-bold text-zinc-100 px-1 font-mono text-sm uppercase tracking-widest">Overall Rankings</h3>
        {data.rankings?.map((r: any, i: number) => (
          <div key={i} className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-5 shadow-2xl relative overflow-hidden group hover:bg-zinc-800/50 transition-colors">
            <div className="absolute top-0 right-0 w-16 h-16 bg-zinc-900 rounded-bl-full flex items-center justify-center -mr-2 -mt-2 shadow-sm border-b border-l border-zinc-800">
              <span className="text-2xl font-black text-zinc-700 group-hover:text-indigo-500 transition-colors">#{r.rank}</span>
            </div>
            <h4 className="text-lg font-bold text-zinc-100 mb-4">{r.place}</h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-[10px] uppercase font-bold text-emerald-500 mb-2 font-mono">Pros</p>
                <ul className="space-y-1">
                  {r.pros?.map((p: string, j: number) => <li key={j} className="text-xs text-zinc-400 font-medium">&bull; {p}</li>)}
                </ul>
              </div>
              <div>
                <p className="text-[10px] uppercase font-bold text-rose-500 mb-2 font-mono">Cons</p>
                <ul className="space-y-1">
                  {r.cons?.map((c: string, j: number) => <li key={j} className="text-xs text-zinc-400 font-medium">&bull; {c}</li>)}
                </ul>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  </motion.div>
);

const BusinessResults = ({ data }: { data: any, key?: string }) => (
  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
    {data._meta?.lat && <LocationMap lat={data._meta.lat} lon={data._meta.lon} name={data._meta.display_name} />}
    <div className="flex flex-col md:flex-row gap-6">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 shadow-2xl flex-1 relative overflow-hidden group hover:border-zinc-700 transition-colors">
        <div className="absolute top-0 left-0 w-2 h-full bg-blue-500/20 group-hover:bg-blue-500/40 transition-colors"></div>
        <h3 className="text-sm font-bold text-zinc-500 uppercase tracking-widest mb-4 font-mono">Assessment</h3>
        <p className="text-zinc-200 leading-relaxed font-semibold text-lg">{data.assessment}</p>
      </div>
      <div className="bg-zinc-900 border border-zinc-800 text-white rounded-2xl p-8 shadow-2xl flex flex-col items-center justify-center shrink-0 md:w-64 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-t from-blue-500/10 to-transparent"></div>
        <span className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-3 relative z-10 font-mono">Overall Viability</span>
        <div className={cn(
          "text-7xl font-black tracking-tighter bg-clip-text text-transparent relative z-10",
          ['A', 'A+', 'A-'].includes(data.viabilityScore) ? "bg-gradient-to-br from-emerald-400 to-emerald-600" :
          ['B', 'B+', 'B-'].includes(data.viabilityScore) ? "bg-gradient-to-br from-blue-400 to-blue-600" :
          ['C', 'C+', 'C-'].includes(data.viabilityScore) ? "bg-gradient-to-br from-amber-400 to-amber-600" :
          "bg-gradient-to-br from-rose-400 to-rose-600"
        )}>
          {data.viabilityScore}
        </div>
      </div>
    </div>

    <div className="grid md:grid-cols-2 gap-6">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-2xl">
        <h3 className="font-bold text-zinc-100 mb-6 font-mono text-sm uppercase tracking-widest">Market Factors</h3>
        <div className="space-y-4">
          {data.factors?.map((f: any, i: number) => (
            <div key={i} className="flex gap-4 items-start p-4 bg-zinc-900/50 rounded-xl border border-zinc-800 hover:bg-zinc-800/80 transition-colors">
              <div className={cn(
                "p-2 rounded-lg shrink-0 ring-1",
                f.impact === 'Positive' ? "bg-emerald-500/10 text-emerald-400 ring-emerald-500/30" :
                f.impact === 'Negative' ? "bg-rose-500/10 text-rose-400 ring-rose-500/30" : "bg-zinc-800 text-zinc-400 ring-zinc-700"
              )}>
                {f.impact === 'Positive' ? <TrendingUp className="w-4 h-4" /> : f.impact === 'Negative' ? <Activity className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
              </div>
              <div>
                <p className="text-sm font-bold text-zinc-100 mb-1">{f.name}</p>
                <p className="text-xs text-zinc-400 leading-snug">{f.details}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-2xl">
        <h3 className="font-bold text-zinc-100 mb-6 font-mono text-sm uppercase tracking-widest">Launch Blueprint</h3>
        <ul className="space-y-3">
          {data.nextSteps?.map((step: string, i: number) => (
            <li key={i} className="flex items-start gap-3 p-4 rounded-xl bg-zinc-900/50 border border-zinc-800 hover:bg-zinc-800/80 transition-colors">
              <CheckCircle2 className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
              <span className="text-sm text-zinc-300 font-medium leading-relaxed">{step}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  </motion.div>
);

const PortfolioResults = ({ data }: { data: any, key?: string }) => (
  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
    {data._meta?.lat && <LocationMap lat={data._meta.lat} lon={data._meta.lon} name={data._meta.display_name} />}
    <div className="bg-zinc-900 border text-center border-zinc-800 rounded-2xl p-8 shadow-2xl relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-r from-red-500/5 via-amber-500/5 to-emerald-500/5"></div>
      <h3 className="text-sm font-bold text-zinc-500 uppercase tracking-widest mb-4 font-mono relative z-10">Portfolio Risk Summary</h3>
      <p className="text-lg md:text-xl leading-relaxed font-semibold font-sans text-zinc-100 relative z-10">"{data.summary}"</p>
    </div>

    <div className="grid md:grid-cols-2 gap-6">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-2xl">
         <h3 className="font-bold text-zinc-100 mb-6 flex items-center gap-2 font-mono text-sm uppercase tracking-widest">
          <PieChart className="w-5 h-5 text-indigo-500" /> Exposure Clusters
         </h3>
         <div className="space-y-4">
          {data.clusters?.map((c: any, i: number) => (
             <div key={i} className="p-4 border-l-4 rounded-r-xl border-zinc-800 bg-zinc-900/80 flex flex-col gap-2 shadow-sm hover:bg-zinc-800 transition-colors" style={{ borderLeftColor: c.riskScore > 70 ? '#ef4444' : c.riskScore > 40 ? '#f59e0b' : '#10b981' }}>
                <div className="flex justify-between items-start">
                   <h4 className="font-bold text-zinc-100">{c.region}</h4>
                   <span className={cn("px-2 py-0.5 rounded text-xs font-bold ring-1", 
                      c.riskScore > 70 ? 'bg-red-500/10 text-red-400 ring-red-500/30' : c.riskScore > 40 ? 'bg-amber-500/10 text-amber-400 ring-amber-500/30' : 'bg-emerald-500/10 text-emerald-400 ring-emerald-500/30'
                   )}>Risk: {c.riskScore}</span>
                </div>
                <div className="text-sm font-medium text-zinc-300"><span className="text-zinc-500 mr-2 font-mono text-xs">Risk Factor:</span>{c.keyRiskFactor}</div>
                <div className="text-sm font-medium text-zinc-300"><span className="text-zinc-500 mr-2 font-mono text-xs">Mitigation:</span>{c.mitigation}</div>
             </div>
          ))}
         </div>
      </div>
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-2xl">
         <h3 className="font-bold text-zinc-100 mb-6 flex items-center gap-2 font-mono text-sm uppercase tracking-widest">
          <Activity className="w-5 h-5 text-indigo-500" /> Macro Trends
         </h3>
         <div className="space-y-3">
          {data.macroTrends?.map((m: any, i: number) => (
            <div key={i} className="flex items-start gap-3 bg-zinc-900/50 p-4 rounded-xl border border-zinc-800 hover:border-zinc-700 transition-colors">
               <Zap className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
               <p className="text-sm font-medium text-zinc-300 leading-relaxed">{m}</p>
            </div>
          ))}
         </div>
      </div>
    </div>
  </motion.div>
);

const CollectionsResults = ({ data }: { data: any, key?: string }) => (
  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
    {data._meta?.lat && <LocationMap lat={data._meta.lat} lon={data._meta.lon} name={data._meta.display_name} />}
    <div className="bg-zinc-900 border text-center border-zinc-800 rounded-2xl p-8 shadow-2xl relative overflow-hidden group">
      <div className="absolute inset-0 bg-gradient-to-t from-rose-500/5 to-transparent group-hover:opacity-100 opacity-50 transition-opacity"></div>
      <h3 className="text-sm font-bold text-zinc-500 uppercase tracking-widest mb-4 font-mono relative z-10">Strategy Overview</h3>
      <p className="text-lg md:text-xl text-zinc-100 leading-relaxed font-semibold font-sans relative z-10">"{data.strategyOverview}"</p>
    </div>
    
    <div className="grid md:grid-cols-3 gap-6">
       <div className="md:col-span-2 space-y-4">
         <h3 className="font-bold text-zinc-100 mb-4 flex items-center gap-2 font-mono text-sm uppercase tracking-widest">
           <Target className="w-5 h-5 text-rose-500" /> Priority Zones
         </h3>
         {data.priorityZones?.map((z: any, i: number) => (
           <div key={i} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-2xl flex flex-col md:flex-row gap-6 hover:border-zinc-700 transition-colors">
              <div className="flex-1">
                 <div className="flex items-center gap-3 mb-3">
                    <h4 className="font-bold text-zinc-100 text-lg">{z.zone}</h4>
                    <span className={cn("px-2 py-1 uppercase tracking-wider text-[10px] font-bold rounded-full ring-1",
                       z.priority === 'High' ? 'bg-rose-500/10 text-rose-400 ring-rose-500/30' :
                       z.priority === 'Medium' ? 'bg-amber-500/10 text-amber-400 ring-amber-500/30' :
                       'bg-blue-500/10 text-blue-400 ring-blue-500/30'
                    )}>{z.priority} Priority</span>
                 </div>
                 <p className="text-sm text-zinc-400 mb-4 leading-relaxed">{z.rationale}</p>
                 <div className="flex items-center gap-2 text-sm">
                    <span className="font-bold text-zinc-500 font-mono text-xs uppercase tracking-widest">Channel:</span>
                    <span className="bg-zinc-800 border border-zinc-700 px-3 py-1 rounded text-zinc-300 font-medium">{z.recommendedChannel}</span>
                 </div>
              </div>
              <div className="shrink-0 flex flex-col items-center justify-center w-24 h-24 bg-zinc-900/50 rounded-full border-4 border-zinc-800 shadow-inner group-hover:border-zinc-700 transition-colors">
                 <span className="text-2xl font-black text-zinc-100">{z.predictedSuccessRate}%</span>
                 <span className="text-[9px] uppercase tracking-widest font-bold text-zinc-500 mt-1 font-mono">Yield</span>
              </div>
           </div>
         ))}
       </div>

       <div>
          <h3 className="font-bold text-zinc-100 mb-4 flex items-center gap-2 font-mono text-sm uppercase tracking-widest">
           <AlertTriangle className="w-5 h-5 text-rose-500" /> Headwinds
         </h3>
         <div className="space-y-3">
            {data.economicHeadwinds?.map((h: any, i: number) => (
               <div key={i} className="bg-zinc-900 border border-zinc-800 p-4 rounded-xl text-sm font-medium text-zinc-300 flex items-start gap-3 hover:bg-zinc-800/50 transition-colors">
                  <div className="w-1.5 h-1.5 rounded-full bg-rose-500 mt-1.5 shrink-0 shadow-[0_0_8px_rgba(244,63,94,0.6)]" />
                  <span className="leading-relaxed">{h}</span>
               </div>
            ))}
         </div>
       </div>
    </div>
  </motion.div>
);
const TrajectoryResults = ({ data }: { data: any, key?: string }) => (
  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
    {data._meta?.lat && <LocationMap lat={data._meta.lat} lon={data._meta.lon} name={data._meta.display_name} />}
    <div className="bg-zinc-900 border text-center border-zinc-800 rounded-2xl p-8 shadow-2xl relative overflow-hidden group">
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-purple-500/10 group-hover:opacity-100 opacity-50 transition-opacity"></div>
      <div className="relative inline-block px-3 py-1 bg-indigo-500/10 text-indigo-400 rounded-full text-xs font-bold uppercase tracking-widest mb-4 ring-1 ring-indigo-500/30 font-mono z-10">
        Archetype: {data.currentArchetype}
      </div>
      <p className="text-lg md:text-xl text-zinc-100 font-semibold leading-relaxed relative z-10">
        {data.forecastSummary}
      </p>
    </div>

    <div className="grid md:grid-cols-2 gap-6">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-2xl">
        <h3 className="font-bold text-zinc-100 mb-6 flex items-center gap-2 font-mono text-sm uppercase tracking-widest">
          <TrendingUp className="w-5 h-5 text-indigo-500" /> Timeline
        </h3>
        <div className="space-y-6 relative before:absolute before:inset-0 before:ml-4 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-[1px] before:bg-gradient-to-b before:from-transparent before:via-zinc-700 before:to-transparent">
          {data.expectedChanges?.map((ec: any, i: number) => (
             <div key={i} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
               <div className="flex items-center justify-center w-8 h-8 rounded-full border-4 border-zinc-900 bg-indigo-500 text-white shadow-lg shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 ml-0 z-10 font-mono text-[10px] font-bold">
                 {i+1}
               </div>
               <div className="w-[calc(100%-3rem)] md:w-[calc(50%-2rem)] p-4 rounded-xl border border-zinc-800 bg-zinc-900/80 shadow-2xl ml-4 md:ml-0 hover:bg-zinc-800 transition-colors">
                 <div className="flex items-center justify-between mb-1">
                   <span className="font-bold text-zinc-100 font-mono text-xs">{ec.year}</span>
                 </div>
                 <p className="text-sm text-zinc-400 leading-snug font-medium">{ec.prediction}</p>
               </div>
             </div>
          ))}
        </div>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-2xl">
        <h3 className="font-bold text-zinc-100 mb-6 flex items-center gap-2 font-mono text-sm uppercase tracking-widest">
          <Activity className="w-5 h-5 text-indigo-500" /> Archetype Analogs
        </h3>
        <div className="space-y-4">
          {data.analogs?.map((a: any, i: number) => (
            <div key={i} className="p-4 border border-zinc-800 rounded-xl bg-zinc-900/50 group hover:border-indigo-500/50 hover:bg-indigo-500/5 transition-all">
              <p className="text-sm font-bold text-zinc-100 mb-2 group-hover:text-indigo-400 transition-colors font-mono">{a.historicalPlace}</p>
              <p className="text-sm text-zinc-400 font-medium">
                {a.whatHappened}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  </motion.div>
);


function App() {
  const [activeMode, setActiveMode] = useState<Mode>('profile');
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  
  // For 'compare' mode
  const [places, setPlaces] = useState<string[]>(['', '']);

  const getPlaceholder = (mode: Mode) => {
    switch (mode) {
       case 'profile': return "e.g., Williamsburg Brooklyn, Shinjuku Tokyo...";
       case 'compare': return "e.g., Where should a young professional move?";
       case 'business': return "e.g., Is Bandra a good place to open an artisanal coffee shop?";
       case 'trajectory': return "e.g., 5-year outlook for Roma Norte Mexico City";
       case 'portfolio': return "e.g., Analyze South East Asian mall portfolio Risk";
       case 'collections': return "e.g., Optimize prioritization for auto loans in Ohio";
    }
  };

  const examplesMap: Record<Mode, { query: string; places?: string[], title: string, desc: string }[]> = {
    profile: [
      { title: "Williamsburg, Brooklyn", desc: "Hipster vibe and walkability", query: "What's the vibe in Williamsburg Brooklyn?" },
      { title: "Shinjuku, Tokyo", desc: "Dense urban core and transit", query: "Analyze the density and transit of Shinjuku Tokyo" },
      { title: "Le Marais, Paris", desc: "Historic charm and boutiques", query: "Give me the profile of Le Marais in Paris" }
    ],
    compare: [
      { title: "Young Professional", desc: "SF vs Seattle", query: "Compare Mission District and Capitol Hill for a young professional", places: ['Mission District, SF', 'Capitol Hill, Seattle'] },
      { title: "Retirement Focus", desc: "Florida vs Arizona", query: "Compare Sarasota and Scottsdale for retirement", places: ['Sarasota, FL', 'Scottsdale, AZ'] },
      { title: "Tech Hubs", desc: "Austin vs Miami", query: "Compare downtown Austin and Brickell Miami for a tech startup", places: ['Austin, TX', 'Brickell, Miami'] }
    ],
    business: [
      { title: "Coffee Shop", desc: "Bandra, Mumbai", query: "Is Bandra a good place to open a coffee shop?" },
      { title: "Boutique Fitness", desc: "Soho, London", query: "Assess viablity of a boutique spinning class in Soho London" },
      { title: "Vegan Bakery", desc: "Silver Lake, LA", query: "Should I open a vegan bakery in Silver Lake?" }
    ],
    trajectory: [
      { title: "Roma Norte", desc: "Mexico City (5 yr)", query: "5-year outlook for Roma Norte Mexico City" },
      { title: "Wynwood", desc: "Miami (5 yr)", query: "Predict the 5-year trajectory of Wynwood Miami" },
      { title: "Lisbon Core", desc: "Portugal (5 yr)", query: "Future outlook for Baixa in Lisbon" }
    ],
    portfolio: [
      { title: "Climate Risk", desc: "Florida Exposure", query: "Analyze portfolio exposure to climate risk in Florida", places: ['Miami, FL', 'Orlando, FL', 'Tampa, FL'] },
      { title: "Mall Resiliency", desc: "SEA Malls", query: "Assess resiliency of Southeast Asian mall portfolio", places: ['Bangkok, Thailand', 'Jakarta, Indonesia', 'Manila, Philippines'] },
      { title: "Urban Flight", desc: "Midwest Core", query: "Evaluate risk of urban flight in midwest office spaces", places: ['Chicago, IL', 'Cleveland, OH', 'Detroit, MI'] }
    ],
    collections: [
      { title: "Auto Loans", desc: "Midwest Subprime", query: "Optimize collections for subprime auto loans in Midwest", places: ['Ohio', 'Indiana', 'Michigan'] },
      { title: "Medical Debt", desc: "Sunbelt Region", query: "Prioritize medical debt collections across the Sunbelt", places: ['Texas', 'Arizona', 'Nevada'] },
      { title: "Credit Cards", desc: "East Coast Metro", query: "Credit card default prediction modeling", places: ['New York, NY', 'Philadelphia, PA', 'Boston, MA'] }
    ]
  };

  const handleTryExample = async (example: { query: string, places?: string[] }) => {
    setQuery(example.query);
    setResult(null);
    const validPlaces = example.places || [];
    if (example.places) {
      setPlaces(example.places);
    } else {
      setPlaces(['', '']);
    }

    setIsLoading(true);
    try {
      const data = await runGeoAgent(activeMode, example.query, validPlaces);
      setResult(data);
    } catch (e: any) {
      alert(e.message || "Agent failed. Please check backend configuration.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    
    // For compare/portfolio/collections mode, ensure we have valid places
    const validPlaces = (activeMode === 'compare' || activeMode === 'portfolio' || activeMode === 'collections') ? places.filter(p => p.trim() !== '') : [];
    
    if (activeMode === 'compare' && validPlaces.length < 2) {
      alert("Please enter at least two places to compare.");
      return;
    }
    
    if ((activeMode === 'portfolio' || activeMode === 'collections') && validPlaces.length < 1) {
       alert("Please enter at least one place for the portfolio/collections.");
       return;
    }

    setIsLoading(true);
    setResult(null);
    try {
      const data = await runGeoAgent(activeMode, query, validPlaces);
      setResult(data);
    } catch (e: any) {
      alert(e.message || "Agent failed. Please check backend configuration.");
    } finally {
      setIsLoading(false);
    }
  };

  // Remove the old implementation

  return (
    <div className="flex h-screen bg-[#0a0a0a] font-sans overflow-hidden text-zinc-100">
      <Sidebar activeMode={activeMode} setActiveMode={(m) => { setActiveMode(m); setResult(null); setQuery(''); }} />

      <main className="flex-1 flex flex-col h-full relative overflow-y-auto w-full">
        <header className="sticky top-0 z-20 bg-[#0a0a0a]/80 backdrop-blur-xl border-b border-zinc-800 shadow-2xl">
          <div className="max-w-5xl mx-auto p-4 md:p-6 w-full">
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 w-5 h-5 pointer-events-none" />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={getPlaceholder(activeMode)}
                  className="w-full pl-12 pr-32 py-4 bg-zinc-900 border border-zinc-800 rounded-2xl text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-zinc-900/80 transition-all shadow-inner text-base font-medium"
                />
                <button
                  type="submit"
                  disabled={isLoading || !query.trim()}
                  className="absolute right-2 top-1/2 -translate-y-1/2 bg-blue-600 hover:bg-blue-500 text-white px-5 py-2 rounded-xl text-sm font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                >
                  {isLoading ? 'Thinking...' : 'Analyze'}
                </button>
              </div>

              {(activeMode === 'compare' || activeMode === 'portfolio' || activeMode === 'collections') && (
                <div className="flex flex-col md:flex-row gap-3 flex-wrap">
                   {places.map((place, index) => (
                     <div key={index} className="flex-1 min-w-[200px] relative">
                       <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 w-4 h-4" />
                       <input 
                         type="text" 
                         value={place}
                         placeholder={`Place ${index + 1}`}
                         onChange={(e) => {
                           const newPlaces = [...places];
                           newPlaces[index] = e.target.value;
                           setPlaces(newPlaces);
                         }}
                         className="w-full pl-9 pr-3 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 font-medium"
                       />
                     </div>
                   ))}
                   {places.length < 10 && (
                     <button type="button" onClick={() => setPlaces([...places, ''])} className="px-4 py-2 text-sm font-bold text-blue-400 bg-blue-500/10 hover:bg-blue-500/20 rounded-xl transition-colors border border-blue-500/20 font-mono">
                       + Add Place
                     </button>
                   )}
                </div>
              )}
            </form>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
          <div className="max-w-5xl mx-auto w-full">
            {isLoading ? (
              <div className="h-64 flex flex-col items-center justify-center text-zinc-500 space-y-4">
                <div className="relative">
                  <div className="w-12 h-12 border-4 border-zinc-800 rounded-full animate-pulse"></div>
                  <div className="w-12 h-12 border-4 border-blue-500 rounded-full border-t-transparent animate-spin absolute inset-0 shadow-[0_0_15px_rgba(59,130,246,0.5)]"></div>
                </div>
                <p className="font-medium text-sm animate-pulse font-mono tracking-widest uppercase">Analyzing Geo Signals...</p>
              </div>
            ) : result ? (
              <AnimatePresence mode="wait">
                {activeMode === 'profile' && <ProfileResults key="profile" data={result} />}
                {activeMode === 'compare' && <CompareResults key="compare" data={result} />}
                {activeMode === 'business' && <BusinessResults key="business" data={result} />}
                {activeMode === 'trajectory' && <TrajectoryResults key="trajectory" data={result} />}
                {activeMode === 'portfolio' && <PortfolioResults key="portfolio" data={result} />}
                {activeMode === 'collections' && <CollectionsResults key="collections" data={result} />}
              </AnimatePresence>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center text-zinc-500 py-10 md:py-20">
                 <div className="w-20 h-20 bg-zinc-900 border border-zinc-800 rounded-full flex items-center justify-center mb-6 shadow-2xl">
                   <Compass className="w-10 h-10 text-zinc-600" />
                 </div>
                 <h2 className="text-xl font-bold text-zinc-200 mb-2">Ready to explore</h2>
                 <p className="max-w-md text-sm leading-relaxed mx-auto mb-10 text-zinc-400">
                   Ask a question about any neighborhood worldwide to get deep insights powered by real geographic data and AI.
                 </p>
                 <div className="w-full max-w-2xl px-4">
                   <h3 className="text-left text-xs font-bold text-zinc-600 uppercase tracking-widest mb-4 font-mono">Popular Queries</h3>
                   <div className="grid md:grid-cols-3 gap-4">
                     {examplesMap[activeMode].map((example, i) => (
                       <button
                         key={i}
                         onClick={() => handleTryExample(example)}
                         className="flex flex-col text-left p-4 bg-zinc-900/50 border border-zinc-800 rounded-xl hover:border-blue-500/50 hover:bg-zinc-800 transition-all group"
                       >
                         <p className="font-bold text-zinc-200 mb-1 group-hover:text-blue-400 transition-colors">{example.title}</p>
                         <p className="text-xs text-zinc-500 leading-snug">{example.desc}</p>
                       </button>
                     ))}
                   </div>
                 </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;
