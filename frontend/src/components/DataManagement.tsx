import React, { useState, useRef } from 'react';
import { Download, Upload, AlertCircle, CheckCircle } from 'lucide-react';
import { ConeAPI } from '../api';
import { ExportData } from '../types';

interface DataManagementProps {
  onDataImported: () => void;
}

export const DataManagement: React.FC<DataManagementProps> = ({ onDataImported }) => {
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importMessage, setImportMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const data = await ConeAPI.exportData();
      
      // Create and download file
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `cone-counter-export-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export failed:', error);
      alert('Failed to export data. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    setImportMessage(null);

    try {
      const text = await file.text();
      const data = JSON.parse(text);

      // Validate data structure - handle both old and new formats
      if (!data.cones || !Array.isArray(data.cones)) {
        throw new Error('Invalid file format. Please use a valid export file.');
      }

      // Log the data structure for debugging
      console.log('Import data structure:', {
        version: data.version,
        conesLength: data.cones.length,
        sampleCone: data.cones[0],
        dataKeys: Object.keys(data)
      });

      // Confirm import
      const coneCount = data.cones.length;
      const confirmed = window.confirm(
        `This will import ${coneCount} cones and replace all existing data. Are you sure you want to continue?`
      );

      if (!confirmed) {
        return;
      }

      const result = await ConeAPI.importData(data);
      
      if (result.success) {
        setImportMessage({
          type: 'success',
          text: `Successfully imported ${result.importedCount} cones!`
        });
        onDataImported();
        
        // Clear file input
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      } else {
        throw new Error(result.message || 'Import failed');
      }
    } catch (error) {
      console.error('Import failed:', error);
      setImportMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Failed to import data. Please check the file format.'
      });
    } finally {
      setIsImporting(false);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Data Management</h2>
      
      <div className="space-y-6">
        {/* Export Section */}
        <div className="border border-gray-200 rounded-lg p-4">
          <h3 className="text-lg font-medium text-gray-900 mb-3">Export Data</h3>
          <p className="text-gray-600 mb-4">
            Download all your cone data as a JSON file. This is useful for backups or transferring data to another device.
          </p>
          <button
            onClick={handleExport}
            disabled={isExporting}
            className="inline-flex items-center px-4 py-2 bg-cone-green text-white rounded-md hover:bg-cone-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Download className="w-4 h-4 mr-2" />
            {isExporting ? 'Exporting...' : 'Export Data'}
          </button>
        </div>

        {/* Import Section */}
        <div className="border border-gray-200 rounded-lg p-4">
          <h3 className="text-lg font-medium text-gray-900 mb-3">Import Data</h3>
          <p className="text-gray-600 mb-4">
            Import cone data from a previously exported file. <strong>Warning:</strong> This will replace all existing data.
          </p>
          
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={handleImport}
            className="hidden"
          />
          
          <button
            onClick={triggerFileInput}
            disabled={isImporting}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Upload className="w-4 h-4 mr-2" />
            {isImporting ? 'Importing...' : 'Choose File & Import'}
          </button>

          {importMessage && (
            <div className={`mt-4 p-3 rounded-md flex items-center space-x-2 ${
              importMessage.type === 'success' 
                ? 'bg-green-50 text-green-800 border border-green-200' 
                : 'bg-red-50 text-red-800 border border-red-200'
            }`}>
              {importMessage.type === 'success' ? (
                <CheckCircle className="w-5 h-5" />
              ) : (
                <AlertCircle className="w-5 h-5" />
              )}
              <span>{importMessage.text}</span>
            </div>
          )}
        </div>

        {/* Data Safety Notice */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
            <div>
              <h4 className="text-sm font-medium text-yellow-800">Data Safety Notice</h4>
              <p className="text-sm text-yellow-700 mt-1">
                Always export your data before making major changes. Import operations will replace all existing data, 
                so make sure you have a backup if needed.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
