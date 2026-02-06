'use client';

import { useState, useCallback, useRef } from 'react';
import { 
  Download, 
  Upload, 
  FileJson, 
  FileSpreadsheet,
  Trash2,
  AlertTriangle,
  Check,
  X,
  Loader2,
  Database,
  Save
} from 'lucide-react';
import { 
  exportAllData, 
  importData, 
  getAllCreativeItems,
  deleteCreativeItem,
  downloadExport,
  type ExportData
} from '@/lib/storage';

interface DataManagerProps {
  onDataChanged?: () => void;
}

export function DataManager({ onDataChanged }: DataManagerProps) {
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [showConfirmClear, setShowConfirmClear] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Show temporary message
  const showMessage = useCallback((type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 3000);
  }, []);

  // Export as JSON
  const handleExportJSON = async () => {
    setIsExporting(true);
    try {
      const data = await exportAllData();
      downloadExport(data);
      showMessage('success', 'Data exported successfully');
    } catch (err) {
      showMessage('error', 'Failed to export data');
    } finally {
      setIsExporting(false);
    }
  };

  // Export as CSV
  const handleExportCSV = async () => {
    setIsExporting(true);
    try {
      const items = await getAllCreativeItems();
      
      // Build CSV content
      const headers = ['ID', 'Created At', 'Updated At', 'Tags', 'Natural Prompt', 'Subject', 'Environment', 'Composition', 'Lighting', 'Mood', 'Style', 'Camera', 'Color'];
      const rows = items.map(item => [
        item.id,
        new Date(item.createdAt).toISOString(),
        new Date(item.updatedAt).toISOString(),
        item.tags.join(', '),
        item.naturalPrompt,
        item.prompt.subject || '',
        item.prompt.environment || '',
        item.prompt.composition || '',
        item.prompt.lighting || '',
        item.prompt.mood || '',
        item.prompt.style || '',
        item.prompt.camera || '',
        item.prompt.color || ''
      ]);

      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${cell.replace(/"/g, '""')}"`).join(','))
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `liquid-memory-export-${Date.now()}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      showMessage('success', 'CSV exported successfully');
    } catch (err) {
      showMessage('error', 'Failed to export CSV');
    } finally {
      setIsExporting(false);
    }
  };

  // Import from JSON
  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    setImportProgress(0);

    try {
      const text = await file.text();
      const data: ExportData = JSON.parse(text);

      // Validate data structure
      if (!data.version || !Array.isArray(data.items)) {
        throw new Error('Invalid data format');
      }

      const result = await importData(data);
      
      if (result.success) {
        showMessage('success', `Imported ${result.imported} items successfully`);
        onDataChanged?.();
      } else {
        showMessage('error', `Imported with ${result.errors.length} errors`);
      }
    } catch (err) {
      showMessage('error', err instanceof Error ? err.message : 'Failed to import data');
    } finally {
      setIsImporting(false);
      setImportProgress(0);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Clear all data
  const handleClearAll = async () => {
    try {
      const items = await getAllCreativeItems();
      for (const item of items) {
        await deleteCreativeItem(item.id);
      }
      showMessage('success', 'All data cleared');
      onDataChanged?.();
      setShowConfirmClear(false);
    } catch (err) {
      showMessage('error', 'Failed to clear data');
    }
  };

  return (
    <div className="space-y-6">
      {/* Message */}
      {message && (
        <div className={`p-4 rounded-xl flex items-center gap-3 ${
          message.type === 'success' 
            ? 'bg-green-500/10 border border-green-500/20 text-green-400'
            : 'bg-red-500/10 border border-red-500/20 text-red-400'
        }`}>
          {message.type === 'success' ? <Check className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
          <span>{message.text}</span>
        </div>
      )}

      {/* Export Section */}
      <div className="p-6 rounded-xl bg-white/5 border border-white/10">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-lg bg-cyan-500/20">
            <Download className="w-5 h-5 text-cyan-400" />
          </div>
          <h3 className="text-lg font-medium text-white">Export Data</h3>
        </div>
        
        <p className="text-sm text-white/50 mb-4">
          Export your creative library for backup or analysis
        </p>

        <div className="flex flex-wrap gap-3">
          <button
            onClick={handleExportJSON}
            disabled={isExporting}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white/80 hover:bg-white/10 transition-colors disabled:opacity-50"
          >
            {isExporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileJson className="w-4 h-4" />}
            Export JSON
          </button>
          
          <button
            onClick={handleExportCSV}
            disabled={isExporting}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white/80 hover:bg-white/10 transition-colors disabled:opacity-50"
          >
            {isExporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileSpreadsheet className="w-4 h-4" />}
            Export CSV
          </button>
        </div>
      </div>

      {/* Import Section */}
      <div className="p-6 rounded-xl bg-white/5 border border-white/10">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-lg bg-purple-500/20">
            <Upload className="w-5 h-5 text-purple-400" />
          </div>
          <h3 className="text-lg font-medium text-white">Import Data</h3>
        </div>
        
        <p className="text-sm text-white/50 mb-4">
          Import previously exported data or migrate from another source
        </p>

        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          onChange={handleImport}
          className="hidden"
        />

        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={isImporting}
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-purple-500/20 border border-purple-500/30 text-purple-400 hover:bg-purple-500/30 transition-colors disabled:opacity-50"
        >
          {isImporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Database className="w-4 h-4" />}
          {isImporting ? 'Importing...' : 'Select JSON File'}
        </button>

        {isImporting && (
          <div className="mt-4">
            <div className="h-2 bg-white/10 rounded-full overflow-hidden">
              <div 
                className="h-full bg-purple-500 transition-all duration-300"
                style={{ width: `${importProgress}%` }}
              />
            </div>
            <p className="text-xs text-white/40 mt-2">Processing...</p>
          </div>
        )}
      </div>

      {/* Danger Zone */}
      <div className="p-6 rounded-xl bg-red-500/5 border border-red-500/20">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-lg bg-red-500/20">
            <Trash2 className="w-5 h-5 text-red-400" />
          </div>
          <h3 className="text-lg font-medium text-white">Danger Zone</h3>
        </div>
        
        <p className="text-sm text-white/50 mb-4">
          These actions cannot be undone. Make sure you have a backup.
        </p>

        {!showConfirmClear ? (
          <button
            onClick={() => setShowConfirmClear(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-red-500/20 border border-red-500/30 text-red-400 hover:bg-red-500/30 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            Clear All Data
          </button>
        ) : (
          <div className="flex items-center gap-3 p-4 rounded-lg bg-red-500/10 border border-red-500/20">
            <AlertTriangle className="w-5 h-5 text-red-400" />
            <div className="flex-1">
              <p className="text-sm text-white/80">Are you sure? This will delete all your data.</p>
            </div>
            <button
              onClick={handleClearAll}
              className="px-3 py-1.5 rounded-lg bg-red-500 text-white text-sm hover:bg-red-600 transition-colors"
            >
              Yes, Clear
            </button>
            <button
              onClick={() => setShowConfirmClear(false)}
              className="px-3 py-1.5 rounded-lg bg-white/10 text-white/70 text-sm hover:bg-white/20 transition-colors"
            >
              Cancel
            </button>
          </div>
        )}
      </div>

      {/* Backup Reminder */}
      <div className="p-4 rounded-xl bg-yellow-500/5 border border-yellow-500/20 flex items-start gap-3">
        <Save className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
        <div>
          <h4 className="text-sm font-medium text-white/90">Backup Reminder</h4>
          <p className="text-xs text-white/50 mt-1">
            We recommend exporting your data regularly. All data is stored locally in your browser and may be lost if you clear your browsing data.
          </p>
        </div>
      </div>
    </div>
  );
}
