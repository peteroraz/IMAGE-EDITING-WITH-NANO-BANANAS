
import React from 'react';
import { GroundingChunk } from '../services/geminiService';

interface GroundingCitationsProps {
  citations: GroundingChunk[];
}

const GroundingCitations: React.FC<GroundingCitationsProps> = ({ citations }) => {
  if (!citations || citations.length === 0) return null;

  return (
    <div className="mt-4 p-4 bg-slate-900/40 rounded-xl border border-slate-700/50">
      <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Sources & References</h4>
      <ul className="space-y-2">
        {citations.map((chunk, idx) => {
          if (!chunk.web) return null;
          return (
            <li key={idx} className="flex items-start gap-2">
              <span className="text-indigo-400 font-mono text-xs mt-1">[{idx + 1}]</span>
              <a 
                href={chunk.web.uri} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-sm text-slate-300 hover:text-indigo-400 hover:underline transition-colors line-clamp-1"
              >
                {chunk.web.title || chunk.web.uri}
              </a>
            </li>
          );
        })}
      </ul>
    </div>
  );
};

export default GroundingCitations;
