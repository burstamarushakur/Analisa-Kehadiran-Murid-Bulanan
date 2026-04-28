import React from 'react';
import { Calendar, CheckCircle2, XCircle, Clock, Lock, ChevronRight } from 'lucide-react';
import { DashboardClassSummary } from '../types';
import { cn } from '../lib/utils';

interface DashboardProps {
  classesSummary: DashboardClassSummary[];
  onSelectClass: (classId: string, monthIdx: number) => void;
}

const MONTHS = [
  'Januari', 'Februari', 'Mac', 'April', 'Mei', 'Jun',
  'Julai', 'Ogos', 'September', 'Oktober', 'November', 'Disember'
];

const MONTH_KEYS = [
  'JANUARI', 'FEBRUARI', 'MAC', 'APRIL', 'MEI', 'JUN',
  'JULAI', 'OGOS', 'SEPTEMBER', 'OKTOBER', 'NOVEMBER', 'DISEMBER'
];

export function Dashboard({ classesSummary, onSelectClass }: DashboardProps) {
  return (
    <div className="flex flex-col h-screen overflow-hidden bg-slate-50">
      <header className="bg-white border-b border-slate-200 px-6 py-4 flex flex-col md:flex-row justify-between items-center gap-4 shrink-0 text-center md:text-left">
        <div className="flex flex-col md:flex-row items-center gap-3 md:gap-4">
          <div className="flex items-center justify-center gap-2 h-10 md:h-11">
            <img src="https://i.postimg.cc/3RF9M05N/Logo-SKSA.png" alt="Logo sekolah" className="h-full object-contain" />
            <img src="https://i.postimg.cc/vHfb7N7V/Whats-App-Image-2026-03-04-at-10-00-06.jpg" alt="Logo Unit HEM" className="h-full object-contain" />
          </div>
          <div className="flex flex-col items-center md:items-start">
            <h1 className="text-lg md:text-xl font-black tracking-tight text-slate-800 uppercase leading-tight">ANALISA KEHADIRAN MURID - BULANAN</h1>
            <p className="text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-widest mt-0.5">SEK KEB SUNGAI ABONG</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-6 px-4 py-2 bg-slate-50 rounded-xl border border-slate-200">
          <div className="text-center md:text-left">
            <p className="text-[10px] font-bold text-slate-400 uppercase">Tahun</p>
            <p className="text-sm font-black text-slate-700">2026</p>
          </div>
          <div className="w-px h-6 bg-slate-200" />
          <div className="text-center md:text-left">
            <p className="text-[10px] font-bold text-slate-400 uppercase">Bulan Semasa</p>
            <p className="text-sm font-black text-blue-600">April</p>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-auto p-4 md:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Legend */}
          <div className="flex flex-wrap gap-4 items-center justify-center md:justify-start bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex items-center gap-2 text-xs font-bold text-emerald-600">
              <CheckCircle2 className="w-4 h-4" /> Selesai
            </div>
            <div className="flex items-center gap-2 text-xs font-bold text-red-500">
              <XCircle className="w-4 h-4" /> Belum Lengkap
            </div>
            <div className="flex items-center gap-2 text-xs font-bold text-slate-400">
              <Clock className="w-4 h-4" /> Bulan Semasa
            </div>
            <div className="flex items-center gap-2 text-xs font-bold text-slate-300">
              <Lock className="w-4 h-4" /> Bulan Akan Datang
            </div>
          </div>

          {/* Matrix Header */}
          <div className="hidden lg:grid grid-cols-[200px_1fr] gap-4 px-6 sticky top-0 bg-slate-50 z-10 py-2">
            <div className="text-xs font-black text-slate-400 uppercase">Senarai Kelas</div>
            <div className="grid grid-cols-12 gap-1 text-center">
              {MONTHS.map(m => (
                <div key={m} className="text-[10px] font-black text-slate-400 uppercase">{m.substring(0, 3)}</div>
              ))}
            </div>
          </div>

          {/* Class Matrix Rows */}
          <div className="space-y-3">
            {classesSummary.map((cls) => {
              const status = cls.status_keseluruhan;
              return (
                <div 
                  key={cls.kelas_id} 
                  className="bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all overflow-hidden"
                >
                  <div className="grid grid-cols-1 lg:grid-cols-[200px_1fr] items-center p-3 md:p-4 gap-4">
                    {/* Class Info */}
                    <div className="flex items-center justify-between lg:block space-x-4 lg:space-x-0 border-b lg:border-b-0 lg:border-r border-slate-100 pb-3 lg:pb-0 pr-4">
                      <div>
                        <h3 className="text-xl font-black text-slate-800">{cls.nama_kelas}</h3>
                        <div className={cn(
                          "inline-block px-2 py-0.5 rounded text-[10px] font-bold mt-1",
                          status === 'SELESAI' ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"
                        )}>
                          {status.replace('_', ' ')}
                        </div>
                      </div>
                      <ChevronRight className="lg:hidden text-slate-300" />
                    </div>

                    {/* Monthly Matrix */}
                    <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-12 gap-2 md:gap-3">
                      {MONTH_KEYS.map((mKey, mIdx) => {
                        const mStatus = cls.status_bulanan[mKey];
                        
                        let content;
                        let cellClass = "flex flex-col items-center justify-center p-2 rounded-lg transition-all border-2 ";
                        let clickable = false;

                        if (mStatus === 'SELESAI') {
                          content = <CheckCircle2 className="w-5 h-5 text-emerald-600" />;
                          cellClass += "bg-emerald-50 border-emerald-100 text-emerald-600 cursor-pointer hover:bg-emerald-100 hover:border-emerald-300 active:scale-95";
                          clickable = true;
                        } else if (mStatus === 'BELUM_LENGKAP') {
                          content = <XCircle className="w-5 h-5 text-red-500" />;
                          cellClass += "bg-red-50 border-red-100 text-red-500 cursor-pointer hover:bg-red-100 hover:border-red-300 active:scale-95";
                          clickable = true;
                        } else if (mStatus === 'SEMASA') {
                          content = <Clock className="w-5 h-5 text-slate-400" />;
                          cellClass += "bg-slate-50 border-slate-100 text-slate-400";
                        } else {
                          content = <Lock className="w-4 h-4 text-slate-200" />;
                          cellClass += "bg-slate-50 border-slate-50 text-slate-200";
                        }

                        return (
                          <div 
                            key={mKey} 
                            onClick={() => clickable && onSelectClass(cls.kelas_id, mIdx)}
                            className={cellClass}
                          >
                            <span className="lg:hidden text-[8px] font-bold text-slate-400 uppercase mb-1">{MONTHS[mIdx].substring(0, 3)}</span>
                            {content}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </main>
    </div>
  );
}
