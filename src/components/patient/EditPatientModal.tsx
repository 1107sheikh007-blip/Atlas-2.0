import React, { useState, useEffect } from 'react';
import { X, Save, User, Phone, Mail, MapPin, Heart, Shield, AlertCircle, Loader2, Stethoscope, Building2, Lock, Sparkles, CheckCircle2 } from 'lucide-react';
import { Patient } from '../../types';
import { useDiagnostic } from '../../context/DiagnosticContext';
import { parsePatientNameParts, normalizeAgeCalendar } from '../../utils/dateUtils';

interface EditPatientModalProps {
  patient: Patient;
  onClose: () => void;
  onSave: (updatedData: Partial<Patient>) => void;
}

export const EditPatientModal: React.FC<EditPatientModalProps> = ({
  patient,
  onClose,
  onSave
}) => {
  const initialParsed = parsePatientNameParts(patient.name || '');
  const [title, setTitle] = useState<'Mr.' | 'Mrs.' | 'Ms.' | 'Mast.' | 'Baby' | 'Dr.'>(
    (patient.title as any) || initialParsed.title || (patient.gender === 'Female' ? 'Mrs.' : 'Mr.')
  );
  const [firstName, setFirstName] = useState(patient.firstName || initialParsed.firstName || '');
  const [lastName, setLastName] = useState(patient.lastName || initialParsed.lastName || '');
  const [age, setAge] = useState<number | string>(patient.age !== undefined && patient.age !== null ? patient.age : '');
  const [ageMonths, setAgeMonths] = useState<number | string>(patient.ageMonths !== undefined && patient.ageMonths !== null ? patient.ageMonths : '');
  const [ageDays, setAgeDays] = useState<number | string>(patient.ageDays !== undefined && patient.ageDays !== null ? patient.ageDays : '');
  const handleAgeBlur = () => {
    if (age === '' && ageMonths === '' && ageDays === '') return;
    const normalized = normalizeAgeCalendar(age, ageMonths, ageDays);
    setAge(normalized.years);
    setAgeMonths(normalized.months);
    setAgeDays(normalized.days);
  };
  const [gender, setGender] = useState<'Male' | 'Female' | 'Other'>(patient.gender || 'Male');
  const [phone, setPhone] = useState(patient.phone || '');
  const [email, setEmail] = useState(patient.email || '');
  const [address, setAddress] = useState(patient.address || '');
  const [bloodGroup, setBloodGroup] = useState(patient.bloodGroup || '');
  const [abhaId, setAbhaId] = useState(patient.abhaId || '');
  const { approvedReferrers, allOrders } = useDiagnostic();

  // Referring Doctor & Affiliated Commission Beneficiary state (Super Admin exclusive)
  const [referringDoctorId, setReferringDoctorId] = useState(
    patient.referringDoctorId || patient.beneficiaryId || ''
  );
  const [isBeneficiaryDifferent, setIsBeneficiaryDifferent] = useState(
    Boolean(
      patient.commissionBeneficiaryId &&
      patient.referringDoctorId &&
      patient.commissionBeneficiaryId !== patient.referringDoctorId
    )
  );
  const [commissionBeneficiaryId, setCommissionBeneficiaryId] = useState(
    patient.commissionBeneficiaryId || patient.referringDoctorId || patient.beneficiaryId || ''
  );

  const patientOrdersCount = (allOrders || []).filter(
    o => o.patientId === patient.id || (o.patient?.phone && o.patient.phone === patient.phone)
  ).length;
  
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Keyboard ESC listener for UI symmetry
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const trimmedFirst = firstName.trim();
    const trimmedLast = lastName.trim();
    const combinedName = [title, trimmedFirst, trimmedLast].filter(Boolean).join(' ').trim();
    const trimmedPhone = phone.trim();
    const numAge = Number(age) || 0;
    const numMonths = Number(ageMonths) || 0;
    const numDays = Number(ageDays) || 0;

    if (!trimmedFirst) {
      setError('Patient First Name is required.');
      return;
    }

    if (numAge < 0 || numAge > 130 || (numAge === 0 && numMonths === 0 && numDays === 0)) {
      setError('Please provide a valid age in years, months, or days.');
      return;
    }

    if (!trimmedPhone || trimmedPhone.replace(/\D/g, '').length < 8) {
      setError('Please provide a valid primary phone number (at least 8 digits).');
      return;
    }

    setIsSaving(true);
    setTimeout(() => {
      const selectedDoc = approvedReferrers.find(r => r.id === referringDoctorId);
      const docName = selectedDoc ? selectedDoc.name : (referringDoctorId ? 'Direct Walk-in' : undefined);

      const effectiveBenId = isBeneficiaryDifferent ? commissionBeneficiaryId : referringDoctorId;
      const selectedBen = approvedReferrers.find(r => r.id === effectiveBenId);
      let benName: string | undefined = undefined;
      if (selectedBen) {
        benName = selectedBen.organizationName || selectedBen.name;
      } else if (docName) {
        benName = selectedDoc?.organizationName || docName;
      }

      onSave({
        name: combinedName,
        title,
        firstName: trimmedFirst,
        lastName: trimmedLast,
        age: numAge,
        ageMonths: numMonths,
        ageDays: numDays,
        ageDisplay: [numAge > 0 ? `${numAge}Y` : '', numMonths > 0 ? `${numMonths}M` : '', numDays > 0 ? `${numDays}D` : ''].filter(Boolean).join(' ') || `${numAge}Y`,
        gender,
        phone: trimmedPhone,
        email: email.trim(),
        address: address.trim(),
        bloodGroup: bloodGroup.trim() || undefined,
        abhaId: abhaId.trim() || undefined,
        referringDoctorId: referringDoctorId || undefined,
        referringDoctorName: docName,
        commissionBeneficiaryId: effectiveBenId || undefined,
        commissionBeneficiaryName: benName,
        beneficiaryId: effectiveBenId || referringDoctorId || undefined
      });
      setIsSaving(false);
      onClose();
    }, 200);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto"
      onClick={e => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="relative w-full max-w-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden my-8 animate-fade-in">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-sky-600 to-indigo-600 text-white">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/10 rounded-xl backdrop-blur-xs">
              <User className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-base font-bold">Edit Patient Demographics</h2>
              <p className="text-xs text-sky-100 font-mono">
                Permanent UHID: {patient.id} • Super Admin Authorized
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-white/80 hover:text-white hover:bg-white/10 rounded-xl transition-colors cursor-pointer"
            title="Close (ESC)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && (
            <div className="p-3.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 rounded-2xl flex items-center gap-2.5 text-xs text-rose-700 dark:text-rose-300">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Title, First Name, and Last Name */}
            <div className="sm:col-span-2 grid grid-cols-1 sm:grid-cols-12 gap-3">
              <div className="sm:col-span-3 space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Title *
                </label>
                <select
                  value={title}
                  onChange={e => {
                    const val = e.target.value as any;
                    setTitle(val);
                    if (val === 'Mr.' || val === 'Mast.') setGender('Male');
                    else if (val === 'Mrs.' || val === 'Ms.') setGender('Female');
                  }}
                  className="w-full bg-slate-50 dark:bg-slate-800/60 border border-slate-300 dark:border-slate-700 rounded-xl px-2.5 py-2 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500 cursor-pointer"
                >
                  <option value="Mr.">Mr.</option>
                  <option value="Mrs.">Mrs.</option>
                  <option value="Ms.">Ms.</option>
                  <option value="Mast.">Mast.</option>
                  <option value="Baby">Baby</option>
                  <option value="Dr.">Dr.</option>
                </select>
              </div>

              <div className="sm:col-span-5 space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-sky-600" /> First Name *
                </label>
                <input
                  type="text"
                  required
                  value={firstName}
                  onChange={e => setFirstName(e.target.value)}
                  placeholder="e.g. Ramesh"
                  className="w-full bg-slate-50 dark:bg-slate-800/60 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div className="sm:col-span-4 space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Last Name
                </label>
                <input
                  type="text"
                  value={lastName}
                  onChange={e => setLastName(e.target.value)}
                  placeholder="e.g. Sharma"
                  className="w-full bg-slate-50 dark:bg-slate-800/60 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              {/* Combined full name preview badge */}
              <div className="sm:col-span-12">
                <div className="px-3 py-1.5 rounded-xl bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800/60 text-[11px] flex items-center justify-between">
                  <span className="text-slate-600 dark:text-slate-400 font-medium">
                    Google Sheets &amp; Invoice Upload Name:
                  </span>
                  <span className="font-bold text-sky-700 dark:text-sky-300">
                    {[title, firstName.trim(), lastName.trim()].filter(Boolean).join(' ') || '—'}
                  </span>
                </div>
              </div>
            </div>

            {/* Age */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Age (Years • Months • Days) *
              </label>
              <div className="grid grid-cols-3 gap-2">
                <div className="relative">
                  <input
                    type="number"
                    min={0}
                    max={130}
                    value={age}
                    onChange={e => setAge(e.target.value)}
                    onBlur={handleAgeBlur}
                    placeholder="Years"
                    className="w-full bg-slate-50 dark:bg-slate-800/60 border border-slate-300 dark:border-slate-700 rounded-xl px-2.5 py-2 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500 pr-6"
                  />
                  <span className="absolute right-2 top-2 text-[10px] font-bold text-slate-400">Y</span>
                </div>
                <div className="relative">
                  <input
                    type="number"
                    min={0}
                    value={ageMonths}
                    onChange={e => setAgeMonths(e.target.value)}
                    onBlur={handleAgeBlur}
                    placeholder="Months"
                    className="w-full bg-slate-50 dark:bg-slate-800/60 border border-slate-300 dark:border-slate-700 rounded-xl px-2.5 py-2 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500 pr-6"
                  />
                  <span className="absolute right-2 top-2 text-[10px] font-bold text-slate-400">M</span>
                </div>
                <div className="relative">
                  <input
                    type="number"
                    min={0}
                    value={ageDays}
                    onChange={e => setAgeDays(e.target.value)}
                    onBlur={handleAgeBlur}
                    placeholder="Days"
                    className="w-full bg-slate-50 dark:bg-slate-800/60 border border-slate-300 dark:border-slate-700 rounded-xl px-2.5 py-2 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500 pr-6"
                  />
                  <span className="absolute right-2 top-2 text-[10px] font-bold text-slate-400">D</span>
                </div>
              </div>
            </div>

            {/* Gender */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Gender *
              </label>
              <select
                value={gender}
                onChange={e => setGender(e.target.value as any)}
                className="w-full bg-slate-50 dark:bg-slate-800/60 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>

            {/* Mobile / Phone */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-sky-600" /> Primary Mobile / WhatsApp *
              </label>
              <input
                type="text"
                required
                value={phone}
                onChange={e => setPhone(e.target.value)}
                placeholder="e.g. 9876543210"
                className="w-full bg-slate-50 dark:bg-slate-800/60 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>

            {/* Blood Group */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Heart className="w-3.5 h-3.5 text-rose-600" /> Blood Group
              </label>
              <select
                value={bloodGroup}
                onChange={e => setBloodGroup(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800/60 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
              >
                <option value="">Unknown / Not Tested</option>
                <option value="A+">A+</option>
                <option value="A-">A-</option>
                <option value="B+">B+</option>
                <option value="B-">B-</option>
                <option value="O+">O+</option>
                <option value="O-">O-</option>
                <option value="AB+">AB+</option>
                <option value="AB-">AB-</option>
              </select>
            </div>


            {/* Prescribing Doctor & Affiliated Commission Beneficiary (Super Admin Feature) */}
            <div className="sm:col-span-2 p-4 bg-sky-50/70 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800/70 rounded-2xl space-y-3.5">
              <div className="flex items-center justify-between border-b border-sky-100 dark:border-sky-900/60 pb-2">
                <span className="text-xs font-black text-sky-900 dark:text-sky-200 uppercase tracking-wider flex items-center gap-1.5">
                  <Stethoscope className="w-4 h-4 text-sky-600" /> Prescribing Doctor & Affiliated Beneficiary
                </span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 text-[10px] font-extrabold border border-emerald-300 dark:border-emerald-800">
                  <Shield className="w-3 h-3 text-emerald-600" /> Super Admin Control
                </span>
              </div>

              {/* 1. Prescribing Doctor Selection */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                  <span className="flex items-center gap-1">
                    <User className="w-3.5 h-3.5 text-sky-600" /> Prescribing / Referring Doctor
                  </span>
                  {referringDoctorId && (
                    <button
                      type="button"
                      onClick={() => {
                        setReferringDoctorId('');
                        if (!isBeneficiaryDifferent) setCommissionBeneficiaryId('');
                      }}
                      className="text-[10px] text-rose-600 hover:underline font-semibold"
                    >
                      Clear Selection
                    </button>
                  )}
                </label>
                <select
                  value={referringDoctorId}
                  onChange={e => {
                    const docId = e.target.value;
                    setReferringDoctorId(docId);
                    if (!isBeneficiaryDifferent) {
                      setCommissionBeneficiaryId(docId);
                    }
                  }}
                  className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500 cursor-pointer"
                >
                  <option value="">-- Direct Walk-in / Self-Prescribed --</option>
                  {approvedReferrers.map(r => (
                    <option key={r.id} value={r.id}>
                      {r.name} {r.specialty ? `• ${r.specialty}` : ''} {r.organizationName ? `[${r.organizationName}]` : ''} ({r.commissionPct}%)
                    </option>
                  ))}
                </select>
              </div>

              {/* 2. Decouple Beneficiary Option */}
              <div className="pt-1">
                <label className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={isBeneficiaryDifferent}
                    onChange={e => {
                      const checked = e.target.checked;
                      setIsBeneficiaryDifferent(checked);
                      if (!checked) {
                        setCommissionBeneficiaryId(referringDoctorId);
                      }
                    }}
                    className="w-4 h-4 text-sky-600 rounded-md border-slate-300 focus:ring-sky-500 cursor-pointer"
                  />
                  <span>Commission Beneficiary is different from Prescribing Doctor (e.g. Clinic / Hospital Organization)</span>
                </label>
              </div>

              {/* 3. Beneficiary Selector (when decoupled) */}
              {isBeneficiaryDifferent && (
                <div className="space-y-1 pl-6 pt-1 animate-fade-in">
                  <label className="text-xs font-bold text-cyan-900 dark:text-cyan-200 flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-cyan-600" /> Affiliated Commission Beneficiary Partner
                  </label>
                  <select
                    value={commissionBeneficiaryId}
                    onChange={e => setCommissionBeneficiaryId(e.target.value)}
                    className="w-full bg-white dark:bg-slate-900 border border-cyan-300 dark:border-cyan-700 rounded-xl px-3.5 py-2 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 cursor-pointer"
                  >
                    <option value="">-- Direct / Walk-in Center Credit --</option>
                    {approvedReferrers.map(r => (
                      <option key={r.id} value={r.id}>
                        {r.organizationName ? `${r.organizationName} (Dr. ${r.name})` : r.name} - {r.commissionPct}%
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Temporal Beneficiary Locking Security Note */}
              <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 text-[11px] text-amber-900 dark:text-amber-200 flex items-start gap-2">
                <Lock className="w-3.5 h-3.5 text-amber-700 shrink-0 mt-0.5" />
                <div className="leading-snug">
                  <strong>Temporal Beneficiary Locking Rule:</strong> Modifying the referring doctor and affiliated beneficiary applies <em>only</em> to future bookings and invoices for this patient. The <strong>{patientOrdersCount} historical order(s)</strong> already registered will permanently preserve their original linked doctor and beneficiary.
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="px-4 py-2 border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold transition-all cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="flex items-center gap-2 px-5 py-2 bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold shadow-md shadow-sky-600/20 transition-all active:scale-95 disabled:opacity-60 cursor-pointer"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Save className="w-3.5 h-3.5" />
                  <span>Save Demographic Updates</span>
                </>
              )}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
