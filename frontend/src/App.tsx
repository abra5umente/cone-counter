import React, { useState, useEffect } from 'react';
import { ChartNoAxesColumnIncreasing, Plus, Sunrise, History, CalendarDays, BarChart3, Database, Home, Moon, Sun, LogOut, User, Cannabis, RefreshCw } from 'lucide-react';
import { Cone, ConeStats, TimeAnalysis } from './types';
import { ConeAPI } from './api';
import { useAuth } from './contexts/AuthContext';
import { StatsCard } from './components/StatsCard';
import { AddConeModal } from './components/AddConeModal';
import { ConeList } from './components/ConeList';
import { Analytics } from './components/Analytics';
import { DataManagement } from './components/DataManagement';
import { MobileDebug } from './components/MobileDebug';

type Tab = 'dashboard' | 'analytics' | 'data';

function AppContent() {
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [cones, setCones] = useState<Cone[]>([]);
  const [stats, setStats] = useState<ConeStats | null>(null);
  const [analysis, setAnalysis] = useState<TimeAnalysis | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [dark, setDark] = useState<boolean>(document.documentElement.classList.contains('dark'));
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [showDebug, setShowDebug] = useState(false);
  const [tapCount, setTapCount] = useState(0);
  const [lastTapTime, setLastTapTime] = useState(0);
  
  const { currentUser, logout } = useAuth();

  // Mobile debug trigger (triple tap on header)
  const handleHeaderTap = () => {
    const now = Date.now();
    if (now - lastTapTime < 500) {
      setTapCount(prev => prev + 1);
      if (tapCount === 2) {
        setShowDebug(true);
        setTapCount(0);
      }
    } else {
      setTapCount(1);
    }
    setLastTapTime(now);
  };

  const fetchData = async (isRetry = false) => {
    try {
      setError(null);
      setIsLoading(true);
      
      console.log('Fetching data...', { isRetry, retryCount });
      
      const [conesData, statsData, analysisData] = await Promise.all([
        ConeAPI.getAllCones(),
        ConeAPI.getStats(),
        ConeAPI.getAnalysis()
      ]);
      
      setCones(conesData);
      setStats(statsData);
      setAnalysis(analysisData);
      setRetryCount(0); // Reset retry count on success
      
      console.log('Data fetched successfully:', {
        cones: conesData.length,
        stats: statsData,
        analysis: analysisData
      });
    } catch (error) {
      console.error('Failed to fetch data:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setError(errorMessage);
      
      // Auto-retry logic for mobile devices
      if (!isRetry && retryCount < 3) {
        const nextRetryCount = retryCount + 1;
        setRetryCount(nextRetryCount);
        console.log(`Auto-retrying data fetch in 2 seconds... (${nextRetryCount}/3)`);
        
        setTimeout(() => {
          fetchData(true);
        }, 2000);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleRetry = () => {
    setRetryCount(0);
    fetchData();
  };

  useEffect(() => {
    fetchData();
  }, []);

  const toggleDark = () => {
    const next = !dark;
    setDark(next);
    if (next) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Failed to log out:', error);
    }
  };

  const handleConeAdded = () => {
    fetchData();
  };

  const handleConeUpdated = () => {
    fetchData();
  };

  const handleDataImported = () => {
    fetchData();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cone-green mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">Loading Cone Counter...</p>
          {retryCount > 0 && (
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
              Retry attempt {retryCount}/3
            </p>
          )}
        </div>
      </div>
    );
  }

  // Show error state if data fetching failed
  if (error && !stats && !cones.length) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
            Failed to Load Data
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mb-4">
            {error}
          </p>
          <button
            onClick={handleRetry}
            className="bg-cone-green text-white px-4 py-2 rounded hover:bg-green-600 transition-colors flex items-center mx-auto"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header 
        className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700"
        onClick={handleHeaderTap}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-cone-green rounded-lg flex items-center justify-center">
                <Cannabis className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">Cone Counter</h1>
            </div>

            <div className="flex items-center space-x-3">
              {/* User Info */}
              <div className="flex items-center space-x-2 text-sm text-gray-700 dark:text-gray-300">
                <User className="w-4 h-4" />
                <span>{currentUser?.displayName || currentUser?.email}</span>
              </div>
              
              <button
                onClick={toggleDark}
                className="inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                title="Toggle theme"
              >
                {dark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </button>

              <button
                onClick={handleLogout}
                className="inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                title="Logout"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'dashboard'
                  ? 'border-cone-green text-cone-green'
                  : 'border-transparent text-gray-500 dark:text-gray-300 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Home className="w-4 h-4 inline mr-2" />
              Dashboard
            </button>
            <button
              onClick={() => setActiveTab('analytics')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'analytics'
                  ? 'border-cone-green text-cone-green'
                  : 'border-transparent text-gray-500 dark:text-gray-300 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <BarChart3 className="w-4 h-4 inline mr-2" />
              Analytics
            </button>
            <button
              onClick={() => setActiveTab('data')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'data'
                  ? 'border-cone-green text-cone-green'
                  : 'border-transparent text-gray-500 dark:text-gray-300 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Database className="w-4 h-4 inline mr-2" />
              Data Management
            </button>
            
            {/* Add Cone Button */}
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="ml-8 inline-flex items-center px-4 py-2 bg-cone-green text-white rounded-md hover:bg-green-600 transition-colors cone-shadow"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Cone
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'dashboard' && (
          <div className="space-y-8">
            {/* Error Banner */}
            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="text-red-500 text-xl mr-2">⚠️</div>
                    <div>
                      <p className="text-red-800 dark:text-red-200 font-medium">Some data failed to load</p>
                      <p className="text-red-600 dark:text-red-300 text-sm">{error}</p>
                    </div>
                  </div>
                  <button
                    onClick={handleRetry}
                    className="bg-red-500 text-white px-3 py-1 rounded text-sm hover:bg-red-600 transition-colors flex items-center"
                  >
                    <RefreshCw className="w-3 h-3 mr-1" />
                    Retry
                  </button>
                </div>
              </div>
            )}

            {/* Stats Cards */}
            {stats && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatsCard
                  title="Total Cones"
                  value={stats.total}
                  icon={ChartNoAxesColumnIncreasing}
                  color="border-l-green-500"
                />
                <StatsCard
                  title="Today"
                  value={stats.today}
                  icon={Sunrise}
                  color="border-l-blue-500"
                />
                <StatsCard
                  title="This Week"
                  value={stats.thisWeek}
                  icon={History}
                  color="border-l-purple-500"
                />
                <StatsCard
                  title="This Month"
                  value={stats.thisMonth}
                  icon={CalendarDays}
                  color="border-l-orange-500"
                />
              </div>
            )}

            {/* Average Stats */}
            {stats && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Daily Average</h3>
                  <p className="text-3xl font-bold text-cone-green">
                    {stats.averagePerDay.toFixed(1)}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">cones per day</p>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Weekly Average</h3>
                  <p className="text-3xl font-bold text-cone-green">
                    {stats.averagePerWeek.toFixed(1)}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">cones per week</p>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Monthly Average</h3>
                  <p className="text-3xl font-bold text-cone-green">
                    {stats.averagePerMonth.toFixed(1)}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">cones per month</p>
                </div>
              </div>
            )}

            {/* Cone List */}
            <ConeList cones={cones} onConesChanged={handleConeUpdated} />
          </div>
        )}

        {activeTab === 'analytics' && analysis && (
          <Analytics analysis={analysis} />
        )}

        {activeTab === 'data' && (
          <DataManagement onDataImported={handleDataImported} />
        )}
      </main>

      {/* Add Cone Modal */}
      <AddConeModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onConeAdded={handleConeAdded}
      />

      {/* Mobile Debug Component */}
      <MobileDebug 
        isVisible={showDebug} 
        onClose={() => setShowDebug(false)} 
      />
    </div>
  );
}

function App() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <AppContent />
    </div>
  );
}

export default App;
