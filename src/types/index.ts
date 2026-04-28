export type Reason = 'ADA ALASAN' | 'TIADA ALASAN' | null;

export interface Student {
  id: string;
  name: string;
  consecutiveAbsentDays: number | '';
  reason: Reason;
}

export interface MonthlyData {
  month: number; // 0-11
  isCompleted: boolean;
  students: Student[];
}

export interface ClassData {
  id: string;
  name: string;
  monthlyRecords: MonthlyData[];
}

export type ClassStatus = 'BELUM SEMAK' | 'SEBAHAGIAN' | 'SELESAI' | 'TIADA KES';

export type MonthStatus = 'SELESAI' | 'BELUM_LENGKAP' | 'SEMASA' | 'AKAN_DATANG';

export interface DashboardClassSummary {
  kelas_id: string;
  nama_kelas: string;
  status_keseluruhan: 'SELESAI' | 'BELUM_SELESAI';
  status_bulanan: {
    [key: string]: MonthStatus;
  };
}

export interface SuratDraft {
  murid_id: string;
  nama_murid: string;
  kelas_id: string;
  nama_kelas: string;
  jenis_amaran: string;
  no_rujukan_surat?: string;
  tarikh_surat: string;
  tarikh_mula: string;
  tarikh_akhir: string;
  bilangan_hari: number;
  nama_penjaga: string;
  alamat_1: string;
  alamat_2: string;
  alamat_3: string;
  alamat_4: string;
}

export interface SuratLatest {
  surat_id: string;
  jenis_amaran: string;
  tarikh_surat: string;
  [key: string]: any;
}

export interface SuratContext {
  draft: SuratDraft;
  latest: SuratLatest | null;
}
