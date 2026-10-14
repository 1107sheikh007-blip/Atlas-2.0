import React, { useState, useEffect } from 'react';
import { X, Save, User, Phone, Mail, MapPin, Heart, Shield, AlertCircle, Loader2 } from 'lucide-react';
import { Patient } from '../../types';
import { useDiagnostic } from '../../context/DiagnosticContext';
import { parsePatientNameParts } from '../../utils/dateUtils';

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
  const [title, setTitle] = useState<'Mr.' | 'Mrs.' | 'Ms.' | 'Mast.' | 'Dr.'>(
    (patient.title as any) || initialParsed.title || (patient.gender === 'Female' ? 'Mrs.' : 'Mr.')
  );
  const [firstName, setFirstName] = useState(patient.firstName || initialParsed.firstName || '');
  const [lastName, setLastName] = useState(patient.lastName || initialParsed.lastName || '');
  const [age, setAge] = useState<number | string>(patient.age || '');
  const [gender, setGender] = useState<'Male' | 'Female' | 'Other'>(patient.gender || 'Male');
  const [phone, setPhone] = useState(patient.phone || '');
  const [email, setEmail] = useState(patient.email || '');
  const [address, setAddress] = useState(patient.address || '');
  const [bloodGroup, setBloodGroup] = useState(patient.bloodGroup || '');
  const [abhaId, setAbhaId] = useState(patient.abhaId || '');
  const [beneficiaryId, setBeneficiaryId] = useState(patient.beneficiaryId || '');
  const { approvedReferrers } = useDiagnostic();
  
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
    const numAge = Number(age);

    if (!trimmedFirst) {
      setError('Patient First Name is required.');
      return;
    }

    if (isNaN(numAge) || numAge <= 0 || numAge > 130) {
      setError('Please provide a valid age between 1 and 130 years.');
      return;
    }

    if (!trimmedPhone || trimmedPhone.replace(/\D/g, '').length < 8) {
      setError('Please provide a valid primary phone number (at least 8 digits).');
      return;
    }

    setIsSaving(true);
    setTimeout(() => {
      onSave({
        name: combinedName,
        title,
        firstName: trimmedFirst,
        lastName: trimmedLast,
        age: numAge,
        gender,
        phone: trimmedPhone,
        email: email.trim(),
        address: address.trim(),
        bloodGroup: bloodGroup.trim() || undefined,
        abhaId: abhaId.trim() || undefined,
        beneficiaryId: beneficiaryId || undefined
      });
      setIsSaving(false);
      onClose();
    }, 200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div 
        className="fixed inset-0 -z-10" 
        onClick={onClose} 
      />
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
                Age (Years) *
              </label>
              <input
                type="number"
                required
                min={1}
                max={130}
                value={age}
                onChange={e => setAge(e.target.value)}
                placeholder="Age in years"
                className="w-full bg-slate-50 dark:bg-slate-800/60 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
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

            {/* Email */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-sky-600" /> Email Address (Optional)
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="patient@example.com"
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

            {/* ABHA / ABDM ID */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-sky-600" /> ABDM / ABHA ID
              </label>
              <input
                type="text"
                value={abhaId}
                onChange={e => setAbhaId(e.target.value)}
                placeholder="e.g. 14-digit ABHA ID / Address"
                className="w-full bg-slate-50 dark:bg-slate-800/60 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>


            {/* Beneficiary Name / Auto-linked Commission */}
            <div className="sm:col-span-2 space-y-1">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Heart className="w-3.5 h-3.5 text-rose-600" /> Linked Beneficiary (Referring Doctor)
              </label>
              <select
                value={beneficiaryId}
                onChange={e => setBeneficiaryId(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800/60 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
              >
                <option value="">-- No Linked Beneficiary --</option>
                {approvedReferrers.map(r => (
                  <option key={r.id} value={r.id}>
                    {r.name} {r.organizationName ? `(${r.organizationName})` : ''} - {r.commissionPct}%
                  </option>
                ))}
              </select>
              <p className="text-[10px] text-slate-500 italic mt-1">
                Changing this only affects future orders for this patient. Past orders retain their original beneficiary.
              </p>
            </div>


            {/* Residential Address */}
            <div className="sm:col-span-2 space-y-1">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-sky-600" /> Residential Address
              </label>
              <textarea
                rows={2}
                value={address}
                onChange={e => setAddress(e.target.value)}
                placeholder="House #, Street, Colony, City, Pin Code"
                className="w-full bg-slate-50 dark:bg-slate-800/60 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500 resize-none"
              />
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
