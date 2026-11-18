import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
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
  Droplets,
  X,
  Type
} from 'lucide-react';
import { useDiagnostic } from '../../context/DiagnosticContext';
import { CLINICAL_TEMPLATES, findTemplateForTest } from '../../data/templates';
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
  const [editorFontSize, setEditorFontSize] = useState<number>(() => {
    const s = localStorage.getItem('atlas_editor_font_size');
    const n = s ? Number(s) : NaN;
    // Default to 20px. Upgrade previous default of 14px to 20px.
    return (!isNaN(n) && n !== 14 && n >= 12 && n <= 32) ? n : 20;
  });

  const editorRef = useRef<HTMLDivElement>(null);
  const loadedReportKeyRef = useRef<string>('');
  const editorContentRef = useRef<string>('');

  const setEditorRef = useCallback((node: HTMLDivElement | null) => {
    editorRef.current = node;
    if (node && editorContentRef.current && (!node.innerHTML || node.innerHTML === '<br>')) {
      node.innerHTML = editorContentRef.current;
    }
  }, []);

  const [previewReport, setPreviewReport] = useState<DiagnosticReport | null>(null);
  const [isSimulatingAnalyzer, setIsSimulatingAnalyzer] = useState(false);
  const [isPdfCropModalOpen, setIsPdfCropModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Template Searcher state
  const [templateSearchQuery, setTemplateSearchQuery] = useState('');
  const [templateCategoryFilter, setTemplateCategoryFilter] = useState<'ALL' | 'Pathology' | 'Radiology' | 'Cardiology'>('ALL');
  const [isTemplatePickerOpen, setIsTemplatePickerOpen] = useState(false);
  const [isTableMenuOpen, setIsTableMenuOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem('atlas_editor_font_size', String(editorFontSize));
  }, [editorFontSize]);

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

  const filteredTemplates = useMemo(() => {
    const q = templateSearchQuery.trim().toLowerCase();
    return CLINICAL_TEMPLATES.filter(tpl => {
      const matchesCategory = templateCategoryFilter === 'ALL' || tpl.category.toLowerCase() === templateCategoryFilter.toLowerCase();
      if (!matchesCategory) return false;
      if (!q) return true;
      return (
        tpl.name.toLowerCase().includes(q) ||
        tpl.category.toLowerCase().includes(q) ||
        tpl.department.toLowerCase().includes(q) ||
        tpl.id.toLowerCase().includes(q)
      );
    });
  }, [templateSearchQuery, templateCategoryFilter]);

  const loadOrderAndTestReport = useCallback((orderId: string, testId: string, forceReset = false) => {
    if (!orderId || !testId) return;
    const reportKey = `${orderId}___${testId}`;
    if (!forceReset && loadedReportKeyRef.current === reportKey) {
      return; // Already loaded, do not overwrite in-progress typing!
    }
    loadedReportKeyRef.current = reportKey;

    const existingRep = reports.find(r => r.orderId === orderId && r.testId === testId);
    if (existingRep && !forceReset) {
      setEditorContent(existingRep.findingsHtml);
      editorContentRef.current = existingRep.findingsHtml;
      setImpression(existingRep.impression);
      setRecommendations(existingRep.recommendations || 'Clinical correlation suggested.');
      setSelectedDoctorName(existingRep.doctorName);
      setSelectedDoctorSpecialty(existingRep.doctorSpecialty);
      setSelectedDoctorRegNo(existingRep.doctorRegistrationNo);
      if (editorRef.current) {
        editorRef.current.innerHTML = existingRep.findingsHtml;
      }
      return;
    }

    // Check if user has an unsaved draft in localStorage
    const savedDraftRaw = localStorage.getItem(`atlas_draft_${orderId}_${testId}`);
    if (savedDraftRaw && !forceReset) {
      try {
        const draft = JSON.parse(savedDraftRaw);
        if (draft.findingsHtml) {
          setEditorContent(draft.findingsHtml);
          editorContentRef.current = draft.findingsHtml;
          setImpression(draft.impression || '');
          setRecommendations(draft.recommendations || 'Clinical correlation suggested.');
          if (editorRef.current) {
            editorRef.current.innerHTML = draft.findingsHtml;
          }
          return;
        }
      } catch (e) {}
    }

    // Otherwise, initialize from matched template blueprint
    const ord = orders.find(o => o.id === orderId);
    const activeTest = ord?.tests.find(t => t.id === testId) || ord?.tests[0];
    const catalogTest = tests.find(t => t.id === testId || (t.name && activeTest?.name && t.name.toLowerCase() === activeTest.name.toLowerCase()));

    const matchedTpl = findTemplateForTest({
      testName: activeTest?.name || catalogTest?.name || '',
      category: activeTest?.category || catalogTest?.category || (isLabTech ? 'Pathology' : 'Radiology'),
      department: activeTest?.department || catalogTest?.department || '',
      gender: ord?.patient?.gender || '',
      patientName: ord?.patient?.name || '',
      defaultTemplateId: catalogTest?.defaultTemplate
    });

    setEditorContent(matchedTpl.htmlContent);
    editorContentRef.current = matchedTpl.htmlContent;
    setImpression(matchedTpl.defaultImpression);
    setRecommendations(matchedTpl.defaultRecommendations);
    if (editorRef.current) {
      editorRef.current.innerHTML = matchedTpl.htmlContent;
    }
  }, [orders, reports, tests, isLabTech]);

  useEffect(() => {
    if (selectedOrderId && selectedTestId) {
      loadOrderAndTestReport(selectedOrderId, selectedTestId);
    }
  }, [selectedOrderId, selectedTestId, loadOrderAndTestReport]);

  // Synchronize editor innerHTML whenever order or test switches
  useEffect(() => {
    if (editorRef.current && editorContentRef.current) {
      if (editorRef.current.innerHTML !== editorContentRef.current) {
        editorRef.current.innerHTML = editorContentRef.current;
      }
    }
  }, [selectedOrderId, selectedTestId]);

  const handleEditorInput = (html: string) => {
    editorContentRef.current = html;
    if (selectedOrderId && selectedTestId) {
      localStorage.setItem(`atlas_draft_${selectedOrderId}_${selectedTestId}`, JSON.stringify({
        findingsHtml: html,
        impression,
        recommendations,
        timestamp: Date.now()
      }));
    }
  };

  const handleEditorBlur = () => {
    if (editorRef.current) {
      const html = editorRef.current.innerHTML;
      editorContentRef.current = html;
      setEditorContent(html);
      if (selectedOrderId && selectedTestId) {
        localStorage.setItem(`atlas_draft_${selectedOrderId}_${selectedTestId}`, JSON.stringify({
          findingsHtml: html,
          impression,
          recommendations,
          timestamp: Date.now()
        }));
      }
    }
  };

  const handleApplyTemplate = (templateId: string) => {
    const tpl = CLINICAL_TEMPLATES.find(t => t.id === templateId);
    if (tpl) {
      setEditorContent(tpl.htmlContent);
      editorContentRef.current = tpl.htmlContent;
      setImpression(tpl.defaultImpression);
      setRecommendations(tpl.defaultRecommendations);
      if (editorRef.current) {
        editorRef.current.innerHTML = tpl.htmlContent;
      }
      if (selectedOrderId && selectedTestId) {
        localStorage.setItem(`atlas_draft_${selectedOrderId}_${selectedTestId}`, JSON.stringify({
          findingsHtml: tpl.htmlContent,
          impression: tpl.defaultImpression,
          recommendations: tpl.defaultRecommendations,
          timestamp: Date.now()
        }));
      }
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
    const content = editorRef.current ? editorRef.current.innerHTML : editorContent;
    saveReportDraft({
      orderId: selectedOrderId,
      testId: selectedTestId,
      findingsHtml: content,
      impression,
      recommendations,
      doctorName: selectedDoctorName,
      doctorSpecialty: selectedDoctorSpecialty,
      doctorRegistrationNo: docStaff?.registrationNo || selectedDoctorRegNo,
      doctorSignatureUrl: docStaff?.signatureUrl,
      doctorSealUrl: docStaff?.sealUrl,
      status: 'DRAFT'
    });
    localStorage.removeItem(`atlas_draft_${selectedOrderId}_${selectedTestId}`);
    showToast('Report draft saved successfully');
  };

  const handleAuthorizeAndSign = () => {
    if (!selectedOrderId || !selectedTestId) return;
    const docStaff = staff.find(s => s.name === selectedDoctorName || s.role === 'Radiologist' || s.role === 'Pathologist');
    const content = editorRef.current ? editorRef.current.innerHTML : editorContent;

    const rep = saveReportDraft({
      orderId: selectedOrderId,
      testId: selectedTestId,
      findingsHtml: content,
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

    localStorage.removeItem(`atlas_draft_${selectedOrderId}_${selectedTestId}`);

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
    if (editorRef.current) {
      editorRef.current.focus();
    }
    document.execCommand(command, false, value);
    if (editorRef.current) {
      const html = editorRef.current.innerHTML;
      setEditorContent(html);
      editorContentRef.current = html;
      if (selectedOrderId && selectedTestId) {
        localStorage.setItem(`atlas_draft_${selectedOrderId}_${selectedTestId}`, JSON.stringify({
          findingsHtml: html,
          impression,
          recommendations,
          timestamp: Date.now()
        }));
      }
    }
  };

  const insertHtmlAtCursor = (html: string) => {
    if (editorRef.current) {
      editorRef.current.focus();
    }
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) {
      if (editorRef.current) {
        editorRef.current.innerHTML += html;
        const newHtml = editorRef.current.innerHTML;
        setEditorContent(newHtml);
        editorContentRef.current = newHtml;
        if (selectedOrderId && selectedTestId) {
          localStorage.setItem(`atlas_draft_${selectedOrderId}_${selectedTestId}`, JSON.stringify({
            findingsHtml: newHtml,
            impression,
            recommendations,
            timestamp: Date.now()
          }));
        }
      }
      return;
    }
    document.execCommand('insertHTML', false, html);
    if (editorRef.current) {
      const newHtml = editorRef.current.innerHTML;
      setEditorContent(newHtml);
      editorContentRef.current = newHtml;
      if (selectedOrderId && selectedTestId) {
        localStorage.setItem(`atlas_draft_${selectedOrderId}_${selectedTestId}`, JSON.stringify({
          findingsHtml: newHtml,
          impression,
          recommendations,
          timestamp: Date.now()
        }));
      }
    }
  };

  const insertGrowthTable = () => {
    const html = `
      <p><strong>The fetal growth parameters are as follows :</strong></p>
      <table style="width: 100%; border-collapse: collapse; margin-top: 8px; margin-bottom: 12px; border: 1px solid #000;">
        <tbody>
          <tr>
            <td style="border: 1px solid #000; padding: 6px 12px; font-weight: bold; width: 25%;">BPD</td>
            <td style="border: 1px solid #000; padding: 6px 12px; width: 25%;">&nbsp; cm</td>
            <td style="border: 1px solid #000; padding: 6px 12px; width: 25%;">&nbsp; wks</td>
            <td style="border: 1px solid #000; padding: 6px 12px; width: 25%;">&nbsp; days</td>
          </tr>
          <tr>
            <td style="border: 1px solid #000; padding: 6px 12px; font-weight: bold;">HC</td>
            <td style="border: 1px solid #000; padding: 6px 12px;">&nbsp; cm</td>
            <td style="border: 1px solid #000; padding: 6px 12px;">&nbsp; wks</td>
            <td style="border: 1px solid #000; padding: 6px 12px;">&nbsp; days</td>
          </tr>
          <tr>
            <td style="border: 1px solid #000; padding: 6px 12px; font-weight: bold;">AC</td>
            <td style="border: 1px solid #000; padding: 6px 12px;">&nbsp; cm</td>
            <td style="border: 1px solid #000; padding: 6px 12px;">&nbsp; wks</td>
            <td style="border: 1px solid #000; padding: 6px 12px;">&nbsp; days</td>
          </tr>
          <tr>
            <td style="border: 1px solid #000; padding: 6px 12px; font-weight: bold;">FL</td>
            <td style="border: 1px solid #000; padding: 6px 12px;">&nbsp; cm</td>
            <td style="border: 1px solid #000; padding: 6px 12px;">&nbsp; wks</td>
            <td style="border: 1px solid #000; padding: 6px 12px;">&nbsp; days</td>
          </tr>
        </tbody>
      </table>
      <p><strong>MGA :</strong> &nbsp;&nbsp;&nbsp; wks &nbsp;&nbsp; day.<br/><strong>Estimated fetal weight is</strong> &nbsp;&nbsp;&nbsp; gm&plusmn; 10% gms.<br/><strong>EDD BY USG:-</strong> </p>
    `;
    insertHtmlAtCursor(html);
    setIsTableMenuOpen(false);
  };

  const insertGenericTable = (cols = 4, rows = 3) => {
    let headerRow = '<tr style="background-color: #f1f5f9; border-bottom: 1px solid #000;">';
    for (let c = 0; c < cols; c++) {
      headerRow += `<th style="border: 1px solid #000; padding: 6px 10px; text-align: left; font-weight: bold;">Column ${c + 1}</th>`;
    }
    headerRow += '</tr>';

    let bodyRows = '';
    for (let r = 0; r < rows; r++) {
      bodyRows += '<tr>';
      for (let c = 0; c < cols; c++) {
        bodyRows += '<td style="border: 1px solid #000; padding: 6px 10px;">&nbsp;</td>';
      }
      bodyRows += '</tr>';
    }

    const html = `<table style="width: 100%; border-collapse: collapse; margin-top: 8px; margin-bottom: 12px; border: 1px solid #000;"><thead>${headerRow}</thead><tbody>${bodyRows}</tbody></table><p></p>`;
    insertHtmlAtCursor(html);
    setIsTableMenuOpen(false);
  };

  const insertDopplerTable = () => {
    const html = `
      <p><strong>Vascular Doppler Evaluation:</strong></p>
      <table style="width: 100%; border-collapse: collapse; margin-top: 8px; margin-bottom: 12px; border: 1px solid #000;">
        <thead>
          <tr style="background-color: #f1f5f9; border-bottom: 1px solid #000;">
            <th style="border: 1px solid #000; padding: 6px 10px; text-align: left; font-weight: bold;">Vessel</th>
            <th style="border: 1px solid #000; padding: 6px 10px; text-align: center; font-weight: bold;">PI</th>
            <th style="border: 1px solid #000; padding: 6px 10px; text-align: center; font-weight: bold;">RI</th>
            <th style="border: 1px solid #000; padding: 6px 10px; text-align: center; font-weight: bold;">Remarks</th>
          </tr>
        </thead>
        <tbody>
          <tr><td style="border: 1px solid #000; padding: 6px 10px; font-weight: bold;">Umbilical Artery</td><td style="border: 1px solid #000; padding: 6px 10px; text-align: center;">0.80</td><td style="border: 1px solid #000; padding: 6px 10px; text-align: center;">0.50</td><td style="border: 1px solid #000; padding: 6px 10px; text-align: center;">Normal</td></tr>
          <tr><td style="border: 1px solid #000; padding: 6px 10px; font-weight: bold;">Middle Cerebral Artery</td><td style="border: 1px solid #000; padding: 6px 10px; text-align: center;">1.61</td><td style="border: 1px solid #000; padding: 6px 10px; text-align: center;">0.79</td><td style="border: 1px solid #000; padding: 6px 10px; text-align: center;">Normal</td></tr>
          <tr><td style="border: 1px solid #000; padding: 6px 10px; font-weight: bold;">Uterine Artery (Rt)</td><td style="border: 1px solid #000; padding: 6px 10px; text-align: center;">0.77</td><td style="border: 1px solid #000; padding: 6px 10px; text-align: center;">0.52</td><td style="border: 1px solid #000; padding: 6px 10px; text-align: center;">Normal</td></tr>
          <tr><td style="border: 1px solid #000; padding: 6px 10px; font-weight: bold;">Uterine Artery (Lt)</td><td style="border: 1px solid #000; padding: 6px 10px; text-align: center;">0.62</td><td style="border: 1px solid #000; padding: 6px 10px; text-align: center;">0.44</td><td style="border: 1px solid #000; padding: 6px 10px; text-align: center;">Normal</td></tr>
        </tbody>
      </table>
      <p></p>
    `;
    insertHtmlAtCursor(html);
    setIsTableMenuOpen(false);
  };

  const addTableRow = () => {
    if (editorRef.current) {
      editorRef.current.focus();
    }
    const sel = window.getSelection();
    if (!sel || !sel.anchorNode) {
      showToast('Click inside a table cell first to add a row.');
      return;
    }
    let node: Node | null = sel.anchorNode;
    let tr: HTMLTableRowElement | null = null;
    let table: HTMLTableElement | null = null;
    while (node && node !== editorRef.current) {
      if (node.nodeName === 'TR') tr = node as HTMLTableRowElement;
      if (node.nodeName === 'TABLE') table = node as HTMLTableElement;
      node = node.parentNode;
    }
    if (table) {
      const colCount = tr ? tr.cells.length : (table.rows[0]?.cells.length || 4);
      const newTr = document.createElement('tr');
      for (let i = 0; i < colCount; i++) {
        const td = document.createElement('td');
        td.style.border = '1px solid #000';
        td.style.padding = '6px 10px';
        td.innerHTML = '&nbsp;';
        newTr.appendChild(td);
      }
      if (tr && tr.parentNode) {
        tr.parentNode.insertBefore(newTr, tr.nextSibling);
      } else {
        const tbody = table.querySelector('tbody');
        if (tbody) tbody.appendChild(newTr);
        else table.appendChild(newTr);
      }
      if (editorRef.current) {
        const newHtml = editorRef.current.innerHTML;
        setEditorContent(newHtml);
        editorContentRef.current = newHtml;
        if (selectedOrderId && selectedTestId) {
          localStorage.setItem(`atlas_draft_${selectedOrderId}_${selectedTestId}`, JSON.stringify({
            findingsHtml: newHtml,
            impression,
            recommendations,
            timestamp: Date.now()
          }));
        }
      }
      showToast('Row added below.');
    } else {
      showToast('Click inside a table first to add a row.');
    }
    setIsTableMenuOpen(false);
  };

  const deleteTableRow = () => {
    const sel = window.getSelection();
    if (!sel || !sel.anchorNode) {
      showToast('Click inside a table row first to delete it.');
      return;
    }
    let node: Node | null = sel.anchorNode;
    while (node && node !== editorRef.current) {
      if (node.nodeName === 'TR') {
        const tr = node as HTMLTableRowElement;
        const table = tr.closest('table');
        tr.remove();
        if (table && table.rows.length === 0) table.remove();
        if (editorRef.current) {
          const newHtml = editorRef.current.innerHTML;
          setEditorContent(newHtml);
          editorContentRef.current = newHtml;
          if (selectedOrderId && selectedTestId) {
            localStorage.setItem(`atlas_draft_${selectedOrderId}_${selectedTestId}`, JSON.stringify({
              findingsHtml: newHtml,
              impression,
              recommendations,
              timestamp: Date.now()
            }));
          }
        }
        showToast('Row deleted.');
        break;
      }
      node = node.parentNode;
    }
    setIsTableMenuOpen(false);
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
                    <span className="text-xs px-2.5 py-0.5 rounded-full bg-sky-50 text-sky-800 border border-sky-200 font-bold">
                      {activeOrder.status.replace('_', ' ')}
                    </span>
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

              {/* Searchable Diagnostic Template Selector */}
              <div className="p-3 bg-sky-50/70 rounded-2xl border border-sky-100 space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <FileEdit className="w-4 h-4 text-sky-600" />
                    <span className="text-xs font-bold text-slate-800">Diagnostic Template:</span>
                    <button
                      type="button"
                      onClick={() => setIsTemplatePickerOpen(prev => !prev)}
                      className="px-3 py-1 bg-white hover:bg-sky-50 text-slate-900 border border-slate-300 rounded-xl text-xs font-bold flex items-center gap-2 shadow-xs cursor-pointer transition-all"
                    >
                      <Search className="w-3.5 h-3.5 text-sky-600" />
                      <span>Search & Select Template ({filteredTemplates.length})</span>
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        if (confirm('Reload the original blueprint template? Any unsaved edits will be replaced.')) {
                          loadOrderAndTestReport(selectedOrderId, selectedTestId, true);
                          localStorage.removeItem(`atlas_draft_${selectedOrderId}_${selectedTestId}`);
                        }
                      }}
                      className="text-[11px] px-2.5 py-1 text-slate-600 hover:text-slate-900 hover:bg-white rounded-lg border border-slate-200 transition-colors flex items-center gap-1 cursor-pointer"
                      title="Reset to clean template blueprint"
                    >
                      <RotateCcw className="w-3 h-3 text-slate-500" />
                      <span>Reset to Template</span>
                    </button>

                    <div className="text-[11px] text-slate-500 flex items-center gap-1.5 ml-1">
                      <span>Modality: <strong className="text-sky-700">{activeTest?.category}</strong></span>
                      <span>•</span>
                      <span>Dept: <strong className="text-slate-700">{activeTest?.department}</strong></span>
                    </div>
                  </div>
                </div>

                {/* Searchable Template Picker Dropdown */}
                {isTemplatePickerOpen && (
                  <div className="p-3 bg-white border border-sky-200 rounded-2xl shadow-xl space-y-2.5 mt-2 transition-all">
                    <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-100">
                      <div className="relative flex-1 min-w-[200px]">
                        <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                        <input
                          type="text"
                          value={templateSearchQuery}
                          onChange={e => setTemplateSearchQuery(e.target.value)}
                          placeholder="Search diagnostic (e.g. cbc, usg, urine, echo, lipid, female, male...)"
                          className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
                          autoFocus
                        />
                      </div>
                      <div className="flex items-center gap-1">
                        {(['ALL', 'Pathology', 'Radiology', 'Cardiology'] as const).map(cat => (
                          <button
                            key={cat}
                            type="button"
                            onClick={() => setTemplateCategoryFilter(cat)}
                            className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                              templateCategoryFilter === cat ? 'bg-sky-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            }`}
                          >
                            {cat}
                          </button>
                        ))}
                        <button
                          type="button"
                          onClick={() => setIsTemplatePickerOpen(false)}
                          className="p-1 hover:bg-slate-100 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer ml-1"
                          title="Close search"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <div className="max-h-56 overflow-y-auto space-y-1 divide-y divide-slate-100 pr-1">
                      {filteredTemplates.length === 0 ? (
                        <p className="text-xs text-slate-500 py-3 text-center">No diagnostics match "{templateSearchQuery}"</p>
                      ) : (
                        filteredTemplates.map(tpl => (
                          <button
                            key={tpl.id}
                            type="button"
                            onClick={() => {
                              handleApplyTemplate(tpl.id);
                              setIsTemplatePickerOpen(false);
                            }}
                            className="w-full text-left p-2 hover:bg-sky-50 rounded-xl flex items-center justify-between gap-3 text-xs transition-colors cursor-pointer"
                          >
                            <div>
                              <span className="font-bold text-slate-900 block">{tpl.name}</span>
                              <span className="text-[10px] text-slate-500">{tpl.department}</span>
                            </div>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              tpl.category === 'Pathology' ? 'bg-purple-100 text-purple-800' :
                              tpl.category === 'Cardiology' ? 'bg-rose-100 text-rose-800' : 'bg-sky-100 text-sky-800'
                            }`}>
                              {tpl.category}
                            </span>
                          </button>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Rich Text Editor Toolbar */}
              <div className="space-y-1">
                <style dangerouslySetInnerHTML={{ __html: `
                  .report-editor-area p {
                    margin-top: 10px !important;
                    margin-bottom: 14px !important;
                    line-height: 1.6 !important;
                  }
                  .report-editor-area table {
                    margin-top: 12px !important;
                    margin-bottom: 16px !important;
                    width: 100% !important;
                    border-collapse: collapse !important;
                    border: 1px solid #000000 !important;
                  }
                  .report-editor-area ul {
                    margin-top: 8px !important;
                    margin-bottom: 14px !important;
                    padding-left: 20px !important;
                  }
                  .report-editor-area li {
                    margin-bottom: 8px !important;
                    line-height: 1.6 !important;
                  }
                  .report-editor-area th,
                  .report-editor-area td {
                    padding: 6px 10px !important;
                    border: 1px solid #000000 !important;
                  }
                  .report-editor-area th {
                    background-color: #f1f5f9 !important;
                    font-weight: 700 !important;
                  }
                  .report-editor-area h3,
                  .report-editor-area h4 {
                    margin-top: 14px !important;
                    margin-bottom: 8px !important;
                    font-weight: 800 !important;
                  }
                ` }} />

                <div className="flex flex-wrap items-center gap-1 p-2 bg-slate-100 rounded-t-2xl border border-slate-300 text-slate-700 text-xs select-none">
                  <button
                    type="button"
                    onMouseDown={e => e.preventDefault()}
                    onClick={() => execFormat('bold')}
                    className="p-1.5 hover:bg-white hover:text-sky-700 rounded transition-colors cursor-pointer"
                    title="Bold"
                  >
                    <Bold className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onMouseDown={e => e.preventDefault()}
                    onClick={() => execFormat('italic')}
                    className="p-1.5 hover:bg-white hover:text-sky-700 rounded transition-colors cursor-pointer"
                    title="Italic"
                  >
                    <Italic className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onMouseDown={e => e.preventDefault()}
                    onClick={() => execFormat('underline')}
                    className="p-1.5 hover:bg-white hover:text-sky-700 rounded transition-colors cursor-pointer"
                    title="Underline"
                  >
                    <Underline className="w-4 h-4" />
                  </button>

                  <div className="h-4 w-px bg-slate-300 mx-1" />

                  {/* Font Size Control */}
                  <div className="flex items-center gap-1 bg-white px-2 py-0.5 rounded-lg border border-slate-300">
                    <Type className="w-3.5 h-3.5 text-slate-400" />
                    <button
                      type="button"
                      onMouseDown={e => e.preventDefault()}
                      onClick={() => setEditorFontSize(prev => Math.max(12, prev - 1))}
                      className="px-1.5 py-0.5 hover:bg-slate-100 rounded text-xs font-black text-slate-700 cursor-pointer"
                      title="Decrease font size"
                    >
                      -
                    </button>
                    <span className="text-xs font-bold text-sky-700 min-w-[28px] text-center font-mono">{editorFontSize}px</span>
                    <button
                      type="button"
                      onMouseDown={e => e.preventDefault()}
                      onClick={() => setEditorFontSize(prev => Math.min(28, prev + 1))}
                      className="px-1.5 py-0.5 hover:bg-slate-100 rounded text-xs font-black text-slate-700 cursor-pointer"
                      title="Increase font size"
                    >
                      +
                    </button>
                  </div>

                  {/* Font Size Presets */}
                  <div className="flex items-center gap-1">
                    {[16, 18, 20, 24].map(px => (
                      <button
                        key={px}
                        type="button"
                        onMouseDown={e => e.preventDefault()}
                        onClick={() => setEditorFontSize(px)}
                        className={`text-[10px] px-1.5 py-0.5 rounded font-bold transition-colors cursor-pointer ${
                          editorFontSize === px ? 'bg-sky-100 text-sky-800 border border-sky-300 font-black' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        {px === 20 ? '20px (Default)' : `${px}px`}
                      </button>
                    ))}
                  </div>

                  <div className="h-4 w-px bg-slate-300 mx-1" />

                  <button
                    type="button"
                    onMouseDown={e => e.preventDefault()}
                    onClick={() => execFormat('formatBlock', '<h3>')}
                    className="p-1.5 hover:bg-white hover:text-sky-700 rounded font-bold cursor-pointer"
                    title="Heading"
                  >
                    <Heading2 className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onMouseDown={e => e.preventDefault()}
                    onClick={() => execFormat('insertUnorderedList')}
                    className="p-1.5 hover:bg-white hover:text-sky-700 rounded cursor-pointer"
                    title="Bullet List"
                  >
                    <List className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onMouseDown={e => e.preventDefault()}
                    onClick={() => execFormat('insertOrderedList')}
                    className="p-1.5 hover:bg-white hover:text-sky-700 rounded cursor-pointer"
                    title="Numbered List"
                  >
                    <ListOrdered className="w-4 h-4" />
                  </button>

                  <div className="h-4 w-px bg-slate-300 mx-1" />

                  {/* Table Insertion & Row Management Menu */}
                  <div className="relative">
                    <button
                      type="button"
                      onMouseDown={e => e.preventDefault()}
                      onClick={() => setIsTableMenuOpen(!isTableMenuOpen)}
                      className={`flex items-center gap-1.5 px-2 py-1 rounded font-bold cursor-pointer transition-colors ${
                        isTableMenuOpen ? 'bg-sky-100 text-sky-800 border border-sky-300 shadow-inner' : 'bg-white hover:bg-slate-50 text-slate-700 border border-slate-300'
                      }`}
                      title="Insert Table or Add/Delete Rows"
                    >
                      <TableIcon className="w-3.5 h-3.5 text-sky-600" />
                      <span className="text-[11px]">Table</span>
                    </button>

                    {isTableMenuOpen && (
                      <div className="absolute left-0 top-full mt-1.5 w-64 bg-white border border-slate-300 rounded-2xl shadow-2xl z-40 p-2 space-y-1 text-slate-800 text-xs">
                        <div className="px-2 py-0.5 text-[10px] font-black uppercase text-slate-400 tracking-wider">
                          Insert Pre-Formatted Table
                        </div>
                        <button
                          type="button"
                          onMouseDown={e => e.preventDefault()}
                          onClick={insertGrowthTable}
                          className="w-full text-left px-2.5 py-1.5 hover:bg-sky-50 hover:text-sky-800 rounded-xl flex items-center justify-between font-bold cursor-pointer transition-colors"
                        >
                          <span>Fetal Growth (BPD / HC / AC / FL)</span>
                          <span className="text-[10px] bg-sky-100 text-sky-700 font-mono px-1.5 py-0.5 rounded">4x4</span>
                        </button>
                        <button
                          type="button"
                          onMouseDown={e => e.preventDefault()}
                          onClick={insertDopplerTable}
                          className="w-full text-left px-2.5 py-1.5 hover:bg-sky-50 hover:text-sky-800 rounded-xl flex items-center justify-between font-bold cursor-pointer transition-colors"
                        >
                          <span>Vascular Doppler (PI / RI)</span>
                          <span className="text-[10px] bg-purple-100 text-purple-700 font-mono px-1.5 py-0.5 rounded">4x4</span>
                        </button>
                        <button
                          type="button"
                          onMouseDown={e => e.preventDefault()}
                          onClick={() => insertGenericTable(4, 3)}
                          className="w-full text-left px-2.5 py-1.5 hover:bg-slate-100 rounded-xl flex items-center justify-between cursor-pointer transition-colors"
                        >
                          <span>Standard 4-Column Table</span>
                          <span className="text-[10px] text-slate-400 font-mono">4x3</span>
                        </button>
                        <button
                          type="button"
                          onMouseDown={e => e.preventDefault()}
                          onClick={() => insertGenericTable(3, 3)}
                          className="w-full text-left px-2.5 py-1.5 hover:bg-slate-100 rounded-xl flex items-center justify-between cursor-pointer transition-colors"
                        >
                          <span>Standard 3-Column Table</span>
                          <span className="text-[10px] text-slate-400 font-mono">3x3</span>
                        </button>

                        <div className="border-t border-slate-100 my-1 pt-1.5">
                          <div className="px-2 py-0.5 text-[10px] font-black uppercase text-slate-400 tracking-wider">
                            Table Row Controls
                          </div>
                          <div className="grid grid-cols-2 gap-1.5 px-1 pt-0.5">
                            <button
                              type="button"
                              onMouseDown={e => e.preventDefault()}
                              onClick={addTableRow}
                              className="px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl font-bold text-center cursor-pointer text-[11px] transition-colors"
                            >
                              + Add Row
                            </button>
                            <button
                              type="button"
                              onMouseDown={e => e.preventDefault()}
                              onClick={deleteTableRow}
                              className="px-2 py-1 bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200 rounded-xl font-bold text-center cursor-pointer text-[11px] transition-colors"
                            >
                              - Delete Row
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="h-4 w-px bg-slate-300 mx-1" />

                  {/* Highlights */}
                  <button
                    type="button"
                    onMouseDown={e => e.preventDefault()}
                    onClick={() => execFormat('hiliteColor', '#fef08a')}
                    className="flex items-center gap-1 px-2 py-0.5 bg-yellow-100 text-yellow-900 border border-yellow-300 rounded text-[11px] font-bold cursor-pointer"
                  >
                    <Highlighter className="w-3.5 h-3.5 text-yellow-600" /> Yellow
                  </button>
                  <button
                    type="button"
                    onMouseDown={e => e.preventDefault()}
                    onClick={() => execFormat('hiliteColor', '#bbf7d0')}
                    className="flex items-center gap-1 px-2 py-0.5 bg-emerald-100 text-emerald-900 border border-emerald-300 rounded text-[11px] font-bold cursor-pointer"
                  >
                    <Highlighter className="w-3.5 h-3.5 text-emerald-600" /> Green
                  </button>
                  <button
                    type="button"
                    onMouseDown={e => e.preventDefault()}
                    onClick={() => execFormat('hiliteColor', '#fed7aa')}
                    className="flex items-center gap-1 px-2 py-0.5 bg-orange-100 text-orange-900 border border-orange-300 rounded text-[11px] font-bold cursor-pointer"
                  >
                    <Highlighter className="w-3.5 h-3.5 text-orange-600" /> Warning
                  </button>

                  <div className="h-4 w-px bg-slate-300 mx-1" />

                  {/* Colors */}
                  <button
                    type="button"
                    onMouseDown={e => e.preventDefault()}
                    onClick={() => execFormat('foreColor', '#0284c7')}
                    className="px-2 py-0.5 text-sky-600 hover:bg-white rounded font-bold text-[11px] cursor-pointer"
                  >
                    Blue
                  </button>
                  <button
                    type="button"
                    onMouseDown={e => e.preventDefault()}
                    onClick={() => execFormat('foreColor', '#dc2626')}
                    className="px-2 py-0.5 text-rose-600 hover:bg-white rounded font-bold text-[11px] cursor-pointer"
                  >
                    Red
                  </button>
                  <button
                    type="button"
                    onMouseDown={e => e.preventDefault()}
                    onClick={() => execFormat('removeFormat')}
                    className="p-1.5 hover:bg-white rounded ml-auto text-slate-400 cursor-pointer"
                    title="Clear"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* ContentEditable Area */}
                <div
                  ref={setEditorRef}
                  contentEditable
                  suppressContentEditableWarning
                  onInput={e => handleEditorInput(e.currentTarget.innerHTML)}
                  onBlur={handleEditorBlur}
                  style={{ fontSize: `${editorFontSize}px` }}
                  className="report-editor-area w-full min-h-[320px] max-h-[500px] overflow-y-auto p-5 bg-white text-slate-900 rounded-b-2xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500 font-sans leading-relaxed shadow-inner"
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
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:bg-white"
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
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:bg-white"
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
                          findingsHtml: editorRef.current ? editorRef.current.innerHTML : (editorContentRef.current || editorContent),
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
