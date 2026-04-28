import React, { useState, useEffect } from 'react';
import { ArrowLeft, Loader2, Save, Calendar, User, Home, Info, AlertCircle, FileText, ExternalLink, CheckCircle } from 'lucide-react';
import { SuratContext } from '../types';
import { fetchSuratAmaranContext, saveSuratAmaran, saveGeneratedSuratAmaranPdfToDrive } from '../services/api';
import { cn } from '../lib/utils';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

// Helper function to format date for display (DD/MM/YYYY)
function formatDateDisplay(dateString: string | null | undefined): string {
  if (!dateString) return 'Tiada';
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return dateString; 
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  } catch (e) {
    return dateString;
  }
}

// Helper to format date in Malay (e.g. 24 APRIL 2026)
function formatTarikhBM(dateString: string): string {
  if (!dateString) return '';
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return dateString;
    const months = ['JANUARI', 'FEBRUARI', 'MAC', 'APRIL', 'MEI', 'JUN', 'JULAI', 'OGOS', 'SEPTEMBER', 'OKTOBER', 'NOVEMBER', 'DISEMBER'];
    const day = d.getDate();
    const month = months[d.getMonth()];
    const year = d.getFullYear();
    return `${day} ${month} ${year}`;
  } catch (e) {
    return dateString;
  }
}

// Helper function to download PDF bytes
function downloadPdfBytes(bytes: Uint8Array, fileName: string): string {
  const blob = new Blob([bytes], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName || "surat-amaran.pdf";
  document.body.appendChild(a);
  a.click();
  a.remove();
  
  // Return URL for the "Lihat PDF Surat" button to use
  return url;
}

function uint8ToBase64(bytes: Uint8Array): string {
  let binary = "";
  const chunkSize = 0x8000;

  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, i + chunkSize);
    binary += String.fromCharCode.apply(null, Array.from(chunk) as any);
  }

  return btoa(binary);
}

interface LetterModuleProps {
  studentId: string;
  onBack: () => void;
}

