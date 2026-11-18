import React, { useRef, useState, useEffect } from 'react';
import { Printer, Download, X, Share2, FileText, Check, Settings2, Info } from 'lucide-react';
import { DiagnosticReport, DiagnosticOrder, CenterBranch } from '../../types';
import { ATLAS_LOGO_DATA_URI } from '../../assets/logo';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { printElement } from '../../utils/printUtility';

interface ReportPrintViewProps {
  report: DiagnosticReport;
  order?: DiagnosticOrder;
  center: CenterBranch;
  onClose: () => void;
}

export const ReportPrintView: React.FC<ReportPrintViewProps> = ({
  report,
  order,
  center,
  onClose
}) => {
  const reportRef = useRef<HTMLDivElement>(null);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  // Print Mode: 'LETTERHEAD' (Pre-printed Diagnostic Stationery) vs 'PLAIN' (Digital Letterhead)
  const [printMode, setPrintMode] = useState<'LETTERHEAD' | 'PLAIN'>(() => {
    const saved = localStorage.getItem('atlas_report_print_mode');
    return (saved === 'PLAIN' || saved === 'LETTERHEAD') ? saved : 'LETTERHEAD';
  });

  // Top margin clearance for pre-printed letterhead in mm (Default: 52mm)
  const [topMarginMm, setTopMarginMm] = useState<number>(() => {
    const saved = localStorage.getItem('atlas_letterhead_top_margin');
    const parsed = Number(saved);
    return !isNaN(parsed) && parsed >= 40 && parsed <= 70 ? parsed : 52;
  });

  // Bottom margin clearance for pre-printed footer in mm (Default: 28mm)
  const bottomMarginMm = 28;

  // Report Text Font Size in px (Default: 20px)
  const [reportFontSize, setReportFontSize] = useState<number>(() => {
    const saved = localStorage.getItem('atlas_report_font_size');
    const parsed = Number(saved);
    // Default to 20px. Upgrade previous default of 14px to 20px.
    return !isNaN(parsed) && parsed !== 14 && parsed >= 12 && parsed <= 32 ? parsed : 20;
  });

  useEffect(() => {
    localStorage.setItem('atlas_report_print_mode', printMode);
  }, [printMode]);

  useEffect(() => {
    localStorage.setItem('atlas_letterhead_top_margin', String(topMarginMm));
  }, [topMarginMm]);

  useEffect(() => {
    localStorage.setItem('atlas_report_font_size', String(reportFontSize));
  }, [reportFontSize]);

  const handlePrint = () => {
    if (printMode === 'LETTERHEAD') {
      printElement('printable-report', {
        title: '', // Empty title prevents Chromium/Edge from printing document title at page top
        pageSize: 'A4 portrait',
        pageMargin: `${topMarginMm}mm 14mm ${bottomMarginMm}mm 14mm`
      });
    } else {
      printElement('printable-report', {
        title: '',
        pageSize: 'A4 portrait',
        pageMargin: '12mm 14mm 14mm 14mm'
      });
    }
  };

  // ESC and Ctrl+P key handlers
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if ((e.ctrlKey || e.metaKey) && e.key === 'p') {
        e.preventDefault();
        handlePrint();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, report.id, printMode, topMarginMm]);

  const handleDownloadPdf = async () => {
    if (!reportRef.current) return;
    setIsGeneratingPdf(true);
    try {
      const canvas = await html2canvas(reportRef.current, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        ignoreElements: (el) => el.classList.contains('no-print')
      });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgWidth = 190;
      const pageHeight = 297;
      const leftMargin = 10;
      const topMargin = printMode === 'LETTERHEAD' ? topMarginMm : 12;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = topMargin;

      pdf.addImage(imgData, 'PNG', leftMargin, position, imgWidth, imgHeight);
      heightLeft -= (pageHeight - topMargin);

      while (heightLeft > 0) {
        position = heightLeft - imgHeight + topMargin;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', leftMargin, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      const pdfBlob = pdf.output('blob');
      const blobUrl = URL.createObjectURL(pdfBlob);
      const win = window.open(blobUrl, '_blank');
      if (!win) {
        pdf.save(`Atlas_Report_${report.patientName.replace(/\s+/g, '_')}_${report.testId}.pdf`);
      }
    } catch (err) {
      console.error('PDF Generation failed', err);
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const handleWhatsApp = () => {
    let cleanPhone = (order?.patient?.phone || '').replace(/[^0-9]/g, '');
    if (cleanPhone.length === 10) cleanPhone = `91${cleanPhone}`;
    const msg = encodeURIComponent(
      `*ATLAS DIAGNOSTICS CENTER*\n\n` +
      `Dear *${report.patientName}*,\n` +
      `Your diagnostic report for *${report.testName}* is now *Ready & Authorized*.\n\n` +
      `• *UHID:* ${report.patientId}\n` +
      `• *Authorized By:* ${report.doctorName}\n` +
      `• *Instant Report Download Link:* https://atlas-diagnostics.portal/report/${report.orderId}\n\n` +
      `For any query, please call: ${center.phone}.\n` +
      `_Thank you for choosing Atlas Diagnostics Center._`
    );
    window.open(`https://wa.me/${cleanPhone}?text=${msg}`, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-sm p-4 overflow-y-auto">
      {/* Container */}
      <div className="relative w-full max-w-4xl bg-slate-100 border border-slate-300 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[95vh]">
        {/* Top Control Bar */}
        <div className="px-6 py-3.5 bg-white border-b border-slate-200 text-slate-900 no-print space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <img
                src={ATLAS_LOGO_DATA_URI}
                alt="Logo"
                className="h-8 w-auto object-contain rounded-md"
              />
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Official Diagnostic Report</h3>
                <p className="text-xs text-slate-500">Report ID: {report.id} • UHID: {report.patientId}</p>
              </div>
            </div>
            
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={handleWhatsApp}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer shadow-xs"
              >
                <Share2 className="w-3.5 h-3.5" />
                WhatsApp Patient
              </button>
              <button
                onClick={handlePrint}
                className="flex items-center gap-1.5 px-3.5 py-1.5 bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer shadow-xs"
              >
                <Printer className="w-3.5 h-3.5" />
                Print Report
              </button>
              <button
                onClick={handleDownloadPdf}
                disabled={isGeneratingPdf}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 disabled:bg-slate-400 text-white text-xs font-bold rounded-xl transition-colors shadow-xs cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                {isGeneratingPdf ? 'Generating...' : 'PDF'}
              </button>
              <button
                onClick={onClose}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Letterhead Print Settings Bar */}
          <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
            {/* Mode Selector */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-600">Print Paper:</span>
              <div className="inline-flex rounded-xl bg-slate-100 p-0.5 border border-slate-200">
                <button
                  type="button"
                  onClick={() => setPrintMode('LETTERHEAD')}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    printMode === 'LETTERHEAD'
                      ? 'bg-sky-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <FileText className="w-3.5 h-3.5" />
                  Pre-Printed Letterhead
                </button>
                <button
                  type="button"
                  onClick={() => setPrintMode('PLAIN')}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    printMode === 'PLAIN'
                      ? 'bg-sky-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <FileText className="w-3.5 h-3.5" />
                  Plain Paper (Full Digital Header)
                </button>
              </div>
            </div>

            {/* Letterhead Margin Calibrator */}
            {printMode === 'LETTERHEAD' && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500 font-bold flex items-center gap-1">
                  <Settings2 className="w-3.5 h-3.5 text-slate-400" /> Top Clearance:
                </span>
                <div className="inline-flex items-center gap-1 bg-slate-100 px-2 py-0.5 rounded-lg border border-slate-200">
                  <button
                    type="button"
                    onClick={() => setTopMarginMm(prev => Math.max(42, prev - 2))}
                    className="px-1.5 py-0.5 hover:bg-white rounded text-xs font-black text-slate-700 cursor-pointer"
                    title="Decrease top margin"
                  >
                    -
                  </button>
                  <span className="text-xs font-mono font-bold text-sky-700 px-1">{topMarginMm} mm</span>
                  <button
                    type="button"
                    onClick={() => setTopMarginMm(prev => Math.min(65, prev + 2))}
                    className="px-1.5 py-0.5 hover:bg-white rounded text-xs font-black text-slate-700 cursor-pointer"
                    title="Increase top margin"
                  >
                    +
                  </button>
                </div>
                <div className="flex gap-1">
                  {[48, 52, 55].map(mm => (
                    <button
                      key={mm}
                      type="button"
                      onClick={() => setTopMarginMm(mm)}
                      className={`text-[10px] px-1.5 py-0.5 rounded font-bold transition-colors cursor-pointer ${
                        topMarginMm === mm ? 'bg-sky-100 text-sky-800 border border-sky-300' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      {mm === 52 ? '52mm (Standard)' : `${mm}mm`}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Font Size Adjuster */}
            <div className="flex items-center gap-1.5 bg-slate-100 px-2 py-0.5 rounded-lg border border-slate-200">
              <span className="text-xs text-slate-500 font-bold">Text Size:</span>
              <button
                type="button"
                onClick={() => setReportFontSize(prev => Math.max(12, prev - 1))}
                className="px-1.5 py-0.5 hover:bg-white rounded text-xs font-black text-slate-700 cursor-pointer"
                title="Decrease font size"
              >
                -
              </button>
              <span className="text-xs font-mono font-bold text-sky-700 px-1">{reportFontSize}px</span>
              <button
                type="button"
                onClick={() => setReportFontSize(prev => Math.min(28, prev + 1))}
                className="px-1.5 py-0.5 hover:bg-white rounded text-xs font-black text-slate-700 cursor-pointer"
                title="Increase font size"
              >
                +
              </button>
              <div className="flex gap-1 ml-1">
                {[16, 18, 20, 24].map(px => (
                  <button
                    key={px}
                    type="button"
                    onClick={() => setReportFontSize(px)}
                    className={`text-[10px] px-1.5 py-0.5 rounded font-bold transition-colors cursor-pointer ${
                      reportFontSize === px ? 'bg-sky-100 text-sky-800 border border-sky-300 font-black' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    {px === 20 ? '20px (Default)' : `${px}px`}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Browser Tip Notice */}
          <div className="flex items-center gap-1.5 text-[11px] text-amber-700 bg-amber-50 px-3 py-1.5 rounded-xl border border-amber-200">
            <Info className="w-3.5 h-3.5 shrink-0 text-amber-600" />
            <span>
              <strong>Chrome / Edge Print Setting:</strong> In the browser print dialog, uncheck <em>"Headers and footers"</em> to avoid printing web URLs or timestamps on the paper.
            </span>
          </div>
        </div>

        {/* Scrollable Printable Document Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-8 bg-slate-200/60 flex justify-center">
          <div
            ref={reportRef}
            id="printable-report"
            style={{ fontSize: `${reportFontSize}px` }}
            className="w-full max-w-[800px] bg-white text-black p-6 sm:p-8 shadow-xl rounded-xl flex flex-col font-sans border border-slate-300 min-h-[500px]"
          >
            {/* Paragraph spacing style */}
            <style dangerouslySetInnerHTML={{ __html: `
              .report-content-body p {
                margin-top: 10px !important;
                margin-bottom: 14px !important;
                line-height: 1.6 !important;
              }
              .report-content-body table {
                margin-top: 12px !important;
                margin-bottom: 16px !important;
                width: 100% !important;
                border-collapse: collapse !important;
              }
              .report-content-body ul {
                margin-top: 8px !important;
                margin-bottom: 14px !important;
                padding-left: 20px !important;
              }
              .report-content-body li {
                margin-bottom: 8px !important;
                line-height: 1.6 !important;
              }
              .report-content-body th,
              .report-content-body td {
                padding: 6px 8px !important;
              }
              .report-content-body h3,
              .report-content-body h4 {
                margin-top: 14px !important;
                margin-bottom: 8px !important;
                font-weight: 800 !important;
              }
            ` }} />
            {/* 1. Header Area */}
            {printMode === 'LETTERHEAD' ? (
              /* Simulated space for physical stationery on screen (Hidden during print) */
              <div 
                className="no-print mb-2 py-4 px-4 border-2 border-dashed border-sky-300 rounded-xl bg-sky-50/70 text-center select-none flex flex-col items-center justify-center transition-all"
                style={{ height: `${Math.round(topMarginMm * 2.8)}px` }}
              >
                <div className="flex items-center gap-2 text-sky-900 font-extrabold text-xs">
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span>PRE-PRINTED LETTERHEAD SPACE RESERVED ({topMarginMm}mm Clearance)</span>
                </div>
                <p className="text-[11px] text-sky-700 mt-1 max-w-md">
                  Your physical stationery header ("ATLAS Diagnostics Centre Clarity in Every Image...!") will occupy this space. Report content starts below the line.
                </p>
              </div>
            ) : (
              /* Full Digital Header for Plain Paper / Digital PDF */
              <div className="pb-4 mb-3 border-b-2 border-black">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <img
                      src={ATLAS_LOGO_DATA_URI}
                      alt="Atlas Diagnostics"
                      className="h-16 w-auto object-contain"
                    />
                    <div>
                      <h1 className="text-xl font-black text-black tracking-tight leading-none uppercase">
                        ATLAS DIAGNOSTICS CENTRE
                      </h1>
                      <p className="text-xs font-bold text-sky-800 tracking-wider mt-0.5">
                        CLARITY IN EVERY IMAGE...!
                      </p>
                      <p className="text-[10px] text-slate-700 font-medium mt-1">
                        Advanced Ultrasound, Digital X-Ray, 2D Echo & Pathology Hub
                      </p>
                    </div>
                  </div>
                  <div className="text-right text-[10px] text-black space-y-0.5">
                    <p className="font-bold">📞 91112-46208, 91112-46308</p>
                    <p>✉️ atlasdiagnosticscentre@gmail.com</p>
                    <p className="font-bold text-sky-800">SUNDAY OPEN</p>
                    <p>Timing: 8:00 AM - 10:00 PM</p>
                  </div>
                </div>
                <div className="mt-2 text-[10px] text-slate-700 border-t border-slate-200 pt-1 flex justify-between">
                  <span>106, Ganesh Market, Survey No. 99/3/2, Near Ganesh Mandir, Khajrana, Indore</span>
                  <span className="font-bold">Home Sample Collection Available</span>
                </div>
              </div>
            )}

            {/* 2. Patient & Test Demographics (High Contrast, Crisp Professional LIS Box) */}
            <div className="border-t-2 border-b-2 border-black py-2.5 my-1.5 text-[11px] leading-snug text-black">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-2">
                <div>
                  <span className="font-bold text-black">Patient Name: </span>
                  <span className="font-black text-black uppercase text-xs">{report.patientName}</span>
                </div>
                <div>
                  <span className="font-bold text-black">Age / Gender: </span>
                  <span className="font-bold text-black">{report.patientAge} Yrs / {report.patientGender}</span>
                </div>
                <div>
                  <span className="font-bold text-black">UHID: </span>
                  <span className="font-mono font-bold text-black">{report.patientId}</span>
                </div>
                <div>
                  <span className="font-bold text-black">Ref. By: </span>
                  <span className="font-bold text-black">{order?.referringDoctorName || 'Self / Walk-in'}</span>
                </div>
                <div>
                  <span className="font-bold text-black">Date & Time: </span>
                  <span className="text-black font-semibold">
                    {order?.sampleCollectedAt 
                      ? new Date(order.sampleCollectedAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }) 
                      : (order?.createdAt ? new Date(order.createdAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }) : new Date().toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }))}
                  </span>
                </div>
                <div>
                  <span className="font-bold text-black">Barcode / Lab No: </span>
                  <span className="font-mono font-bold text-black">{order?.barcode || `ATL-${report.id.slice(-6)}`}</span>
                </div>
              </div>
            </div>

            {/* 3. Investigation Header Title */}
            <div className="text-center my-3 pb-1 border-b-2 border-black">
              <span className="text-[10px] font-black uppercase tracking-widest text-black block">
                DIAGNOSTIC INVESTIGATION
              </span>
              <h2 className="text-sm sm:text-base font-black uppercase tracking-wide text-black mt-0.5">
                {report.testName}
              </h2>
            </div>

            {/* 4. Findings HTML Body */}
            <div 
              className="report-content-body leading-relaxed text-black my-2 prose prose-neutral max-w-none flex-1"
              style={{ fontSize: `${reportFontSize}px` }}
              dangerouslySetInnerHTML={{ __html: report.findingsHtml }}
            />

            {/* 5. Impression */}
            {report.impression && (
              <div className="mt-4" style={{ fontSize: `${Math.max(15, Math.round(reportFontSize * 0.95))}px` }}>
                <span className="font-black text-black uppercase tracking-wide block mb-1">IMPRESSION:</span>
                <p className="text-black font-bold leading-relaxed whitespace-pre-line pl-2 border-l-2 border-black">
                  {report.impression}
                </p>
              </div>
            )}

            {/* 6. Clinical Advice / Recommendations */}
            {report.recommendations && (
              <div className="mt-3" style={{ fontSize: `${Math.max(14, Math.round(reportFontSize * 0.9))}px` }}>
                <span className="font-black text-black uppercase tracking-wide block mb-1">CLINICAL ADVICE / RECOMMENDATIONS:</span>
                <p className="text-black font-medium leading-relaxed whitespace-pre-line pl-2">
                  {report.recommendations}
                </p>
              </div>
            )}

            {/* 7. End of Report Divider */}
            <div className="my-5 text-center text-[10px] text-black font-bold font-mono tracking-widest">
              --- END OF REPORT ---
            </div>

            {/* 8. Doctor Sign-off Area */}
            <div className="mt-2 pt-2 flex justify-end">
              <div className="text-right w-64">
                <div className="h-14 border-b-2 border-black mb-2 ml-auto flex items-end justify-center pb-1">
                  {report.doctorSignatureUrl ? (
                    <img src={report.doctorSignatureUrl} alt="Signature" className="max-h-12 object-contain" />
                  ) : (
                    <span className="text-[10px] text-black italic font-bold">Doctor's Signature</span>
                  )}
                </div>
                <p className="font-black text-black text-xs">{report.doctorName}</p>
                <p className="text-[11px] text-black font-bold">{report.doctorSpecialty}</p>
                <p className="text-[10px] text-black font-mono font-bold">Reg No: {report.doctorRegistrationNo}</p>
              </div>
            </div>

            {/* 9. Digital Footer (Only displayed on Plain Paper mode, hidden on pre-printed letterhead) */}
            {printMode === 'PLAIN' && (
              <div className="mt-6 pt-3 border-t-2 border-black text-[10px] text-black flex items-center justify-between">
                <div>
                  <p className="font-bold">ATLAS DIAGNOSTICS CENTRE • Indore</p>
                  <p className="text-slate-600">106, Ganesh Market, Near Ganesh Mandir, Khajrana</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-sky-800">Ph: 91112-46208, 91112-46308</p>
                  <p className="text-slate-600">SUNDAY OPEN • 8:00 AM - 10:00 PM</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
