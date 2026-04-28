import { DashboardClassSummary, Student, Reason, SuratContext } from '../types';

const BASE_URL = '/api/gas-proxy';

export async function fetchDashboardData(tahun: number = 2026): Promise<DashboardClassSummary[]> {
  try {
    const response = await fetch(`${BASE_URL}?action=getDashboardTahun&tahun=${tahun}`);
    const result = await response.json();
    
    if (result.ok) {
      return result.data;
    } else {
      throw new Error(result.message || 'Gagal memuatkan data dashboard');
    }
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    throw error;
  }
}

const MONTH_NAMES = [
  'JANUARI', 'FEBRUARI', 'MAC', 'APRIL', 'MEI', 'JUN',
  'JULAI', 'OGOS', 'SEPTEMBER', 'OKTOBER', 'NOVEMBER', 'DISEMBER'
];

export async function fetchClassMonthlyData(kelas_id: string, monthIdx: number, tahun: number = 2026): Promise<Student[]> {
  try {
    const bulan = MONTH_NAMES[monthIdx];
    const response = await fetch(`${BASE_URL}?action=getPaparanKelasBulan&kelas_id=${kelas_id}&tahun=${tahun}&bulan=${bulan}`);
    const result = await response.json();

    if (result.ok) {
      return result.data.map((m: any) => ({
        id: m.murid_id,
        name: m.nama_murid,
        consecutiveAbsentDays: m.bil_hari_berturut_turut === "" ? "" : Number(m.bil_hari_berturut_turut),
        reason: m.pilihan_alasan === "ADA ALASAN" || m.pilihan_alasan === "TIADA ALASAN" ? m.pilihan_alasan as Reason : null
      }));
    } else {
      throw new Error(result.message || 'Gagal memuatkan rekod bulanan');
    }
  } catch (error) {
    console.error('Error fetching class monthly data:', error);
    throw error;
  }
}

export async function validatePassword(kelas_id: string, kata_laluan: string): Promise<boolean> {
  try {
    const response = await fetch(BASE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'validatePassword',
        kelas_id,
        kata_laluan
      })
    });
    const result = await response.json();
    console.log("VALIDATE PASSWORD RESPONSE:", result);

    if (result === true) return true;

    if (result && typeof result === "object") {
      return (
        result.valid === true ||
        result.data === true ||
        result.result === true ||
        (result.ok === true && result.valid !== false)
      );
    }

    return false;
  } catch (error) {
    console.error('Error validating password:', error);
    throw new Error("Ralat sambungan sistem. Sila cuba lagi.");
  }
}

export async function saveClassMonthlyData(
  tahun: number,
  monthIdx: number,
  kelas_id: string,
  nama_kelas: string,
  students: Student[]
): Promise<any> {
  try {
    const bulan = MONTH_NAMES[monthIdx];
    const items = students.map(s => ({
      murid_id: s.id,
      nama_murid: s.name,
      bil_hari_berturut_turut: s.consecutiveAbsentDays === "" ? 0 : s.consecutiveAbsentDays,
      pilihan_alasan: s.reason || ""
    }));

    const response = await fetch(BASE_URL, {
      method: 'POST',
      body: JSON.stringify({
        action: 'saveRekodKelasBulan',
        tahun: tahun.toString(),
        bulan,
        kelas_id,
        nama_kelas,
        items
      })
    });
    const result = await response.json();
    
    if (result.ok) {
      return result;
    } else {
      throw new Error(result.message || 'Gagal menyimpan rekod');
    }
  } catch (error) {
    console.error('Error saving class monthly data:', error);
    throw error;
  }
}

export async function fetchSuratAmaranContext(murid_id: string): Promise<SuratContext> {
  try {
    const url = `${BASE_URL}?action=getSuratAmaranContext&murid_id=${murid_id}`;
    console.log('FETCH CONTEXT URL:', url);
    
    const response = await fetch(url);
    const rawText = await response.text();
    console.log('RAW CONTEXT RESPONSE TEXT:', rawText);

    let result;
    try {
      result = JSON.parse(rawText);
    } catch (e) {
      throw new Error('Response context bukan JSON yang sah');
    }

    console.log('PARSED CONTEXT RESPONSE:', result);

    // Normalize response: could be {ok, data: {draft, latest}} or {draft, latest} or {ok, draft, latest}
    let contextData = null;
    if (result.ok && result.data) {
      contextData = result.data;
    } else if (result.draft) {
      contextData = result;
    } else if (result.ok && result.draft) {
      // already in result, contextData = result but we might want to clean it
      contextData = result;
    }

    if (contextData && contextData.draft) {
      console.log('NORMALIZED CONTEXT:', contextData);
      return contextData;
    } else {
      throw new Error(result.message || result.error || 'Data context surat tidak lengkap');
    }
  } catch (error) {
    console.error('CONTEXT ERROR:', error);
    throw error;
  }
}


export async function saveGeneratedSuratAmaranPdfToDrive(payload: any): Promise<any> {
  try {
    const response = await fetch(`${BASE_URL}?action=saveGeneratedSuratAmaranPdfToDrive`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'saveGeneratedSuratAmaranPdfToDrive',
        ...payload
      })
    });
    
    const result = await response.json();
    console.log('SAVE TO DRIVE RESPONSE:', result);
    return result;
  } catch (error) {
    console.error('Error saving PDF to Drive:', error);
    throw error;
  }
}

export async function saveSuratAmaran(payload: any): Promise<any> {
  try {
    const response = await fetch(`${BASE_URL}?action=saveSuratAmaran`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'saveSuratAmaran',
        ...payload
      })
    });
    
    const result = await response.json();
    console.log('SAVE RESPONSE:', result);
    return result;
  } catch (error) {
    console.error('Error saving surat amaran:', error);
    throw error;
  }
}
