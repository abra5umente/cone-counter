import React, { useState } from 'react';
import { Edit, Trash2, Clock, FileText, Calendar } from 'lucide-react';
import { Cone } from '../types';
import { ConeAPI } from '../api';
import { EditConeModal } from './EditConeModal';

interface ConeListProps {
  cones: Cone[];
  onConesChanged: () => void;
}

export const ConeList: React.FC<ConeListProps> = ({ cones, onConesChanged }) => {
  const [editingCone, setEditingCone] = useState<Cone | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const handleEdit = (cone: Cone) => {
    setEditingCone(cone);
    setIsEditModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this cone?')) {
      try {
        await ConeAPI.deleteCone(id);
        onConesChanged();
      } catch (error) {
        console.error('Failed to delete cone:', error);
        alert('Failed to delete cone. Please try again.');
      }
    }
  };

  const handleConeUpdated = () => {
    onConesChanged();
  };

  if (cones.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-400 mb-4">
          <Clock className="w-16 h-16 mx-auto" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">No cones yet</h3>
        <p className="text-gray-500">Start tracking your cones by adding your first one!</p>
      </div>
    );
  }

  return (
    <>
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Recent Cones</h3>
        </div>
        <div className="divide-y divide-gray-200">
          {cones.map((cone) => (
            <div key={cone.id} className="px-6 py-4 hover:bg-gray-50 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center space-x-2 text-sm text-gray-500">
                      <Calendar className="w-4 h-4" />
                      <span>{new Date(cone.date).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center space-x-2 text-sm text-gray-500">
                      <Clock className="w-4 h-4" />
                      <span>{cone.time}</span>
                    </div>
                    <span className="text-sm text-gray-400">•</span>
                    <span className="text-sm font-medium text-gray-700">{cone.dayOfWeek}</span>
                  </div>
                  
                  {cone.notes && (
                    <div className="mt-2 flex items-start space-x-2">
                      <FileText className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                      <p className="text-sm text-gray-600">{cone.notes}</p>
                    </div>
                  )}
                </div>
                
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleEdit(cone)}
                    className="p-2 text-gray-400 hover:text-cone-green hover:bg-cone-light rounded-md transition-colors"
                    title="Edit cone"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(cone.id)}
                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                    title="Delete cone"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <EditConeModal
        isOpen={isEditModalOpen}
        cone={editingCone}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditingCone(null);
        }}
        onConeUpdated={handleConeUpdated}
      />
    </>
  );
};
