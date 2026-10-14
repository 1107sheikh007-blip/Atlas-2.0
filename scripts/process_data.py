import os
import re
import json
import base64
import openpyxl
import pypdf

# 1. Generate src/assets/logo.ts
logo_path = 'data/logo PNG.jpeg'
with open(logo_path, 'rb') as f:
    b64 = base64.b64encode(f.read()).decode('utf-8')

with open('src/assets/logo.ts', 'w', encoding='utf-8') as out:
    out.write('export const ATLAS_LOGO_DATA_URI = "data:image/jpeg;base64,' + b64 + '";\n')
    out.write('export default ATLAS_LOGO_DATA_URI;\n')

print("Created src/assets/logo.ts")

# 2. Parse Sonography list.xlsx
usg_tests = []
wb = openpyxl.load_workbook('data/Sonography list.xlsx')
ws = wb['Sheet1']
rows = list(ws.iter_rows(values_only=True))
idx = 1
for r in rows[1:]:
    if not r or not r[1]:
        continue
    name = str(r[1]).strip()
    rate = int(r[2]) if r[2] is not None else 1000
    code_suffix = re.sub(r'[^A-Z0-9]', '', name.upper())[:8]
    code = f"RAD-USG-{idx:02d}-{code_suffix}"
    usg_tests.append({
        'id': f't-usg-{idx:03d}',
        'code': code,
        'name': name,
        'category': 'Radiology',
        'department': 'Ultrasound / Sonography',
        'sampleType': 'Ultrasound Scan',
        'price': rate,
        'costPrice': max(50, int(rate * 0.2)),
        'tatHours': 2,
        'defaultTemplate': 'tpl-usg-abdomen'
    })
    idx += 1

print(f"Extracted {len(usg_tests)} USG tests from Sonography list.xlsx")

# 3. Parse non-USG tests from Test Details (2).pdf
pdf2_tests = []
reader2 = pypdf.PdfReader('data/Test Details (2).pdf')
non_usg_count = 0

for page_idx, page in enumerate(reader2.pages):
    page_num = page_idx + 1
    if page_num in [6, 7]:  # Skip USG pages
        continue
    text = page.extract_text()
    lines = [l.strip() for l in text.split('\n') if l.strip()]
    
    if page_num == 1:  # MRI
        dept = 'Magnetic Resonance Imaging (MRI)'
        cat = 'Radiology'
        sample = 'MRI Scan'
        tpl = 'tpl-mri-brain'
        prefix = 'RAD-MRI'
    elif page_num == 2:  # CT
        dept = 'Computed Tomography (CT)'
        cat = 'Radiology'
        sample = 'CT Scan'
        tpl = 'tpl-xray-chest'
        prefix = 'RAD-CT'
    elif page_num == 3:  # EEG
        dept = 'Neurodiagnostics / EEG'
        cat = 'Specialized'
        sample = 'Digital Imaging'
        tpl = 'tpl-xray-chest'
        prefix = 'SPEC-EEG'
    elif page_num == 4:  # 2D ECHO
        dept = 'Cardiology / Echo'
        cat = 'Cardiology'
        sample = 'Ultrasound Scan'
        tpl = 'tpl-usg-abdomen'
        prefix = 'CARD-ECHO'
    elif page_num == 5:  # ECG
        dept = 'Cardiology / ECG'
        cat = 'Cardiology'
        sample = 'Digital Imaging'
        tpl = 'tpl-xray-chest'
        prefix = 'CARD-ECG'
    elif page_num in [8, 9]:  # X-RAY
        dept = 'Digital Radiography (X-Ray)'
        cat = 'Radiology'
        sample = 'Digital Imaging'
        tpl = 'tpl-xray-chest'
        prefix = 'RAD-XR'
    elif page_num == 10:  # FNAC
        dept = 'Cytology / FNAC'
        cat = 'Pathology'
        sample = 'Swab'
        tpl = 'tpl-cbc-pathology'
        prefix = 'PATH-FNAC'
    elif page_num == 11:  # NCV
        dept = 'Neurodiagnostics / NCV'
        cat = 'Specialized'
        sample = 'Digital Imaging'
        tpl = 'tpl-xray-chest'
        prefix = 'SPEC-NCV'
    elif page_num == 12:  # HSG
        dept = 'Special Radiography (HSG)'
        cat = 'Radiology'
        sample = 'Digital Imaging'
        tpl = 'tpl-xray-chest'
        prefix = 'RAD-HSG'
    elif page_num == 13:  # EMG
        dept = 'Neurodiagnostics / EMG'
        cat = 'Specialized'
        sample = 'Digital Imaging'
        tpl = 'tpl-xray-chest'
        prefix = 'SPEC-EMG'

    for line in lines[1:]:
        if 'Tests Rank' in line or 'Tests Short Name' in line or 'Tests Category' in line:
            continue
        m = re.search(r'^(.*?)\s+([\d,]+)\s*$', line)
        if m:
            raw_name = m.group(1).strip()
            cleaned_name = re.sub(r'\s+\d+\s+(RADIO\s+MRI|Radio\s+CT|Radiology|Special\s+Test|CARDIOLOGY\s+ECHO|CARDIOLOGY\s+ECG|REPORT\s+ON\s+CYTOLOGY).*$', '', raw_name, flags=re.IGNORECASE).strip()
            cleaned_name = re.sub(r'\s+(Radiology|Special\s+Test|Radio\s+CT|RADIO\s+MRI)$', '', cleaned_name, flags=re.IGNORECASE).strip()
            rate_str = m.group(2).replace(',', '')
            try:
                rate = int(rate_str)
                non_usg_count += 1
                code_suffix = re.sub(r'[^A-Z0-9]', '', cleaned_name.upper())[:8]
                code = f"{prefix}-{non_usg_count:03d}-{code_suffix}"
                pdf2_tests.append({
                    'id': f't-radct-{non_usg_count:03d}',
                    'code': code,
                    'name': cleaned_name,
                    'category': cat,
                    'department': dept,
                    'sampleType': sample,
                    'price': rate,
                    'costPrice': max(50, int(rate * 0.2)),
                    'tatHours': 4 if cat == 'Radiology' else 2,
                    'defaultTemplate': tpl
                })
            except ValueError:
                pass

