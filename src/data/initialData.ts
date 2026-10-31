import {
  CenterBranch,
  ReferringDoctor,
  DiagnosticTestItem,
  Patient,
  DiagnosticOrder,
  DiagnosticReport,
  StaffEmployee,
  OperatingExpense,
  DoctorRosterItem
} from '../types';
import allTestsCatalog from './allTestsCatalog.json';

export const resolveTestSubDepartment = (test: Partial<DiagnosticTestItem>): string => {
  const name = (test.name || '').toLowerCase();
  const dept = (test.department || '').toLowerCase();
  const cat = (test.category || '').toLowerCase();

  // 1. Radiology Sub-sections
  if (cat === 'radiology' || dept.includes('radiography') || dept.includes('mri') || dept.includes('ultrasound') || dept.includes('sonography')) {
    if (dept.includes('mri') || name.includes('mri')) return 'MRI';
    if (dept.includes('computed tomography') || dept.includes('(ct)') || name.includes('ct scan') || name.startsWith('ct ') || name.includes(' ct ') || name.startsWith('ct-')) return 'CT Scan';
    if (dept.includes('ultrasound') || dept.includes('sonography') || name.includes('usg') || name.includes('ultrasound') || name.includes('sonography') || name.includes('doppler')) return 'USG / Ultrasound';
    if (dept.includes('radiography') || dept.includes('x-ray') || name.includes('x-ray') || name.includes('xray') || name.includes('radiograph') || dept.includes('hsg')) return 'X-Ray';
    if (name.includes('dexa') || name.includes('bmd')) return 'Dexa Scan';
    if (name.includes('mammo')) return 'Mammography';
    return 'General Radiology';
  }

  // 2. Cardiology Sub-sections
  if (cat === 'cardiology' || dept.includes('cardio')) {
    if (dept.includes('echo') || name.includes('echo') || name.includes('tmt')) return 'Echo / TMT';
    if (dept.includes('ecg') || name.includes('ecg')) return 'ECG';
    if (name.includes('holter')) return 'Holter';
    return 'Cardiology Diagnostics';
  }

  // 3. Specialized / Neurology Sub-sections
  if (cat === 'specialized' || dept.includes('neuro')) {
    if (dept.includes('eeg') || name.includes('eeg')) return 'EEG';
    if (dept.includes('ncv') || dept.includes('emg') || name.includes('ncv') || name.includes('emg')) return 'NCV / EMG';
    return 'Specialized Diagnostics';
  }

  // 4. Pathology Sub-sections
  if (dept.includes('hematology') || name.includes('cbc') || name.includes('hemoglobin') || name.includes('platelet') || name.includes('esr') || name.includes('blood group') || name.includes('dlc') || name.includes('tlc') || name.includes('coagulation') || name.includes('pt/inr')) return 'Hematology & CBC';
  if (dept.includes('endocrinology') || dept.includes('hormones') || name.includes('thyroid') || name.includes('tsh') || name.includes('vitamin') || name.includes('t3') || name.includes('t4') || name.includes('b12') || name.includes('d3') || name.includes('ferritin') || name.includes('iron') || name.includes('psa') || name.includes('prolactin') || name.includes('cortisol')) return 'Hormones & Thyroid';
  if (dept.includes('histopathology') || dept.includes('cytology') || dept.includes('fnac') || name.includes('biopsy') || name.includes('pap') || name.includes('fnac')) return 'Histopathology';
  if (dept.includes('microbiology') || dept.includes('serology') || dept.includes('infectious') || dept.includes('allergy') || dept.includes('immunology') || name.includes('widal') || name.includes('hiv') || name.includes('hbsag') || name.includes('hcv') || name.includes('culture') || name.includes('crp') || name.includes('dengue') || name.includes('malaria') || name.includes('ra factor')) return 'Microbiology & Serology';
  if (dept.includes('biochemistry') || name.includes('lft') || name.includes('kft') || name.includes('rft') || name.includes('lipid') || name.includes('glucose') || name.includes('sugar') || name.includes('hba1c') || name.includes('creatinine') || name.includes('urea') || name.includes('uric') || name.includes('bilirubin') || name.includes('calcium') || name.includes('electrolyte')) return 'Biochemistry';
  if (dept.includes('microscopy') || name.includes('urine') || name.includes('stool') || name.includes('routine')) return 'Urine & Stool Routine';

  return 'Clinical Pathology';
};

export const INITIAL_CENTERS: CenterBranch[] = [
  {
    id: 'cnt-01',
    name: 'Atlas Diagnostics Center',
    code: 'ATL-MAIN',
    sheetName: 'Orders_ATL_MAIN',
    address: 'Ganesh Market, 106, Ganeshpuri, Khajrana, Indore, Madhya Pradesh 452016',
    phone: '9111246208, 9111246308',
    isMain: true
  }
];

export const INITIAL_TESTS: DiagnosticTestItem[] = (allTestsCatalog as DiagnosticTestItem[]).map(t => ({
  ...t,
  subDepartment: t.subDepartment || resolveTestSubDepartment(t)
}));

// Clean empty operational collections - Zero mock data
export const INITIAL_STAFF: StaffEmployee[] = [];

export const INITIAL_REFERRERS: ReferringDoctor[] = [];

export const INITIAL_PATIENTS: Patient[] = [];

export const INITIAL_ORDERS: DiagnosticOrder[] = [];

export const INITIAL_REPORTS: DiagnosticReport[] = [];

export const INITIAL_EXPENSES: OperatingExpense[] = [];

export const INITIAL_DOCTOR_ROSTER: DoctorRosterItem[] = [];
