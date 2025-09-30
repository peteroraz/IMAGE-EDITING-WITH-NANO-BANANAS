
import React from 'react';

export interface HistoryItem {
  id: string;
  type: 'generate' | 'edit';
  prompt: string;
  thumbnailUrl: string;
  sourceImageUrls: string[];
  aspectRatio: string;
  baseImageForBlend?: string;
  timestamp: Date;
}

interface HistorySidebarProps {
  isVisible: boolean;
  history: HistoryItem[];
  onRevert: (item: HistoryItem) => void;
  onReEdit: (item: HistoryItem) => void;
  onClose: () => void;
}

const HistorySidebar: React.FC<HistorySidebarProps> = ({
  isVisible,
  history,
  onRevert,
  onReEdit,
  onClose,
}) => {
  return (
    <>
      {/* Overlay */}
      <div
        onClick={onClose}
        className={`fixed inset-0 bg-black/60 z-40 transition-opacity duration-300 ${
          isVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      />
      {/* Sidebar */}
      <div
        className={`fixed top-0 right-0 h-full w-full max-w-sm bg-slate-800 border-l border-slate-700 shadow-2xl z-50 transform transition-transform duration-300 ease-in-out ${
          isVisible ? 'translate-x-0' : 'translate-x-full'
        }`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="history-title"
      >
        <div className="flex flex-col h-full">
          <header className="flex items-center justify-between p-4 border-b border-slate-700">
            <h2 id="history-title" className="text-xl font-semibold text-white">
              History
            </h2>
            <button
              onClick={onClose}
              className="p-1 rounded-full text-slate-400 hover:bg-slate-700 hover:text-white"
              aria-label="Close history"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </header>
          
          <div className="flex-grow overflow-y-auto p-4 space-y-4">
            {history.length === 0 ? (
              <div className="text-center text-slate-400 pt-10">
                <p>Your edit history will appear here.</p>
              </div>
            ) : (
              history.map(item => (
                <div key={item.id} className="bg-slate-900/50 p-3 rounded-lg">
                  <div className="flex gap-4">
                    <img src={item.thumbnailUrl} alt="History thumbnail" className="w-20 h-20 object-cover rounded-md flex-shrink-0" />
                    <div className="flex-grow min-w-0">
                        <span className={`text-xs font-bold uppercase ${item.type === 'generate' ? 'text-purple-400' : 'text-indigo-400'}`}>
                            {item.type}
                        </span>
                        <p className="text-sm text-slate-300 truncate mt-1" title={item.prompt}>
                            "{item.prompt}"
                        </p>
                        <p className="text-xs text-slate-500 mt-1">
                            {item.timestamp.toLocaleTimeString()}
                        </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 mt-3">
                    <button 
                        onClick={() => onRevert(item)}
                        className="w-full text-sm px-3 py-1.5 bg-slate-700 hover:bg-slate-600 rounded-md transition-colors"
                    >
                        Revert
                    </button>
                    {item.type === 'edit' && (
                        <button 
                            onClick={() => onReEdit(item)}
                            className="w-full text-sm px-3 py-1.5 bg-slate-700 hover:bg-slate-600 rounded-md transition-colors"
                        >
                            Re-edit
                        </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default HistorySidebar;
