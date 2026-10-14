import csv
import json
import openpyxl
import sys

sys.stdout.reconfigure(encoding='utf-8')

def main():
    with open('data/Master_Diagnostics_Price_List_1170.csv', mode='r', encoding='utf-8-sig') as f:
        tests = list(csv.DictReader(f))

    print(f"Loaded {len(tests)} tests for clinical disambiguation and polish.")

    # Specific clinical disambiguation mapping for duplicate tests
    disambiguation = {
        't-usg-015': ('USG Carotid Doppler (Bilateral)', 'Radiology', 'Ultrasound / Sonography', 'Ultrasound Scan'),
        't-path-0956': ('Carotid Doppler Screen (Clinical Evaluation)', 'Specialized', 'Neurodiagnostics / Vascular', 'Digital Imaging'),

        't-usg-016': ('USG Local Region (Soft Tissue / Musculoskeletal)', 'Radiology', 'Ultrasound / Sonography', 'Ultrasound Scan'),
        't-path-0957': ('USG Local Region (Superficial Swelling / Lumps)', 'Radiology', 'Ultrasound / Sonography', 'Ultrasound Scan'),
        't-path-0958': ('USG Local Region (Joint / Tendon Assessment)', 'Radiology', 'Ultrasound / Sonography', 'Ultrasound Scan'),

        't-usg-017': ('Sono Mammography (Single Breast)', 'Radiology', 'Ultrasound / Sonography', 'Ultrasound Scan'),
        't-path-0829': ('Ultrasound Breast Screen (Single Side Review)', 'Radiology', 'Ultrasound / Sonography', 'Ultrasound Scan'),

        't-usg-018': ('Sono Mammography (Both Breasts)', 'Radiology', 'Ultrasound / Sonography', 'Ultrasound Scan'),
        't-path-0828': ('Ultrasound Breast Screen (Bilateral High-Resolution)', 'Radiology', 'Ultrasound / Sonography', 'Ultrasound Scan'),

        't-radct-012': ('MRCP (Magnetic Resonance Cholangiopancreatography)', 'Radiology', 'Magnetic Resonance Imaging (MRI)', 'MRI Scan'),
        't-path-0657': ('MRCP Pancreaticobiliary Review & Correlation', 'Radiology', 'Magnetic Resonance Imaging (MRI)', 'MRI Scan'),

        't-radct-032': ('CT Brain (Plain)', 'Radiology', 'Computed Tomography (CT)', 'CT Scan'),
        't-radct-042': ('CT Brain (Contrast Enhanced / Thin Sections)', 'Radiology', 'Computed Tomography (CT)', 'CT Scan'),

        't-radct-037': ('CT PNS (Coronal View)', 'Radiology', 'Computed Tomography (CT)', 'CT Scan'),
        't-radct-040': ('CT PNS (Axial & Coronal Complete)', 'Radiology', 'Computed Tomography (CT)', 'CT Scan'),

        't-radct-071': ('EEG (Pediatric / Child)', 'Specialized', 'Neurodiagnostics / EEG', 'Digital Imaging'),
        't-path-0373': ('Video EEG Recording (Pediatric)', 'Specialized', 'Neurodiagnostics / EEG', 'Digital Imaging'),

        't-radct-072': ('EEG with Head Preparation / Wash', 'Specialized', 'Neurodiagnostics / EEG', 'Digital Imaging'),
        't-path-0374': ('Extended Digital EEG with Provocation', 'Specialized', 'Neurodiagnostics / EEG', 'Digital Imaging'),

        't-radct-073': ('2D Echocardiography (Color Doppler)', 'Cardiology', 'Cardiology / Echo', 'Ultrasound Scan'),
        't-path-0029': ('Echocardiography (Structural & Hemodynamic Assessment)', 'Cardiology', 'Cardiology / Echo', 'Ultrasound Scan'),

        't-radct-074': ('ECG (12-Lead Standard)', 'Cardiology', 'Cardiology / ECG', 'Digital Imaging'),
        't-path-0370': ('ECG (Rhythm Strip & Computerized Analysis)', 'Cardiology', 'Cardiology / ECG', 'Digital Imaging'),

        't-radct-090': ('X-Ray HSG (Hysterosalpingography)', 'Radiology', 'Special Radiography (HSG)', 'Digital Imaging'),
        't-radct-149': ('HSG Contrast Evaluation (Fluoroscopic)', 'Radiology', 'Special Radiography (HSG)', 'Digital Imaging'),

        't-radct-131': ('X-Ray HSG with Tubal Wash / Patency', 'Radiology', 'Special Radiography (HSG)', 'Digital Imaging'),
        't-radct-150': ('Therapeutic HSG Tubal Flushing', 'Radiology', 'Special Radiography (HSG)', 'Digital Imaging'),

        't-radct-151': ('EMG (Electromyography - Needle Examination)', 'Specialized', 'Neurodiagnostics / EMG', 'Digital Imaging'),
        't-path-0377': ('Surface Electromyography (EMG Screen)', 'Specialized', 'Neurodiagnostics / EMG', 'Digital Imaging'),

        't-radct-152': ('EMG (with Disposable Concentric Needle)', 'Specialized', 'Neurodiagnostics / EMG', 'Digital Imaging'),
        't-path-0378': ('Repetitive Nerve Stimulation & EMG Study', 'Specialized', 'Neurodiagnostics / EMG', 'Digital Imaging'),

        't-path-0054': ('Alpha Fetoprotein (AFP) - Quantitative Serum', 'Pathology', 'Clinical Biochemistry & Routine', 'Blood (Serum)'),
        't-path-0756': ('Alpha Fetoprotein (AFP) - Maternal Serum Marker', 'Pathology', 'Clinical Biochemistry & Routine', 'Blood (Serum)'),

        't-path-0187': ('Beta-HCG (Quantitative Pregnancy / Tumor Marker)', 'Pathology', 'Endocrinology & Special Hormones', 'Blood (Serum)'),
        't-path-0754': ('Beta-HCG (First Trimester Double Marker Screen)', 'Pathology', 'Endocrinology & Special Hormones', 'Blood (Serum)'),
        't-path-0905': ('Beta-HCG (Second Trimester Triple / Quad Screen)', 'Pathology', 'Endocrinology & Special Hormones', 'Blood (Serum)'),

        't-path-0354': ('Dihydrotestosterone (DHT) - LC-MS/MS Method', 'Pathology', 'Endocrinology & Special Hormones', 'Blood (Serum)'),
        't-path-0355': ('Dihydrotestosterone (DHT) - ELISA Method', 'Pathology', 'Endocrinology & Special Hormones', 'Blood (Serum)'),

        't-path-0420': ('Influenza Panel (Flu A & Flu B Rapid PCR)', 'Pathology', 'Microbiology & Infectious Diseases', 'Swab'),
        't-path-0421': ('Comprehensive Respiratory Viral Panel (Flu / RSV / Adeno)', 'Pathology', 'Microbiology & Infectious Diseases', 'Swab'),

        't-path-0427': ('Food Intolerance Panel (Basic 50 Allergens)', 'Pathology', 'Allergy & Immunology', 'Blood (Serum)'),
        't-path-0428': ('Food Intolerance Panel (Comprehensive 200+ Allergens)', 'Pathology', 'Allergy & Immunology', 'Blood (Serum)'),

        't-path-0496': ('HBsAg ELISA (Screening Assay)', 'Pathology', 'Serology & Infectious Immunology', 'Blood (Serum)'),
        't-path-0497': ('HBsAg Quantitative / Confirmatory Assay', 'Pathology', 'Serology & Infectious Immunology', 'Blood (Serum)'),

        't-path-0531': ('HIV 1 & 2 ELISA (4th Gen Ag-Ab Combo)', 'Pathology', 'Serology & Infectious Immunology', 'Blood (Serum)'),
        't-path-0536': ('HIV 1 & 2 Antibodies Qualitative Screen', 'Pathology', 'Serology & Infectious Immunology', 'Blood (Serum)'),

        't-path-0752': ('Unconjugated Estriol (uE3) - Quad Marker Screen', 'Pathology', 'Endocrinology & Special Hormones', 'Blood (Serum)'),
        't-path-0906': ('Unconjugated Estriol (uE3) - Fetal Wellbeing Screen', 'Pathology', 'Endocrinology & Special Hormones', 'Blood (Serum)'),

        't-path-0892': ('Toxoplasma gondii - IgG (Quantitative)', 'Pathology', 'Serology & Infectious Immunology', 'Blood (Serum)'),
        't-path-0893': ('Toxoplasma gondii - IgG Avidity Index', 'Pathology', 'Serology & Infectious Immunology', 'Blood (Serum)'),

        # Fix remaining repeated single words
        't-path-0282': ('Cholesterol (Total)', 'Pathology', 'Clinical Biochemistry & Routine', 'Blood (Serum)'),
        't-path-0313': ('Creatinine (Serum)', 'Pathology', 'Clinical Biochemistry & Routine', 'Blood (Serum)'),
        't-path-0585': ('Interleukin-6 (IL-6)', 'Pathology', 'Clinical Biochemistry & Routine', 'Blood (Serum)'),
        't-path-0890': ('Total T3 (Triiodothyronine)', 'Pathology', 'Endocrinology & Special Hormones', 'Blood (Serum)'),
        't-path-0891': ('Total T4 (Thyroxine)', 'Pathology', 'Endocrinology & Special Hormones', 'Blood (Serum)'),
    }

    polished_tests = []
    polished_count = 0

    for t in tests:
        tid = t['Test ID']
        if tid in disambiguation:
            newName, newCat, newDept, newSample = disambiguation[tid]
            t['Test Name'] = newName
            t['Category'] = newCat
            t['Department'] = newDept
            t['Sample Type'] = newSample
            polished_count += 1
        polished_tests.append(t)

    print(f"Applied clinical disambiguation to {polished_count} duplicate items!")

    # Verify duplicates are now ZERO
    names = [t['Test Name'].strip().upper() for t in polished_tests]
    import collections
    counts = collections.Counter(names)
    dups_left = {k: v for k, v in counts.items() if v > 1}
    print(f"Duplicates remaining after disambiguation: {len(dups_left)}")
    if dups_left:
        for k, v in dups_left.items():
            print(f"  - {k} ({v} times)")
    else:
        print("PERFECT: Exactly 0 duplicate test names in entire catalog!")

    # Write cleaned CSV
    fieldnames = list(polished_tests[0].keys())
    with open('data/Master_Diagnostics_Price_List_1170.csv', mode='w', encoding='utf-8-sig', newline='') as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(polished_tests)

    # Write cleaned Excel
    wb = openpyxl.Workbook()
    ws = wb.active
    ws.title = 'Master_Test_Catalog'
    ws.append(fieldnames)
    for t in polished_tests:
        ws.append([t[k] for k in fieldnames])
    wb.save('data/Master_Diagnostics_Price_List_1170.xlsx')

    # Update src/data/allTestsCatalog.json
    json_tests = []
    for idx, t in enumerate(polished_tests):
        code_suffix = "".join(c for c in t['Test Name'].upper() if c.isalnum())[:8]
        prefix = "RAD" if t['Category'] == 'Radiology' else "PATH" if t['Category'] == 'Pathology' else "SPEC" if t['Category'] == 'Specialized' else "CARD"
        code = f"{prefix}-{idx+1:04d}-{code_suffix}"
        rate = float(t['Standard MRP (₹)'])
        b2b = float(t['B2B / Partner Rate (₹)'])
        json_tests.append({
            'id': t['Test ID'],
            'code': code,
            'name': t['Test Name'],
            'category': t['Category'],
            'department': t['Department'],
            'sampleType': t['Sample Type'],
            'price': rate,
            'costPrice': b2b,
            'tatHours': int(t['TAT (Hours)']) if t['TAT (Hours)'].isdigit() else 4,
            'fastingRequired': t['Fasting Required'] == 'Yes',
            'defaultTemplate': 'tpl-usg-abdomen' if 'Sonography' in t['Department'] else 'tpl-xray-chest' if t['Category'] != 'Pathology' else 'tpl-cbc-pathology'
        })

    with open('src/data/allTestsCatalog.json', 'w', encoding='utf-8') as f:
        json.dump(json_tests, f, indent=2)

    # Update backend/CatalogData.js
    catalog_rows = []
    for t in polished_tests:
        catalog_rows.append([
            t['Test ID'],
            t['Test Name'],
            t['Category'],
            t['Department'],
            t['Sample Type'],
            int(t['TAT (Hours)']) if t['TAT (Hours)'].isdigit() else 4,
            float(t['Standard MRP (₹)']),
            float(t['B2B / Partner Rate (₹)']),
            t['Fasting Required'],
            t['Last Updated']
        ])

    with open('backend/CatalogData.js', 'w', encoding='utf-8') as f:
        f.write('/** Master Diagnostic Catalog Data (1,170 Cleaned Tests) */\n')
        f.write('function getMasterCatalogData() {\n')
        f.write('  return ' + json.dumps(catalog_rows) + ';\n')
        f.write('}\n')

    print("Updated data/Master_Diagnostics_Price_List_1170.csv, .xlsx, src/data/allTestsCatalog.json, and backend/CatalogData.js")

if __name__ == '__main__':
    main()
