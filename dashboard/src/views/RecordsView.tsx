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

  return (
    <div className="max-w-6xl mx-auto space-y-8 text-left">
      
      {/* Header */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-primary/10 border border-primary/25 flex items-center justify-center text-primary shrink-0 mt-0.5">
            <FileText size={22} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl sm:text-2xl font-bold text-navy">Health Records Vault</h2>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                AES-256 Sharded
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Immutable diagnostic history, lab results, and physician notes protected by zero-knowledge architecture.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleSimulatedUpload}
            disabled={isUploading}
            className="px-4 py-2.5 rounded-xl bg-primary hover:bg-[#1f60b5] text-white text-xs font-bold transition-all shadow-xs flex items-center gap-2 cursor-pointer border border-primary/30"
          >
            <div className="w-5 h-5 rounded-md bg-white/20 flex items-center justify-center">
              <Upload size={12} />
            </div>
            <span>{isUploading ? 'Encrypting & Storing...' : 'Upload Document'}</span>
          </button>
        </div>
      </div>

      {/* Search & Category Filter Toolbar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <div className="absolute left-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-md bg-slate-100 flex items-center justify-center text-slate-500">
            <Search size={13} />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search records by title or hospital..."
            className="w-full pl-11 pr-4 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:border-primary"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors shrink-0 cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-primary text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-200/80'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Records Table / List */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs overflow-hidden">
        <div className="divide-y divide-slate-100">
          {filteredRecords.length === 0 ? (
            <div className="p-12 text-center text-slate-400 text-xs font-semibold">
              No matching records found in encrypted vault.
            </div>
          ) : (
            filteredRecords.map((rec) => (
              <div
                key={rec.id}
                className="p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/70 transition-colors"
              >
                <div className="flex items-start gap-4">
                  <div className="w-11 h-11 rounded-2xl bg-blue-100 border border-blue-200 text-blue-700 flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
                    <FileText size={20} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold text-navy">{rec.title}</h4>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 border border-slate-200/60">
                        {rec.category}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">{rec.provider} &bull; {rec.date} &bull; {rec.fileSize}</p>
                    <p className="font-mono text-[10px] text-slate-400 mt-1">HASH: {rec.hash}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-auto">
                  <button
                    onClick={() => showToast(`Decrypted and previewing: ${rec.title}`, "info")}
                    className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5"
                  >
                    <Eye size={13} />
                    <span>View</span>
                  </button>
                  <button
                    onClick={() => showToast(`Downloaded encrypted file ${rec.title}.`, "success")}
                    className="px-3 py-1.5 rounded-xl bg-primary hover:bg-[#1f60b5] text-white text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 shadow-2xs"
                  >
                    <Download size={13} />
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
