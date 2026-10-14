import React, { useEffect } from 'react';
import { X, Printer, Receipt, CheckCircle2, Phone, MapPin, Share2, DollarSign } from 'lucide-react';
import { DiagnosticOrder, CenterBranch } from '../../types';
import { ATLAS_LOGO_DATA_URI } from '../../assets/logo';
import { printElement } from '../../utils/printUtility';
import { formatSafeDateTime } from '../../utils/dateUtils';

interface InvoiceReceiptModalProps {
  order: DiagnosticOrder;
  center: CenterBranch;
  onClose: () => void;
}

export const InvoiceReceiptModal: React.FC<InvoiceReceiptModalProps> = ({ order, center, onClose }) => {
  const handlePrint = () => {
    printElement('printable-invoice', {
      title: `Atlas_Invoice_${order.invoiceNumber}`,
      pageSize: 'A4 portrait',
      pageMargin: '6mm 8mm'
    });
  };

  // ESC and Ctrl+P key handlers for UI symmetry & keyboard shortcuts
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
  }, [onClose, order.invoiceNumber]);

  const handleWhatsApp = () => {
    const message = encodeURIComponent(
      `*ATLAS DIAGNOSTICS CENTER*\n\n` +
      `Dear *${order.patient.name}*,\n` +
      `Thank you for choosing Atlas Diagnostics Center. Your bill has been generated successfully.\n\n` +
      `• *Invoice Number:* ${order.invoiceNumber}\n` +
      `• *UHID:* ${order.patientId}\n` +
      `• *Tests Ordered:* ${order.tests.map(t => t.name).join(', ')}\n` +
      `• *Total Amount:* ₹${order.totalAmount.toLocaleString()}\n` +
      `• *Paid Amount:* ₹${order.paidAmount.toLocaleString()} (${order.paymentMode})\n` +
      `${order.dueAmount > 0 ? `• *Due Balance:* ₹${order.dueAmount.toLocaleString()}\n` : `• *Payment Status:* PAID IN FULL\n`}\n` +
      `• *Center:* ${center.name}\n` +
      `• *Helpdesk:* ${center.phone}\n\n` +
      `_We will notify you once your diagnostic test reports are verified._`
    );

    let cleanPhone = (order.patient.phone || '').replace(/[^0-9]/g, '');
    if (cleanPhone.length === 10) cleanPhone = `91${cleanPhone}`;
    if (cleanPhone.length >= 10) {
      window.open(`https://wa.me/${cleanPhone}?text=${message}`, '_blank');
    } else {
      window.open(`https://wa.me/?text=${message}`, '_blank');
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-md p-3 sm:p-6 overflow-y-auto"
      onClick={e => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      {/* Floating High-Contrast Always-Visible Screen Close Button */}
      <button
        type="button"
        onClick={onClose}
        className="fixed top-3 right-3 sm:top-5 sm:right-5 z-[80] no-print flex items-center gap-1.5 px-4 py-2 bg-slate-950/90 hover:bg-rose-600 text-white rounded-full shadow-2xl text-xs font-black tracking-wide border border-white/20 transition-all active:scale-95 cursor-pointer backdrop-blur-md"
        title="Close Invoice (Esc)"
      >
        <X className="w-4 h-4" />
        <span>✕ Close</span>
      </button>

      <div className="relative w-full max-w-2xl bg-white border border-slate-200 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header - Screen Only */}
        <div className="flex items-center justify-between px-6 py-4 bg-sky-50 border-b border-sky-100 text-slate-900 no-print">
          <div className="flex items-center gap-2.5">
            <img
              src={ATLAS_LOGO_DATA_URI}
              alt="Logo"
              className="h-7 w-auto object-contain rounded-md"
            />
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Diagnostic Bill & Tax Invoice</h3>
              <p className="text-xs text-slate-500">Invoice: {order.invoiceNumber}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-extrabold text-xs rounded-xl transition-colors cursor-pointer shadow-xs"
            title="Close Invoice (Esc)"
          >
            <X className="w-4 h-4" />
            <span>Close</span>
          </button>
        </div>

        {/* Scrollable Printable Invoice Content */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-8 bg-white text-black font-sans space-y-6" id="printable-invoice">
          {/* Invoice Header */}
          <div className="flex flex-row justify-between items-start gap-4 border-b-2 border-black pb-5">
            <div>
              <div className="flex items-center gap-3">
                <img
                  src={ATLAS_LOGO_DATA_URI}
                  alt="Atlas Diagnostics Center Logo"
                  data-brand-logo="true"
                  className="atlas-brand-logo h-12 w-12 object-contain rounded-lg shadow-xs shrink-0"
                  style={{
                    width: '48px',
                    height: '48px',
                    maxWidth: '48px',
                    maxHeight: '48px',
                    minWidth: '48px',
                    minHeight: '48px',
                    objectFit: 'contain'
                  }}
                  width={48}
                  height={48}
                />
                <div>
                  <h1 className="text-lg font-black text-black tracking-tight leading-none">
                    ATLAS DIAGNOSTICS CENTER
                  </h1>
                  <span className="text-[10px] font-bold text-black uppercase tracking-wider block mt-0.5">
                    clearity in every image...!
                  </span>
                </div>
              </div>
              <div className="mt-2 text-xs text-black space-y-1 font-bold">
                <p className="font-black text-black text-xs">{center.name}</p>
                <p className="flex items-center gap-1.5 text-[11px] text-black font-bold">
                  <MapPin className="w-3.5 h-3.5 text-black shrink-0 stroke-[2.5]" />
                  <span className="text-black font-bold">{center.address}</span>
                </p>
                <p className="flex items-center gap-1.5 text-[11px] text-black font-bold">
                  <Phone className="w-3.5 h-3.5 text-black shrink-0 stroke-[2.5]" />
                  <span className="text-black font-black tracking-wide">{center.phone}</span>
                </p>
              </div>
            </div>

            <div className="text-right sm:self-end">
              <span className="inline-block px-3 py-1 rounded-full text-xs font-black bg-slate-100 text-black mb-1 border border-black">
                TAX INVOICE / RECEIPT
              </span>
              <p className="font-mono font-bold text-sm text-black">{order.invoiceNumber}</p>
              <p className="text-[11px] text-black font-medium">
                Date: {formatSafeDateTime(order.createdAt)}
              </p>
              <p className="text-[11px] text-black font-bold mt-0.5">
                Billed By: <span className="font-black text-black">{order.createdByStaffName || 'Reception Desk'}</span>
              </p>
              <div className="mt-1">
                {order.paymentStatus === 'PAID' ? (
                  <span className="px-2 py-0.5 rounded text-[10px] font-black bg-slate-100 text-black border border-black">
                    PAID IN FULL
                  </span>
                ) : order.paymentStatus === 'PARTIAL' ? (
                  <span className="px-2 py-0.5 rounded text-[10px] font-black bg-slate-100 text-black border border-black">
                    PARTIALLY PAID
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded text-[10px] font-black bg-slate-100 text-black border border-black">
                    PAYMENT DUE
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Patient & Doctor Information Box */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-300 text-xs text-black">
            <div className="space-y-1">
              <span className="text-[10px] font-black text-black uppercase tracking-wider block">Patient Details</span>
              <p className="font-black text-sm text-black">{order.patient.name}</p>
              <p className="text-black font-medium">
                Age / Gender: <strong className="font-bold text-black">{order.patient.age} Yrs / {order.patient.gender}</strong>
              </p>
              <p className="text-black font-medium">
                UHID: <strong className="font-mono font-bold text-black">{order.patientId}</strong>
              </p>
              <p className="text-black font-bold">
                Phone: <strong className="font-black text-black font-mono">{order.patient.phone}</strong>
              </p>
              {order.patient.address && (
                <p className="text-black text-[11px] font-bold">
                  Address: <span className="font-bold text-black">{order.patient.address}</span>
                </p>
              )}
            </div>

            <div className="space-y-1 sm:border-l sm:border-slate-300 sm:pl-4">
              <span className="text-[10px] font-black text-black uppercase tracking-wider block">Prescription & Referring Info</span>
              <p className="font-bold text-black">
                Prescribing Doctor: <span className="text-black font-black">{order.referringDoctorName || 'Self / Direct Walk-in'}</span>
              </p>
              <p className="text-black font-medium">
                Branch Hub: <strong className="font-bold text-black">{center.name} ({order.centerCode || center.code})</strong>
              </p>
              <p className="text-black font-medium">
                Payment Mode: <strong className="text-black font-bold">{order.paymentMode}</strong>
              </p>
              {order.patientStatusRemark && (
                <p className="text-black text-[11px]">
                  Patient Status: <span className="px-1.5 py-0.5 rounded bg-slate-100 text-black font-black border border-black text-[10px]">{order.patientStatusRemark}</span>
                </p>
              )}
              {order.hasMissedAppointment && (
                <div className="p-2 rounded-xl bg-slate-100 border border-black text-black text-[11px] font-bold mt-1">
                  <span>Previous Missed Appointment Recorded</span>
                  {order.missedAppointmentNotes && <p className="text-[10px] font-normal text-black mt-0.5">{order.missedAppointmentNotes}</p>}
                </div>
              )}
              {order.notes && (
                <p className="text-black text-[11px] italic font-medium">Notes: {order.notes}</p>
              )}
            </div>
          </div>

          {/* Itemized Tests Table */}
          <div className="border border-black rounded-2xl overflow-hidden">
            <table className="w-full text-left text-xs text-black">
              <thead className="bg-slate-100 text-black font-black border-b border-black uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="p-3 w-12 text-center">#</th>
                  <th className="p-3">Investigation / Diagnostic Service</th>
                  <th className="p-3">Category</th>
                  <th className="p-3 text-right">Price (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-black">
                {order.tests.map((t, idx) => (
                  <tr key={t.id} className="hover:bg-slate-50">
                    <td className="p-3 text-center text-black font-bold">{idx + 1}</td>
                    <td className="p-3">
                      <span className="font-black text-black block">{t.name}</span>
                      <span className="text-[10px] font-mono text-black">{t.code} • TAT: {t.tatHours}h</span>
                    </td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded bg-slate-100 text-black text-[10px] font-bold border border-slate-300">
                        {t.category}
                      </span>
                    </td>
                    <td className="p-3 text-right font-black text-black">
                      ₹{t.price.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Financial Breakdown Summary */}
          <div className="flex justify-end">
            <div className="w-full sm:w-72 p-4 bg-slate-50 rounded-2xl border border-black text-xs space-y-2 text-black">
              <div className="flex justify-between text-black font-medium">
                <span>Subtotal (Gross):</span>
                <span className="font-bold text-black">₹{order.subtotal.toLocaleString()}</span>
              </div>
              {order.discountAmount > 0 && (
                <div className="flex justify-between text-black font-bold">
                  <span>Discount ({order.discountPct}%):</span>
                  <span>- ₹{order.discountAmount.toLocaleString()}</span>
                </div>
              )}
              <div className="flex justify-between text-black font-black text-sm pt-2 border-t border-black">
                <span>Net Total Payable:</span>
                <span className="text-black font-black">₹{order.totalAmount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-black pt-1 border-t border-slate-300 font-semibold">
                <span>Amount Paid ({order.paymentMode}):</span>
                <span className="font-black text-black">₹{order.paidAmount.toLocaleString()}</span>
              </div>
              {order.paymentMode === 'Split Payment' && order.splitPaymentDetails && (
                <div className="pl-2.5 py-1 space-y-0.5 text-[11px] text-black border-l-2 border-black bg-slate-100/60 rounded-r-lg">
                  <div className="flex justify-between">
                    <span>• Cash:</span>
                    <span className="font-bold text-black">₹{(order.splitPaymentDetails.cashAmount || 0).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>• {order.splitPaymentDetails.onlineMode || 'Online'}:</span>
                    <span className="font-bold text-black">₹{(order.splitPaymentDetails.onlineAmount || 0).toLocaleString()}</span>
                  </div>
                </div>
              )}
              {order.dueAmount > 0 ? (
                <div className="flex justify-between text-black font-black pt-1">
                  <span>Balance Due:</span>
                  <span>₹{order.dueAmount.toLocaleString()}</span>
                </div>
              ) : (
                <div className="flex justify-between text-black font-bold pt-1">
                  <span>Balance Due:</span>
                  <span>₹0.00 (Cleared)</span>
                </div>
              )}
              {order.isRefunded && (order.refundAmount || 0) > 0 && (
                <div className="flex justify-between text-black font-black pt-1 border-t border-black">
                  <span>Refund Issued ({order.refundMode || 'Cash'}):</span>
                  <span>- ₹{order.refundAmount?.toLocaleString()}</span>
                </div>
              )}
            </div>
          </div>

          {/* Refund Notice Banner */}
          {order.isRefunded && order.refundReason && (
            <div className="p-3.5 bg-slate-50 border border-black rounded-2xl text-xs text-black space-y-1">
              <div className="font-bold flex items-center justify-between">
                <span className="text-black font-black uppercase text-[11px] tracking-wide">
                  Return & Refund Record: ₹{order.refundAmount?.toLocaleString()} ({order.refundMode || 'Cash'})
                </span>
                <span className="px-2 py-0.5 bg-slate-200 text-black rounded-md text-[10px] font-black uppercase border border-black">
                  {order.refundStatus?.replace('_', ' ') || 'REFUNDED'}
                </span>
              </div>
              <p className="text-[11px] text-black">
                <strong>Reason:</strong> {order.refundReason}
              </p>
              {order.refundedAt && (
                <p className="text-[10px] text-black">
                  Processed: {new Date(order.refundedAt).toLocaleString()} by {order.refundedByStaffName || 'Authorized Staff'}
                </p>
              )}
            </div>
          )}

          {/* Invoice Terms & Declaration */}
          <div className="pt-4 border-t border-slate-300 text-[10px] text-black font-medium space-y-1">
            <p>1. This is a computer-generated tax invoice and diagnostic receipt. Physical signature is not required.</p>
            <p>2. Reports can be accessed online via Patient Portal using your registered UHID (<strong>{order.patientId}</strong>) or WhatsApp.</p>
            <p>3. Please collect sample containers within operational lab hours. For any query, call <strong>{center.phone}</strong>.</p>
          </div>
        </div>

        {/* Footer Actions - Screen Only */}
        <div className="flex items-center justify-between p-4 bg-slate-50 border-t border-slate-200 no-print gap-3">
          <button
            type="button"
            onClick={handleWhatsApp}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-2xl text-xs transition-all shadow-xs cursor-pointer"
          >
            <Share2 className="w-4 h-4" />
            <span>Send on WhatsApp</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-5 py-2.5 bg-sky-600 hover:bg-sky-500 text-white font-bold rounded-2xl text-xs transition-all shadow-md active:scale-95 cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Print Invoice Receipt</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 font-bold rounded-2xl text-xs transition-all cursor-pointer shadow-xs"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
