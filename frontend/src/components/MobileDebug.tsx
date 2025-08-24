import React, { useState, useEffect } from 'react';
import { Bug, X, CheckCircle, AlertCircle, Info } from 'lucide-react';

interface DebugInfo {
  userAgent: string;
  viewport: string;
  connection: string;
  localStorage: boolean;
  sessionStorage: boolean;
  cookies: boolean;
  timestamp: string;
}

interface MobileDebugProps {
  isVisible: boolean;
  onClose: () => void;
}

export const MobileDebug: React.FC<MobileDebugProps> = ({ isVisible, onClose }) => {
  const [debugInfo, setDebugInfo] = useState<DebugInfo | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    if (isVisible) {
      const info: DebugInfo = {
        userAgent: navigator.userAgent,
        viewport: `${window.innerWidth}x${window.innerHeight}`,
        connection: (navigator as any).connection ? 
          `${(navigator as any).connection.effectiveType || 'unknown'} (${(navigator as any).connection.downlink || 'unknown'} Mbps)` : 
          'unknown',
        localStorage: !!window.localStorage,
        sessionStorage: !!window.sessionStorage,
        cookies: navigator.cookieEnabled,
        timestamp: new Date().toISOString()
      };
      setDebugInfo(info);
    }
  }, [isVisible]);

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 max-w-sm">
        {/* Header */}
        <div className="flex items-center justify-between p-3 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-2">
            <Bug className="w-4 h-4 text-blue-500" />
            <span className="text-sm font-medium text-gray-900 dark:text-white">Mobile Debug</span>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              {isExpanded ? '−' : '+'}
            </button>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content */}
        {isExpanded && debugInfo && (
          <div className="p-3 space-y-2 text-xs">
            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                <Info className="w-3 h-3 text-blue-500" />
                <span className="text-gray-600 dark:text-gray-300">Viewport:</span>
                <span className="text-gray-900 dark:text-white font-mono">{debugInfo.viewport}</span>
              </div>
              
              <div className="flex items-center space-x-2">
                <Info className="w-3 h-3 text-blue-500" />
                <span className="text-gray-600 dark:text-gray-300">Connection:</span>
                <span className="text-gray-900 dark:text-white font-mono">{debugInfo.connection}</span>
              </div>
              
              <div className="flex items-center space-x-2">
                {debugInfo.localStorage ? 
                  <CheckCircle className="w-3 h-3 text-green-500" /> : 
                  <AlertCircle className="w-3 h-3 text-red-500" />
                }
                <span className="text-gray-600 dark:text-gray-300">LocalStorage:</span>
                <span className={`font-mono ${debugInfo.localStorage ? 'text-green-600' : 'text-red-600'}`}>
                  {debugInfo.localStorage ? 'Available' : 'Unavailable'}
                </span>
              </div>
              
              <div className="flex items-center space-x-2">
                {debugInfo.sessionStorage ? 
                  <CheckCircle className="w-3 h-3 text-green-500" /> : 
                  <AlertCircle className="w-3 h-3 text-red-500" />
                }
                <span className="text-gray-600 dark:text-gray-300">SessionStorage:</span>
                <span className={`font-mono ${debugInfo.sessionStorage ? 'text-green-600' : 'text-red-600'}`}>
                  {debugInfo.sessionStorage ? 'Available' : 'Unavailable'}
                </span>
              </div>
              
              <div className="flex items-center space-x-2">
                {debugInfo.cookies ? 
                  <CheckCircle className="w-3 h-3 text-green-500" /> : 
                  <AlertCircle className="w-3 h-3 text-red-500" />
                }
                <span className="text-gray-600 dark:text-gray-300">Cookies:</span>
                <span className={`font-mono ${debugInfo.cookies ? 'text-green-600' : 'text-red-600'}`}>
                  {debugInfo.cookies ? 'Enabled' : 'Disabled'}
                </span>
              </div>
            </div>
            
            <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
              <div className="text-gray-500 dark:text-gray-400 text-xs">
                {debugInfo.timestamp}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