export function LetterModule({ studentId, onBack }: LetterModuleProps) {
  const [context, setContext] = useState<SuratContext | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStep, setSaveStep] = useState<'IDLE' | 'GENERATING' | 'SAVING_DRIVE' | 'SAVING' | 'SUCCESS'>('IDLE');
  const [generatedFileUrl, setGeneratedFileUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    tarikh_surat: new Date().toISOString().split('T')[0],
    tarikh_mula: '',
    tarikh_akhir: '',
    nama_penjaga: '',
    alamat_1: '',
    alamat_2: '',
    alamat_3: '',
    alamat_4: ''
  });

  const [bilanganHari, setBilanganHari] = useState(0);

  useEffect(() => {
    loadContext();
  }, [studentId]);

  useEffect(() => {
    if (formData.tarikh_mula && formData.tarikh_akhir) {
      const start = new Date(formData.tarikh_mula);
      const end = new Date(formData.tarikh_akhir);
      
      if (end >= start) {
        const diffTime = Math.abs(end.getTime() - start.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
        setBilanganHari(diffDays);
      } else {
        setBilanganHari(0);
      }
    } else {
      setBilanganHari(0);
    }
  }, [formData.tarikh_mula, formData.tarikh_akhir]);

  const loadContext = async () => {
    console.log('LOADING START: context loading...');
    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchSuratAmaranContext(studentId);
      console.log('CONTEXT LOADED SUCCESSFULLY:', data);
      
      if (data && data.draft) {
        setContext(data);
        // Pre-fill if draft has data
        setFormData(prev => ({
          ...prev,
          nama_penjaga: data.draft.nama_penjaga || '',
          alamat_1: data.draft.alamat_1 || '',
          alamat_2: data.draft.alamat_2 || '',
          alamat_3: data.draft.alamat_3 || '',
          alamat_4: data.draft.alamat_4 || '',
          tarikh_mula: data.draft.tarikh_mula || '',
          tarikh_akhir: data.draft.tarikh_akhir || '',
          // Ensure tarikh_surat is also filled if comes from draft
          tarikh_surat: data.draft.tarikh_surat || prev.tarikh_surat
        }));
      } else {
        throw new Error('Data draf tidak lengkap');
      }
    } catch (err: any) {
      console.error('CONTEXT LOAD ERROR:', err);
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      console.log('LOADING END.');
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const validateForm = () => {
    if (!formData.tarikh_surat) return 'Tarikh surat wajib diisi';
    if (!formData.tarikh_mula) return 'Tarikh mula wajib diisi';
    if (!formData.tarikh_akhir) return 'Tarikh akhir wajib diisi';
    if (new Date(formData.tarikh_akhir) < new Date(formData.tarikh_mula)) return 'Tarikh akhir tidak boleh lebih awal dari tarikh mula';
    if (!formData.nama_penjaga) return 'Nama penjaga wajib diisi';
    if (!formData.alamat_1) return 'Alamat 1 wajib diisi';
    return null;
  };

  const handleSave = async () => {
    const validationError = validateForm();
    if (validationError) {
      alert(validationError);
      return;
    }

    if (!context) return;

    setIsSaving(true);
    setSaveStep('GENERATING');
    try {
      const fileName = `SURAT AMARAN ${context.draft.jenis_amaran} ${context.draft.nama_murid} ${context.draft.nama_kelas}.pdf`;
      const pdfPayload = {
        no_rujukan_surat: context.draft.no_rujukan_surat,
        tarikh_surat: formData.tarikh_surat,
        nama_penjaga: formData.nama_penjaga,
        alamat_1: formData.alamat_1,
        alamat_2: formData.alamat_2,
        alamat_3: formData.alamat_3,
        alamat_4: formData.alamat_4,
        nama_murid: context.draft.nama_murid,
        nama_kelas: context.draft.nama_kelas,
        jenis_amaran: context.draft.jenis_amaran,
        tarikh_mula: formData.tarikh_mula,
        tarikh_akhir: formData.tarikh_akhir,
        bilangan_hari: bilanganHari,
        file_nama: fileName
      };

      // STEP 1: Generate PDF locally
      const templateUrl = '/TEMPLATE SURAT AMARAN RASMI.pdf';
      const templateResponse = await fetch(templateUrl);
      if (!templateResponse.ok) {
        throw new Error('Gagal memuat turun template PDF rasmi. Pastikan TEMPLATE SURAT AMARAN RASMI.pdf ada di dalam folder public.');
      }
      const existingPdfBytes = await templateResponse.arrayBuffer();

      const pdfDoc = await PDFDocument.load(existingPdfBytes);

      const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
      const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

      const pages = pdfDoc.getPages();
      const firstPage = pages[0];
      const secondPage = pages[1];

      const tarikhSuratBM = formatTarikhBM(formData.tarikh_surat);
      const tarikhMulaBM = formatTarikhBM(formData.tarikh_mula);
      const tarikhAkhirBM = formatTarikhBM(formData.tarikh_akhir);

      const color = rgb(0, 0, 0);

      const writeText = (page: any, text: string, x: number, y: number, isBold: boolean = false, size: number = 10) => {
        if (!text) return;
        page.drawText(text.toString(), {
          x,
          y,
          size,
          font: isBold ? helveticaBold : helveticaFont,
          color,
        });
      };

      // Page 1
      writeText(firstPage, context.draft.no_rujukan_surat || '-', 460, 720);
      writeText(firstPage, tarikhSuratBM, 460, 705);
      writeText(firstPage, formData.nama_penjaga, 15, 678, true);
      writeText(firstPage, formData.alamat_1, 15, 665);
      writeText(firstPage, formData.alamat_2, 15, 653);
      writeText(firstPage, formData.alamat_3, 15, 640);
      writeText(firstPage, formData.alamat_4, 15, 629);
      writeText(firstPage, context.draft.jenis_amaran, 305, 592, true);
      writeText(firstPage, context.draft.nama_murid, 15, 549, true);
      writeText(firstPage, context.draft.nama_kelas, 430, 549, true);
      writeText(firstPage, tarikhMulaBM, 180, 535, true);
      writeText(firstPage, tarikhAkhirBM, 350, 535, true);
      writeText(firstPage, String(bilanganHari), 510, 535, true);

      // Page 2
      if (secondPage) {
        writeText(secondPage, context.draft.no_rujukan_surat || '-', 150, 642);
        writeText(secondPage, context.draft.nama_murid, 165, 589, true);
        writeText(secondPage, context.draft.nama_kelas, 165, 571, true);
        writeText(secondPage, String(bilanganHari), 165, 556, true);
      }

      const pdfBytes = await pdfDoc.save();

      // STEP 2: Automatically download the PDF.
      const pdfUrl = downloadPdfBytes(pdfBytes, fileName);

      setSaveStep('SAVING_DRIVE');

      const pdfBase64 = uint8ToBase64(pdfBytes);
      const driveResult = await saveGeneratedSuratAmaranPdfToDrive({
        action: "saveGeneratedSuratAmaranPdfToDrive",
        file_nama: fileName,
        pdf_base64: pdfBase64
      });

      if (!driveResult || !driveResult.ok) {
        throw new Error('PDF berjaya dimuat turun tetapi gagal disimpan ke Drive.');
      }

      setSaveStep('SAVING');
      
      // STEP 3: Save record
      const savePayload = {
        murid_id: context.draft.murid_id,
        nama_murid: context.draft.nama_murid,
        kelas_id: context.draft.kelas_id,
        nama_kelas: context.draft.nama_kelas,
        jenis_amaran: context.draft.jenis_amaran,
        tarikh_surat: formData.tarikh_surat,
        tarikh_mula: formData.tarikh_mula,
        tarikh_akhir: formData.tarikh_akhir,
        nama_penjaga: formData.nama_penjaga,
        alamat_1: formData.alamat_1,
        alamat_2: formData.alamat_2,
        alamat_3: formData.alamat_3,
        alamat_4: formData.alamat_4,
        file_nama: driveResult.file_nama,
        file_url_drive: driveResult.file_url,
        file_id_drive: driveResult.file_id
      };

      const saveResult = await saveSuratAmaran(savePayload);
      console.log('SAVE RESPONSE', saveResult);
      
      setGeneratedFileUrl(pdfUrl);
      setSaveStep('SUCCESS');
      alert('Surat berjaya dijana dan dimuat turun.');
      
      await loadContext(); 
      
    } catch (err: any) {
      console.error('GENERATE/SAVE ERROR', err);
      alert(err instanceof Error ? err.message : String(err));
      setSaveStep('IDLE');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-slate-50">
        <Loader2 className="w-12 h-12 text-blue-600 animate-spin mb-4" />
        <p className="text-sm font-black text-slate-800 uppercase tracking-widest">MEMUATKAN MAKLUMAT SURAT...</p>
      </div>
    );
  }

  if (error || !context) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-slate-50 p-6 text-center">
        <AlertCircle className="w-16 h-16 text-red-500 mb-4" />
        <h2 className="text-xl font-black text-slate-800 mb-2 uppercase">Ralat</h2>
        <p className="text-slate-500 mb-6">{error || 'Data tidak dijumpai'}</p>
        <button onClick={onBack} className="bg-slate-900 text-white px-8 py-3 rounded-xl font-bold uppercase">Kembali</button>
      </div>
    );
  }

  const { draft, latest } = context;

  return (
    <div className="flex flex-col h-screen bg-slate-50 overflow-hidden font-sans">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center gap-4 shrink-0">
        <button 
          onClick={onBack}
          className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-600"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
        <div>
          <h1 className="text-xl font-black tracking-tight text-slate-800 uppercase">MODUL SISTEM SURAT</h1>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">JANA SURAT AMARAN KETIDAKHADIRAN</p>
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
        <div className="max-w-4xl mx-auto space-y-6">
          
          {/* Status Surat Terdahulu */}
          <div className={cn(
            "p-4 rounded-2xl border flex items-center gap-4",
            latest ? "bg-amber-50 border-amber-100 text-amber-800" : "bg-emerald-50 border-emerald-100 text-emerald-800"
          )}>
            <Info className="w-6 h-6 shrink-0" />
            <div>
              <p className="text-xs font-black uppercase tracking-wider">Status Surat Terdahulu</p>
              <p className="font-bold">
                {latest ? `Surat terdahulu: ${latest.jenis_amaran} pada ${formatDateDisplay(latest.tarikh_surat)}` : 'Tiada surat terdahulu'}
              </p>
            </div>
          </div>

          {/* Success Message & PDF Link */}
          {saveStep === 'SUCCESS' && generatedFileUrl && (
            <div className="bg-blue-600 p-6 rounded-3xl border border-blue-500 shadow-xl shadow-blue-100 text-white space-y-4 animate-in fade-in slide-in-from-top-4 duration-500">
              <div className="flex items-center gap-3">
                <div className="bg-white/20 p-2 rounded-full">
                  <CheckCircle className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-black uppercase tracking-tight">Surat Berjaya Dijana!</h3>
                  <p className="text-xs font-bold text-blue-100 uppercase tracking-widest">Sila muat turun atau cetak surat tersebut</p>
                </div>
              </div>
              <a 
                href={generatedFileUrl} 
                target="_blank" 
                rel="noreferrer"
                className="flex items-center justify-center gap-2 w-full bg-white text-blue-600 py-3 rounded-xl font-black uppercase tracking-widest hover:bg-blue-50 transition-all active:scale-95"
              >
                <ExternalLink className="w-5 h-5" /> LIHAT PDF SURAT
              </a>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Section A: Maklumat Murid */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <User className="w-5 h-5 text-blue-600" />
                <h2 className="font-black text-slate-800 uppercase tracking-tight">Maklumat Murid</h2>
              </div>
              
              <div className="space-y-3">
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Nama Murid</label>
                  <p className="font-black text-slate-800 bg-slate-50 px-4 py-3 rounded-xl border border-slate-100">{draft.nama_murid}</p>
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Kelas</label>
                  <p className="font-black text-slate-800 bg-slate-50 px-4 py-3 rounded-xl border border-slate-100">{draft.nama_kelas}</p>
                </div>
              </div>
            </div>

            {/* Section B: Maklumat Surat */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="w-5 h-5 text-blue-600" />
                <h2 className="font-black text-slate-800 uppercase tracking-tight">Maklumat Surat</h2>
              </div>
              
              <div className="space-y-3">
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">No. Rujukan Surat</label>
                  <p className="font-black text-slate-800 bg-slate-50 px-4 py-3 rounded-xl border border-slate-100">{draft.no_rujukan_surat || '-'}</p>
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Jenis Amaran</label>
                  <p className="font-black text-blue-700 bg-blue-50 px-4 py-3 rounded-xl border border-blue-100">{draft.jenis_amaran}</p>
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Tarikh Surat</label>
                  <input 
                    type="date"
                    name="tarikh_surat"
                    value={formData.tarikh_surat}
                    onChange={handleInputChange}
                    className="w-full font-black text-slate-800 bg-white px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-50 focus:outline-none transition-all"
                  />
                  {formData.tarikh_surat && (
                    <p className="text-[10px] font-bold text-blue-600 mt-1 uppercase">PILIHAN: {formatDateDisplay(formData.tarikh_surat)}</p>
                  )}
                </div>
              </div>
            </div>

          </div>

          {/* Section C: Tempoh Ketidakhadiran */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="w-5 h-5 text-blue-600" />
              <h2 className="font-black text-slate-800 uppercase tracking-tight">Tempoh Ketidakhadiran</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Tarikh Mula</label>
                <input 
                  type="date"
                  name="tarikh_mula"
                  value={formData.tarikh_mula}
                  onChange={handleInputChange}
                  className="w-full font-black text-slate-800 bg-white px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:outline-none transition-all"
                />
                {formData.tarikh_mula && (
                  <p className="text-[10px] font-bold text-blue-600 mt-1 uppercase">{formatDateDisplay(formData.tarikh_mula)}</p>
                )}
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Tarikh Akhir</label>
                <input 
                  type="date"
                  name="tarikh_akhir"
                  value={formData.tarikh_akhir}
                  onChange={handleInputChange}
                  className="w-full font-black text-slate-800 bg-white px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:outline-none transition-all"
                />
                {formData.tarikh_akhir && (
                  <p className="text-[10px] font-bold text-blue-600 mt-1 uppercase">{formatDateDisplay(formData.tarikh_akhir)}</p>
                )}
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Bilangan Hari</label>
                <div className="w-full font-black text-slate-800 bg-slate-50 px-4 py-3 rounded-xl border border-slate-100 flex items-center justify-center">
                  <span className="text-2xl">{bilanganHari}</span> <span className="text-xs ml-2 text-slate-400">HARI</span>
                </div>
              </div>
            </div>
          </div>

          {/* Section D: Maklumat Penjaga */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <Home className="w-5 h-5 text-blue-600" />
              <h2 className="font-black text-slate-800 uppercase tracking-tight">Maklumat Penjaga & Alamat</h2>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Nama Ibu Bapa / Penjaga</label>
                <input 
                  type="text"
                  name="nama_penjaga"
                  value={formData.nama_penjaga}
                  onChange={handleInputChange}
                  placeholder="Isi Nama Penuh"
                  className="w-full font-black text-slate-800 bg-white px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:outline-none transition-all uppercase"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Alamat 1</label>
                  <input 
                    type="text"
                    name="alamat_1"
                    value={formData.alamat_1}
                    onChange={handleInputChange}
                    className="w-full font-black text-slate-800 bg-white px-4 py-2.5 rounded-xl border border-slate-200 focus:border-blue-500 focus:outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Alamat 2</label>
                  <input 
                    type="text"
                    name="alamat_2"
                    value={formData.alamat_2}
                    onChange={handleInputChange}
                    className="w-full font-black text-slate-800 bg-white px-4 py-2.5 rounded-xl border border-slate-200 focus:border-blue-500 focus:outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Alamat 3</label>
                  <input 
                    type="text"
                    name="alamat_3"
                    value={formData.alamat_3}
                    onChange={handleInputChange}
                    className="w-full font-black text-slate-800 bg-white px-4 py-2.5 rounded-xl border border-slate-200 focus:border-blue-500 focus:outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Alamat 4</label>
                  <input 
                    type="text"
                    name="alamat_4"
                    value={formData.alamat_4}
                    onChange={handleInputChange}
                    className="w-full font-black text-slate-800 bg-white px-4 py-2.5 rounded-xl border border-slate-200 focus:border-blue-500 focus:outline-none transition-all"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col md:flex-row items-center gap-4 pt-4 pb-8">
            <button 
              onClick={onBack}
              disabled={isSaving}
              className="w-full md:w-auto px-10 py-4 bg-white text-slate-600 border-2 border-slate-200 rounded-2xl font-black uppercase tracking-widest transition-all hover:bg-slate-50"
            >
              Kembali
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving || saveStep !== 'IDLE'}
              id="jana-surat-button"
              className={`flex-1 w-full flex items-center justify-center gap-3 py-4 px-10 rounded-2xl font-black uppercase tracking-widest transition-all duration-300 shadow-xl shadow-blue-200 active:scale-95 ${
                (isSaving || saveStep !== 'IDLE')
                  ? 'bg-slate-400 cursor-not-allowed text-white shadow-none' 
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
              }`}
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>
                    {saveStep === 'GENERATING' ? 'MENJANA PDF...' : 
                     saveStep === 'SAVING_DRIVE' ? 'MENYIMPAN KE DRIVE...' : 
                     'MENYIMPAN REKOD...'}
                  </span>
                </>
              ) : (
                <>
                  <FileText className="w-5 h-5" />
                  <span>{saveStep === 'SUCCESS' ? 'SURAT SIAP DIJANA' : 'JANA SURAT AMARAN'}</span>
                </>
              )}
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
