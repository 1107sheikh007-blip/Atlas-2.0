import React, { useEffect, useState } from 'react';
import {
  X,
  User,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Building2,
  Stethoscope,
  HeartHandshake,
  Receipt,
  FileText,
  Download,
  CheckCircle2,
  Clock,
  Edit3,
  Lock,
  ShieldCheck,
  ChevronRight,
  ExternalLink
} from 'lucide-react';
import { Patient, DiagnosticOrder, CenterBranch } from '../../types';
import { formatSafeDate } from '../../utils/dateUtils';
import { ReportPrintView } from '../common/ReportPrintView';
import { InvoiceReceiptModal } from '../common/InvoiceReceiptModal';
import { useDiagnostic } from '../../context/DiagnosticContext';

interface PatientDetailsModalProps {
  patient: Patient;
  orders: DiagnosticOrder[];
  center: CenterBranch;
  canEdit: boolean;
  onClose: () => void;
  onEdit?: (patient: Patient) => void;
}

export const PatientDetailsModal: React.FC<PatientDetailsModalProps> = ({
  patient,
  orders,
  center,
  canEdit,
  onClose,
  onEdit
}) => {
  const { getReportByOrderId, referrers } = useDiagnostic();
  const [selectedReportOrder, setSelectedReportOrder] = useState<DiagnosticOrder | null>(null);
  const [selectedInvoiceOrder, setSelectedInvoiceOrder] = useState<DiagnosticOrder | null>(null);

  // Keyboard ESC listener for UI symmetry
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !selectedReportOrder && !selectedInvoiceOrder) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, selectedReportOrder, selectedInvoiceOrder]);

  // Orders for this patient - match by patientId, patient.id, or normalized phone/name
  const patientOrders = orders.filter(o => {
    if (o.isDeleted || o.deletionPendingApproval) return false;
    if (o.patientId && (o.patientId === patient.id || o.patientId.toLowerCase() === patient.id.toLowerCase())) return true;
    if (o.patient?.id && (o.patient.id === patient.id || o.patient.id.toLowerCase() === patient.id.toLowerCase())) return true;
    if (patient.phone && o.patient?.phone) {
      const p1 = patient.phone.replace(/[^0-9]/g, '').slice(-10);
      const p2 = o.patient.phone.replace(/[^0-9]/g, '').slice(-10);
      if (p1 && p2 && p1 === p2) return true;
    }
    if (patient.name && o.patient?.name && patient.name.trim().toLowerCase() === o.patient.name.trim().toLowerCase()) return true;
    return false;
  });

  // Compute all Affiliated Doctors for this patient
  const affiliatedDoctorsMap = new Map<string, {
    name: string;
    specialty?: string;
    hospital?: string;
    role: string;
    orderCount: number;
    totalAmount: number;
    lastVisit: string;
  }>();

  patientOrders.forEach(ord => {
    const docName = ord.referringDoctorName || 'Direct Walk-in';
    const existingRef = referrers.find(
      r => r.id === ord.referringDoctorId || r.name.toLowerCase() === docName.toLowerCase()
    );

    const docKey = docName.toLowerCase();
    if (!affiliatedDoctorsMap.has(docKey)) {
      affiliatedDoctorsMap.set(docKey, {
        name: docName,
        specialty: existingRef?.specialty || (docName === 'Direct Walk-in' ? 'Walk-in Registration' : 'Consulting Physician'),
        hospital: existingRef?.organizationName || existingRef?.hospital || '',
        role: docName === 'Direct Walk-in' ? 'Direct Registration' : 'Referring Doctor',
        orderCount: 1,
        totalAmount: ord.totalAmount || 0,
        lastVisit: ord.createdAt
      });
    } else {
      const entry = affiliatedDoctorsMap.get(docKey)!;
      entry.orderCount += 1;
      entry.totalAmount += ord.totalAmount || 0;
      if (new Date(ord.createdAt) > new Date(entry.lastVisit)) {
        entry.lastVisit = ord.createdAt;
      }
    }

    // Check reporting doctor if report exists
    const rep = getReportByOrderId(ord.id);
    if (rep?.doctorName) {
      const repKey = rep.doctorName.toLowerCase();
      if (!affiliatedDoctorsMap.has(repKey)) {
        affiliatedDoctorsMap.set(repKey, {
          name: rep.doctorName,
          specialty: rep.doctorSpecialty || 'Consultant Radiologist / Pathologist',
          hospital: center.name,
          role: 'Reporting Consultant',
          orderCount: 1,
          totalAmount: 0,
          lastVisit: ord.createdAt
        });
      }
    }
  });

  const affiliatedDoctors = Array.from(affiliatedDoctorsMap.values());
  const totalBilled = patientOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
  const totalPaid = patientOrders.reduce((sum, o) => sum + (o.paidAmount || 0), 0);
  const totalDue = patientOrders.reduce((sum, o) => sum + (o.dueAmount || 0), 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div 
        className="fixed inset-0 -z-10" 
        onClick={onClose} 
      />

      <div className="relative w-full max-w-4xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden my-6 animate-fade-in flex flex-col max-h-[90vh]">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4.5 bg-gradient-to-r from-slate-900 via-sky-950 to-indigo-950 text-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-sky-500/20 text-sky-400 flex items-center justify-center font-black text-xl border border-sky-400/30">
              {patient.name[0]?.toUpperCase() || 'P'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-black tracking-tight">{patient.name}</h2>
                <span className="px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-300 border border-sky-400/30 text-[10px] font-mono font-bold">
                  UHID: {patient.id}
                </span>
              </div>
              <p className="text-xs text-slate-300 font-medium">
                {patient.gender} • {patient.age} Years • Registered {formatSafeDate(patient.registeredAt)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            {canEdit ? (
              <button
                type="button"
                onClick={() => onEdit && onEdit(patient)}
                className="flex items-center gap-1.5 px-3.5 py-1.5 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-sky-600/30 active:scale-95 cursor-pointer"
                title="Super Admin Authorized Edit"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Edit Demographics</span>
              </button>
            ) : (
              <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-800/80 text-slate-400 border border-slate-700 text-[11px] font-semibold">
                <Lock className="w-3 h-3 text-slate-400" />
                <span>View Only • Super Admin Edit Required</span>
              </span>
            )}

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-white/80 hover:text-white hover:bg-white/10 rounded-xl transition-colors cursor-pointer"
              title="Close (ESC)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* Top Quick Stats Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3.5 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-800 text-center">
              <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Total Tests Booked</span>
              <span className="text-lg font-black text-slate-900 dark:text-white">{patientOrders.length}</span>
            </div>
            <div className="p-3.5 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-800 text-center">
              <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Total Billed</span>
              <span className="text-lg font-black text-sky-700 dark:text-sky-400">₹{totalBilled.toLocaleString()}</span>
            </div>
            <div className="p-3.5 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-800 text-center">
              <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Total Paid</span>
              <span className="text-lg font-black text-emerald-600 dark:text-emerald-400">₹{totalPaid.toLocaleString()}</span>
            </div>
            <div className="p-3.5 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-800 text-center">
              <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Balance Due</span>
              <span className={`text-lg font-black ${totalDue > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-400'}`}>
                ₹{totalDue.toLocaleString()}
              </span>
            </div>
          </div>

          {/* Section 1: Demographics Card */}
          <div className="bg-white dark:bg-slate-800/40 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2.5">
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <User className="w-4 h-4 text-sky-600" /> Patient Identification & Demographics
              </h3>
              {canEdit && (
                <button
                  type="button"
                  onClick={() => onEdit && onEdit(patient)}
                  className="text-xs font-bold text-sky-600 hover:text-sky-700 flex items-center gap-1 cursor-pointer"
                >
                  <Edit3 className="w-3 h-3" /> Edit
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-y-3 gap-x-6 text-xs">
              <div>
                <span className="text-slate-400 font-medium block">Full Name:</span>
                <span className="font-bold text-slate-900 dark:text-white text-sm">{patient.name}</span>
              </div>
              <div>
                <span className="text-slate-400 font-medium block">Permanent UHID:</span>
                <span className="font-mono font-bold text-sky-700 dark:text-sky-400">{patient.id}</span>
              </div>
              <div>
                <span className="text-slate-400 font-medium block">Age & Gender:</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">{patient.age} Y / {patient.gender}</span>
              </div>
              <div>
                <span className="text-slate-400 font-medium block">Primary Mobile:</span>
                <span className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1">
                  <Phone className="w-3 h-3 text-emerald-600" /> {patient.phone || 'N/A'}
                </span>
              </div>
              <div>
                <span className="text-slate-400 font-medium block">Blood Group:</span>
                <span className="font-extrabold text-rose-600">{patient.bloodGroup || 'Unspecified'}</span>
              </div>
              <div>
                <span className="text-slate-400 font-medium block">Registered Date:</span>
                <span className="font-medium text-slate-700 dark:text-slate-300">
                  {formatSafeDate(patient.registeredAt)}
                </span>
              </div>
              <div className="sm:col-span-2 md:col-span-3 pt-2 mt-1 border-t border-slate-100 dark:border-slate-800/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 bg-sky-50/50 dark:bg-sky-950/20 p-2.5 rounded-xl border border-sky-100 dark:border-sky-900/40">
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 block">Default Referring Doctor (Future Orders):</span>
                    <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1">
                      <Stethoscope className="w-3.5 h-3.5 text-sky-600" />
                      {patient.referringDoctorName || 'Direct / Walk-in'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 block">Default Commission Beneficiary:</span>
                    <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1">
                      <HeartHandshake className="w-3.5 h-3.5 text-emerald-600" />
                      {patient.commissionBeneficiaryName || patient.referringDoctorName || 'Direct Center / None'}
                    </span>
                  </div>
                </div>
                {canEdit && (
                  <button
                    type="button"
                    onClick={() => onEdit && onEdit(patient)}
                    className="text-xs font-bold text-sky-600 hover:text-sky-700 dark:text-sky-400 flex items-center gap-1 px-2.5 py-1 bg-white dark:bg-slate-900 rounded-lg border border-sky-200 dark:border-sky-800 shadow-2xs cursor-pointer shrink-0"
                  >
                    <Edit3 className="w-3 h-3" /> Edit Doctor & Beneficiary
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Section 2: Affiliated Doctors & Referral Network */}
          <div className="bg-white dark:bg-slate-800/40 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2.5">
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <Stethoscope className="w-4 h-4 text-emerald-600" /> Affiliated Doctors & Clinical Network ({affiliatedDoctors.length})
              </h3>
              <span className="text-[11px] text-slate-400 font-medium">
                Linked via Referral Orders & Diagnostics
              </span>
            </div>

            {affiliatedDoctors.length === 0 ? (
              <div className="p-4 bg-slate-50 dark:bg-slate-800/30 rounded-xl text-center text-xs text-slate-400">
                No specific doctor referral records affiliated with this patient (Direct Walk-in).
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {affiliatedDoctors.map((doc, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 flex items-start justify-between gap-2"
                  >
                    <div className="flex items-start gap-2.5">
                      <div className="p-2 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 rounded-xl shrink-0 mt-0.5">
                        <HeartHandshake className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-900 dark:text-white text-xs">{doc.name}</h4>
                        <p className="text-[11px] text-slate-500">{doc.specialty}</p>
                        {doc.hospital && (
                          <p className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                            <Building2 className="w-3 h-3 text-slate-400" /> {doc.hospital}
                          </p>
                        )}
                        <span className="inline-block mt-1.5 px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-[9px] font-bold">
                          {doc.role}
                        </span>
                      </div>
                    </div>

                    <div className="text-right shrink-0 text-[11px]">
                      <span className="font-bold text-sky-700 dark:text-sky-400 block">{doc.orderCount} Orders</span>
                      {doc.totalAmount > 0 && (
                        <span className="text-[10px] text-slate-400 block">₹{doc.totalAmount.toLocaleString()}</span>
                      )}
                      <span className="text-[9px] text-slate-400 block mt-1">
                        Last: {formatSafeDate(doc.lastVisit)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Section 3: Diagnostic Test History & Orders */}
          <div className="bg-white dark:bg-slate-800/40 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2.5">
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <Receipt className="w-4 h-4 text-sky-600" /> Diagnostic Invoices & Test Orders ({patientOrders.length})
              </h3>
              <span className="text-[11px] text-slate-400 font-medium">
                Official clinical and financial records
              </span>
            </div>

            {patientOrders.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400 bg-slate-50 dark:bg-slate-800/30 rounded-xl">
                No diagnostic investigation orders placed yet for this patient.
              </div>
            ) : (
              <div className="space-y-3">
                {patientOrders.map(ord => {
                  const rep = getReportByOrderId(ord.id);
                  const isReady = rep?.status === 'AUTHORIZED' || ord.status === 'VERIFIED' || ord.status === 'DISPATCHED';

                  return (
                    <div
                      key={ord.id}
                      className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-3"
                    >
                      {/* Top Order Row */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-slate-200 dark:border-slate-700">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-extrabold text-slate-900 dark:text-white text-xs">{ord.invoiceNumber}</span>
                            <span className="font-mono text-sky-700 dark:text-sky-400 text-[11px] font-bold">
                              #{ord.barcode}
                            </span>
                            <span className="text-[10px] text-slate-400 font-medium">
                              • {formatSafeDate(ord.createdAt)}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 mt-0.5">
                            Referred by: <strong className="text-slate-700 dark:text-slate-300 font-semibold">{ord.referringDoctorName || 'Direct Walk-in'}</strong>
                          </p>
                        </div>

                        <div className="flex items-center gap-2">
                          <span
                            className={`px-2.5 py-1 rounded-full text-[10px] font-bold inline-flex items-center gap-1 ${
                              isReady
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                                : 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                            }`}
                          >
                            {isReady ? <CheckCircle2 className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                            {isReady ? 'Report Authorized' : ord.status.replace('_', ' ')}
                          </span>
                        </div>
                      </div>

                      {/* Tests in Order */}
                      <div className="space-y-1.5">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                          Investigations Included:
                        </span>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {ord.tests.map(t => (
                            <div
                              key={t.id}
                              className="p-2.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 flex justify-between items-center text-xs"
                            >
                              <div>
                                <span className="font-bold text-slate-800 dark:text-slate-200 block">{t.name}</span>
                                <span className="text-[10px] text-slate-400">{t.category} • {t.department}</span>
                              </div>
                              <span className="font-extrabold text-sky-700 dark:text-sky-400">₹{t.price}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Billing & Action Footer */}
                      <div className="pt-2 border-t border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
                        <div className="text-slate-500">
                          Total: <strong className="text-slate-900 dark:text-white font-bold">₹{ord.totalAmount}</strong> • Paid: <strong className="text-emerald-700 font-bold">₹{ord.paidAmount}</strong> ({ord.paymentMode})
                          {ord.dueAmount > 0 && (
                            <span className="text-rose-600 font-bold ml-1.5">• Due: ₹{ord.dueAmount}</span>
                          )}
                        </div>

                        <div className="flex items-center gap-2 w-full sm:w-auto">
                          <button
                            type="button"
                            onClick={() => setSelectedInvoiceOrder(ord)}
                            className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold rounded-xl text-xs transition-colors cursor-pointer"
                          >
                            <Receipt className="w-3.5 h-3.5 text-sky-600" />
                            <span>Invoice Receipt</span>
                          </button>

                          {isReady ? (
                            <button
                              type="button"
                              onClick={() => setSelectedReportOrder(ord)}
                              className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3.5 py-1.5 bg-sky-600 hover:bg-sky-500 text-white font-bold rounded-xl text-xs shadow-sm transition-all active:scale-95 cursor-pointer"
                            >
                              <Download className="w-3.5 h-3.5" />
                              <span>Official Report (PDF)</span>
                            </button>
                          ) : (
                            <span className="text-[11px] text-amber-600 font-semibold px-2">
                              Report Pending
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 shrink-0">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Digital Patient Record • Confidential & AERB Standard</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 font-bold rounded-xl transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>

      </div>

      {/* Sub-Modal: Official Report View */}
      {selectedReportOrder && (
        <ReportPrintView
          report={getReportByOrderId(selectedReportOrder.id) || {
            id: `REP-${selectedReportOrder.id.slice(-4)}`,
            orderId: selectedReportOrder.id,
            testId: selectedReportOrder.tests[0]?.id || 't-01',
            testName: selectedReportOrder.tests.map(t => t.name).join(', '),
            patientId: selectedReportOrder.patientId,
            patientName: selectedReportOrder.patient.name,
            patientAge: selectedReportOrder.patient.age,
            patientGender: selectedReportOrder.patient.gender,
            category: selectedReportOrder.tests[0]?.category || 'Pathology',
            findingsHtml: '<p>Authorized test evaluation verified.</p>',
            impression: 'Investigation parameters correlate clinically with reference findings.',
            doctorName: selectedReportOrder.referringDoctorName || 'Consultant Specialist',
            doctorSpecialty: 'Senior Clinical Consultant',
            doctorRegistrationNo: 'MCI / 54201 / 2015',
            status: 'AUTHORIZED',
            attachments: []
          }}
          order={selectedReportOrder}
          center={center}
          onClose={() => setSelectedReportOrder(null)}
        />
      )}

      {/* Sub-Modal: Invoice Thermal Receipt */}
      {selectedInvoiceOrder && (
        <InvoiceReceiptModal
          order={selectedInvoiceOrder}
          center={center}
          onClose={() => setSelectedInvoiceOrder(null)}
        />
      )}
    </div>
  );
};
