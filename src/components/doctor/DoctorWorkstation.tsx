import React, { useState, useEffect } from 'react';
import {
  Stethoscope,
  FileEdit,
  CheckCircle2,
  Sparkles,
  Upload,
  Cpu,
  Layers,
  FileCheck,
  Search,
  AlertCircle,
  Eye,
  Bold,
  Italic,
  Underline,
  Heading1,
  Heading2,
  List,
  ListOrdered,
  Highlighter,
  Palette,
  Table as TableIcon,
  RotateCcw,
  Save,
  ShieldCheck,
  ExternalLink,
  ChevronRight,
  UserCheck,
  Lock,
  Scissors,
  FlaskConical,
  Droplets
} from 'lucide-react';
import { useDiagnostic } from '../../context/DiagnosticContext';
import { CLINICAL_TEMPLATES } from '../../data/templates';
import { DiagnosticOrder, DiagnosticReport, DiagnosticTestItem } from '../../types';
import { ReportPrintView } from '../common/ReportPrintView';
import { PdfCropTranscribeModal } from '../common/PdfCropTranscribeModal';
import { DateRangeFilter, DatePresetType, isDateInSelectedRange } from '../common/DateRangeFilter';

export interface AvailableDoctorItem {
  id: string;
  name: string;
  qualification: string;
  specialty: string;
  regNo: string;
}

export const AVAILABLE_DOCTORS: AvailableDoctorItem[] = [
  {
    id: 'doc-rekha',
    name: 'Dr. Rekha Khanna',
    qualification: 'MBBS MD Radiodiagnosis',
    specialty: 'MBBS MD Radiodiagnosis',
    regNo: 'MP 13663'
  },
  {
    id: 'doc-nivedita',
    name: 'Dr. Nivedita Prajapati',
    qualification: 'MBBS MD Radiodiagnosis',
    specialty: 'MBBS MD Radiodiagnosis',
    regNo: 'MP 27139'
  },
  {
    id: 'doc-shruti',
    name: 'Dr. Shruti Kuchariya',
    qualification: 'MBBS MD Radiodiagnosis',
    specialty: 'MBBS MD Radiodiagnosis',
    regNo: 'MP 30138'
  }
];

