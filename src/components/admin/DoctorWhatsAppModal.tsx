import React, { useState, useEffect } from 'react';
import {
  X,
  Share2,
  Phone,
  MessageCircle,
  Copy,
  Check,
  ExternalLink,
  Clock,
  Building2,
  Stethoscope,
  AlertTriangle,
  Send,
  Sparkles
} from 'lucide-react';
import { DoctorRosterItem, CenterBranch } from '../../types';

interface DoctorWhatsAppModalProps {
  doctor: DoctorRosterItem;
  center: CenterBranch;
  onClose: () => void;
  onGetWhatsAppUrl: (doctor: DoctorRosterItem, templateType?: string, customMessage?: string) => string;
}

type TemplateType = 'DUTY_REMINDER' | 'CRITICAL_REPORT' | 'EMERGENCY_PATIENT' | 'ROSTER_UPDATE' | 'CUSTOM';

export const DoctorWhatsAppModal: React.FC<DoctorWhatsAppModalProps> = ({
  doctor,
  center,
  onClose,
  onGetWhatsAppUrl
}) => {
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateType>('DUTY_REMINDER');
  const [customText, setCustomText] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);

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

  // Generate clean phone for display
  const cleanPhone = (doctor.phone || '').replace(/[^0-9]/g, '');
  const displayPhone = cleanPhone.length === 10 ? `+91 ${cleanPhone.slice(0, 5)} ${cleanPhone.slice(5)}` : doctor.phone;

  // Compute live message text
  const getComputedMessage = (): string => {
    const centerTitle = center.name;
    const centerPhone = center.phone;

    switch (selectedTemplate) {
      case 'CRITICAL_REPORT':
        return (
          `*URGENT CLINICAL REVIEW REQUIRED - ATLAS DIAGNOSTICS*\n\n` +
          `Dear *${doctor.name}*,\n\n` +
          `We have a high-priority / critical abnormal investigation pending your immediate expert review & authorization at *${centerTitle}*.\n\n` +
          `• *Specialty:* ${doctor.specialty}\n` +
          `• *Reporting Cabin:* ${doctor.roomNo || 'Digital Workstation'}\n` +
          `• *Center Hub:* ${centerTitle}\n\n` +
          `Please access your Doctor Workstation portal or notify the reception desk immediately.\n\n` +
          `_Atlas Diagnostics Center Urgent Clinical Alert_`
        );

      case 'EMERGENCY_PATIENT':
        return (
          `*EMERGENCY PATIENT ARRIVAL ALERT - ATLAS DIAGNOSTICS*\n\n` +
          `Dear *${doctor.name}*,\n\n` +
          `An emergency patient has arrived requiring urgent ${doctor.department} clinical attention / diagnostic scan at *${centerTitle}*.\n\n` +
          `• *Assigned Consultant:* ${doctor.name}\n` +
          `• *Shift / Status:* ${doctor.shift} (${doctor.status.replace('_', ' ')})\n` +
          `• *Reception Helpline:* ${centerPhone}\n\n` +
          `Kindly confirm your availability to attend to this case.\n\n` +
          `_Atlas Diagnostics Center Emergency Response_`
        );

      case 'ROSTER_UPDATE':
        return (
          `*DOCTOR DUTY ROSTER SCHEDULE - ATLAS DIAGNOSTICS*\n\n` +
          `Dear *${doctor.name}*,\n\n` +
          `Here is your updated duty roster schedule at *${centerTitle}*:\n\n` +
          `• *Shift Timing:* ${doctor.shift}\n` +
          `• *Working Days:* ${doctor.workingDays.join(', ')}\n` +
          `• *Department:* ${doctor.department}\n` +
          `• *Room / Suite:* ${doctor.roomNo || 'Consultant Suite'}\n` +
          `• *Current Status:* ${doctor.status.replace('_', ' ')}\n\n` +
          `Please inform administration in advance if any shift adjustments are needed.\n\n` +
          `_Atlas Diagnostics Center Administration_`
        );

      case 'CUSTOM':
        return customText || `Dear ${doctor.name}, greetings from Atlas Diagnostics Center.`;

      case 'DUTY_REMINDER':
      default:
        return (
          `*DUTY ROSTER & SHIFT CHECK - ATLAS DIAGNOSTICS*\n\n` +
          `Dear *${doctor.name}*,\n\n` +
          `This is a gentle reminder regarding your duty schedule at *${centerTitle}*:\n\n` +
          `• *Duty Shift:* ${doctor.shift}\n` +
          `• *Department:* ${doctor.department}\n` +
          `• *Designation:* ${doctor.specialty}\n` +
          `• *Room:* ${doctor.roomNo || 'Doctor Cabin'}\n` +
          `• *Duty Status:* ${doctor.status.replace('_', ' ')}\n\n` +
          `Please confirm your availability. For any assistance, reach the administrative desk at ${centerPhone}.\n\n` +
          `_Atlas Diagnostics Center Medical Operations_`
        );
    }
  };

  const currentMessage = getComputedMessage();

  const handleOpenWhatsApp = () => {
    const url = onGetWhatsAppUrl(doctor, selectedTemplate, customText);
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(currentMessage);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-fade-in overflow-y-auto">
      <div
        className="fixed inset-0"
        onClick={onClose}
        aria-hidden="true"
      />

      <div className="relative w-full max-w-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden z-10 animate-scale-up my-8">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-sky-700 p-6 text-white relative">
          <button
            type="button"
            onClick={onClose}
            className="absolute top-5 right-5 p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-all cursor-pointer"
            title="Close dialog (Esc)"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white shadow-inner">
              <MessageCircle className="w-6 h-6" />
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/20 text-emerald-100 text-[10px] font-black uppercase tracking-wider mb-1">
                <Share2 className="w-3 h-3" /> WhatsApp Instant Connect
              </div>
              <h2 className="text-xl font-black text-white">{doctor.name}</h2>
              <p className="text-xs text-emerald-100/90 font-medium">
                {doctor.specialty} • {doctor.department}
              </p>
            </div>
          </div>

          {/* Quick Doctor Badges */}
          <div className="mt-4 pt-4 border-t border-white/15 flex flex-wrap items-center gap-2 text-xs">
            <span className="px-2.5 py-1 rounded-xl bg-white/15 font-bold flex items-center gap-1.5">
              <Phone className="w-3 h-3" /> {displayPhone}
            </span>
            <span className="px-2.5 py-1 rounded-xl bg-white/15 font-bold flex items-center gap-1.5">
              <Clock className="w-3 h-3" /> {doctor.shift}
            </span>
            <span className="px-2.5 py-1 rounded-xl bg-white/15 font-bold flex items-center gap-1.5">
              <Building2 className="w-3 h-3" /> {doctor.roomNo || 'Main Suite'}
            </span>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5">
          {/* Template Selector Chips */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
              Select Communication Template:
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {[
                { id: 'DUTY_REMINDER', label: 'Duty Shift Reminder', icon: Clock },
                { id: 'CRITICAL_REPORT', label: 'Critical Report Alert', icon: AlertTriangle },
                { id: 'EMERGENCY_PATIENT', label: 'Emergency Patient', icon: Stethoscope },
                { id: 'ROSTER_UPDATE', label: 'Roster Schedule', icon: Building2 },
                { id: 'CUSTOM', label: 'Custom Message', icon: Sparkles }
              ].map(tpl => {
                const Icon = tpl.icon;
                const isSelected = selectedTemplate === tpl.id;
                return (
                  <button
                    key={tpl.id}
                    type="button"
                    onClick={() => setSelectedTemplate(tpl.id as TemplateType)}
                    className={`p-2.5 rounded-2xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer text-left border ${
                      isSelected
                        ? 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-500 text-emerald-800 dark:text-emerald-300 shadow-xs'
                        : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100'
                    }`}
                  >
                    <Icon className={`w-3.5 h-3.5 shrink-0 ${isSelected ? 'text-emerald-600' : 'text-slate-400'}`} />
                    <span className="truncate">{tpl.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Custom Message Field */}
          {selectedTemplate === 'CUSTOM' && (
            <div className="animate-fade-in space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                Compose Custom Message:
              </label>
              <textarea
                rows={3}
                value={customText}
                onChange={e => setCustomText(e.target.value)}
                placeholder={`Dear Dr. ${doctor.name}, please note...`}
                className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-2xl text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          )}

          {/* Live Formatted WhatsApp Message Preview */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-600 dark:text-slate-400">
                Live WhatsApp Message Preview:
              </span>
              <button
                type="button"
                onClick={handleCopy}
                className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 hover:text-emerald-800 dark:text-emerald-400 cursor-pointer transition-colors"
              >
                {copied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                <span>{copied ? 'Copied to Clipboard!' : 'Copy Text'}</span>
              </button>
            </div>

            <div className="p-4 bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200/80 dark:border-emerald-800/40 rounded-2xl text-xs font-mono text-slate-800 dark:text-slate-200 whitespace-pre-wrap max-h-48 overflow-y-auto leading-relaxed shadow-inner">
              {currentMessage}
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
            {/* Phone Call Link */}
            <a
              href={`tel:${cleanPhone}`}
              className="w-full sm:w-auto px-4 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-2xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Phone className="w-3.5 h-3.5 text-slate-500" />
              <span>Call Doctor Directly</span>
            </a>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 sm:flex-none px-4 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 rounded-2xl text-xs font-bold transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleOpenWhatsApp}
                className="flex-1 sm:flex-none px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white rounded-2xl text-xs font-bold transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Open in WhatsApp</span>
                <ExternalLink className="w-3 h-3 opacity-80" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
