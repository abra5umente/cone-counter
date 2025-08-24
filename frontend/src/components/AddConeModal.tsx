import React, { useState } from 'react';
import { X, Plus, Clock, FileText } from 'lucide-react';
import { ConeAPI } from '../api';

interface AddConeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConeAdded: () => void;
}

export const AddConeModal: React.FC<AddConeModalProps> = ({ isOpen, onClose, onConeAdded }) => {
  const [timestamp, setTimestamp] = useState('');
  const [notes, setNotes] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      await ConeAPI.addCone(timestamp || undefined, notes || undefined);
      setTimestamp('');
      setNotes('');
      onConeAdded();
      onClose();
    } catch (error) {
      console.error('Failed to add cone:', error);
      alert('Failed to add cone. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md mx-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Add New Cone</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <Clock className="w-4 h-4 inline mr-2" />
              Time (optional - defaults to now)
            </label>
            <input
              type="datetime-local"
              value={timestamp}
              onChange={(e) => setTimestamp(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cone-green focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <FileText className="w-4 h-4 inline mr-2" />
              Notes (optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Any notes about this cone..."
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cone-green focus:border-transparent"
            />
          </div>

          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 px-4 py-2 bg-cone-green text-white rounded-md hover:bg-cone-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {isLoading ? (
                'Adding...'
              ) : (
                <>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Cone
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
