import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';

// Initialize dark mode from localStorage
const prefersDark = localStorage.getItem('theme') === 'dark';
if (prefersDark) {
	document.documentElement.classList.add('dark');
}

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);
root.render(
  <React.StrictMode>
    <AuthProvider>
      <ProtectedRoute>
        <App />
      </ProtectedRoute>
    </AuthProvider>
  </React.StrictMode>
);

// Temporarily disable service worker to fix API issues
// TODO: Re-enable with proper configuration later
/*
if ('serviceWorker' in navigator) {
	window.addEventListener('load', async () => {
		try {
			// Unregister any existing service workers first
			const registrations = await navigator.serviceWorker.getRegistrations();
			for (const registration of registrations) {
				await registration.unregister();
			}
			
			// Register the new service worker
			await navigator.serviceWorker.register('/service-worker.js');
			console.log('Service worker registered successfully');
		} catch (error) {
			console.log('Service worker registration failed:', error);
		}
	});
}
*/
