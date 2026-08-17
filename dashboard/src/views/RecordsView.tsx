import React, { useState } from 'react';
import {
  FileText,
  Download,
  Upload,
  Search,
  Eye
} from 'lucide-react';
import type { HealthRecord } from '../types';

interface RecordsViewProps {
  records: HealthRecord[];
  onUploadRecord: (record: HealthRecord) => void;
  showToast: (msg: string, type?: 'info' | 'success') => void;
}

export const RecordsView: React.FC<RecordsViewProps> = ({
  records,
  onUploadRecord,
  showToast
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [isUploading, setIsUploading] = useState(false);

  const categories = ['All', 'Lab Diagnostics', 'Clinical Notes', 'Cardiology Report'];

  const filteredRecords = records.filter(rec => {
    const matchesSearch = rec.title.toLowerCase().includes(searchQuery.toLowerCase()) || rec.provider.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || rec.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleSimulatedUpload = () => {
    setIsUploading(true);
    setTimeout(() => {
      const newRec: HealthRecord = {
        id: `rec-${Date.now().toString().slice(-4)}`,
        title: 'Patient Self-Uploaded Telemetry & Health Document',
        category: 'Clinical Notes',
        date: 'Today, Aug 14',
        provider: 'Verified Client Enclave Upload',
        fileSize: '1.8 MB',
        hash: `SHA256: 0x${Math.random().toString(16).substring(2, 8)}...${Math.random().toString(16).substring(2, 6)}`,
        status: 'Verified'
      };
      onUploadRecord(newRec);
      setIsUploading(false);
      showToast("Document encrypted with AES-256 and stored in vault!", "success");
    }, 1400);
  };

  const card3dClass = `bg-white/80 dark:bg-slate-950/40 border border-slate-200/60 dark:border-slate-800/40 shadow-[inset_0_2px_4px_rgba(0,0,0,0.04),0_1px_1.5px_rgba(255,255,255,0.9)] dark:shadow-[inset_0_2px_4px_rgba(0,0,0,0.3)] rounded-2xl p-4 transition-all duration-200 text-left`;

  return (
    <div className="max-w-6xl mx-auto space-y-5 text-left">
      
      {/* Header Card */}
      <div className={`${card3dClass} flex flex-col md:flex-row md:items-center justify-between gap-3 p-4`}>
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0">
            <FileText size={16} />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-100 leading-tight">Health Records Vault</h2>
              <span className="text-[8px] font-bold px-1.5 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-450 border border-emerald-100/50 dark:border-emerald-900/30">
                AES-256 Sharded
              </span>
            </div>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5 leading-normal">
              Immutable diagnostic history, lab results, and physician notes protected by zero-knowledge architecture.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleSimulatedUpload}
            disabled={isUploading}
            className="px-3 py-1.5 rounded-xl bg-primary hover:bg-[#1f60b5] text-white text-[10px] font-semibold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer border border-primary/20"
          >
            <div className="w-4.5 h-4.5 rounded bg-white/20 flex items-center justify-center">
              <Upload size={11} />
            </div>
            <span>{isUploading ? 'Encrypting...' : 'Upload Document'}</span>
          </button>
        </div>
      </div>

      {/* Search & Category Filter Toolbar */}
      <div className={`${card3dClass} p-3 flex flex-col sm:flex-row items-center justify-between gap-3`}>
        <div className="relative w-full sm:w-72">
          <div className="absolute left-2.5 top-1/2 -translate-y-1/2 w-5.5 h-5.5 rounded bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 dark:text-slate-500">
            <Search size={11} />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search records by title or hospital..."
            className="w-full pl-10 pr-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent text-[10.5px] font-medium text-slate-700 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20"
          />
        </div>

        <div className="flex items-center gap-1 overflow-x-auto w-full sm:w-auto">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-2.5 py-1 rounded-xl text-[10px] font-semibold transition-colors shrink-0 cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-primary text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-750 border border-slate-200/60 dark:border-slate-750'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Records Table / List */}
      <div className={`${card3dClass} p-0 overflow-hidden`}>
        <div className="divide-y divide-slate-100 dark:divide-slate-850/60">
          {filteredRecords.length === 0 ? (
            <div className="p-10 text-center text-slate-400 dark:text-slate-500 text-[11px] font-semibold">
              No matching records found in encrypted vault.
            </div>
          ) : (
            filteredRecords.map((rec) => (
              <div
                key={rec.id}
                className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/40 dark:hover:bg-slate-950/20 transition-colors"
              >
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/20 text-blue-650 dark:text-blue-450 flex items-center justify-center shrink-0 mt-0.5">
                    <FileText size={15} />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <h4 className="text-[11.5px] font-semibold text-slate-700 dark:text-slate-200">{rec.title}</h4>
                      <span className="text-[8px] font-semibold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200/50 dark:border-slate-700">
                        {rec.category}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">{rec.provider} &bull; {rec.date} &bull; {rec.fileSize}</p>
                    <p className="font-mono text-[9px] text-slate-400 dark:text-slate-650 mt-0.5">HASH: {rec.hash}</p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 self-end sm:self-auto shrink-0">
                  <button
                    onClick={() => showToast(`Decrypted and previewing: ${rec.title}`, "info")}
                    className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 text-slate-600 dark:text-slate-350 text-[10px] font-semibold transition-colors cursor-pointer flex items-center gap-1"
                  >
                    <Eye size={11} />
                    <span>View</span>
                  </button>
                  <button
                    onClick={() => showToast(`Downloaded encrypted file ${rec.title}.`, "success")}
                    className="px-2.5 py-1 rounded-lg bg-primary hover:bg-[#1f60b5] text-white text-[10px] font-semibold transition-colors cursor-pointer flex items-center gap-1 shadow-2xs border border-primary/20"
                  >
                    <Download size={11} />
                    <span>Download</span>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

    </div>
  );
};
