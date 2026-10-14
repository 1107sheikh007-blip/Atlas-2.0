import React, { useRef } from 'react';
import { Printer, Download, X, Share2 } from 'lucide-react';
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
  const [isGeneratingPdf, setIsGeneratingPdf] = React.useState(false);

  const handlePrint = () => {
    printElement('printable-report', {
      title: `Atlas_Report_${report.patientName.replace(/\s+/g, '_')}_${report.testId}`,
      pageSize: 'A4 portrait',
      pageMargin: '28mm 12mm 15mm 12mm'
    });
  };

  // ESC and Ctrl+P key handlers
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if ((e.ctrlKey || e.metaKey) && e.key === 'p') {
        e.preventDefault();
        handlePrint();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, report.id]);

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
      const topMargin = 25; // 25mm clearance for letterhead
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
    let cleanPhone = (order?.patient.phone || '').replace(/[^0-9]/g, '');
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
      <div className="relative w-full max-w-4xl bg-slate-100 border border-slate-300 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Top Action Bar */}
        <div className="flex items-center justify-between px-6 py-4 bg-white border-b border-slate-200 text-slate-900 no-print">
          <div className="flex items-center gap-3">
            <img
              src={ATLAS_LOGO_DATA_URI}
              alt="Logo"
              className="h-8 w-auto object-contain rounded-md"
            />
            <div>
              <h3 className="font-bold text-slate-900">Official Diagnostic Report</h3>
              <p className="text-xs text-slate-500">Report ID: {report.id} • UHID: {report.patientId}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={handleWhatsApp}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer shadow-xs"
            >
              <Share2 className="w-4 h-4" />
              Send to Patient
            </button>
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors cursor-pointer"
            >
              <Printer className="w-4 h-4 text-slate-600" />
              Print
            </button>
            <button
              onClick={handleDownloadPdf}
              disabled={isGeneratingPdf}
              className="flex items-center gap-1.5 px-4 py-2 bg-sky-600 hover:bg-sky-500 disabled:bg-sky-400 text-white text-xs font-bold rounded-xl transition-colors shadow-xs cursor-pointer"
            >
              <Download className="w-4 h-4" />
              {isGeneratingPdf ? 'Generating PDF...' : 'Download PDF'}
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors ml-2 cursor-pointer"
              title="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Printable Document Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-8 bg-slate-100 flex justify-center">
          <div
            ref={reportRef}
            id="printable-report"
            className="w-full max-w-[800px] bg-white text-black p-8 sm:p-10 shadow-lg rounded-2xl flex flex-col font-sans border border-slate-300"
          >
            {/* Screen Preview Letterhead Area Indicator (Hidden in print/pdf) */}
            <div className="no-print mb-4 py-3 px-4 border border-dashed border-slate-300 rounded-xl bg-slate-50/60 text-center select-none">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                Pre-printed Letterhead Space (Top Margin for Physical Stationery)
              </span>
            </div>

            {/* Patient & Test Demographics (Text Only - Ultra Compact) */}
            <div className="border-t-2 border-b-2 border-black py-2.5 my-2 text-[11px] leading-normal text-black">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-1.5">
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
                  <span className="font-bold text-black">Sample Date: </span>
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

            {/* Investigation Header Title */}
            <div className="text-center my-3 pb-1 border-b-2 border-black">
              <h2 className="text-sm sm:text-base font-black uppercase tracking-wide text-black underline decoration-1 underline-offset-4">
                {report.testName}
              </h2>
            </div>

            {/* Findings HTML */}
            <div 
              className="report-content-body text-xs leading-relaxed text-black my-3 prose prose-neutral max-w-none"
              dangerouslySetInnerHTML={{ __html: report.findingsHtml }}
            />

            {/* Impression (Text Only) */}
            {report.impression && (
              <div className="mt-4 text-xs">
                <span className="font-black text-black uppercase tracking-wide block mb-1">IMPRESSION:</span>
                <p className="text-black font-bold leading-relaxed whitespace-pre-line pl-2 border-l-2 border-black">
                  {report.impression}
                </p>
              </div>
            )}

            {/* Recommendations (Text Only) */}
            {report.recommendations && (
              <div className="mt-3 text-xs">
                <span className="font-black text-black uppercase tracking-wide block mb-1">CLINICAL ADVICE / RECOMMENDATIONS:</span>
                <p className="text-black font-medium leading-relaxed whitespace-pre-line pl-2">
                  {report.recommendations}
                </p>
              </div>
            )}

            {/* End of Report Divider */}
            <div className="my-6 text-center text-[10px] text-black font-bold font-mono tracking-widest">
              --- END OF REPORT ---
            </div>

            {/* Doctor Sign-off (Kept Blank for Manual Physical Signing as Requested) */}
            <div className="mt-4 pt-2 flex justify-end">
              <div className="text-right w-64">
                {/* Physical Signature Line (Kept Blank) */}
                <div className="h-14 border-b-2 border-black mb-2 ml-auto flex items-end justify-center pb-1">
                  <span className="text-[10px] text-black italic font-bold">Doctor's Signature</span>
                </div>
                <p className="font-black text-black text-xs">{report.doctorName}</p>
                <p className="text-[11px] text-black font-bold">{report.doctorSpecialty}</p>
                <p className="text-[10px] text-black font-mono font-bold">Reg No: {report.doctorRegistrationNo}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