print(f"Extracted {len(pdf2_tests)} non-USG tests from Test Details (2).pdf")

# 4. Parse Pathology Rate Master.pdf
path_tests = []
reader_path = pypdf.PdfReader('data/Pathology Rate Master.pdf')
lines_path = []
for p in reader_path.pages:
    text = p.extract_text()
    for l in text.split('\n'):
        l = l.strip()
        if l and 'TestOrProfileName Charges' not in l:
            lines_path.append(l)

# Merge wrapped lines
merged_lines = []
buffer = ''
for l in lines_path:
    if buffer:
        buffer += ' ' + l
    else:
        buffer = l
    if re.search(r'\d+\s*$', buffer):
        merged_lines.append(buffer)
        buffer = ''
if buffer:
    merged_lines.append(buffer)

path_count = 0
for l in merged_lines:
    m = re.search(r'^(.*?)\s+([\d,]+)\s*$', l)
    if m:
        raw_name = m.group(1).strip()
        rate = int(m.group(2).replace(',', ''))
        
        dup_m = re.match(r'^(.*?)\s*\(\s*(.*?)\s*\)$', raw_name)
        clean_name = raw_name
        if dup_m:
            left = dup_m.group(1).strip()
            right = dup_m.group(2).strip()
            if left.lower() == right.lower():
                clean_name = left
        
        lower = clean_name.lower()
        if any(w in lower for w in ['urine', 'stool', 'semen', 'fluid']):
            dept = 'Clinical Pathology & Microscopy'
            sample = 'Urine' if 'urine' in lower else 'Swab'
        elif any(w in lower for w in ['cbc', 'tlc', 'dlc', 'esr', 'hemoglobin', 'platelet', 'blood group', 'coagulation', 'pt/inr', 'aptt', 'bleeding']):
            dept = 'Hematology & Hemostasis'
            sample = 'Blood (EDTA)'
        elif any(w in lower for w in ['allergy', 'allergen']):
            dept = 'Allergy & Immunology'
            sample = 'Blood (Serum)'
        elif any(w in lower for w in ['anti', 'antibody', 'hiv', 'hbsag', 'hcv', 'vdrl', 'elisa', 'igg', 'igm', 'ige', 'iga', 'widal', 'dengue', 'malaria', 'typhi', 'covid']):
            dept = 'Serology & Infectious Immunology'
            sample = 'Blood (Serum)'
        elif any(w in lower for w in ['culture', 'sensitivity', 'gram stain', 'afb', 'fungal', 'sputum', 'swab']):
            dept = 'Microbiology & Infectious Diseases'
            sample = 'Swab'
        elif any(w in lower for w in ['biopsy', 'histopathology', 'pap smear', 'cytology', 'fnac']):
            dept = 'Histopathology & Cytology'
            sample = 'Swab'
        elif any(w in lower for w in ['hormone', 'thyroid', 't3', 't4', 'tsh', 'fsh', 'lh', 'prolactin', 'estrogen', 'progesterone', 'testosterone', 'cortisol', 'insulin', 'vitamin', 'ferritin', 'b12', 'd3']):
            dept = 'Endocrinology & Special Hormones'
            sample = 'Blood (Serum)'
        else:
            dept = 'Clinical Biochemistry & Routine'
            sample = 'Blood (Serum)'

        path_count += 1
        code_suffix = re.sub(r'[^A-Z0-9]', '', clean_name.upper())[:8]
        code = f"PATH-{path_count:04d}-{code_suffix}"
        path_tests.append({
            'id': f't-path-{path_count:04d}',
            'code': code,
            'name': clean_name,
            'category': 'Pathology',
            'department': dept,
            'sampleType': sample,
            'price': rate,
            'costPrice': max(30, int(rate * 0.18)),
            'tatHours': 4,
            'defaultTemplate': 'tpl-cbc-pathology'
        })

print(f"Extracted {len(path_tests)} Pathology tests from Pathology Rate Master.pdf")

all_tests = usg_tests + pdf2_tests + path_tests
print(f"Total Master Tests to save: {len(all_tests)}")

with open('src/data/allTestsCatalog.json', 'w', encoding='utf-8') as f:
    json.dump(all_tests, f, indent=2)

print("Saved src/data/allTestsCatalog.json")