export const DoctorWorkstation: React.FC = () => {
  const {
    orders,
    reports,
    tests,
    staff,
    selectedCenter,
    currentStaff,
    currentUser,
    currentRole,
    saveReportDraft,
    authorizeReport,
    markSampleCollected,
  } = useDiagnostic();

  const isLabTech = currentRole === 'LAB_TECHNICIAN' || currentStaff?.role === 'Lab Technician' || currentUser?.designation === 'Lab Technician';

  // Active selected order & test for reporting
  const [selectedOrderId, setSelectedOrderId] = useState<string>(orders[0]?.id || '');
  const [selectedTestId, setSelectedTestId] = useState<string>('');
  const [filterModality, setFilterModality] = useState<'ALL' | 'Radiology' | 'Pathology'>(() => {
    return (currentRole === 'LAB_TECHNICIAN' || currentStaff?.role === 'Lab Technician') ? 'Pathology' : 'ALL';
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [docDateRange, setDocDateRange] = useState<DatePresetType>('ALL');
  const [docStartDate, setDocStartDate] = useState<string>('');
  const [docEndDate, setDocEndDate] = useState<string>('');

  // Editor states
  const [editorContent, setEditorContent] = useState<string>('');
  const [impression, setImpression] = useState<string>('');
  const [recommendations, setRecommendations] = useState<string>('Clinical correlation suggested.');
  const [selectedDoctorName, setSelectedDoctorName] = useState<string>(AVAILABLE_DOCTORS[0].name);
  const [selectedDoctorSpecialty, setSelectedDoctorSpecialty] = useState<string>(AVAILABLE_DOCTORS[0].qualification);
  const [selectedDoctorRegNo, setSelectedDoctorRegNo] = useState<string>(AVAILABLE_DOCTORS[0].regNo);

  const [previewReport, setPreviewReport] = useState<DiagnosticReport | null>(null);
  const [isSimulatingAnalyzer, setIsSimulatingAnalyzer] = useState(false);
  const [isPdfCropModalOpen, setIsPdfCropModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const activeOrder = orders.find(o => o.id === selectedOrderId);

  // Auto select first order if none selected or if previous order removed
  useEffect(() => {
    if ((!selectedOrderId || !activeOrder) && orders.length > 0) {
      setSelectedOrderId(orders[0].id);
    }
  }, [orders, selectedOrderId, activeOrder]);

  useEffect(() => {
    if (activeOrder && activeOrder.tests.length > 0) {
      if (!selectedTestId || !activeOrder.tests.some(t => t.id === selectedTestId)) {
        setSelectedTestId(activeOrder.tests[0].id);
      }
    }
  }, [activeOrder, selectedTestId]);

  useEffect(() => {
    if (!selectedOrderId || !selectedTestId) return;

    const existingRep = reports.find(r => r.orderId === selectedOrderId && r.testId === selectedTestId);
    if (existingRep) {
      setEditorContent(existingRep.findingsHtml);
      setImpression(existingRep.impression);
      setRecommendations(existingRep.recommendations || 'Clinical correlation suggested.');
      setSelectedDoctorName(existingRep.doctorName);
      setSelectedDoctorSpecialty(existingRep.doctorSpecialty);
      setSelectedDoctorRegNo(existingRep.doctorRegistrationNo);
    } else {
      const test = tests.find(t => t.id === selectedTestId);
      const matchedTpl = CLINICAL_TEMPLATES.find(tpl => tpl.id === test?.defaultTemplate) || CLINICAL_TEMPLATES[0];
      setEditorContent(matchedTpl.htmlContent);
      setImpression(matchedTpl.defaultImpression);
      setRecommendations(matchedTpl.defaultRecommendations);
    }
  }, [selectedOrderId, selectedTestId, reports, tests]);

  const handleApplyTemplate = (templateId: string) => {
    const tpl = CLINICAL_TEMPLATES.find(t => t.id === templateId);
    if (tpl) {
      setEditorContent(tpl.htmlContent);
      setImpression(tpl.defaultImpression);
      setRecommendations(tpl.defaultRecommendations);
      showToast(`Loaded "${tpl.name}" template`);
    }
  };

  const handleSimulateAnalyzerData = () => {
    setIsSimulatingAnalyzer(true);
    setTimeout(() => {
      setIsSimulatingAnalyzer(false);
      const randomHb = (13.5 + Math.random() * 2).toFixed(1);
      const randomWbc = Math.floor(6000 + Math.random() * 3000);
      const randomPlatelet = Math.floor(220000 + Math.random() * 80000);

      const analyzerTableHtml = `
        <div style="background-color: #f0fdf4; border: 1px solid #86efac; border-radius: 8px; padding: 12px; margin-bottom: 15px;">
          <h4 style="color: #166534; margin-top: 0; font-size: 13px; font-weight: bold;">AUTOMATED ANALYZER DIRECT INGESTION (Uni-directional Interfacing)</h4>
          <p style="font-size: 11px; color: #15803d; margin-bottom: 8px;">Device: Sysmex XN-550 Hematology Analyzer • Ingestion Time: ${new Date().toLocaleTimeString()} • Calibration Passed</p>
          <table style="width: 100%; border: 1px solid #cbd5e1; font-size: 12px;">
            <tr style="background: #e2e8f0; font-weight: bold;">
              <th style="padding: 6px; border: 1px solid #cbd5e1;">Analyzer Parameter</th>
              <th style="padding: 6px; border: 1px solid #cbd5e1;">Measured Value</th>
              <th style="padding: 6px; border: 1px solid #cbd5e1;">Flag</th>
              <th style="padding: 6px; border: 1px solid #cbd5e1;">Normal Reference</th>
            </tr>
            <tr>
              <td style="padding: 5px; border: 1px solid #cbd5e1;">Hemoglobin (Hb)</td>
              <td style="padding: 5px; border: 1px solid #cbd5e1; font-weight: bold; color: #0369a1;">${randomHb} g/dL</td>
              <td style="padding: 5px; border: 1px solid #cbd5e1; color: #16a34a; font-weight: bold;">NORMAL</td>
              <td style="padding: 5px; border: 1px solid #cbd5e1;">13.0 - 17.0 g/dL</td>
            </tr>
            <tr>
              <td style="padding: 5px; border: 1px solid #cbd5e1;">Total Leucocyte Count (TLC)</td>
              <td style="padding: 5px; border: 1px solid #cbd5e1; font-weight: bold;">${randomWbc.toLocaleString()} cells/cumm</td>
              <td style="padding: 5px; border: 1px solid #cbd5e1; color: #16a34a; font-weight: bold;">NORMAL</td>
              <td style="padding: 5px; border: 1px solid #cbd5e1;">4,000 - 11,000</td>
            </tr>
            <tr>
              <td style="padding: 5px; border: 1px solid #cbd5e1;">Platelet Count</td>
              <td style="padding: 5px; border: 1px solid #cbd5e1; font-weight: bold;">${randomPlatelet.toLocaleString()} /cumm</td>
              <td style="padding: 5px; border: 1px solid #cbd5e1; color: #16a34a; font-weight: bold;">NORMAL</td>
              <td style="padding: 5px; border: 1px solid #cbd5e1;">150,000 - 450,000</td>
            </tr>
          </table>
        </div>
      `;

      setEditorContent(prev => analyzerTableHtml + prev);
      showToast('Machine data successfully ingested from Lab Analyzer!');
    }, 700);
  };

  const handleSaveDraft = () => {
    if (!selectedOrderId || !selectedTestId) return;
    const docStaff = staff.find(s => s.name === selectedDoctorName || s.role === 'Radiologist' || s.role === 'Pathologist');
    saveReportDraft({
      orderId: selectedOrderId,
      testId: selectedTestId,
      findingsHtml: editorContent,
      impression,
      recommendations,
      doctorName: selectedDoctorName,
      doctorSpecialty: selectedDoctorSpecialty,
      doctorRegistrationNo: docStaff?.registrationNo || selectedDoctorRegNo,
      doctorSignatureUrl: docStaff?.signatureUrl,
      doctorSealUrl: docStaff?.sealUrl,
      status: 'DRAFT'
    });
    showToast('Report draft saved successfully');
  };

  const handleAuthorizeAndSign = () => {
    if (!selectedOrderId || !selectedTestId) return;
    const docStaff = staff.find(s => s.name === selectedDoctorName || s.role === 'Radiologist' || s.role === 'Pathologist');

    const rep = saveReportDraft({
      orderId: selectedOrderId,
      testId: selectedTestId,
      findingsHtml: editorContent,
      impression,
      recommendations,
      doctorName: selectedDoctorName,
      doctorSpecialty: selectedDoctorSpecialty,
      doctorRegistrationNo: docStaff?.registrationNo || selectedDoctorRegNo,
      doctorSignatureUrl: docStaff?.signatureUrl,
      doctorSealUrl: docStaff?.sealUrl,
      status: 'AUTHORIZED'
    });

    authorizeReport(rep.id, {
      name: selectedDoctorName,
      specialty: selectedDoctorSpecialty,
      regNo: docStaff?.registrationNo || selectedDoctorRegNo,
      signatureUrl: docStaff?.signatureUrl,
      sealUrl: docStaff?.sealUrl
    });

    setPreviewReport({
      ...rep,
      doctorSignatureUrl: docStaff?.signatureUrl,
      doctorSealUrl: docStaff?.sealUrl,
      status: 'AUTHORIZED',
      authorizedAt: new Date().toISOString()
    });

    showToast('Report authorized and digitally signed! Ready for WhatsApp delivery.');
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const execFormat = (command: string, value: string = '') => {
    document.execCommand(command, false, value);
  };

  const filteredOrders = orders.filter(ord => {
    if (ord.isDeleted || ord.deletionPendingApproval) return false;
    const dateMatches =
      isDateInSelectedRange(ord.createdAt, docDateRange, docStartDate, docEndDate) ||
      (ord.appointmentDate ? isDateInSelectedRange(ord.appointmentDate, docDateRange, docStartDate, docEndDate) : false);
    if (!dateMatches) return false;
    const matchesSearch = 
      ord.patient.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ord.patientId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (ord.invoiceNumber && ord.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase())) ||
      ord.id.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (!matchesSearch) return false;
    if (filterModality === 'ALL') return true;
    return ord.tests.some(t => t.category === filterModality);
  });

  const activeTest = activeOrder?.tests.find(t => t.id === selectedTestId) || activeOrder?.tests[0];
  const currentSavedReport = reports.find(r => r.orderId === selectedOrderId && r.testId === selectedTestId);
  const isAuthorized = currentSavedReport?.status === 'AUTHORIZED';

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 bg-sky-900 border border-sky-600 text-white rounded-2xl shadow-2xl animate-fade-in text-xs font-semibold">
          <Sparkles className="w-4 h-4 text-cyan-300" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header Bar */}
      <div className={`flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 bg-white border rounded-3xl shadow-xs ${
        isLabTech ? 'border-emerald-200' : 'border-sky-100'
      }`}>
        <div className="flex items-center gap-3.5">
          <div className={`p-3 rounded-2xl border ${
            isLabTech ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-cyan-50 text-cyan-700 border-cyan-100'
          }`}>
            {isLabTech ? <FlaskConical className="w-6 h-6 text-emerald-600" /> : <Stethoscope className="w-6 h-6" />}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-slate-900 tracking-tight">
                Lab Technician Workstation
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                LIMS & Clinical Diagnostic Suite
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Center: <strong>{selectedCenter.name}</strong> • Assigned Technician: <strong>{currentStaff?.name || currentUser?.name || 'Khushi Singh'}</strong>
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => setIsPdfCropModalOpen(true)}
            className="flex items-center gap-2 px-3.5 py-2 bg-gradient-to-r from-sky-600 to-cyan-600 hover:from-sky-500 hover:to-cyan-500 text-white rounded-2xl text-xs font-bold transition-all shadow-xs cursor-pointer"
          >
            <Scissors className="w-4 h-4 text-cyan-200" />
            <span>Crop & Ingest External Lab PDF</span>
          </button>

          <button
            type="button"
            onClick={handleSimulateAnalyzerData}
            disabled={isSimulatingAnalyzer}
            className="flex items-center gap-2 px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 text-emerald-800 rounded-2xl text-xs font-bold transition-all shadow-xs cursor-pointer"
          >
            <Cpu className="w-4 h-4 text-emerald-600" />
            {isSimulatingAnalyzer ? 'Ingesting Data...' : 'Pull Analyzer Data'}
          </button>

          <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200 text-xs">
            <UserCheck className="w-4 h-4 text-sky-600" />
            <select
              value={selectedDoctorName}
              onChange={e => {
                const docName = e.target.value;
                setSelectedDoctorName(docName);
                const found = AVAILABLE_DOCTORS.find(d => d.name === docName);
                if (found) {
                  setSelectedDoctorSpecialty(found.qualification);
                  setSelectedDoctorRegNo(found.regNo);
                }
              }}
              className="bg-transparent text-slate-800 font-bold focus:outline-none cursor-pointer"
            >
              {AVAILABLE_DOCTORS.map(doc => (
                <option key={doc.id} value={doc.name}>
                  {doc.name} ({doc.qualification} - Reg: {doc.regNo})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Main Studio Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Live Diagnostic Queue */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-white border border-sky-100 rounded-3xl p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <Layers className="w-4 h-4 text-sky-600" />
                Center Queue ({filteredOrders.length})
              </h3>
              <div className="flex gap-1">
                {(['ALL', 'Radiology', 'Pathology'] as const).map(mod => (
                  <button
                    key={mod}
                    onClick={() => setFilterModality(mod)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                      filterModality === mod
                        ? 'bg-sky-600 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {mod}
                  </button>
                ))}
              </div>
            </div>

            {/* Search & Date Filter */}
            <div className="space-y-2">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Search patient, UHID or order..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <DateRangeFilter
                preset={docDateRange}
                startDate={docStartDate}
                endDate={docEndDate}
                onPresetChange={setDocDateRange}
                onStartDateChange={setDocStartDate}
                onEndDateChange={setDocEndDate}
                className="w-full"
                selectClassName="w-full text-[11px] py-1.5"
                inputClassName="text-[11px] py-1 px-2"
              />
            </div>

            {/* Orders List */}
            <div className="space-y-2 max-h-[520px] overflow-y-auto pr-1">
              {filteredOrders.length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-xs">
                  No cases in queue for this center.
                </div>
              ) : (
                filteredOrders.map(ord => {
                  const isSelected = ord.id === selectedOrderId;
                  const orderRep = reports.find(r => r.orderId === ord.id);
                  const isRepAuthorized = orderRep?.status === 'AUTHORIZED';

                  return (
                    <div
                      key={ord.id}
                      onClick={() => {
                        setSelectedOrderId(ord.id);
                        if (ord.tests[0]) setSelectedTestId(ord.tests[0].id);
                      }}
                      className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-sky-50 border-sky-500 shadow-sm'
                          : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-slate-900 text-xs">{ord.patient.name}</span>
                            <span className="text-[10px] text-slate-500 font-medium">
                              ({ord.patient.gender[0]}/{ord.patient.age}y)
                            </span>
                          </div>
                          <p className="text-[10px] font-mono text-sky-700 mt-0.5">
                            {ord.patientId} • #{ord.barcode}
                          </p>
                        </div>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold ${
                            isRepAuthorized
                              ? 'bg-emerald-100 text-emerald-800'
                              : ord.status === 'DOCTOR_REVIEW'
                              ? 'bg-sky-100 text-sky-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {isRepAuthorized ? 'AUTHORIZED' : ord.status.replace('_', ' ')}
                        </span>
                      </div>

                      <div className="mt-2 flex items-center justify-between gap-1.5">
                        <div className="flex flex-wrap gap-1">
                          {ord.tests.map(t => (
                            <span
                              key={t.id}
                              className="px-2 py-0.5 bg-white text-slate-700 rounded text-[10px] font-medium border border-slate-200 truncate"
                            >
                              {t.name}
                            </span>
                          ))}
                        </div>
                        {isLabTech && (
                          ord.sampleCollected ? (
                            <span className="shrink-0 flex items-center gap-0.5 text-[9px] px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 font-bold border border-emerald-200">
                              <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600" /> Sample Recv
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                markSampleCollected(ord.id, currentStaff?.name || 'Khushi Singh');
                                showToast(`Sample collected for Order #${ord.invoiceNumber || ord.id}`);
                              }}
                              className="shrink-0 px-2 py-0.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-[9px] font-bold shadow-xs cursor-pointer transition-all active:scale-95"
                            >
                              Collect Sample
                            </button>
                          )
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Rich Diagnostic Workstation */}
        <div className="lg:col-span-8 space-y-4">
          {activeOrder ? (
            <div className="bg-white border border-sky-100 rounded-3xl p-6 shadow-xs space-y-5">
              {/* Active Patient & Test Bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-base font-bold text-slate-900">
                      {activeOrder.patient.name}
                    </h3>
                    <span className="text-xs px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-mono font-bold">
                      {activeOrder.patientId}
                    </span>
                    {isAuthorized && (
                      <span className="flex items-center gap-1 text-xs px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Authorized
                      </span>
                    )}
                    {activeOrder.sampleCollected ? (
                      <span className="flex items-center gap-1 text-[11px] px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Sample Collected
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          markSampleCollected(activeOrder.id, currentStaff?.name || 'Khushi Singh');
                          showToast(`Sample marked collected for ${activeOrder.patient.name}`);
                        }}
                        className="flex items-center gap-1 text-[11px] px-2.5 py-0.5 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold shadow-xs cursor-pointer transition-all active:scale-95"
                      >
                        <Droplets className="w-3 h-3" /> Collect Sample Now
                      </button>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    Ref: <strong>{activeOrder.referringDoctorName}</strong> • Barcode: <strong className="font-mono text-sky-700">{activeOrder.barcode}</strong>
                  </p>
                </div>

                {/* Switch between multiple tests */}
                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-slate-500 font-bold">Test:</span>
                  <div className="flex gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
                    {activeOrder.tests.map(t => (
                      <button
                        key={t.id}
                        onClick={() => setSelectedTestId(t.id)}
                        className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                          selectedTestId === t.id
                            ? 'bg-sky-600 text-white shadow-xs'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        {t.name}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Multiple Investigations in this Order Selector */}
              {activeOrder.tests.length > 1 && (
                <div className="p-4 bg-gradient-to-r from-sky-50 via-indigo-50 to-emerald-50 border border-sky-200 rounded-2xl space-y-3 shadow-xs">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                    <div>
                      <h4 className="text-xs font-black text-slate-900 uppercase tracking-wide flex items-center gap-1.5">
                        <Layers className="w-4 h-4 text-sky-600" />
                        Order Contains {activeOrder.tests.length} Separate Investigations
                      </h4>
                      <p className="text-[11px] text-slate-600">
                        Click any test below to draft, customize templates, and save its individual report:
                      </p>
                    </div>
                    <span className="text-[10px] font-extrabold text-sky-800 bg-white px-2.5 py-1 rounded-full border border-sky-200 self-start sm:self-auto shadow-xs">
                      Editing Report {activeOrder.tests.findIndex(t => t.id === selectedTestId) + 1} of {activeOrder.tests.length}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                    {activeOrder.tests.map((testItem, idx) => {
                      const isCurrent = selectedTestId === testItem.id;
                      const rep = reports.find(r => r.orderId === activeOrder.id && r.testId === testItem.id);
                      const isAuth = rep?.status === 'AUTHORIZED';
                      const isDraft = rep && !isAuth;

                      return (
                        <button
                          key={testItem.id}
                          type="button"
                          onClick={() => setSelectedTestId(testItem.id)}
                          className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                            isCurrent
                              ? 'bg-white border-sky-600 ring-2 ring-sky-500/20 shadow-sm'
                              : 'bg-white/80 border-slate-200 hover:bg-white hover:border-slate-300'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-1 mb-1">
                            <span className="text-[10px] font-bold text-slate-500">
                              Report #{idx + 1}
                            </span>
                            <span className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded-full ${
                              isAuth
                                ? 'bg-emerald-100 text-emerald-800'
                                : isDraft
                                ? 'bg-sky-100 text-sky-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}>
                              {isAuth ? '✓ Authorized' : isDraft ? 'Draft' : 'Pending'}
                            </span>
                          </div>
                          <div className="text-xs font-bold text-slate-900 truncate" title={testItem.name}>
                            {testItem.name}
                          </div>
                          <div className="text-[10px] text-slate-500 truncate mt-0.5">
                            {testItem.department} • {testItem.category}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Template Quick Selector */}
              <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-sky-50/60 rounded-2xl border border-sky-100">
                <div className="flex items-center gap-2 text-xs text-slate-800">
                  <FileEdit className="w-4 h-4 text-sky-600" />
                  <span className="font-bold">Template:</span>
                  <select
                    onChange={e => handleApplyTemplate(e.target.value)}
                    className="bg-white text-slate-900 border border-slate-300 rounded-lg px-2.5 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-sky-500 cursor-pointer"
                    defaultValue=""
                  >
                    <option value="" disabled>Choose Clinical Template...</option>
                    {CLINICAL_TEMPLATES.map(tpl => (
                      <option key={tpl.id} value={tpl.id}>
                        [{tpl.category}] {tpl.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="text-[11px] text-slate-500 flex items-center gap-2">
                  <span>Modality: <strong className="text-sky-700">{activeTest?.category}</strong></span>
                  <span>•</span>
                  <span>Dept: <strong className="text-slate-700">{activeTest?.department}</strong></span>
                </div>
              </div>

              {/* Rich Text Editor Toolbar */}
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-1 p-2 bg-slate-100 rounded-t-2xl border border-slate-300 text-slate-700 text-xs">
                  <button
                    type="button"
                    onClick={() => execFormat('bold')}
                    className="p-1.5 hover:bg-white hover:text-sky-700 rounded transition-colors cursor-pointer"
                    title="Bold"
                  >
                    <Bold className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => execFormat('italic')}
                    className="p-1.5 hover:bg-white hover:text-sky-700 rounded transition-colors cursor-pointer"
                    title="Italic"
                  >
                    <Italic className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => execFormat('underline')}
                    className="p-1.5 hover:bg-white hover:text-sky-700 rounded transition-colors cursor-pointer"
                    title="Underline"
                  >
                    <Underline className="w-4 h-4" />
                  </button>

                  <div className="h-4 w-px bg-slate-300 mx-1" />

                  <button
                    type="button"
                    onClick={() => execFormat('formatBlock', '<h3>')}
                    className="p-1.5 hover:bg-white hover:text-sky-700 rounded font-bold cursor-pointer"
                    title="Heading"
                  >
                    <Heading2 className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => execFormat('insertUnorderedList')}
                    className="p-1.5 hover:bg-white hover:text-sky-700 rounded cursor-pointer"
                    title="Bullet List"
                  >
                    <List className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => execFormat('insertOrderedList')}
                    className="p-1.5 hover:bg-white hover:text-sky-700 rounded cursor-pointer"
                    title="Numbered List"
                  >
                    <ListOrdered className="w-4 h-4" />
                  </button>

                  <div className="h-4 w-px bg-slate-300 mx-1" />

                  {/* Highlights */}
                  <button
                    type="button"
                    onClick={() => execFormat('hiliteColor', '#fef08a')}
                    className="flex items-center gap-1 px-2 py-0.5 bg-yellow-100 text-yellow-900 border border-yellow-300 rounded text-[11px] font-bold cursor-pointer"
                  >
                    <Highlighter className="w-3.5 h-3.5 text-yellow-600" /> Yellow
                  </button>
                  <button
                    type="button"
                    onClick={() => execFormat('hiliteColor', '#bbf7d0')}
                    className="flex items-center gap-1 px-2 py-0.5 bg-emerald-100 text-emerald-900 border border-emerald-300 rounded text-[11px] font-bold cursor-pointer"
                  >
                    <Highlighter className="w-3.5 h-3.5 text-emerald-600" /> Green
                  </button>
                  <button
                    type="button"
                    onClick={() => execFormat('hiliteColor', '#fed7aa')}
                    className="flex items-center gap-1 px-2 py-0.5 bg-orange-100 text-orange-900 border border-orange-300 rounded text-[11px] font-bold cursor-pointer"
                  >
                    <Highlighter className="w-3.5 h-3.5 text-orange-600" /> Warning
                  </button>

                  <div className="h-4 w-px bg-slate-300 mx-1" />

                  {/* Colors */}
                  <button
                    type="button"
                    onClick={() => execFormat('foreColor', '#0284c7')}
                    className="px-2 py-0.5 text-sky-600 hover:bg-white rounded font-bold text-[11px] cursor-pointer"
                  >
                    Blue
                  </button>
                  <button
                    type="button"
                    onClick={() => execFormat('foreColor', '#dc2626')}
                    className="px-2 py-0.5 text-rose-600 hover:bg-white rounded font-bold text-[11px] cursor-pointer"
                  >
                    Red
                  </button>
                  <button
                    type="button"
                    onClick={() => execFormat('removeFormat')}
                    className="p-1.5 hover:bg-white rounded ml-auto text-slate-400 cursor-pointer"
                    title="Clear"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* ContentEditable Area */}
                <div
                  contentEditable
                  suppressContentEditableWarning
                  dangerouslySetInnerHTML={{ __html: editorContent }}
                  onBlur={e => setEditorContent(e.currentTarget.innerHTML)}
                  className="w-full min-h-[300px] max-h-[460px] overflow-y-auto p-5 bg-white text-slate-900 rounded-b-2xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500 font-sans leading-relaxed text-sm shadow-inner"
                />
              </div>

              {/* Impression & Advice */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-sky-600" />
                    Clinical Impression / Diagnosis:
                  </label>
                  <textarea
                    rows={3}
                    value={impression}
                    onChange={e => setImpression(e.target.value)}
                    placeholder="E.g., Normal study / No acute pathology..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-3 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                    Recommendations / Clinical Notes:
                  </label>
                  <textarea
                    rows={3}
                    value={recommendations}
                    onChange={e => setRecommendations(e.target.value)}
                    placeholder="E.g., Correlate clinically..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-3 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:bg-white"
                  />
                </div>
              </div>

              {/* Doctor Sign-off & Consultant Configuration (Editable) */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <span className="text-xs font-bold text-slate-800 uppercase flex items-center gap-1.5">
                    <UserCheck className="w-4 h-4 text-sky-600" />
                    Consultant Doctor / Authorizing Sign-off (Editable):
                  </span>
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-[10px] text-slate-400 font-bold uppercase">Presets:</span>
                    {AVAILABLE_DOCTORS.map(doc => (
                      <button
                        key={doc.id}
                        type="button"
                        onClick={() => {
                          setSelectedDoctorName(doc.name);
                          setSelectedDoctorSpecialty(doc.qualification);
                          setSelectedDoctorRegNo(doc.regNo);
                          showToast(`Applied ${doc.name} preset`);
                        }}
                        className={`px-2.5 py-1 text-[10px] rounded-lg font-bold border cursor-pointer shadow-2xs transition-all ${
                          selectedDoctorName === doc.name
                            ? 'bg-sky-600 text-white border-sky-600'
                            : 'bg-white hover:bg-sky-50 text-slate-700 border-slate-300 hover:border-sky-400'
                        }`}
                      >
                        {doc.name} ({doc.regNo})
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="text-[10px] font-bold text-slate-600 uppercase block mb-1">
                      Doctor Name (Editable):
                    </label>
                    <input
                      type="text"
                      value={selectedDoctorName}
                      onChange={e => setSelectedDoctorName(e.target.value)}
                      placeholder="Doctor Name (e.g. Dr. Bhavna Singhal)"
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-1.5 text-xs text-slate-900 font-bold focus:outline-none focus:ring-2 focus:ring-sky-500 shadow-2xs"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-600 uppercase block mb-1">
                      Specialty / Department:
                    </label>
                    <input
                      type="text"
                      value={selectedDoctorSpecialty}
                      onChange={e => setSelectedDoctorSpecialty(e.target.value)}
                      placeholder="Specialty (e.g. Consultant Pathologist)"
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500 shadow-2xs"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-600 uppercase block mb-1">
                      Medical Registration No.:
                    </label>
                    <input
                      type="text"
                      value={selectedDoctorRegNo}
                      onChange={e => setSelectedDoctorRegNo(e.target.value)}
                      placeholder="Reg No. (e.g. MPMC / 58492 / 2018)"
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-1.5 text-xs text-slate-900 font-mono focus:outline-none focus:ring-2 focus:ring-sky-500 shadow-2xs"
                    />
                  </div>
                </div>
              </div>

              {/* Action Toolbar */}
              <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="text-xs text-slate-500 flex items-center gap-2">
                  <span>Current Test: <strong className="text-slate-800">{activeTest?.name}</strong></span>
                  {activeOrder.tests.length > 1 && (
                    <span className="text-[10px] bg-slate-100 px-2 py-0.5 rounded-full font-bold text-slate-600">
                      {activeOrder.tests.findIndex(t => t.id === selectedTestId) + 1} of {activeOrder.tests.length}
                    </span>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={handleSaveDraft}
                    className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-xl text-xs transition-colors cursor-pointer"
                  >
                    <Save className="w-4 h-4 text-slate-500" />
                    Save Draft
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      const rep = reports.find(r => r.orderId === selectedOrderId && r.testId === selectedTestId);
                      const docStaff = staff.find(s => s.name === selectedDoctorName || s.role === 'Radiologist' || s.role === 'Pathologist');
                      if (rep) setPreviewReport(rep);
                      else {
                        setPreviewReport({
                          id: `PREVIEW-${Date.now().toString().slice(-4)}`,
                          orderId: selectedOrderId,
                          testId: selectedTestId,
                          testName: activeTest?.name || 'Diagnostic Investigation',
                          patientId: activeOrder.patientId,
                          patientName: activeOrder.patient.name,
                          patientAge: activeOrder.patient.age,
                          patientGender: activeOrder.patient.gender,
                          category: activeTest?.category || 'Radiology',
                          findingsHtml: editorContent,
                          impression,
                          recommendations,
                          doctorName: selectedDoctorName,
                          doctorSpecialty: selectedDoctorSpecialty,
                          doctorRegistrationNo: docStaff?.registrationNo || selectedDoctorRegNo,
                          doctorSignatureUrl: docStaff?.signatureUrl,
                          doctorSealUrl: docStaff?.sealUrl,
                          status: 'DRAFT',
                          attachments: []
                        });
                      }
                    }}
                    className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-sky-50 hover:bg-sky-100 text-sky-800 font-bold rounded-xl text-xs transition-colors cursor-pointer"
                  >
                    <Eye className="w-4 h-4 text-sky-600" />
                    Preview PDF
                  </button>

                  <button
                    type="button"
                    onClick={handleAuthorizeAndSign}
                    className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 bg-gradient-to-r from-sky-600 to-cyan-600 hover:from-sky-500 hover:to-cyan-500 text-white font-black rounded-xl text-xs shadow-md shadow-sky-600/20 transition-all active:scale-95 cursor-pointer"
                  >
                    <FileCheck className="w-4 h-4" />
                    Authorize & Sign Report
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white border border-sky-100 rounded-3xl p-12 text-center text-slate-400 shadow-xs">
              <Stethoscope className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h4 className="text-base font-bold text-slate-700">No Investigation Selected</h4>
              <p className="text-xs text-slate-500 mt-1">
                Please select a patient from the queue on the left to begin reporting.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Report Modal */}
      {previewReport && (
        <ReportPrintView
          report={previewReport}
          order={activeOrder}
          center={selectedCenter}
          onClose={() => setPreviewReport(null)}
        />
      )}

      {/* External Lab PDF / Image Crop & Transcribe Modal */}
      {isPdfCropModalOpen && (
        <PdfCropTranscribeModal
          onClose={() => setIsPdfCropModalOpen(false)}
          patientName={activeOrder?.patient.name}
          testName={activeTest?.name}
          onInsertToReport={data => {
            setEditorContent(prev => data.findingsHtml + (prev ? `<br/>${prev}` : ''));
            if (data.impression) {
              setImpression(prev => prev ? `${data.impression}\n\n${prev}` : data.impression!);
            }
            showToast('Extracted lab parameters ingested into patient report!');
          }}
        />
      )}
    </div>
  );
};
