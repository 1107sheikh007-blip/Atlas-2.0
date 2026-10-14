import React, { useState, useEffect } from 'react';
import {
  Stethoscope,
  Users,
  DollarSign,
  Award,
  Wallet,
  CheckCircle2,
  Clock,
  Eye,
  Search,
  Building2,
  Phone,
  Mail,
  FileText,
  ShieldCheck,
  ChevronDown,
  Plus,
  X,
  Sparkles,
  UserPlus
} from 'lucide-react';
import { useDiagnostic } from '../../context/DiagnosticContext';
import { ReferringDoctor, DiagnosticOrder } from '../../types';
import { ReportPrintView } from '../common/ReportPrintView';
import { DateRangeFilter, DatePresetType, isDateInSelectedRange } from '../common/DateRangeFilter';

export const ReferringDoctorPortal: React.FC = () => {
  const {
    referrers,
    approvedReferrers,
    orders,
    selectedCenter,
    activeReferrerId,
    setActiveReferrerId,
    getReportByOrderId,
    addReferringDoctor
  } = useDiagnostic();

  const currentDocId = activeReferrerId || approvedReferrers[0]?.id || referrers[0]?.id;
  const currentDoctor = referrers.find(r => r.id === currentDocId) || referrers[0];

  const [searchPatient, setSearchPatient] = useState('');
  const [docDateRange, setDocDateRange] = useState<DatePresetType>('ALL');
  const [docStartDate, setDocStartDate] = useState<string>('');
  const [docEndDate, setDocEndDate] = useState<string>('');
  const [viewingReportOrder, setViewingReportOrder] = useState<DiagnosticOrder | null>(null);

  // Add Referring Partner Modal State
  const [isAddPartnerModalOpen, setIsAddPartnerModalOpen] = useState(false);
  const [docName, setDocName] = useState('');
  const [docSpecialty, setDocSpecialty] = useState('');
  const [docHospital, setDocHospital] = useState('');
  const [docPhone, setDocPhone] = useState('');
  const [docEmail, setDocEmail] = useState('');
  const [docCommissionPct, setDocCommissionPct] = useState<number>(15);
  const [docBankDetails, setDocBankDetails] = useState('');
  const [docNotes, setDocNotes] = useState('');
  const [toastMessage, setToastMessage] = useState('');

  // Handle ESC key for modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isAddPartnerModalOpen) {
        setIsAddPartnerModalOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isAddPartnerModalOpen]);

  const handleCreateReferringDoctor = (e: React.FormEvent) => {
    e.preventDefault();
    if (!docName.trim() || !docPhone.trim()) return;

    const newId = addReferringDoctor({
      name: docName.trim().startsWith('Dr.') ? docName.trim() : `Dr. ${docName.trim()}`,
      qualification: '',
      specialty: docSpecialty.trim() || '',
      hospital: docHospital.trim() || '',
      phone: docPhone.trim(),
      email: docEmail.trim() || '',
      commissionPct: Math.min(100, Math.max(0, Number(docCommissionPct) || 15)),
      status: 'APPROVED',
      addedByRole: 'SUPER_ADMIN',
      bankDetails: docBankDetails.trim() || undefined,
      notes: docNotes.trim() || undefined
    });

    setActiveReferrerId(newId);
    setIsAddPartnerModalOpen(false);
    setToastMessage(`Referring partner ${docName.trim()} registered and active in roster!`);
    setTimeout(() => setToastMessage(''), 4000);

    // Reset Form
    setDocName('');
    setDocSpecialty('');
    setDocHospital('');
    setDocPhone('');
    setDocEmail('');
    setDocCommissionPct(15);
    setDocBankDetails('');
    setDocNotes('');
  };

  const referredOrders = orders.filter(o => 
    !o.isDeleted && !o.deletionPendingApproval &&
    (o.referringDoctorId === currentDoctor?.id || 
    (o.referringDoctorName && currentDoctor && o.referringDoctorName.includes(currentDoctor.name.split(',')[0])))
  );

  const filteredReferredOrders = referredOrders.filter(o => {
    const dateMatches =
      isDateInSelectedRange(o.createdAt, docDateRange, docStartDate, docEndDate) ||
      (o.appointmentDate ? isDateInSelectedRange(o.appointmentDate, docDateRange, docStartDate, docEndDate) : false);
    if (!dateMatches) return false;
    return (
      o.patient.name.toLowerCase().includes(searchPatient.toLowerCase()) ||
      o.patientId.toLowerCase().includes(searchPatient.toLowerCase()) ||
      (o.invoiceNumber && o.invoiceNumber.toLowerCase().includes(searchPatient.toLowerCase()))
    );
  });

  const pendingPayoutBalance = Math.max(0, (currentDoctor?.totalCommissionEarned || 0) - (currentDoctor?.payoutPaid || 0));

  return (
    <div className="space-y-4">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 bg-sky-900 border border-sky-500 text-white rounded-2xl shadow-2xl text-xs font-semibold animate-fade-in">
          <Sparkles className="w-4 h-4 text-cyan-300" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header & Doctor Selector Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 p-4 sm:p-5 bg-white border border-sky-100 rounded-3xl shadow-xs">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-sky-50 text-sky-600 rounded-2xl border border-sky-100">
            <Stethoscope className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-slate-900 tracking-tight">
                Referring Partner Portal
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-sky-100 text-sky-800">
                Partner Dashboard
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Live updates on referred patients, clinical outcomes, and commission settlements
            </p>
          </div>
        </div>

        {/* Doctor Selector & Add Button */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Add Partner Button */}
          <button
            type="button"
            onClick={() => setIsAddPartnerModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-sky-600 hover:bg-sky-700 text-white font-bold rounded-2xl text-xs shadow-sm cursor-pointer transition-all shrink-0"
          >
            <UserPlus className="w-4 h-4" />
            <span>+ Add Partner Doctor</span>
          </button>

          {/* Switch Logged-in Referring Doctor */}
          <div className="flex items-center gap-2 bg-slate-50 px-3 py-2 rounded-2xl border border-slate-200 text-xs">
            <span className="text-slate-500 font-bold">Doctor Profile:</span>
            <select
              value={currentDoctor?.id || ''}
              onChange={e => setActiveReferrerId(e.target.value)}
              className="bg-transparent text-slate-900 font-bold focus:outline-none cursor-pointer max-w-[200px] truncate"
            >
              {referrers.length === 0 ? (
                <option value="">No referring doctors registered</option>
              ) : (
                referrers.map(doc => (
                  <option key={doc.id} value={doc.id}>
                    {doc.name} [{doc.status}]
                  </option>
                ))
              )}
            </select>
          </div>
        </div>
      </div>

      {/* Doctor Overview Cards & Tables */}
      {currentDoctor ? (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Commission % */}
          <div className="p-5 bg-white border border-sky-100 rounded-3xl shadow-xs space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-500 font-bold">
              <span>Allotted Referral Share</span>
              <div className="p-2 bg-sky-50 text-sky-600 rounded-xl">
                <Award className="w-4 h-4" />
              </div>
            </div>
            <p className="text-3xl font-black text-sky-700">
              {currentDoctor.commissionPct}%
            </p>
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
              <span className="text-slate-500">Roster Status:</span>
              <span className={`font-bold px-2 py-0.5 rounded ${
                currentDoctor.status === 'APPROVED'
                  ? 'bg-emerald-100 text-emerald-800'
                  : 'bg-amber-100 text-amber-800'
              }`}>
                {currentDoctor.status}
              </span>
            </div>
          </div>

          {/* Patients Referred */}
          <div className="p-5 bg-white border border-sky-100 rounded-3xl shadow-xs space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-500 font-bold">
              <span>Patients Referred</span>
              <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                <Users className="w-4 h-4" />
              </div>
            </div>
            <p className="text-3xl font-black text-slate-900">
              {currentDoctor.totalReferralsCount}
            </p>
            <p className="text-[11px] text-slate-500 pt-2 border-t border-slate-100">
              Across Imaging & Pathology panels
            </p>
          </div>

          {/* Gross Invoiced Revenue */}
          <div className="p-5 bg-white border border-sky-100 rounded-3xl shadow-xs space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-500 font-bold">
              <span>Total Gross Billing</span>
              <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
                <DollarSign className="w-4 h-4" />
              </div>
            </div>
            <p className="text-3xl font-black text-emerald-600">
              ₹{currentDoctor.totalRevenueGenerated.toLocaleString()}
            </p>
            <p className="text-[11px] text-slate-500 pt-2 border-t border-slate-100">
              Total investigation fee generated
            </p>
          </div>

          {/* Commission & Settlement */}
          <div className="p-5 bg-white border border-sky-100 rounded-3xl shadow-xs space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-500 font-bold">
              <span>Earned Commission</span>
              <div className="p-2 bg-purple-50 text-purple-600 rounded-xl">
                <Wallet className="w-4 h-4" />
              </div>
            </div>
            <p className="text-3xl font-black text-purple-700">
              ₹{currentDoctor.totalCommissionEarned.toLocaleString()}
            </p>
            <div className="flex justify-between items-center text-[11px] text-slate-500 pt-2 border-t border-slate-100">
              <span>Paid: <strong className="text-slate-800">₹{(currentDoctor.payoutPaid || 0).toLocaleString()}</strong></span>
              <span>Due: <strong className="text-amber-700 font-bold">₹{pendingPayoutBalance.toLocaleString()}</strong></span>
            </div>
          </div>
        </div>

      {/* Referred Patients List */}
      <div className="bg-white border border-sky-100 rounded-3xl p-6 shadow-xs space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div>
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <FileText className="w-4 h-4 text-sky-600" />
              Referred Patients & Investigation Status ({filteredReferredOrders.length})
            </h3>
            <p className="text-xs text-slate-500">
              Real-time report updates and direct access to finalized PDF reports
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                value={searchPatient}
                onChange={e => setSearchPatient(e.target.value)}
                placeholder="Search referred patient..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>

            <DateRangeFilter
              preset={docDateRange}
              startDate={docStartDate}
              endDate={docEndDate}
              onPresetChange={setDocDateRange}
              onStartDateChange={setDocStartDate}
              onEndDateChange={setDocEndDate}
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-sky-50 text-sky-900 uppercase text-[10px] tracking-wider border-b border-sky-100 font-bold">
              <tr>
                <th className="p-3.5">Patient Details</th>
                <th className="p-3.5">Tests Prescribed</th>
                <th className="p-3.5">Bill Amount</th>
                <th className="p-3.5">Commission Share</th>
                <th className="p-3.5">Diagnostic Status</th>
                <th className="p-3.5 text-right">View Report</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredReferredOrders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-400">
                    No referred patients found for this doctor profile in active center.
                  </td>
                </tr>
              ) : (
                filteredReferredOrders.map(ord => {
                  const rep = getReportByOrderId(ord.id);
                  const isReady = rep?.status === 'AUTHORIZED' || ord.status === 'VERIFIED' || ord.status === 'DISPATCHED';
                  const docCommShare = Math.round((ord.totalAmount * ((currentDoctor?.commissionPct || 15) / 100)) * 100) / 100;

                  return (
                    <tr key={ord.id} className="hover:bg-slate-50">
                      <td className="p-3.5">
                        <span className="font-bold text-slate-900 block">{ord.patient.name}</span>
                        <span className="text-slate-500 text-[11px]">{ord.patient.gender[0]}/{ord.patient.age}y • UHID: {ord.patientId}</span>
                      </td>

                      <td className="p-3.5">
                        <div className="flex flex-wrap gap-1">
                          {ord.tests.map(t => (
                            <span key={t.id} className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[10px] border border-slate-200">
                              {t.name}
                            </span>
                          ))}
                        </div>
                      </td>

                      <td className="p-3.5 font-bold text-slate-900">
                        ₹{ord.totalAmount}
                      </td>

                      <td className="p-3.5 font-bold text-emerald-700">
                        ₹{docCommShare} ({currentDoctor?.commissionPct || 15}%)
                      </td>

                      <td className="p-3.5">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-bold inline-flex items-center gap-1 ${
                            isReady
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {isReady ? <CheckCircle2 className="w-3 h-3 text-emerald-600" /> : <Clock className="w-3 h-3 text-amber-600" />}
                          {ord.status.replace('_', ' ')}
                        </span>
                      </td>

                      <td className="p-3.5 text-right">
                        {isReady ? (
                          <button
                            onClick={() => setViewingReportOrder(ord)}
                            className="px-3 py-1.5 bg-sky-600 hover:bg-sky-500 text-white font-bold rounded-xl text-xs inline-flex items-center gap-1 shadow-xs transition-all"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            View Report
                          </button>
                        ) : (
                          <span className="text-slate-400 text-xs italic">Processing</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
      </>
      ) : (
        <div className="p-10 bg-white border border-slate-200 rounded-3xl text-center space-y-4 shadow-xs">
          <div className="w-14 h-14 rounded-2xl bg-sky-100 text-sky-700 mx-auto flex items-center justify-center shadow-xs">
            <Stethoscope className="w-7 h-7" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-slate-900">No Referring Doctors in Roster</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Add referring clinic and hospital partner doctors here to track their patient cases, clinical test reports, and earned referral commission ledger.
            </p>
          </div>
          <div>
            <button
              type="button"
              onClick={() => setIsAddPartnerModalOpen(true)}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-sky-600 hover:bg-sky-700 text-white font-bold rounded-2xl text-xs shadow-md shadow-sky-600/20 cursor-pointer transition-all"
            >
              <UserPlus className="w-4 h-4" />
              <span>+ Add Referring Partner Doctor</span>
            </button>
          </div>
        </div>
      )}

      {/* MODAL: Add Referring Partner Doctor */}
      {isAddPartnerModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto"
          onClick={() => setIsAddPartnerModalOpen(false)}
        >
          <div
            className="relative w-full max-w-lg bg-white border border-slate-200 rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200"
            onClick={e => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-sky-600 to-cyan-600 text-white">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/20 rounded-xl backdrop-blur-xs">
                  <UserPlus className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-white">Add Referring Partner Doctor</h3>
                  <p className="text-xs text-sky-100">Register doctor to roster with customized commission share</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAddPartnerModalOpen(false)}
                className="p-1.5 text-white/80 hover:text-white hover:bg-white/10 rounded-xl transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleCreateReferringDoctor} className="p-6 space-y-4 text-xs">
              {/* Doctor Name */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Doctor Full Name *
                </label>
                <div className="relative">
                  <Stethoscope className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={docName}
                    onChange={e => setDocName(e.target.value)}
                    placeholder="e.g. Dr. Rajesh Sharma, MD"
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:bg-white"
                    autoFocus
                  />
                </div>
              </div>

              {/* Specialty & Hospital / Clinic */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Specialty / Department
                  </label>
                  <input
                    type="text"
                    value={docSpecialty}
                    onChange={e => setDocSpecialty(e.target.value)}
                    placeholder="e.g. Consultant Physician / Ortho"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Hospital / Clinic Practice
                  </label>
                  <div className="relative">
                    <Building2 className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={docHospital}
                      onChange={e => setDocHospital(e.target.value)}
                      placeholder="e.g. City Polyclinic & Care"
                      className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
                    />
                  </div>
                </div>
              </div>

              {/* Phone & Email */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Mobile Phone (WhatsApp) *
                  </label>
                  <div className="relative">
                    <Phone className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="tel"
                      required
                      value={docPhone}
                      onChange={e => setDocPhone(e.target.value)}
                      placeholder="e.g. +91 98765 43210"
                      className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      value={docEmail}
                      onChange={e => setDocEmail(e.target.value)}
                      placeholder="e.g. doctor@hospital.com"
                      className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
                    />
                  </div>
                </div>
              </div>

              {/* Commission Percentage with Quick Preset Pills */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-slate-700">
                    Referral Commission Share (%)
                  </label>
                  <span className="font-extrabold text-sky-700 text-xs">
                    {docCommissionPct}% of gross bill
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {[10, 15, 20, 25].map(pct => (
                    <button
                      key={pct}
                      type="button"
                      onClick={() => setDocCommissionPct(pct)}
                      className={`flex-1 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                        docCommissionPct === pct
                          ? 'bg-sky-600 text-white border-sky-600 shadow-xs ring-2 ring-sky-300'
                          : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                      }`}
                    >
                      {pct}%
                    </button>
                  ))}
                  <div className="w-24">
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={docCommissionPct}
                      onChange={e => {
                        const val = Number(e.target.value);
                        setDocCommissionPct(Math.min(100, Math.max(0, isNaN(val) ? 0 : val)));
                      }}
                      placeholder="Custom %"
                      className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 text-center"
                    />
                  </div>
                </div>
              </div>

              {/* Bank / UPI Settlement Details */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Payout Settlement Preference (UPI / Bank Account)
                </label>
                <div className="relative">
                  <Wallet className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={docBankDetails}
                    onChange={e => setDocBankDetails(e.target.value)}
                    placeholder="e.g. UPI: doctor@okhdfcbank or A/c 501002341..."
                    className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddPartnerModalOpen(false)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-2xl text-xs transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-sky-600 hover:bg-sky-700 text-white font-extrabold rounded-2xl text-xs shadow-md shadow-sky-600/20 transition-all cursor-pointer"
                >
                  Save & Add to Roster
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Report Modal */}
      {viewingReportOrder && (
        <ReportPrintView
          report={getReportByOrderId(viewingReportOrder.id) || {
            id: `REP-${viewingReportOrder.id.slice(-4)}`,
            orderId: viewingReportOrder.id,
            testId: viewingReportOrder.tests[0].id,
            testName: viewingReportOrder.tests.map(t => t.name).join(', '),
            patientId: viewingReportOrder.patientId,
            patientName: viewingReportOrder.patient.name,
            patientAge: viewingReportOrder.patient.age,
            patientGender: viewingReportOrder.patient.gender,
            category: viewingReportOrder.tests[0].category,
            findingsHtml: '<p>Patient findings authorized and verified by consultant radiologist.</p>',
            impression: 'Investigation reported within normal physiological parameters.',
            doctorName: 'Dr. Rekha Khanna',
            doctorSpecialty: 'MBBS MD Radiodiagnosis',
            doctorRegistrationNo: 'MP 13663',
            status: 'AUTHORIZED',
            attachments: []
          }}
          order={viewingReportOrder}
          center={selectedCenter}
          onClose={() => setViewingReportOrder(null)}
        />
      )}
    </div>
  );
};
