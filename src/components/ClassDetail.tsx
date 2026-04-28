import React, { useState, useMemo, useEffect } from 'react';
import { ClassData, Student, Reason, MonthlyData } from '../types';
import { ArrowLeft, Search, CheckCircle2, Save, FileText, Filter, Loader2 } from 'lucide-react';
import { cn } from '../lib/utils';

interface ClassDetailProps {
  classData: ClassData;
  monthData: MonthlyData;
  isUnlocked: boolean;
  isSaving: boolean;
  onUnlock: () => void;
  onBack: () => void;
  onUpdateReason: (studentId: string, reason: Reason) => void;
  onUpdateDays: (studentId: string, days: number | '') => void;
  onSaveClass: () => void;
  onLetterModule: (studentId: string) => void;
}

const MONTH_NAMES = [
  'Januari', 'Februari', 'Mac', 'April', 'Mei', 'Jun',
  'Julai', 'Ogos', 'September', 'Oktober', 'November', 'Disember'
];

type FilterType = 'SEMUA' | '3_HARI' | 'SUDAH_DITANDA' | 'BELUM_DITANDA';

export function ClassDetail({ 
  classData, 
  monthData, 
  isUnlocked, 
  isSaving, 
  onUnlock, 
  onBack, 
  onUpdateReason, 
  onUpdateDays, 
  onSaveClass,
  onLetterModule 
}: ClassDetailProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<FilterType>('SEMUA');
  const [isEditMode, setIsEditMode] = useState(!monthData.isCompleted || isUnlocked);

  useEffect(() => {
    if (isUnlocked) {
      setIsEditMode(true);
    }
  }, [isUnlocked]);

  const monthName = MONTH_NAMES[monthData.month];

  const filteredStudents = useMemo(() => {
    return monthData.students.filter(student => {
      const matchSearch = student.name.toLowerCase().includes(searchQuery.toLowerCase());
      if (!matchSearch) return false;

      const hasCase = typeof student.consecutiveAbsentDays === 'number' && student.consecutiveAbsentDays >= 3;

      switch (filter) {
        case '3_HARI':
          return hasCase;
        case 'SUDAH_DITANDA':
          return hasCase && student.reason !== null;
        case 'BELUM_DITANDA':
          return hasCase && student.reason === null;
        case 'SEMUA':
        default:
          return true;
      }
    });
  }, [monthData.students, searchQuery, filter]);

  const handleReasonChange = (studentId: string, reason: Reason) => {
    onUpdateReason(studentId, reason);
  };

  const handleFinalSave = () => {
    onSaveClass();
    setIsEditMode(false);
  };

  return (
    <div className="flex flex-col h-screen bg-slate-50 overflow-hidden">
      {/* Header */}
      <div className="bg-slate-900 text-white px-6 py-4 flex flex-col sm:flex-row justify-between items-start sm:items-center shrink-0">
        <div className="flex items-center gap-4">
          <div>
            <h2 className="text-2xl font-black">{classData.name}</h2>
            <p className="text-xs text-blue-300 font-black uppercase tracking-widest">
              {monthData.isCompleted ? "REKOD BULANAN (PAPARAN SAHAJA)" : `BULAN ${monthName} 2026`}
            </p>
          </div>
          {monthData.isCompleted && (
            <div className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-3 py-1 rounded-md text-[10px] font-black uppercase tracking-tighter flex items-center gap-2">
              <CheckCircle2 className="w-3.5 h-3.5" /> REKOD SELESAI
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          {monthData.isCompleted && (
            <span className="hidden md:inline-block text-[10px] font-black uppercase text-emerald-400/60 bg-emerald-400/5 px-2 py-1 rounded border border-emerald-400/10 tracking-widest">
              MOD PAPARAN SAHAJA
            </span>
          )}
          <button 
            onClick={onBack}
            className="text-white/60 hover:text-white flex items-center gap-2 text-sm font-bold bg-white/10 hover:bg-white/20 transition-colors px-3 py-1.5 rounded-md mt-4 sm:mt-0"
          >
            <ArrowLeft className="w-4 h-4" /> KEMBALI
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-auto bg-slate-50">
        <div className="max-w-7xl mx-auto p-4 md:p-6 w-full flex flex-col gap-4">
          {/* Controls */}
          <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-sm flex flex-col-reverse md:flex-row justify-between items-start md:items-center gap-4">
            <div className="flex flex-wrap gap-2">
              {[
                { id: 'SEMUA', label: 'SEMUA MURID' },
                { id: '3_HARI', label: '3 HARI BERTURUT-TURUT' },
                { id: 'BELUM_DITANDA', label: 'BELUM DITANDA' },
              ].map(f => (
                <button
                  key={f.id}
                  onClick={() => setFilter(f.id as FilterType)}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-[10px] font-black shadow-sm transition-all border tracking-tight",
                    filter === f.id ? "bg-slate-800 text-white border-slate-800" : "bg-white border-slate-200 text-slate-500 hover:bg-slate-50"
                  )}
                >
                  {f.label}
                </button>
              ))}
            </div>
            
            <div className="relative w-full md:w-auto">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input 
                type="text" 
                placeholder="Cari nama murid..."
                className="bg-white border border-slate-200 rounded-lg py-1.5 pl-9 pr-3 text-sm w-full md:w-64 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          {/* Table */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden w-full">
            <div className="overflow-x-auto w-full">
              <table className="w-full text-left border-collapse">
                <thead className="bg-slate-50 border-b border-slate-200 text-[10px] text-slate-400 font-black uppercase tracking-widest">
                  <tr>
                    <th className="px-6 py-3 w-16 text-center">BIL</th>
                    <th className="px-6 py-3">NAMA MURID</th>
                    <th className="px-6 py-3 w-40 text-center">BIL. HARI BERTURUT TIDAK HADIR</th>
                    <th className="px-6 py-3 w-48">STATUS KES</th>
                    <th className="px-6 py-3 w-56">PILIHAN ALASAN</th>
                    <th className="px-6 py-3 w-48 text-right">TINDAKAN</th>
                  </tr>
                </thead>
                <tbody className="text-sm divide-y divide-slate-100">
                  {filteredStudents.length > 0 ? (
                    filteredStudents.map((student, idx) => {
                      const hasCase = typeof student.consecutiveAbsentDays === 'number' && student.consecutiveAbsentDays >= 3;
                      const partialCase = typeof student.consecutiveAbsentDays === 'number' && student.consecutiveAbsentDays > 0 && student.consecutiveAbsentDays < 3;
                      
                      return (
                        <tr key={student.id} className={cn(hasCase ? "bg-red-50/20" : "")}>
                          <td className="px-6 py-4 font-mono text-xs text-slate-400 text-center">
                            {(idx + 1).toString().padStart(2, '0')}
                          </td>
                          <td className="px-6 py-4">
                            <span className={cn("font-bold tracking-tight", hasCase ? "text-red-900" : "text-slate-800 uppercase")}>
                              {student.name}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <input
                              type="number"
                              min="0"
                              placeholder="0"
                              value={student.consecutiveAbsentDays}
                              onChange={(e) => {
                                const val = e.target.value === '' ? '' : parseInt(e.target.value, 10);
                                onUpdateDays(student.id, val);
                              }}
                              disabled={!isEditMode}
                              className={cn(
                                "w-16 rounded-lg border-2 px-2 py-1.5 text-sm font-black text-center outline-none transition-all",
                                hasCase ? "border-red-200 bg-red-50 text-red-700" : "border-slate-100 bg-slate-50",
                                !isEditMode && "opacity-50 grayscale cursor-not-allowed"
                              )}
                            />
                          </td>
                          <td className="px-6 py-4">
                            {hasCase ? (
                              <span className="inline-flex items-center gap-1 bg-red-600 text-white px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-tighter">
                                3 HARI BERTURUT
                              </span>
                            ) : partialCase ? (
                              <span className="text-[10px] font-bold text-amber-500 bg-amber-50 px-2 py-0.5 rounded">BUKAN KES</span>
                            ) : (
                              <span className="text-[10px] font-bold text-slate-300">TIADA KES</span>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            {hasCase ? (
                              <select
                                className={cn(
                                  "w-full rounded-lg border-2 px-2 py-1.5 text-[11px] font-black outline-none transition-all",
                                  student.reason === null 
                                    ? "bg-white border-red-200 text-red-500" 
                                    : "bg-emerald-50 border-emerald-200 text-emerald-800",
                                  !isEditMode && "opacity-50 cursor-not-allowed"
                                )}
                                value={student.reason || ''}
                                onChange={(e) => handleReasonChange(student.id, e.target.value as Reason)}
                                disabled={!isEditMode}
                              >
                                <option value="" disabled>PILIH ALASAN...</option>
                                <option value="ADA ALASAN">ADA ALASAN</option>
                                <option value="TIADA ALASAN">TIADA ALASAN</option>
                              </select>
                            ) : (
                              <span className="text-[10px] font-black text-slate-300 italic uppercase">TIDAK PERLU ISI</span>
                            )}
                          </td>
                          <td className="px-6 py-4 text-right">
                            {!isEditMode && hasCase && student.reason === 'TIADA ALASAN' ? (
                              <button 
                                onClick={() => onLetterModule(student.id)}
                                className="inline-flex items-center gap-2 bg-slate-900 text-white hover:bg-slate-800 px-3 py-1.5 rounded-lg text-[10px] font-black shadow-sm transition-all uppercase tracking-tighter"
                              >
                                <FileText className="w-3.5 h-3.5" /> SISTEM SURAT
                              </button>
                            ) : (
                              <div className="h-8" />
                            )}
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={6} className="px-6 py-20 text-center opacity-30">
                        <Search className="w-12 h-12 mx-auto mb-2" />
                        <p className="text-xs font-black uppercase tracking-widest">Tiada murid ditemui</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Action Footer */}
          {!monthData.isCompleted ? (
            <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-center gap-6">
              <div className="space-y-1 text-center md:text-left">
                <h4 className="text-sm font-black text-slate-800 uppercase">{isEditMode ? "TINDAKAN DIPERLUKAN" : "DATA TELAH DISAHKAN"}</h4>
                <p className="text-xs text-slate-500 font-medium max-w-md">
                  {isEditMode 
                    ? "Sila isi 'BIL. HARI BERTURUT' dan 'PILIHAN ALASAN' bagi semua kes sebelum menekan butang simpan." 
                    : "Rekod bulan ini telah selesai. Butang 'SISTEM SURAT' dipaparkan untuk murid tanpa alasan."}
                </p>
              </div>
              {isEditMode ? (
                <button 
                  onClick={handleFinalSave}
                  disabled={isSaving}
                  className="w-full md:w-auto px-10 py-3.5 bg-blue-600 text-white rounded-xl font-black text-xs shadow-xl shadow-blue-200 flex items-center justify-center gap-2 hover:bg-blue-700 transition-all active:scale-95 uppercase tracking-widest disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSaving ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )} 
                  {isSaving ? "MENYIMPAN..." : "SIMPAN DATA KELAS"}
                </button>
              ) : (
                <button 
                  onClick={() => setIsEditMode(true)}
                  className="w-full md:w-auto px-10 py-3.5 bg-slate-100 text-slate-600 rounded-xl font-black text-xs hover:bg-slate-200 transition-all active:scale-95 uppercase tracking-widest"
                >
                  KEMASKINI SEMULA
                </button>
              )}
            </div>
          ) : (
            <div className="p-6 bg-emerald-50 rounded-2xl border border-emerald-100 flex flex-col md:flex-row justify-between items-center gap-6">
              <div className="space-y-1 text-center md:text-left">
                <h4 className="text-sm font-black text-emerald-800 uppercase">REKOD DISAHKAN</h4>
                <p className="text-xs text-emerald-600 font-medium max-w-md">
                  Data bagi bulan {monthName} telah disahkan dan dikunci. Anda hanya boleh melihat rekod dan mencetak surat jika perlu.
                </p>
              </div>
              
              {!isEditMode ? (
                <button 
                  onClick={onUnlock}
                  disabled={isSaving}
                  className="w-full md:w-auto px-10 py-3.5 bg-emerald-600 text-white rounded-xl font-black text-xs shadow-xl shadow-emerald-200 flex items-center justify-center gap-2 hover:bg-emerald-700 transition-all active:scale-95 uppercase tracking-widest disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Save className="w-4 h-4" /> KEMASKINI DATA
                </button>
              ) : (
                <button 
                  onClick={handleFinalSave}
                  disabled={isSaving}
                  className="w-full md:w-auto px-10 py-3.5 bg-blue-600 text-white rounded-xl font-black text-xs shadow-xl shadow-blue-200 flex items-center justify-center gap-2 hover:bg-blue-700 transition-all active:scale-95 uppercase tracking-widest disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSaving ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  {isSaving ? "MENYIMPAN..." : "SIMPAN PERUBAHAN"}
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
