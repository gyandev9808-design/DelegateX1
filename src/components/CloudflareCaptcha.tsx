import React, { useState, useEffect } from 'react';
import { Shield, Check, RefreshCw } from 'lucide-react';

interface CloudflareCaptchaProps {
  onVerify: (token: string) => void;
  onExpire?: () => void;
  isVerified: boolean;
  theme?: 'dark' | 'light';
  className?: string;
}

export default function CloudflareCaptcha({
  onVerify,
  onExpire,
  isVerified,
  theme = 'dark',
  className = '',
}: CloudflareCaptchaProps) {
  const [status, setStatus] = useState<'idle' | 'verifying' | 'success' | 'expired'>('idle');
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    if (!isVerified && status === 'success') {
      setStatus('idle');
      setToken(null);
    }
  }, [isVerified, status]);

  const handleCheckboxClick = () => {
    if (status === 'verifying' || status === 'success') return;

    setStatus('verifying');

    // Simulate Cloudflare Turnstile cryptographic browser handshake
    const timer = setTimeout(() => {
      const generatedToken = 'cf_turnstile_' + Math.random().toString(36).substring(2, 10) + '_' + Date.now();
      setToken(generatedToken);
      setStatus('success');
      onVerify(generatedToken);
    }, 750);

    return () => clearTimeout(timer);
  };

  const handleRefresh = (e: React.MouseEvent) => {
    e.stopPropagation();
    setStatus('idle');
    setToken(null);
    if (onExpire) onExpire();
  };

  return (
    <div
      className={`rounded-2xl border border-[#36393e] bg-[#1a1b1e] p-3.5 shadow-md select-none transition-all ${
        status === 'success' ? 'border-emerald-500/40 bg-[#161f1c]' : 'hover:border-[#4f545c]'
      } ${className}`}
    >
      <div className="flex items-center justify-between gap-3">
        {/* Left: Interactive Checkbox */}
        <div
          onClick={handleCheckboxClick}
          className="flex items-center gap-3 cursor-pointer flex-1"
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              handleCheckboxClick();
            }
          }}
        >
          <div
            className={`h-7 w-7 rounded-lg border flex items-center justify-center transition-all ${
              status === 'success'
                ? 'bg-emerald-500 border-emerald-400 text-slate-950 shadow-sm shadow-emerald-500/40 scale-105'
                : status === 'verifying'
                ? 'border-cyan-400 bg-cyan-950/40 text-cyan-300'
                : 'border-slate-500 bg-[#25282c] hover:border-slate-400'
            }`}
          >
            {status === 'success' && <Check className="h-4 w-4 stroke-[3]" />}
            {status === 'verifying' && <RefreshCw className="h-4 w-4 animate-spin text-cyan-400" />}
          </div>

          <div className="flex flex-col">
            <span className="text-xs sm:text-sm font-semibold text-slate-200">
              {status === 'success'
                ? 'Success! Verified'
                : status === 'verifying'
                ? 'Verifying you are human...'
                : 'Verify you are human'}
            </span>
            <span className="text-[10px] text-slate-400">
              {status === 'success' ? 'Cloudflare security check passed' : 'Interactive browser verification'}
            </span>
          </div>
        </div>

        {/* Right: Cloudflare Official Turnstile Branding */}
        <div className="flex flex-col items-end shrink-0 pl-2 border-l border-white/5">
          <div className="flex items-center gap-1.5">
            {/* Cloudflare SVG / Icon */}
            <svg
              className="h-4 w-4 text-[#F38020]"
              viewBox="0 0 115.2 48"
              fill="currentColor"
              aria-hidden="true"
            >
              <path d="M86.3 22.8c-.8-6.8-6.6-12.1-13.6-12.1-5.1 0-9.6 2.8-12 7-1.7-.8-3.6-1.3-5.7-1.3-6.5 0-11.8 5-12.3 11.4-4.8.7-8.5 4.8-8.5 9.8 0 5.5 4.5 10 10 10h41.5c5.8 0 10.6-4.7 10.6-10.6 0-5.4-4.1-9.9-9.5-10.5l-.5-.7z" />
            </svg>
            <span className="text-[11px] font-extrabold tracking-tight text-white">
              CLOUDFLARE
            </span>
          </div>
          <div className="flex items-center gap-1 text-[9px] text-slate-400 mt-0.5">
            <Shield className="h-2.5 w-2.5 text-cyan-400" />
            <span className="text-slate-400">Turnstile</span>
            <span>•</span>
            <a
              href="https://www.cloudflare.com/privacypolicy/"
              target="_blank"
              rel="noreferrer"
              className="hover:underline text-slate-400"
              onClick={(e) => e.stopPropagation()}
            >
              Privacy
            </a>
            <span>•</span>
            <a
              href="https://www.cloudflare.com/terms/"
              target="_blank"
              rel="noreferrer"
              className="hover:underline text-slate-400"
              onClick={(e) => e.stopPropagation()}
            >
              Terms
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
