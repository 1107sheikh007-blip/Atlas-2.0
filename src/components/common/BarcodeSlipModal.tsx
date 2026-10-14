import React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { X, Printer, Barcode, ShieldAlert, Check } from 'lucide-react';
import { DiagnosticOrder } from '../../types';
import { printElement } from '../../utils/printUtility';

interface BarcodeSlipModalProps {
  order: DiagnosticOrder;
  onClose: () => void;
}

export const BarcodeSlipModal: React.FC<BarcodeSlipModalProps> = ({ order, onClose }) => {
  const handlePrintSlip = () => {
    printElement('printable-barcode-slip', {
      title: `Atlas_Barcode_${order.barcode}`,
      pageSize: '50mm 35mm',
      pageMargin: '2mm'
    });
  };

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if ((e.ctrlKey || e.metaKey) && e.key === 'p') {
        e.preventDefault();
        handlePrintSlip();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, order.barcode]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-md bg-white border border-slate-200 rounded-3xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-sky-50 border-b border-sky-100 text-slate-900 no-print">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-sky-100 text-sky-700 rounded-xl">
              <Barcode className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900">Thermal Barcode Tube Label</h3>
              <p className="text-xs text-slate-500">Order: {order.id}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Barcode Visual Preview */}
        <div className="p-6 flex flex-col items-center bg-slate-50">
          <div id="printable-barcode-slip" className="w-full bg-white text-slate-900 p-5 rounded-2xl border-2 border-dashed border-sky-200 shadow-inner flex flex-col items-center">
            {/* Header label */}
            <div className="w-full flex justify-between items-center text-[10px] font-extrabold tracking-wider text-sky-900 border-b border-slate-200 pb-1 mb-2">
              <span>ATLAS DIAGNOSTICS CENTER</span>
              <span>{order.patient.gender[0]}/{order.patient.age}Y</span>
            </div>

            {/* Patient Name */}
            <h4 className="font-black text-slate-900 text-sm tracking-tight text-center">
              {order.patient.name}
            </h4>
            <p className="text-[11px] font-mono text-slate-600 font-bold mb-2">
              UHID: {order.patientId}
            </p>

            {/* Simulated Barcode Stripes */}
            <div className="w-full py-2 px-3 bg-slate-50 rounded-xl flex flex-col items-center my-1 border border-slate-200">
              <div className="flex items-center justify-center gap-1 h-12 w-full">
                {[...order.barcode].map((char, i) => (
                  <div
                    key={i}
                    className="h-full bg-slate-900"
                    style={{
                      width: `${(char.charCodeAt(0) % 4) + 1.5}px`,
                      marginRight: `${(i % 3) + 1}px`
                    }}
                  />
                ))}
              </div>
              <span className="font-mono font-bold text-xs tracking-widest text-slate-900 mt-1">
                *{order.barcode}*
              </span>
            </div>

            {/* Tests in sample */}
            <div className="w-full mt-2 pt-1.5 border-t border-slate-200 text-[10px] text-slate-600">
              <p className="font-bold text-slate-800 truncate">
                Tests: {order.tests.map(t => t.code).join(' | ')}
              </p>
              <div className="flex justify-between items-center text-[9px] text-slate-500 mt-1">
                <span>Ref: {order.referringDoctorName?.split(',')[0]}</span>
                <span>{new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
            </div>
          </div>

          <div className="w-full mt-5 flex gap-3 no-print">
            <button
              onClick={handlePrintSlip}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-sky-600 hover:bg-sky-500 text-white font-bold rounded-2xl transition-all shadow-md active:scale-95 text-xs cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              Print Thermal Label (50x25mm)
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-2xl transition-colors text-xs cursor-pointer"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
