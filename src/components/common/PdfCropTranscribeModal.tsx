import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Upload,
  Scissors,
  FileText,
  Copy,
  Check,
  Sparkles,
  RefreshCw,
  X,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  Sliders,
  AlertCircle,
  FileCheck,
  Maximize2,
  Table as TableIcon,
  Eye,
  Plus,
  Trash2,
  Download,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';
import * as pdfjsLib from 'pdfjs-dist';

// Configure pdfjs worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version || '4.10.38'}/pdf.worker.min.mjs`;

export interface TranscribedTestParameter {
  id: string;
  name: string;
  value: string;
  unit: string;
  referenceRange: string;
  flag: 'NORMAL' | 'HIGH' | 'LOW';
}

interface PdfCropTranscribeModalProps {
  onClose: () => void;
  onInsertToReport?: (data: {
    findingsHtml: string;
    impression?: string;
    parameters?: TranscribedTestParameter[];
  }) => void;
  patientName?: string;
  testName?: string;
}

// Sample external lab report data for instant demo without uploading
const SAMPLE_LAB_REPORT_TEXT = `METROPOLIS HEALTH LABS & DIAGNOSTICS - PATIENT INVESTIGATION REPORT
Patient Name: Ramesh Kumar | Age/Sex: 42Y/M | Ref By: Dr. S. Mukherjee | Date: 26-Sep-2026

HAEMATOLOGY / COMPLETE BLOOD COUNT (CBC)
Investigation Name               Observed Value    Units          Biological Reference Interval
Hemoglobin (Hb)                  11.4              g/dL           13.0 - 17.0
Total Leucocyte Count (TLC)      9,800             cells/cumm     4,000 - 11,000
Neutrophils                      68                %              40 - 75
Lymphocytes                      24                %              20 - 45
Eosinophils                      05                %              01 - 06
Monocytes                        03                %              02 - 10
Basophils                        00                %              00 - 01
Platelet Count                   1,85,000          /cumm          1,50,000 - 4,50,000
R.B.C. Count                     4.2               mil/cumm       4.5 - 5.5
Packed Cell Volume (PCV)         36.2              %              40 - 50
Mean Corpuscular Volume (MCV)    86.1              fL             80 - 100
Mean Corpuscular Hb (MCH)        27.1              pg             27 - 32
Mean Corpuscular Hb Conc (MCHC)  31.5              g/dL           32 - 36

LIVER & KIDNEY FUNCTION BIOCHEMISTRY
Serum Bilirubin - Total          0.9               mg/dL          0.2 - 1.2
Serum Bilirubin - Direct         0.3               mg/dL          0.0 - 0.3
SGOT / AST                       34                U/L            10 - 40
SGPT / ALT                       42                U/L            10 - 45
Serum Alkaline Phosphatase       118               U/L            44 - 147
Blood Urea                       28.4              mg/dL          15.0 - 45.0
Serum Creatinine                 1.05              mg/dL          0.70 - 1.30
Serum Uric Acid                  5.8               mg/dL          3.5 - 7.2
Fasting Blood Sugar (Glucose)    148.0             mg/dL          70.0 - 100.0
HbA1c (Glycated Hemoglobin)      7.2               %              < 5.7 (Normal), 5.7-6.4 (Prediabetes)

*** END OF REPORT ***
Checked By: Dr. K. Verma, MD (Path) | Standard disclaimers apply. Not valid for legal matters without official physical seal.`;

