import React from 'react';
import { Link } from 'react-router-dom';

export default function Navbar() {
  return (
    <header className="fixed left-1/2 top-4 z-50 flex h-14 w-auto -translate-x-1/2 items-center justify-center rounded-full border border-white/10 bg-slate-950/85 px-6 shadow-2xl shadow-cyan-950/40 backdrop-blur-xl transition-all">
      <Link to="/" className="flex items-center space-x-3 group">
        <div className="flex h-9 w-9 items-center justify-center rounded-full border border-cyan-400/40 bg-cyan-400/10 text-cyan-300 transition group-hover:scale-105 group-hover:border-cyan-400/70 shadow-md shadow-cyan-500/10 overflow-hidden">
          <img src="/delegatex_logo.jpg" alt="DelegateX" className="h-full w-full object-cover" />
        </div>
        <span className="text-lg font-bold tracking-tight text-white">
          Delegate<span className="text-cyan-400">X</span>
        </span>
      </Link>
    </header>
  );
}

