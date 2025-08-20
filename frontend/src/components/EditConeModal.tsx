import React, { useState, useEffect } from 'react';
import { X, Save, Clock, FileText } from 'lucide-react';
import { Cone } from '../types';
import { ConeAPI } from '../api';

interface EditConeModalProps {
  isOpen: boolean;
  cone: Cone | null;
  onClose: () => void;
  onConeUpdated: () => void;
}

export const EditConeModal: React.FC<EditConeModalProps> = ({ isOpen, cone, onClose, onConeUpdated }) => {
  const [timestamp, setTimestamp] = useState('');
  const [notes, setNotes] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (cone) {
      // Convert ISO timestamp to datetime-local format
      const date = new Date(cone.timestamp);
      const localDateTime = new Date(date.getTime() - date.getTimezoneOffset() * 60000)
        .toISOString()
        .slice(0, 16);
      setTimestamp(localDateTime);
      setNotes(cone.notes || '');
    }
  }, [cone]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cone) return;
    
    setIsLoading(true);
    
    try {
      const updates: Partial<Cone> = {};
      
      if (timestamp) {
        updates.timestamp = new Date(timestamp).toISOString();
      }
      
      if (notes !== cone.notes) {
        updates.notes = notes;
      }
      
      if (Object.keys(updates).length > 0) {
        await ConeAPI.updateCone(cone.id, updates);
        onConeUpdated();
        onClose();
      }
    } catch (error) {
      console.error('Failed to update cone:', error);
      alert('Failed to update cone. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen || !cone) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900">Edit Cone</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Clock className="w-4 h-4 inline mr-2" />
              Time
            </label>
            <input
              type="datetime-local"
              value={timestamp}
              onChange={(e) => setTimestamp(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-cone-green focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <FileText className="w-4 h-4 inline mr-2" />
              Notes
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Any notes about this cone..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-cone-green focus:border-transparent"
            />
          </div>

          <div className="text-sm text-gray-500">
            <p>Original time: {new Date(cone.timestamp).toLocaleString()}</p>
            <p>Created: {new Date(cone.createdAt).toLocaleString()}</p>
          </div>

          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 px-4 py-2 bg-cone-green text-white rounded-md hover:bg-cone-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {isLoading ? (
                'Saving...'
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save Changes
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
