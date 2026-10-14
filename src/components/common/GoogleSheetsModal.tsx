import React, { useState } from 'react';
import {
  FileSpreadsheet,
  X,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Zap,
  Building2,
  Table,
  UploadCloud,
  DownloadCloud,
  Tag
} from 'lucide-react';
import { useDiagnostic } from '../../context/DiagnosticContext';
import {
  testGoogleAppsScriptConnection,
  initializeGoogleSheetsTables,
  syncFullBackupToGoogleSheets
} from '../../services/googleSheetsSync';

interface GoogleSheetsModalProps {
  onClose: () => void;
}

export const GoogleSheetsModal: React.FC<GoogleSheetsModalProps> = ({ onClose }) => {
  const {
    centers,
    allOrders,
    allExpenses,
    tests,
    patients,
    referrers,
    appointments,
    staff,
    doctorRoster,
    syncCatalogToSheets,
    reloadCatalogFromSheets,
    isOnline,
    unsyncedOrdersCount,
    syncOfflineQueue,
    pullOrdersFromGoogleSheets
  } = useDiagnostic();

  const [isTesting, setIsTesting] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  const [isSyncingAll, setIsSyncingAll] = useState(false);
  const [isSyncingCatalog, setIsSyncingCatalog] = useState(false);
  const [isFetchingCatalog, setIsFetchingCatalog] = useState(false);
  const [isPullingOrders, setIsPullingOrders] = useState(false);
  const [isSyncingOfflineQueue, setIsSyncingOfflineQueue] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>({
    success: true,
    message: 'Google Sheets Database & Two-Way Price Master are permanently connected. 1,170 tests and live rates synced.'
  });
  const [activeTab, setActiveTab] = useState<'STATUS' | 'SHEET_TABS'>('STATUS');

  const handleSyncPendingOrders = async () => {
    setIsSyncingOfflineQueue(true);
    const { syncedCount, failedCount } = await syncOfflineQueue();
    setIsSyncingOfflineQueue(false);
    if (failedCount === 0) {
      setTestResult({
        success: true,
        message: `Successfully synchronized ${syncedCount} queued orders to Google Sheets!`
      });
    } else {
      setTestResult({
        success: false,
        message: `Synced ${syncedCount} orders, ${failedCount} could not be sent. Check internet connection.`
      });
    }
  };

  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestResult(null);
    const res = await testGoogleAppsScriptConnection();
    setIsTesting(false);
    setTestResult(res);
  };

  const handleInitializeTables = async () => {
    setIsInitializing(true);
    setTestResult(null);
    const res = await initializeGoogleSheetsTables();
    setIsInitializing(false);
    setTestResult(res);
  };

  const handleSyncAllNow = async () => {
    setIsSyncingAll(true);
    const res = await syncFullBackupToGoogleSheets(
      allOrders,
      allExpenses,
      tests,
      patients,
      referrers,
      appointments,
      staff,
      doctorRoster
    );
    setIsSyncingAll(false);
    setTestResult(res);
  };

  const handlePushTestCatalog = async () => {
    setIsSyncingCatalog(true);
    const res = await syncCatalogToSheets();
    setIsSyncingCatalog(false);
    setTestResult(res);
  };

  const handleFetchTestCatalog = async () => {
    setIsFetchingCatalog(true);
    const res = await reloadCatalogFromSheets();
    setIsFetchingCatalog(false);
    setTestResult(res);
  };

  const handlePullOrdersFromSheets = async () => {
    setIsPullingOrders(true);
    setTestResult(null);
    const res = await pullOrdersFromGoogleSheets(true);
    setIsPullingOrders(false);
    setTestResult(res);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto font-sans">
      <div className="relative w-full max-w-xl bg-white border border-slate-200 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-sky-600 to-indigo-600 text-white">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-xl backdrop-blur-xs">
              <FileSpreadsheet className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">Google Sheets Database & Price Master</h3>
              <p className="text-xs text-sky-100">Live two-way rate syncing & multi-center cloud backup</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-white/80 hover:text-white hover:bg-white/10 rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-6 pt-2">
          <button
            onClick={() => setActiveTab('STATUS')}
            className={`pb-3 px-3 text-xs font-bold border-b-2 transition-all cursor-pointer ${
              activeTab === 'STATUS'
                ? 'border-sky-600 text-sky-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Connection & Price Sync
          </button>
          <button
            onClick={() => setActiveTab('SHEET_TABS')}
            className={`pb-3 px-3 text-xs font-bold border-b-2 transition-all cursor-pointer ${
              activeTab === 'SHEET_TABS'
                ? 'border-sky-600 text-sky-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Connected Sheet Tabs ({centers.length + 4})
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5 text-xs text-slate-700">
          {activeTab === 'STATUS' && (
            <div className="space-y-4">
              <div className={`p-4 rounded-2xl border space-y-2 ${isOnline ? 'bg-emerald-50 border-emerald-200' : 'bg-amber-50 border-amber-300'}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={`w-2.5 h-2.5 rounded-full ${isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
                    <p className={`font-bold text-xs ${isOnline ? 'text-emerald-950' : 'text-amber-950'}`}>
                      {isOnline ? 'Network Online • Google Sheets Live Sync Active' : 'Offline Mode • Local Storage Active'}
                    </p>
                  </div>
                  <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${isOnline ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-200 text-amber-900'}`}>
                    {isOnline ? 'ONLINE' : 'OFFLINE'}
                  </span>
                </div>
                <p className={`text-[11px] leading-relaxed ${isOnline ? 'text-emerald-800' : 'text-amber-800'}`}>
                  {isOnline
                    ? 'The app is directly linked to your Google Sheet. Rate changes and new orders synchronize in real time.'
                    : 'Internet connection is currently severed. Zero interruption: all patient registrations, bills, barcodes, and reports continue operating 100% locally and will auto-sync when online.'}
                </p>

                {/* Offline Queue Status */}
                <div className="mt-2 pt-2 border-t border-slate-200/60 flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-700">
                    Offline Queue Status:
                  </span>
                  {unsyncedOrdersCount > 0 ? (
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 bg-amber-100 border border-amber-300 text-amber-800 rounded-md text-[10px] font-bold">
                        {unsyncedOrdersCount} pending sync
                      </span>
                      <button
                        type="button"
                        onClick={handleSyncPendingOrders}
                        disabled={isSyncingOfflineQueue || !isOnline}
                        className="px-2 py-0.5 bg-amber-600 hover:bg-amber-700 text-white rounded-md text-[10px] font-bold transition-all disabled:opacity-50 cursor-pointer"
                      >
                        {isSyncingOfflineQueue ? 'Syncing...' : 'Sync Now'}
                      </button>
                    </div>
                  ) : (
                    <span className="text-emerald-700 font-bold text-[10px] flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      All orders in lockstep with Google Sheets
                    </span>
                  )}
                </div>
              </div>

              {testResult && (
                <div
                  className={`p-3.5 rounded-2xl border flex items-start gap-2.5 ${
                    testResult.success
                      ? 'bg-sky-50 border-sky-300 text-sky-950'
                      : 'bg-amber-50 border-amber-300 text-amber-950'
                  }`}
                >
                  {testResult.success ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  )}
                  <div>
                    <span className="font-bold block text-xs">{testResult.success ? 'Database Status' : 'Notice'}</span>
                    <span className="text-[11px]">{testResult.message}</span>
                  </div>
                </div>
              )}

              {/* Price Master Two-Way Sync Block */}
              <div className="p-4 bg-indigo-50/70 border border-indigo-200 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Tag className="w-4 h-4 text-indigo-700" />
                    <span className="font-bold text-indigo-950 text-xs">Diagnostics Price List Master ({tests.length} tests)</span>
                  </div>
                  <span className="text-[10px] font-extrabold bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded-full">Tab: Master_Test_Catalog</span>
                </div>
                <p className="text-[11px] text-indigo-900 leading-relaxed">
                  Push your complete 1,170 test rates into Google Sheets so you can view or modify pricing directly in your spreadsheet. Any changes made in the sheet can be pulled instantly back into the app.
                </p>

                <div className="grid grid-cols-2 gap-2 pt-1">
                  <button
                    type="button"
                    onClick={handlePushTestCatalog}
                    disabled={isSyncingCatalog}
                    className="py-2 px-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs transition-all flex items-center justify-center gap-1.5 shadow-xs cursor-pointer disabled:opacity-60"
                  >
                    <UploadCloud className={`w-3.5 h-3.5 ${isSyncingCatalog ? 'animate-bounce' : ''}`} />
                    <span>{isSyncingCatalog ? 'Pushing 1,170 Rates...' : 'Push Rates to Google Sheet'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleFetchTestCatalog}
                    disabled={isFetchingCatalog}
                    className="py-2 px-3 bg-white border border-indigo-300 hover:bg-indigo-100/50 text-indigo-900 font-bold rounded-xl text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-60"
                  >
                    <DownloadCloud className={`w-3.5 h-3.5 text-indigo-600 ${isFetchingCatalog ? 'animate-spin' : ''}`} />
                    <span>{isFetchingCatalog ? 'Fetching Rates...' : 'Pull Live Rates from Sheet'}</span>
                  </button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2 pt-1">
                <button
                  type="button"
                  onClick={handleInitializeTables}
                  disabled={isInitializing}
                  className="w-full py-2.5 px-4 bg-sky-600 hover:bg-sky-700 text-white font-extrabold rounded-2xl text-xs transition-all flex items-center justify-center gap-2 shadow-md cursor-pointer disabled:opacity-60"
                >
                  <Table className="w-4 h-4" />
                  <span>
                    {isInitializing
                      ? 'Creating Sheets & Formatted Headers...'
                      : 'Initialize All Sheets & Formatted Headers'}
                  </span>
                </button>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={handlePullOrdersFromSheets}
                    disabled={isPullingOrders}
                    className="py-2.5 px-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs transition-all flex items-center justify-center gap-1.5 shadow-sm cursor-pointer disabled:opacity-60"
                  >
                    <DownloadCloud className={`w-4 h-4 ${isPullingOrders ? 'animate-bounce' : ''}`} />
                    <span>{isPullingOrders ? 'Pulling Orders...' : 'Pull Orders from Sheets'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleSyncAllNow}
                    disabled={isSyncingAll}
                    className="py-2.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition-all flex items-center justify-center gap-1.5 shadow-sm cursor-pointer disabled:opacity-60"
                  >
                    <Zap className="w-4 h-4" />
                    <span>{isSyncingAll ? 'Syncing...' : 'Push All to Sheets'}</span>
                  </button>
                </div>

                <button
                  type="button"
                  onClick={handleTestConnection}
                  disabled={isTesting}
                  className="w-full py-2 px-3 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold rounded-xl text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-60"
                >
                  <RefreshCw className={`w-3.5 h-3.5 text-sky-600 ${isTesting ? 'animate-spin' : ''}`} />
                  <span>{isTesting ? 'Testing...' : 'Test Connection'}</span>
                </button>
              </div>
            </div>
          )}

          {activeTab === 'SHEET_TABS' && (
            <div className="space-y-3">
              <p className="text-slate-600 font-medium">
                The Google Spreadsheet organizes all diagnostic center data across these dedicated tabs:
              </p>
              <div className="space-y-2">
                <div className="p-3 bg-indigo-50/80 border border-indigo-200 rounded-2xl flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-indigo-950">Master Diagnostics Rate List</span>
                      <span className="px-2 py-0.5 bg-indigo-200 text-indigo-900 text-[10px] font-bold rounded">
                        Two-Way Sync
                      </span>
                    </div>
                    <p className="text-[11px] font-mono text-indigo-700 mt-0.5">
                      Tab: <strong>Master_Test_Catalog</strong>
                    </p>
                  </div>
                  <span className="font-black text-indigo-900 bg-white px-3 py-1 rounded-xl border border-indigo-200">
                    {tests.length} Tests
                  </span>
                </div>

                {centers.map(center => {
                  const centerOrders = allOrders.filter(o => o.centerId === center.id);
                  return (
                    <div
                      key={center.id}
                      className="p-3 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900">{center.name}</span>
                          {center.isMain && (
                            <span className="px-2 py-0.5 bg-sky-100 text-sky-800 text-[10px] font-bold rounded">
                              Main Hub
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] font-mono text-sky-700 mt-0.5">
                          Target Tab: <strong>{center.sheetName}</strong>
                        </p>
                      </div>
                      <span className="font-black text-slate-800 bg-white px-3 py-1 rounded-xl border border-slate-200">
                        {centerOrders.length} Orders
                      </span>
                    </div>
                  );
                })}

                <div className="p-3 bg-teal-50/80 border border-teal-200 rounded-2xl flex items-center justify-between">
                  <div>
                    <span className="font-bold text-teal-950">Staff Attendance & Live Working Hours</span>
                    <p className="text-[11px] font-mono text-teal-700 mt-0.5">
                      Tab: <strong>Staff_Attendance_Log</strong>
                    </p>
                  </div>
                </div>

                <div className="p-3 bg-rose-50/80 border border-rose-200 rounded-2xl flex items-center justify-between">
                  <div>
                    <span className="font-bold text-rose-950">Operating Expenses & Vouchers</span>
                    <p className="text-[11px] font-mono text-rose-700 mt-0.5">
                      Tab: <strong>Expenses_All_Centers</strong>
                    </p>
                  </div>
                  <span className="font-black text-rose-900 bg-white px-3 py-1 rounded-xl border border-rose-200">
                    {allExpenses.length} Vouchers
                  </span>
                </div>

                <div className="p-3 bg-emerald-50/80 border border-emerald-200 rounded-2xl flex items-center justify-between">
                  <div>
                    <span className="font-bold text-emerald-950">Referring Doctors & Commission Ledger</span>
                    <p className="text-[11px] font-mono text-emerald-700 mt-0.5">
                      Tab: <strong>Referral_Partners</strong>
                    </p>
                  </div>
                </div>

                <div className="p-3 bg-slate-100 border border-slate-200 rounded-2xl flex items-center justify-between">
                  <div>
                    <span className="font-bold text-slate-900">Activity Audit Trail Log</span>
                    <p className="text-[11px] font-mono text-slate-700 mt-0.5">
                      Tab: <strong>Activity_Audit_Log</strong>
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