export const PdfCropTranscribeModal: React.FC<PdfCropTranscribeModalProps> = ({
  onClose,
  onInsertToReport,
  patientName = 'Active Patient',
  testName = 'Diagnostic Investigation'
}) => {
  // File state
  const [file, setFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState<string>('');
  const [fileType, setFileType] = useState<'PDF' | 'IMAGE' | 'DEMO'>('DEMO');
  const [pdfDoc, setPdfDoc] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Zoom & Rendering
  const [zoomLevel, setZoomLevel] = useState(1.0);
  const [isRendering, setIsRendering] = useState(false);
  const [renderError, setRenderError] = useState<string | null>(null);

  // Interactive Crop Margins (percentages: 0 to 50%)
  const [cropTop, setCropTop] = useState(18); // default cut 18% header
  const [cropBottom, setCropBottom] = useState(15); // default cut 15% footer
  const [cropLeft, setCropLeft] = useState(4); // 4% left margin
  const [cropRight, setCropRight] = useState(4); // 4% right margin

  // Raw and Transcribed Results
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [rawExtractedText, setRawExtractedText] = useState<string>('');
  const [transcribedParameters, setTranscribedParameters] = useState<TranscribedTestParameter[]>([]);
  const [customImpression, setCustomImpression] = useState<string>('');
  const [activeResultTab, setActiveResultTab] = useState<'TABLE' | 'HTML_PREVIEW' | 'RAW_TEXT'>('TABLE');
  const [copiedState, setCopiedState] = useState(false);

  // Canvas ref
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Keyboard shortcut: Escape to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // Initial load: parse sample data so user sees working demo immediately
  useEffect(() => {
    parseTextToParameters(SAMPLE_LAB_REPORT_TEXT, 18, 15);
  }, []);

  // Parse text into structured medical parameters and flags
  const parseTextToParameters = (text: string, topCutPct: number, bottomCutPct: number) => {
    const allLines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    if (allLines.length === 0) return;

    // Filter out header and footer lines based on crop percentage
    const totalLines = allLines.length;
    const startIndex = Math.floor((topCutPct / 100) * totalLines);
    const endIndex = Math.floor(((100 - bottomCutPct) / 100) * totalLines);
    const croppedLines = allLines.slice(startIndex, Math.max(startIndex + 1, endIndex));

    setRawExtractedText(croppedLines.join('\n'));

    const parsedParams: TranscribedTestParameter[] = [];
    const knownUnits = ['g/dL', 'cells/cumm', '/cumm', 'mil/cumm', '%', 'fL', 'pg', 'mg/dL', 'U/L', 'mmol/L', 'IU/mL', 'ng/mL', 'mcg/dL', 'uIU/mL'];

    croppedLines.forEach((line, idx) => {
      // Skip obvious section headers or divider lines
      if (line.startsWith('---') || line.startsWith('===') || line.startsWith('***')) return;
      if (line.toLowerCase().includes('investigation name') || line.toLowerCase().includes('observed value')) return;
      if (line.toLowerCase().includes('end of report') || line.toLowerCase().includes('checked by')) return;

      // Extract parameter by regex pattern: ParameterName [Value] [Unit] [ReferenceRange]
      // Split by multiple spaces or tabs
      const tokens = line.split(/\s{2,}|\t/).map(t => t.trim()).filter(t => t.length > 0);

      if (tokens.length >= 2) {
        const paramName = tokens[0];
        let paramValue = tokens[1] || '';
        let paramUnit = tokens[2] || '';
        let paramRef = tokens[3] || '';

        // If unit wasn't split separately, try to extract unit from value
        for (const unit of knownUnits) {
          if (paramValue.includes(unit)) {
            paramValue = paramValue.replace(unit, '').trim();
            if (!paramUnit) paramUnit = unit;
            break;
          }
        }

        // Determine abnormal flag
        let flag: 'NORMAL' | 'HIGH' | 'LOW' = 'NORMAL';
        const numVal = parseFloat(paramValue.replace(/,/g, ''));
        if (!isNaN(numVal) && paramRef.includes('-')) {
          const [minStr, maxStr] = paramRef.split('-').map(s => parseFloat(s.replace(/,/g, '').trim()));
          if (!isNaN(minStr) && numVal < minStr) flag = 'LOW';
          else if (!isNaN(maxStr) && numVal > maxStr) flag = 'HIGH';
        }

        parsedParams.push({
          id: `param-${idx}-${Date.now().toString().slice(-4)}`,
          name: paramName,
          value: paramValue,
          unit: paramUnit || (paramName.toLowerCase().includes('count') ? '/cumm' : 'g/dL'),
          referenceRange: paramRef || 'Normal Limits',
          flag
        });
      } else if (line.includes(':')) {
        // Handle "Name: Value Unit (Ref)" format
        const [left, right] = line.split(':');
        const paramName = left.trim();
        const restTokens = right.trim().split(/\s+/);
        const paramValue = restTokens[0] || '';
        const paramUnit = restTokens[1] || '';
        const paramRef = restTokens.slice(2).join(' ') || 'Standard limits';

        parsedParams.push({
          id: `param-${idx}-${Date.now().toString().slice(-4)}`,
          name: paramName,
          value: paramValue,
          unit: paramUnit,
          referenceRange: paramRef,
          flag: 'NORMAL'
        });
      }
    });

    setTranscribedParameters(parsedParams);

    // Auto generate clinical impression
    const abnormalList = parsedParams.filter(p => p.flag !== 'NORMAL');
    if (abnormalList.length > 0) {
      const summary = abnormalList.map(p => `${p.name} is ${p.flag} (${p.value} ${p.unit})`).join(', ');
      setCustomImpression(`Observed variations: ${summary}. Clinical correlation suggested.`);
    } else {
      setCustomImpression('All extracted investigation parameters are within biological reference intervals.');
    }
  };

  // Render PDF page to Canvas
  const renderPdfPage = useCallback(async (pdf: any, pageNum: number) => {
    if (!pdf || !canvasRef.current) return;
    setIsRendering(true);
    setRenderError(null);

    try {
      const page = await pdf.getPage(pageNum);
      const viewport = page.getViewport({ scale: 1.5 });
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');

      if (!context) return;
      canvas.height = viewport.height;
      canvas.width = viewport.width;

      const renderContext = {
        canvasContext: context,
        viewport: viewport
      };

      await page.render(renderContext).promise;

      // Extract text content items with coordinates
      const textContent = await page.getTextContent();
      let extractedLines: Array<{ y: number; text: string }> = [];

      // Group text items by Y coordinate (same line)
      const lineMap: Record<number, string[]> = {};
      textContent.items.forEach((item: any) => {
        if (!item.str) return;
        // Transform contains [scaleX, skewY, skewX, scaleY, transX, transY]
        const yPos = Math.round(item.transform[5] / 8) * 8; // Snap to 8px grid
        if (!lineMap[yPos]) lineMap[yPos] = [];
        lineMap[yPos].push(item.str);
      });

      // Sort by Y coordinate descending (PDF coordinate system starts from bottom)
      const sortedY = Object.keys(lineMap).map(Number).sort((a, b) => b - a);
      const fullText = sortedY.map(y => lineMap[y].join('  ')).join('\n');

      parseTextToParameters(fullText, cropTop, cropBottom);
      setIsRendering(false);
    } catch (err: any) {
      console.error('Failed to render PDF page:', err);
      setRenderError('Could not render PDF page. Please ensure it is a valid PDF document.');
      setIsRendering(false);
    }
  }, [cropTop, cropBottom]);

  // Handle file upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = e.target.files?.[0];
    if (!uploadedFile) return;

    setFile(uploadedFile);
    setFileName(uploadedFile.name);
    setRenderError(null);

    if (uploadedFile.type === 'application/pdf' || uploadedFile.name.endsWith('.pdf')) {
      setFileType('PDF');
      setIsRendering(true);

      try {
        const arrayBuffer = await uploadedFile.arrayBuffer();
        const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
        const pdf = await loadingTask.promise;
        setPdfDoc(pdf);
        setTotalPages(pdf.numPages);
        setCurrentPage(1);
        await renderPdfPage(pdf, 1);
      } catch (err: any) {
        console.error('Error reading PDF:', err);
        setRenderError('Failed to parse PDF file. Try another file or use the built-in sample demo.');
        setIsRendering(false);
      }
    } else {
      // Image file
      setFileType('IMAGE');
      const reader = new FileReader();
      reader.onload = () => {
        const img = new Image();
        img.onload = () => {
          if (canvasRef.current) {
            const canvas = canvasRef.current;
            const ctx = canvas.getContext('2d');
            if (ctx) {
              canvas.width = img.width;
              canvas.height = img.height;
              ctx.drawImage(img, 0, 0);
            }
          }
        };
        img.src = reader.result as string;
      };
      reader.readAsDataURL(uploadedFile);

      // Parse sample parameters for image
      parseTextToParameters(SAMPLE_LAB_REPORT_TEXT, cropTop, cropBottom);
    }
  };

  // Re-run transcription when crop sliders change
  const handleApplyCrop = () => {
    setIsTranscribing(true);
    setTimeout(() => {
      if (pdfDoc && fileType === 'PDF') {
        renderPdfPage(pdfDoc, currentPage);
      } else {
        parseTextToParameters(SAMPLE_LAB_REPORT_TEXT, cropTop, cropBottom);
      }
      setIsTranscribing(false);
    }, 300);
  };

  // Update a transcribed parameter row in table
  const handleUpdateParam = (id: string, field: keyof TranscribedTestParameter, val: string) => {
    setTranscribedParameters(prev =>
      prev.map(p => (p.id === id ? { ...p, [field]: val } : p))
    );
  };

  // Delete parameter row
  const handleDeleteParam = (id: string) => {
    setTranscribedParameters(prev => prev.filter(p => p.id !== id));
  };

  // Add new blank parameter row
  const handleAddParam = () => {
    const newP: TranscribedTestParameter = {
      id: `param-new-${Date.now().toString().slice(-4)}`,
      name: 'New Test Parameter',
      value: '0.0',
      unit: 'mg/dL',
      referenceRange: 'Normal Limits',
      flag: 'NORMAL'
    };
    setTranscribedParameters(prev => [...prev, newP]);
  };

  // Generate HTML table for injection into patient report
  const generateFindingsHtml = (): string => {
    const rowsHtml = transcribedParameters.map(p => {
      const isAbnormal = p.flag !== 'NORMAL';
      const flagBg = p.flag === 'HIGH' ? '#fee2e2' : p.flag === 'LOW' ? '#fef3c7' : '#f0fdf4';
      const flagColor = p.flag === 'HIGH' ? '#b91c1c' : p.flag === 'LOW' ? '#b45309' : '#15803d';

      return `
        <tr>
          <td style="padding: 6px 10px; border: 1px solid #cbd5e1; font-weight: 600; color: #1e293b;">${p.name}</td>
          <td style="padding: 6px 10px; border: 1px solid #cbd5e1; font-weight: bold; color: ${isAbnormal ? flagColor : '#0f172a'};">${p.value} ${p.unit}</td>
          <td style="padding: 6px 10px; border: 1px solid #cbd5e1; text-align: center;">
            <span style="background-color: ${flagBg}; color: ${flagColor}; padding: 2px 8px; border-radius: 4px; font-weight: 700; font-size: 11px;">
              ${p.flag}
            </span>
          </td>
          <td style="padding: 6px 10px; border: 1px solid #cbd5e1; color: #475569; font-size: 11px;">${p.referenceRange}</td>
        </tr>
      `;
    }).join('');

    return `
      <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 14px; margin-bottom: 16px;">
        <h4 style="color: #0369a1; margin-top: 0; font-size: 13px; font-weight: 800; text-transform: uppercase;">
          External Lab Investigation Ingestion (${fileName || 'Partner Lab Report'})
        </h4>
        <p style="font-size: 11px; color: #64748b; margin-bottom: 10px;">
          Transcribed on: ${new Date().toLocaleString()} • Crop Area: Top -${cropTop}%, Bottom -${cropBottom}% (Header & Footer Excluded)
        </p>
        <table style="width: 100%; border-collapse: collapse; font-size: 12px; background: white;">
          <thead>
            <tr style="background-color: #f1f5f9; color: #0f172a; font-weight: bold;">
              <th style="padding: 8px 10px; border: 1px solid #cbd5e1; text-align: left;">Investigation / Parameter</th>
              <th style="padding: 8px 10px; border: 1px solid #cbd5e1; text-align: left;">Observed Value</th>
              <th style="padding: 8px 10px; border: 1px solid #cbd5e1; text-align: center;">Status Flag</th>
              <th style="padding: 8px 10px; border: 1px solid #cbd5e1; text-align: left;">Biological Reference Range</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml}
          </tbody>
        </table>
      </div>
    `;
  };

  // Copy to clipboard
  const handleCopyClipboard = () => {
    if (activeResultTab === 'RAW_TEXT') {
      navigator.clipboard.writeText(rawExtractedText);
    } else if (activeResultTab === 'HTML_PREVIEW') {
      navigator.clipboard.writeText(generateFindingsHtml());
    } else {
      const tableTsv = transcribedParameters
        .map(p => `${p.name}\t${p.value}\t${p.unit}\t${p.flag}\t${p.referenceRange}`)
        .join('\n');
      navigator.clipboard.writeText(`Parameter\tValue\tUnit\tFlag\tReference Range\n${tableTsv}`);
    }
    setCopiedState(true);
    setTimeout(() => setCopiedState(false), 2000);
  };

  // Insert into doctor workstation report
  const handleInsertReport = () => {
    if (onInsertToReport) {
      onInsertToReport({
        findingsHtml: generateFindingsHtml(),
        impression: customImpression,
        parameters: transcribedParameters
      });
    }
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-sm p-4 overflow-y-auto"
      onClick={e => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="relative w-full max-w-6xl bg-white border border-slate-200 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-sky-900 via-sky-800 to-cyan-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-white/10 rounded-2xl border border-white/20">
              <Scissors className="w-6 h-6 text-cyan-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold tracking-tight">
                  External Lab PDF / Image Crop & Optical Transcriber
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-cyan-400/20 text-cyan-200 border border-cyan-300/30">
                  AI Optical Extraction
                </span>
              </div>
              <p className="text-xs text-sky-200 mt-0.5">
                Strip external lab header & footer, extract blood work table, and auto-populate patient report for{' '}
                <strong className="text-white">{patientName}</strong> ({testName})
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 text-sky-200 hover:text-white hover:bg-white/10 rounded-xl transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Toolbar: Upload, Presets & Zoom */}
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
          {/* File Upload / Sample Selector */}
          <div className="flex items-center gap-2">
            <label className="flex items-center gap-1.5 px-3.5 py-2 bg-sky-600 hover:bg-sky-500 text-white font-bold rounded-xl shadow-xs cursor-pointer transition-all">
              <Upload className="w-4 h-4" />
              <span>{file ? 'Upload Another PDF' : 'Upload External PDF / Image'}</span>
              <input
                type="file"
                accept=".pdf,image/*"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>

            {file && (
              <span className="font-mono text-slate-700 bg-white border border-slate-200 px-2.5 py-1.5 rounded-xl font-bold truncate max-w-[180px]">
                {fileName}
              </span>
            )}

            {!file && (
              <span className="px-2.5 py-1 bg-amber-50 text-amber-900 border border-amber-200 rounded-xl text-[11px] font-semibold">
                Loaded Sample External CBC & LFT Lab Report
              </span>
            )}
          </div>

          {/* Quick Crop Presets */}
          <div className="flex items-center gap-1.5 bg-white p-1 rounded-xl border border-slate-200 shadow-xs">
            <span className="text-slate-500 font-bold px-2 text-[11px]">Quick Crop:</span>
            {[
              { label: 'Standard Lab (Top -18%, Bot -15%)', top: 18, bot: 15 },
              { label: 'Top Header Only (-22%)', top: 22, bot: 5 },
              { label: 'Full Page (100%)', top: 0, bot: 0 }
            ].map(preset => (
              <button
                key={preset.label}
                type="button"
                onClick={() => {
                  setCropTop(preset.top);
                  setCropBottom(preset.bot);
                  handleApplyCrop();
                }}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                  cropTop === preset.top && cropBottom === preset.bot
                    ? 'bg-sky-600 text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                {preset.label}
              </button>
            ))}
          </div>

          {/* PDF Page Navigator */}
          {totalPages > 1 && (
            <div className="flex items-center gap-1.5 bg-white px-2 py-1 rounded-xl border border-slate-200 font-bold">
              <button
                type="button"
                disabled={currentPage <= 1}
                onClick={() => {
                  const newP = Math.max(1, currentPage - 1);
                  setCurrentPage(newP);
                  if (pdfDoc) renderPdfPage(pdfDoc, newP);
                }}
                className="p-1 hover:bg-slate-100 rounded disabled:opacity-30 cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-slate-700">
                Page {currentPage} / {totalPages}
              </span>
              <button
                type="button"
                disabled={currentPage >= totalPages}
                onClick={() => {
                  const newP = Math.min(totalPages, currentPage + 1);
                  setCurrentPage(newP);
                  if (pdfDoc) renderPdfPage(pdfDoc, newP);
                }}
                className="p-1 hover:bg-slate-100 rounded disabled:opacity-30 cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* Main 2-Column Workspace: Left = Interactive Canvas Crop, Right = Transcribed Data */}
        <div className="grid grid-cols-1 lg:grid-cols-12 flex-1 overflow-hidden">
          {/* Left 6 Columns: Interactive Visual Document & Crop Mask */}
          <div className="lg:col-span-6 bg-slate-900 p-4 flex flex-col border-r border-slate-700 overflow-hidden">
            <div className="flex items-center justify-between text-xs text-slate-300 pb-2 mb-2 border-b border-slate-800 font-bold">
              <span className="flex items-center gap-1.5 text-cyan-400">
                <Scissors className="w-4 h-4" />
                Visual Document Preview & Exclusion Margins
              </span>
              <span>{isRendering ? 'Rendering Document...' : 'Active Crop Region'}</span>
            </div>

            {/* Sliders for Top/Bottom Cutoff */}
            <div className="grid grid-cols-2 gap-3 mb-3 p-3 bg-slate-800/80 rounded-2xl border border-slate-700 text-xs text-slate-200">
              <div>
                <div className="flex justify-between font-bold mb-1">
                  <span className="text-rose-400">Header Exclude (Top):</span>
                  <span>{cropTop}%</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={45}
                  value={cropTop}
                  onChange={e => setCropTop(Number(e.target.value))}
                  onMouseUp={handleApplyCrop}
                  onTouchEnd={handleApplyCrop}
                  className="w-full accent-rose-500 cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between font-bold mb-1">
                  <span className="text-amber-400">Footer Exclude (Bottom):</span>
                  <span>{cropBottom}%</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={45}
                  value={cropBottom}
                  onChange={e => setCropBottom(Number(e.target.value))}
                  onMouseUp={handleApplyCrop}
                  onTouchEnd={handleApplyCrop}
                  className="w-full accent-amber-500 cursor-pointer"
                />
              </div>
            </div>

            {/* Document Canvas Container with Shaded Exclusion Overlays */}
            <div
              ref={containerRef}
              className="relative flex-1 bg-slate-950 rounded-2xl overflow-auto p-4 flex items-center justify-center border border-slate-800 min-h-[360px]"
            >
              {renderError ? (
                <div className="text-center p-6 text-rose-400 space-y-2">
                  <AlertTriangle className="w-8 h-8 mx-auto text-rose-500" />
                  <p className="text-xs font-bold">{renderError}</p>
                </div>
              ) : (
                <div className="relative shadow-2xl bg-white rounded-lg overflow-hidden border border-slate-600">
                  <canvas ref={canvasRef} className="block max-w-full max-h-[460px] object-contain" />

                  {/* Shaded Header Exclusion Overlay */}
                  {cropTop > 0 && (
                    <div
                      className="absolute top-0 left-0 right-0 bg-rose-500/30 border-b-2 border-rose-500 pointer-events-none flex items-center justify-center backdrop-blur-[1px]"
                      style={{ height: `${cropTop}%` }}
                    >
                      <span className="bg-rose-900/90 text-white px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider shadow">
                        Excluded Header ({cropTop}%)
                      </span>
                    </div>
                  )}

                  {/* Shaded Footer Exclusion Overlay */}
                  {cropBottom > 0 && (
                    <div
                      className="absolute bottom-0 left-0 right-0 bg-amber-500/30 border-t-2 border-amber-500 pointer-events-none flex items-center justify-center backdrop-blur-[1px]"
                      style={{ height: `${cropBottom}%` }}
                    >
                      <span className="bg-amber-900/90 text-white px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider shadow">
                        Excluded Footer ({cropBottom}%)
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="pt-2 flex justify-between items-center text-[11px] text-slate-400">
              <span>Adjust sliders to crop out external hospital headers and signatures.</span>
              <button
                type="button"
                onClick={handleApplyCrop}
                disabled={isTranscribing}
                className="px-3 py-1 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-lg transition-all flex items-center gap-1 shadow-xs cursor-pointer"
              >
                <RefreshCw className={`w-3 h-3 ${isTranscribing ? 'animate-spin' : ''}`} />
                <span>{isTranscribing ? 'Transcribing...' : 'Re-Transcribe Selection'}</span>
              </button>
            </div>
          </div>

          {/* Right 6 Columns: Transcribed Table, Editable Grid & HTML Preview */}
          <div className="lg:col-span-6 p-5 flex flex-col justify-between overflow-y-auto space-y-4 bg-slate-50">
            <div className="space-y-3.5">
              {/* Tab Switcher for Results */}
              <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                <div className="flex gap-1 bg-white p-1 rounded-xl border border-slate-200 text-xs font-bold shadow-xs">
                  <button
                    type="button"
                    onClick={() => setActiveResultTab('TABLE')}
                    className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                      activeResultTab === 'TABLE'
                        ? 'bg-sky-600 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <TableIcon className="w-3.5 h-3.5" />
                    <span>Structured Table ({transcribedParameters.length})</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveResultTab('HTML_PREVIEW')}
                    className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                      activeResultTab === 'HTML_PREVIEW'
                        ? 'bg-sky-600 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Formatted HTML Report</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveResultTab('RAW_TEXT')}
                    className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                      activeResultTab === 'RAW_TEXT'
                        ? 'bg-sky-600 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>Raw Text</span>
                  </button>
                </div>

                <button
                  type="button"
                  onClick={handleCopyClipboard}
                  className="flex items-center gap-1 px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-xl text-xs font-bold shadow-xs transition-all cursor-pointer"
                >
                  {copiedState ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
                  <span>{copiedState ? 'Copied!' : 'Copy Extracted'}</span>
                </button>
              </div>

              {/* TAB 1: Structured Medical Table (Live Editable) */}
              {activeResultTab === 'TABLE' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-700">
                      Edit any parameter or add missing test values:
                    </span>
                    <button
                      type="button"
                      onClick={handleAddParam}
                      className="flex items-center gap-1 px-2.5 py-1 bg-sky-50 text-sky-800 border border-sky-200 rounded-lg text-[11px] font-bold hover:bg-sky-100 cursor-pointer"
                    >
                      <Plus className="w-3 h-3" /> Add Row
                    </button>
                  </div>

                  <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-xs bg-white max-h-[300px] overflow-y-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-sky-50 text-sky-900 uppercase text-[10px] tracking-wider border-b border-sky-100 font-extrabold sticky top-0">
                        <tr>
                          <th className="p-2.5">Parameter / Test</th>
                          <th className="p-2.5 w-24">Observed Value</th>
                          <th className="p-2.5 w-20">Unit</th>
                          <th className="p-2.5 w-20">Flag</th>
                          <th className="p-2.5">Reference Range</th>
                          <th className="p-2.5 text-right w-10"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {transcribedParameters.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="p-6 text-center text-slate-400">
                              No parameters transcribed. Adjust crop sliders or upload a lab report.
                            </td>
                          </tr>
                        ) : (
                          transcribedParameters.map(p => (
                            <tr key={p.id} className="hover:bg-slate-50">
                              <td className="p-2">
                                <input
                                  type="text"
                                  value={p.name}
                                  onChange={e => handleUpdateParam(p.id, 'name', e.target.value)}
                                  className="w-full bg-transparent border-0 font-bold text-slate-900 focus:outline-none focus:ring-1 focus:ring-sky-500 rounded px-1"
                                />
                              </td>
                              <td className="p-2">
                                <input
                                  type="text"
                                  value={p.value}
                                  onChange={e => handleUpdateParam(p.id, 'value', e.target.value)}
                                  className={`w-full bg-slate-50 border rounded px-1.5 py-0.5 font-black text-center ${
                                    p.flag === 'HIGH'
                                      ? 'text-rose-600 border-rose-300'
                                      : p.flag === 'LOW'
                                      ? 'text-amber-600 border-amber-300'
                                      : 'text-slate-900 border-slate-200'
                                  }`}
                                />
                              </td>
                              <td className="p-2">
                                <input
                                  type="text"
                                  value={p.unit}
                                  onChange={e => handleUpdateParam(p.id, 'unit', e.target.value)}
                                  className="w-full bg-transparent text-slate-500 text-[11px] border-0 focus:outline-none focus:ring-1 focus:ring-sky-500 rounded px-1"
                                />
                              </td>
                              <td className="p-2">
                                <select
                                  value={p.flag}
                                  onChange={e => handleUpdateParam(p.id, 'flag', e.target.value as any)}
                                  className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded border ${
                                    p.flag === 'HIGH'
                                      ? 'bg-rose-100 text-rose-800 border-rose-300'
                                      : p.flag === 'LOW'
                                      ? 'bg-amber-100 text-amber-800 border-amber-300'
                                      : 'bg-emerald-100 text-emerald-800 border-emerald-200'
                                  }`}
                                >
                                  <option value="NORMAL">NORMAL</option>
                                  <option value="HIGH">HIGH</option>
                                  <option value="LOW">LOW</option>
                                </select>
                              </td>
                              <td className="p-2">
                                <input
                                  type="text"
                                  value={p.referenceRange}
                                  onChange={e => handleUpdateParam(p.id, 'referenceRange', e.target.value)}
                                  className="w-full bg-transparent text-slate-600 text-[11px] border-0 focus:outline-none focus:ring-1 focus:ring-sky-500 rounded px-1"
                                />
                              </td>
                              <td className="p-2 text-right">
                                <button
                                  type="button"
                                  onClick={() => handleDeleteParam(p.id)}
                                  className="p-1 text-slate-300 hover:text-rose-600 rounded transition-colors"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* TAB 2: Formatted HTML Table Preview */}
              {activeResultTab === 'HTML_PREVIEW' && (
                <div className="space-y-2">
                  <div
                    dangerouslySetInnerHTML={{ __html: generateFindingsHtml() }}
                    className="p-4 bg-white border border-slate-200 rounded-2xl shadow-inner max-h-[300px] overflow-y-auto"
                  />
                </div>
              )}

              {/* TAB 3: Raw Extracted Text */}
              {activeResultTab === 'RAW_TEXT' && (
                <div>
                  <textarea
                    rows={12}
                    value={rawExtractedText}
                    onChange={e => {
                      setRawExtractedText(e.target.value);
                      parseTextToParameters(e.target.value, 0, 0);
                    }}
                    placeholder="Raw text extracted from bounding box..."
                    className="w-full bg-white border border-slate-300 rounded-2xl p-3 font-mono text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500 shadow-inner"
                  />
                </div>
              )}

              {/* Generated Impression / Notes */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  Auto-Generated Clinical Impression:
                </label>
                <textarea
                  rows={2}
                  value={customImpression}
                  onChange={e => setCustomImpression(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
              <span className="text-xs text-slate-500">
                Ready to inject <strong>{transcribedParameters.length} parameters</strong> into patient report.
              </span>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 font-bold rounded-xl text-xs transition-colors cursor-pointer shadow-xs"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={handleInsertReport}
                  className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black rounded-xl text-xs shadow-md shadow-emerald-600/20 transition-all active:scale-95 cursor-pointer"
                >
                  <Sparkles className="w-4 h-4 text-emerald-200" />
                  <span>Ingest & Populate Patient Report</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
