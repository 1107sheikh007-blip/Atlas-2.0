export interface ClinicalTemplate {
  id: string;
  name: string;
  category: 'Radiology' | 'Pathology' | 'Cardiology';
  department: string;
  htmlContent: string;
  defaultImpression: string;
  defaultRecommendations: string;
}

export const CLINICAL_TEMPLATES: ClinicalTemplate[] = [
  {
    id: 'tpl-xray-chest',
    name: 'Digital X-Ray Chest (PA View)',
    category: 'Radiology',
    department: 'Digital Radiography',
    htmlContent: `
      <h3>DIGITAL RADIOGRAPHY - CHEST PA VIEW</h3>
      <p><strong>Clinical Indication:</strong> Persistent cough, breathlessness for 4 days. Rule out pulmonary consolidation.</p>
      <hr/>
      <h4>FINDINGS:</h4>
      <ul>
        <li><strong>Trachea:</strong> Centrally placed with normal caliber and bifurcation.</li>
        <li><strong>Lungs:</strong> Both lung fields are <mark style="background-color: #fef08a;">clear with normal vascular markings</mark>. No focal parenchymal consolidation, cavitation, or active Koch's lesion seen.</li>
        <li><strong>Pleura & Angles:</strong> Bilateral costophrenic and cardiophrenic angles are sharp and clear. No evidence of pleural effusion or pneumothorax.</li>
        <li><strong>Cardiac Silhouette:</strong> Normal in size and configuration. Cardiothoracic (CT) ratio is within normal physiological limits (<strong>&lt; 50%</strong>).</li>
        <li><strong>Hila & Mediastinum:</strong> Bilateral hila appear normal in size and density. Mediastinal contours are unremarkable.</li>
        <li><strong>Bony Thorax & Soft Tissues:</strong> Visualized thoracic cage, ribs, clavicles, and soft tissues demonstrate normal morphology. No fractures or lytic lesions.</li>
      </ul>
    `,
    defaultImpression: 'No significant acute cardiopulmonary abnormality detected on current PA view radiograph.',
    defaultRecommendations: 'Clinical correlation recommended. Repeat examination if symptoms persist.'
  },
  {
    id: 'tpl-usg-abdomen',
    name: 'Ultrasound (USG) Whole Abdomen & Pelvis',
    category: 'Radiology',
    department: 'Sonography / USG',
    htmlContent: `
      <h3>ULTRASONOGRAPHY OF WHOLE ABDOMEN & PELVIS</h3>
      <p><strong>Clinical Indication:</strong> Epigastric pain, dyspepsia.</p>
      <hr/>
      <h4>ORGAN SPECIFIC FINDINGS:</h4>
      <ul>
        <li><strong>LIVER:</strong> Normal in size (13.4 cm). Normal parenchymal echotexture with smooth surface margins. Intrahepatic biliary radicals (IHBR) are not dilated. No focal space occupying lesion (SOL) detected. Portal vein diameter is normal (9.8 mm).</li>
        <li><strong>GALL BLADDER:</strong> Well distended with thin, uniform walls (2.1 mm). <mark style="background-color: #bbf7d0;">Lumen is anechoic with no evidence of calculus</mark>, sludge, or polyp. Common Bile Duct (CBD) is normal in caliber (4.2 mm).</li>
        <li><strong>PANCREAS:</strong> Visualized head, body, and tail appear normal in size and homogenous echotexture. Pancreatic duct is not dilated.</li>
        <li><strong>SPLEEN:</strong> Normal in size (9.6 cm) and uniform echogenicity. No focal lesion or splenomegaly. Splenic vein is normal.</li>
        <li><strong>KIDNEYS:</strong> 
          <br/>• <em>Right Kidney:</em> Measures 9.8 x 4.2 cm. Normal cortical thickness (14 mm) and preserved corticomedullary differentiation. No calculus, hydronephrosis, or mass lesion.
          <br/>• <em>Left Kidney:</em> Measures 10.1 x 4.4 cm. Normal cortical thickness (15 mm). No hydronephrosis or nephrolithiasis.
        </li>
        <li><strong>URINARY BLADDER:</strong> Adequately distended with regular, thin walls. No intravesical calculus, diverticulum, or mass lesion seen. Pre-void volume: 280 ml, Post-void residual: 12 ml (insignificant).</li>
        <li><strong>RETROPERITONEUM / BOWEL:</strong> No retroperitoneal or mesenteric lymphadenopathy. No free fluid / ascites seen in peritoneal or pelvic cavity.</li>
      </ul>
    `,
    defaultImpression: 'Normal ultrasound examination of the whole abdomen and pelvis. No sonological evidence of cholelithiasis, nephrolithiasis, or organomegaly.',
    defaultRecommendations: 'Correlate with clinical and biochemical parameters.'
  },
  {
    id: 'tpl-mri-brain',
    name: 'MRI Brain (Plain + Contrast Screen)',
    category: 'Radiology',
    department: 'Magnetic Resonance Imaging (1.5T / 3.0T)',
    htmlContent: `
      <h3>MAGNETIC RESONANCE IMAGING (MRI) - BRAIN</h3>
      <p><strong>Protocol:</strong> Axial T1, T2, FLAIR, DWI, ADC, Coronal T2, Sagittal T1 & SWI sequences.</p>
      <hr/>
      <h4>DETAILED FINDINGS:</h4>
      <ul>
        <li><strong>Brain Parenchyma:</strong> Cerebral hemispheres reveal normal gray-white matter differentiation. No focal areas of altered signal intensity noted in cortex or subcortical white matter.</li>
        <li><strong>Diffusion Weighted Imaging (DWI):</strong> <mark style="background-color: #fed7aa;">No evidence of acute diffusion restriction</mark> or cytotoxic edema to suggest acute infarct.</li>
        <li><strong>Vascular / SWI:</strong> No blooming on Gradient/SWI images to suggest micro-hemorrhage or cavernoma. Major intracranial flow voids are preserved.</li>
        <li><strong>Ventricular System:</strong> Lateral, third, and fourth ventricles are normal in size, shape, and symmetry for age. Basal cisterns and cortical sulci are within normal limits.</li>
        <li><strong>Midline Structures:</strong> Corpus callosum, basal ganglia, thalamus, brainstem, and cerebellar hemispheres show normal morphology and signal intensity. Midline shift is absent.</li>
        <li><strong>Sella & Orbits:</strong> Sellar, parasellar regions, pituitary gland, and bilateral orbits appear unremarkable.</li>
        <li><strong>Paranasal Sinuses & Mastoids:</strong> Visualized paranasal sinuses and mastoid air cells show clear aeration without mucosal thickening.</li>
      </ul>
    `,
    defaultImpression: 'Normal MRI Brain study. No evidence of acute ischemic stroke, intracranial hemorrhage, mass effect, or demyelinating pathology.',
    defaultRecommendations: 'Follow up as clinically indicated.'
  },
  {
    id: 'tpl-cbc-pathology',
    name: 'Complete Blood Count (CBC) with ESR & Indices',
    category: 'Pathology',
    department: 'Hematology',
    htmlContent: `
      <h3>HAEMATOLOGY REPORT - COMPLETE BLOOD COUNT (CBC)</h3>
      <table style="width: 100%; border: 1px solid #cbd5e1; text-align: left;">
        <thead>
          <tr style="background-color: #f1f5f9;">
            <th style="padding: 8px; border: 1px solid #cbd5e1;">Test Parameter</th>
            <th style="padding: 8px; border: 1px solid #cbd5e1;">Observed Value</th>
            <th style="padding: 8px; border: 1px solid #cbd5e1;">Unit</th>
            <th style="padding: 8px; border: 1px solid #cbd5e1;">Reference Range</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style="padding: 6px 8px; border: 1px solid #cbd5e1;"><strong>Haemoglobin (Hb)</strong></td>
            <td style="padding: 6px 8px; border: 1px solid #cbd5e1; color: #0284c7; font-weight: bold;">14.2</td>
            <td style="padding: 6px 8px; border: 1px solid #cbd5e1;">g/dL</td>
            <td style="padding: 6px 8px; border: 1px solid #cbd5e1;">13.0 - 17.0 (Male)</td>
          </tr>
          <tr>
            <td style="padding: 6px 8px; border: 1px solid #cbd5e1;"><strong>Total Leucocyte Count (TLC)</strong></td>
            <td style="padding: 6px 8px; border: 1px solid #cbd5e1; font-weight: bold;">7,400</td>
            <td style="padding: 6px 8px; border: 1px solid #cbd5e1;">cells/cu.mm</td>
            <td style="padding: 6px 8px; border: 1px solid #cbd5e1;">4,000 - 11,000</td>
          </tr>
          <tr>
            <td style="padding: 6px 8px; border: 1px solid #cbd5e1;"><strong>RBC Count</strong></td>
            <td style="padding: 6px 8px; border: 1px solid #cbd5e1;">4.85</td>
            <td style="padding: 6px 8px; border: 1px solid #cbd5e1;">mil/cu.mm</td>
            <td style="padding: 6px 8px; border: 1px solid #cbd5e1;">4.50 - 5.50</td>
          </tr>
          <tr>
            <td style="padding: 6px 8px; border: 1px solid #cbd5e1;"><strong>Platelet Count</strong></td>
            <td style="padding: 6px 8px; border: 1px solid #cbd5e1; font-weight: bold;">245,000</td>
            <td style="padding: 6px 8px; border: 1px solid #cbd5e1;">/cu.mm</td>
            <td style="padding: 6px 8px; border: 1px solid #cbd5e1;">150,000 - 450,000</td>
          </tr>
          <tr>
            <td style="padding: 6px 8px; border: 1px solid #cbd5e1;">Neutrophils</td>
            <td style="padding: 6px 8px; border: 1px solid #cbd5e1;">62</td>
            <td style="padding: 6px 8px; border: 1px solid #cbd5e1;">%</td>
            <td style="padding: 6px 8px; border: 1px solid #cbd5e1;">40 - 70</td>
          </tr>
          <tr>
            <td style="padding: 6px 8px; border: 1px solid #cbd5e1;">Lymphocytes</td>
            <td style="padding: 6px 8px; border: 1px solid #cbd5e1;">30</td>
            <td style="padding: 6px 8px; border: 1px solid #cbd5e1;">%</td>
            <td style="padding: 6px 8px; border: 1px solid #cbd5e1;">20 - 40</td>
          </tr>
          <tr>
            <td style="padding: 6px 8px; border: 1px solid #cbd5e1;">Eosinophils</td>
            <td style="padding: 6px 8px; border: 1px solid #cbd5e1;">04</td>
            <td style="padding: 6px 8px; border: 1px solid #cbd5e1;">%</td>
            <td style="padding: 6px 8px; border: 1px solid #cbd5e1;">01 - 06</td>
          </tr>
          <tr>
            <td style="padding: 6px 8px; border: 1px solid #cbd5e1;">Monocytes</td>
            <td style="padding: 6px 8px; border: 1px solid #cbd5e1;">04</td>
            <td style="padding: 6px 8px; border: 1px solid #cbd5e1;">%</td>
            <td style="padding: 6px 8px; border: 1px solid #cbd5e1;">02 - 08</td>
          </tr>
          <tr>
            <td style="padding: 6px 8px; border: 1px solid #cbd5e1;"><strong>ESR (Westergren Method)</strong></td>
            <td style="padding: 6px 8px; border: 1px solid #cbd5e1;">12</td>
            <td style="padding: 6px 8px; border: 1px solid #cbd5e1;">mm at 1st hr</td>
            <td style="padding: 6px 8px; border: 1px solid #cbd5e1;">0 - 15 (Male)</td>
          </tr>
        </tbody>
      </table>
      <p style="margin-top: 10px;"><strong>Peripheral Blood Smear:</strong> RBCs are normocytic and normochromic. WBC morphology is normal. Platelets adequate on smear.</p>
    `,
    defaultImpression: 'Normocytic Normochromic blood picture. Hemogram parameters within reference biological intervals.',
    defaultRecommendations: 'Please correlate with clinical presentation.'
  },
  {
    id: 'tpl-lipid-profile',
    name: 'Lipid Profile Screen (Cardiovascular Risk)',
    category: 'Pathology',
    department: 'Clinical Biochemistry',
    htmlContent: `
      <h3>BIOCHEMISTRY REPORT - LIPID PROFILE (FASTING)</h3>
      <table style="width: 100%; border: 1px solid #cbd5e1; text-align: left;">
        <thead>
          <tr style="background-color: #f1f5f9;">
            <th style="padding: 8px; border: 1px solid #cbd5e1;">Parameter</th>
            <th style="padding: 8px; border: 1px solid #cbd5e1;">Result</th>
            <th style="padding: 8px; border: 1px solid #cbd5e1;">Unit</th>
            <th style="padding: 8px; border: 1px solid #cbd5e1;">Desirable Range</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style="padding: 6px 8px; border: 1px solid #cbd5e1;"><strong>Total Cholesterol</strong></td>
            <td style="padding: 6px 8px; border: 1px solid #cbd5e1; font-weight: bold;">184</td>
            <td style="padding: 6px 8px; border: 1px solid #cbd5e1;">mg/dL</td>
            <td style="padding: 6px 8px; border: 1px solid #cbd5e1;">&lt; 200 (Desirable)</td>
          </tr>
          <tr>
            <td style="padding: 6px 8px; border: 1px solid #cbd5e1;"><strong>Triglycerides</strong></td>
            <td style="padding: 6px 8px; border: 1px solid #cbd5e1; font-weight: bold;">138</td>
            <td style="padding: 6px 8px; border: 1px solid #cbd5e1;">mg/dL</td>
            <td style="padding: 6px 8px; border: 1px solid #cbd5e1;">&lt; 150 (Normal)</td>
          </tr>
          <tr>
            <td style="padding: 6px 8px; border: 1px solid #cbd5e1;"><strong>HDL Cholesterol (Good)</strong></td>
            <td style="padding: 6px 8px; border: 1px solid #cbd5e1; color: #16a34a; font-weight: bold;">48</td>
            <td style="padding: 6px 8px; border: 1px solid #cbd5e1;">mg/dL</td>
            <td style="padding: 6px 8px; border: 1px solid #cbd5e1;">&gt; 40 (Male), &gt; 50 (Female)</td>
          </tr>
          <tr>
            <td style="padding: 6px 8px; border: 1px solid #cbd5e1;"><strong>LDL Cholesterol (Calculated)</strong></td>
            <td style="padding: 6px 8px; border: 1px solid #cbd5e1;">108</td>
            <td style="padding: 6px 8px; border: 1px solid #cbd5e1;">mg/dL</td>
            <td style="padding: 6px 8px; border: 1px solid #cbd5e1;">&lt; 100 (Optimal)</td>
          </tr>
          <tr>
            <td style="padding: 6px 8px; border: 1px solid #cbd5e1;"><strong>VLDL Cholesterol</strong></td>
            <td style="padding: 6px 8px; border: 1px solid #cbd5e1;">27.6</td>
            <td style="padding: 6px 8px; border: 1px solid #cbd5e1;">mg/dL</td>
            <td style="padding: 6px 8px; border: 1px solid #cbd5e1;">&lt; 30</td>
          </tr>
          <tr>
            <td style="padding: 6px 8px; border: 1px solid #cbd5e1;">Total Chol / HDL Ratio</td>
            <td style="padding: 6px 8px; border: 1px solid #cbd5e1;">3.83</td>
            <td style="padding: 6px 8px; border: 1px solid #cbd5e1;">Ratio</td>
            <td style="padding: 6px 8px; border: 1px solid #cbd5e1;">3.3 - 4.4</td>
          </tr>
        </tbody>
      </table>
    `,
    defaultImpression: 'Lipid profile parameters within desirable reference limits.',
    defaultRecommendations: 'Maintain healthy diet and regular cardiovascular exercise routine.'
  },
  {
    id: 'tpl-lft-biochem',
    name: 'Liver Function Test (LFT) Complete Panel',
    category: 'Pathology',
    department: 'Biochemistry',
    htmlContent: `
      <h3>LIVER FUNCTION TEST (LFT)</h3>
      <table style="width: 100%; border: 1px solid #cbd5e1; text-align: left;">
        <thead>
          <tr style="background-color: #f1f5f9;">
            <th style="padding: 8px; border: 1px solid #cbd5e1;">Investigation</th>
            <th style="padding: 8px; border: 1px solid #cbd5e1;">Result</th>
            <th style="padding: 8px; border: 1px solid #cbd5e1;">Unit</th>
            <th style="padding: 8px; border: 1px solid #cbd5e1;">Biological Reference</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style="padding: 6px 8px; border: 1px solid #cbd5e1;"><strong>Bilirubin - Total</strong></td>
            <td style="padding: 6px 8px; border: 1px solid #cbd5e1; font-weight: bold;">0.85</td>
            <td style="padding: 6px 8px; border: 1px solid #cbd5e1;">mg/dL</td>
            <td style="padding: 6px 8px; border: 1px solid #cbd5e1;">0.2 - 1.2</td>
          </tr>
          <tr>
            <td style="padding: 6px 8px; border: 1px solid #cbd5e1;">Bilirubin - Direct</td>
            <td style="padding: 6px 8px; border: 1px solid #cbd5e1;">0.22</td>
            <td style="padding: 6px 8px; border: 1px solid #cbd5e1;">mg/dL</td>
            <td style="padding: 6px 8px; border: 1px solid #cbd5e1;">0.0 - 0.3</td>
          </tr>
          <tr>
            <td style="padding: 6px 8px; border: 1px solid #cbd5e1;"><strong>SGOT / AST</strong></td>
            <td style="padding: 6px 8px; border: 1px solid #cbd5e1;">28.0</td>
            <td style="padding: 6px 8px; border: 1px solid #cbd5e1;">U/L</td>
            <td style="padding: 6px 8px; border: 1px solid #cbd5e1;">10 - 40</td>
          </tr>
          <tr>
            <td style="padding: 6px 8px; border: 1px solid #cbd5e1;"><strong>SGPT / ALT</strong></td>
            <td style="padding: 6px 8px; border: 1px solid #cbd5e1; font-weight: bold;">32.4</td>
            <td style="padding: 6px 8px; border: 1px solid #cbd5e1;">U/L</td>
            <td style="padding: 6px 8px; border: 1px solid #cbd5e1;">10 - 45</td>
          </tr>
          <tr>
            <td style="padding: 6px 8px; border: 1px solid #cbd5e1;"><strong>Alkaline Phosphatase (ALP)</strong></td>
            <td style="padding: 6px 8px; border: 1px solid #cbd5e1;">96.0</td>
            <td style="padding: 6px 8px; border: 1px solid #cbd5e1;">U/L</td>
            <td style="padding: 6px 8px; border: 1px solid #cbd5e1;">40 - 130</td>
          </tr>
          <tr>
            <td style="padding: 6px 8px; border: 1px solid #cbd5e1;">Total Protein</td>
            <td style="padding: 6px 8px; border: 1px solid #cbd5e1;">7.4</td>
            <td style="padding: 6px 8px; border: 1px solid #cbd5e1;">g/dL</td>
            <td style="padding: 6px 8px; border: 1px solid #cbd5e1;">6.4 - 8.3</td>
          </tr>
          <tr>
            <td style="padding: 6px 8px; border: 1px solid #cbd5e1;">Serum Albumin</td>
            <td style="padding: 6px 8px; border: 1px solid #cbd5e1;">4.5</td>
            <td style="padding: 6px 8px; border: 1px solid #cbd5e1;">g/dL</td>
            <td style="padding: 6px 8px; border: 1px solid #cbd5e1;">3.5 - 5.0</td>
          </tr>
        </tbody>
      </table>
    `,
    defaultImpression: 'Hepatic enzymes and synthetic liver functions are within normal physiological range.',
    defaultRecommendations: 'Correlate clinically.'
  }
,
  {
    id: "tpl-ap-obs-anomaly-scan",
    name: "AP OBS ANOMALY SCAN",
    category: "Radiology",
    department: "Obstetric Ultrasound",
    htmlContent: "<h3>OBSTETRIC ANOMALY SCAN</h3>\n<ul>\n  <li>Clinical LMP:                        Avg. Gestation:  Wks  Days                           Clinical EDD:  /01/2024</li>\n  <li>Single live intrauterine fetus seen with Changing presentation at the time of scanning.</li>\n  <li>Fetal cardiac activity is regular ( FHR = \u2026    bpm ). Fetal movements are normal.</li>\n  <li>Placenta is \u2026\u2026.. with grade \"    \"  maturity. Liquor is adequate.</li>\n  <li>The fetal growth parameters are as follow :</li>\n  <li>Parameters</li>\n  <li>Value (cm)</li>\n  <li>Weeks</li>\n  <li>Days</li>\n  <li>Bi-parietal Diameter :</li>\n  <li>Head Circumference :</li>\n  <li>Abdominal Circumference:</li>\n  <li>Femoral Length:</li>\n  <li>Tibial Length:</li>\n  <li>Humerus Length:</li>\n  <li>Ulnar Length:</li>\n  <li>Outer Orbital Distance:</li>\n  <li>Transverse Cerebellar Distance:</li>\n  <li>Average gestation by USG:     wks     days  +/-  1 wk</li>\n  <li>EDD [USG]:</li>\n  <li>Fetal weight:       grams +/- 10 %</li>\n  <li>FETAL MORPHOLOGY:</li>\n  <li>FETAL CNS</li>\n  <li>Fetal skull bones are normal.</li>\n  <li>Midline echo is seen.</li>\n  <li>Cavum Septum pellucidum (CSP) is visualized</li>\n  <li>The atriums of the lateral ventricles are normal. (Normal: &lt;10mm)</li>\n  <li>Trans cerebellar diameter measures        cm</li>\n  <li>Cisterna magna measures      mm and is normal. (Normal = 2-11mm)</li>\n  <li>FETAL SPINE</li>\n  <li>Fetal spine appears grossly normal.</li>\n  <li>Curvatures appear normal.</li>\n  <li>Skin cover over the vertebrae is seen.</li>\n  <li>FETAL FACE</li>\n  <li>Facial profile appears normal.</li>\n  <li>Nasal bone seen.</li>\n  <li>Outer orbital diameter (OOD) =    cm</li>\n  <li>Visualized orbits, lips and mandible appear normal.</li>\n  <li>FETAL NECK</li>\n  <li>Cystic/ solid lesion not seen.</li>\n  <li>FETALTHORAX</li>\n  <li>Cardiac is four chambered.</li>\n  <li>Cardiac apex is to the left.</li>\n  <li>Cardiac outflow tracts (LVOT and RVOT) appear normal.</li>\n  <li>The lungs are echogenic and normal. No e/o diaphragmatic hernia / pleural or pericardial effusion.</li>\n  <li>The diaphragm appears normal.</li>\n  <li>Situs normal.</li>\n  <li>FETALABDOMEN</li>\n  <li>The fetal stomach bubble appears normal and seen on the left side.</li>\n  <li>Right kidney is visualized and appears normal. No significant calyceal dilatation.</li>\n  <li>Left kidney is visualized and appears normal. No significant calyceal dilatation.</li>\n  <li>Urinary bladder is visualized.</li>\n  <li>Anterior abdominal wall is intact.</li>\n  <li>FETAL EXTREMITIES</li>\n  <li>The limbs are normal to the visible extent at the time of study.</li>\n  <li>Length of long bones of all 4 limbs corresponding to gestational age.</li>\n  <li>Anomalies of toes and fingers cannot be entirely ruled out.</li>\n  <li>UMBILICAL CORD</li>\n  <li>Triple vessel and shows normal vascularity.</li>\n  <li>PI of bilateral uterine arteries are 0.95 & 0.86 on right & left side respectively and are normal for gestational age.</li>\n  <li>Cervical length is normal =       cm.</li>\n</ul>",
    defaultImpression: "SINGLE LIVE INTRAUTERINE FETUS OF MGA    WKS     DAYS WITH CHANGING PRESENTATION AT THE TIME OF SCANNING. NO SONOLOGICALLY DETECTABLE ANOMALIES SEEN AT PRESENT.",
    defaultRecommendations: "FETAL ECHOCARDIOGRAPHY IS ADVISED TO RULE OUT CARDIAC ANOMALIES. Please note that all anomalies cannot be detected all the times due to various technical and circumstantial reasons like gestation period, fetal position, quantity of liquor, fetal movements, maternal abdominal wall thickness and tissue echogenicity. Therefore All Congenital anomalies CANNOT BE DETECTED BY ULTRASONOGRAPHY esp. cardiac, ear, spina bifida occulta, Mental retardation, metabolic anomalies. Fetal cardiac Doppler is done separately to rule out cardiac anomalies. (I Dr.    declare that while conducting the sonography Mrs I have neither detected nor disclosed the sex of the fetus to anybody in any manner.)"
  },
  {
    id: "tpl-color-doppler-lower-limb-venous-system-4",
    name: "COLOR DOPPLER LOWER LIMB VENOUS SYSTEM (4)",
    category: "Radiology",
    department: "Color Doppler",
    htmlContent: "<h3>COLOR SPECTRAL DOPPLER RIGHT  LOWER LIMB VENOUS SYSTEM</h3>\n<ul>\n  <li>B - Mode & colour doppler study of venous system of lower limb performed with high frequency (7 to 11 MHz) linear probe.</li>\n  <li>Right CFV, SFV, DFV, Popliteal, ATV, PTV, Peroneal were assessed.</li>\n  <li>All these vessels shows normal flow on color doppler and are normally compressible.</li>\n  <li>Right GSV appear normal in course and caliber. Right SFJ is competent.</li>\n  <li>Right SSV appears normal in course and caliber. Right SPJ is competent normal.</li>\n</ul>",
    defaultImpression: "Normal right lower limb venous doppler study .",
    defaultRecommendations: ".- clinical correlation and further evaluation suggested.. DR"
  },
  {
    id: "tpl-echo-normal-formate-dr-arpit-sir",
    name: "ECHO NORMAL FORMATE DR ARPIT SIR",
    category: "Cardiology",
    department: "2D Echocardiography",
    htmlContent: "<h3>ECHOCARDIOGRAPHY REPORT</h3>\n<ul>\n</ul>",
    defaultImpression: "Concentric Mild LVH Grade I LV Diastolic Dysfunction. NORMAL SIZED CARDIAC CHAMBER. NO LV RWMA AT REST. LVEF: 61 % NORMAL CARDIAC VALVES NO E/O PAH 2D ECHOCARDIOGRAPHY STUDY: Mitral valve normal, No evidence of mitral valve prolapse / SAM. Aortic valve has three cusps and are not thickened and closure line is central. The opening of aortic valve is not restricted. Movement of septum, anterior, posterior, inferior wall is normal. Global LVEF: 61 % Aorta and pulmonary arteries are normal Intertrial and interventricular septum are intact. Right ventricle systolic function is normal. MODE MEASUREMENTS : VALUES NORMAL RANGE Left atrium (ed) 2.1 2-4     cms Aorta  Root Diameter (ed) 2.2 2-4        cm LV Dimension Diastole Systole 4.4 3.0 3.5 \u2013 5.6 cms 2.4 cms LV Posterior Wall Diastole Systole 1.2 2.0 0.6 \u2013 1.2 cms 0.9-1.6 cms IVS                 Diastole Systole 1.3 1.7 0.6  - 1.2  cms 0.9 \u2013 1.6 cms Ejection Fraction 61  % 50 \u2013 80    %",
    defaultRecommendations: "Clinical correlation and follow-up recommended."
  },
  {
    id: "tpl-pseudo-gynecomastia",
    name: "PSEUDO GYNECOMASTIA",
    category: "Radiology",
    department: "Sonography / USG",
    htmlContent: "<h3>SONOGRAPHY \u2013 LOCAL REGION</h3>\n<ul>\n  <li>No focal lesion seen in bilateral anterior chest wall region.</li>\n  <li>Bilateral retroareolar region appears normal, however uniformly mildly thickened fatty plane noted likely pseudo gynecomastia.</li>\n  <li>No e/o any subareolar hypoechoic nodule, disc or fan shaped glandular tissue noted.</li>\n  <li>No e/o any fibrofatty or glandular proliferation noted.</li>\n  <li>No evidence of solid / cystic lesion noted.</li>\n  <li>No evidence of any collection/abscess noted.</li>\n  <li>No evidence of any inflammation & soft tissue thickening.</li>\n</ul>",
    defaultImpression: "No significant abnormality detected on current sonographic examination.",
    defaultRecommendations: "ice - Clinical correlation and further evaluation suggested."
  },
  {
    id: "tpl-right-upper-limb-arterial-system",
    name: "RIGHT UPPER LIMB ARTERIAL SYSTEM.",
    category: "Radiology",
    department: "Sonography / USG",
    htmlContent: "<h3>B - MODE & COLOUR DOPPLER STUDY OF ARTERIAL SYSTEM OF RIGHT UPPER LIMB PERFORMED WITH HIGH FREQUENCY (7 TO 11 MHZ) LINEAR PROBE.</h3>\n<ul>\n  <li>Findings:-</li>\n  <li>Right subclavian, axillary, brachial, radial and ulnar artery shows normal colour flow, spectrum and velocity.</li>\n  <li>No evidence of thrombus noted.</li>\n</ul>",
    defaultImpression: "Normal right\u00a0upper limb arterial doppler study.",
    defaultRecommendations: "Clinical correlation and further evaluation. DR"
  },
  {
    id: "tpl-transcranial",
    name: "TRANSCRANIAL",
    category: "Radiology",
    department: "Sonography / USG",
    htmlContent: "<h3>TRANSCRANIAL USG</h3>\n<ul>\n  <li>Cerebral hemispheres are symmetrical with normal echotexture.</li>\n  <li>No germinal matrix / intraventricular hemorrhage seen.</li>\n  <li>Ventricular system normal in size and configuration.</li>\n  <li>Periventricular white matter appears normal.</li>\n  <li>Midline structures are central.</li>\n  <li>Posterior fossa structures are normal.</li>\n  <li>No extra axial colletion.</li>\n</ul>",
    defaultImpression: "No remarkable abnormalities.",
    defaultRecommendations: "ice -\u00a0\u00a0\u00a0 Clinical correlation."
  },
  {
    id: "tpl-twing-obst-growth-scan",
    name: "TWING OBST GROWTH SCAN",
    category: "Radiology",
    department: "Obstetric Ultrasound",
    htmlContent: "<h3>OBSTETRIC SONOGRAPHY</h3>\n<ul>\n  <li>LMP- 30/01/2026           GA BY LMP-  31 weeks 6 days         EDD BY LMP \u2013 06/11/2026</li>\n  <li>Gravid uterus reveal twin live fetuses with fetus A in transverse presentation and fetus B is cephalic (at present scan) lie with following parameters (monochronic diamniotic)</li>\n  <li>Fetus A  is towards maternal right.</li>\n  <li>FETUS \u2013A</li>\n  <li>BPD</li>\n  <li>7.9 cm</li>\n  <li>32 wks</li>\n  <li>0 days</li>\n  <li>HC</li>\n  <li>29.2 cm</li>\n  <li>32 wks</li>\n  <li>2 days</li>\n  <li>AC</li>\n  <li>27.1 cm</li>\n  <li>31 wks</li>\n  <li>2 days</li>\n  <li>FL</li>\n  <li>6.1 cm</li>\n  <li>31 wks</li>\n  <li>5 days</li>\n  <li>MGA: 31 wks 6 day</li>\n  <li>Fetal cardiac activity is seen & is regular FHR \u2013 137 Bpm. Fetal movements are seen.</li>\n  <li>Placenta is anterior more towards right & grade II is away from os. Internal os is closed.</li>\n  <li>Estimated fetal Wt. :  1789 gm ( +/-10 %)</li>\n  <li>FETUS \u2013 B</li>\n  <li>BPD</li>\n  <li>8.0 cm</li>\n  <li>32 wks</li>\n  <li>1 days</li>\n  <li>HC</li>\n  <li>28.9 cm</li>\n  <li>31 wks</li>\n  <li>6 days</li>\n  <li>AC</li>\n  <li>27.2 cm</li>\n  <li>31 wks</li>\n  <li>2 days</li>\n  <li>FL</li>\n  <li>6.1 cm</li>\n  <li>31 wks</li>\n  <li>5 days</li>\n  <li>MGA :  31 wks  6 day</li>\n  <li>Fetal cardiac activity is seen & is regular FHR \u2013 136 Bpm. Fetal movements are seen.</li>\n  <li>.</li>\n  <li>Placenta is anterior more towards right & grade II is away from os. Internal os is closed.</li>\n  <li>Estimated fetal Wt. : 1796   gm ( +/-10 %)</li>\n  <li>Amniotic fluid is adequate for gestational age. (AFI \u2013 15-16 cm).</li>\n  <li>Cervical length is normal 4 cm.</li>\n  <li>EDD by USG \u2013 06/11/2026</li>\n</ul>",
    defaultImpression: "Twin live intrauterine fetuses of about 31 weeks 6 day (+/- 1 week) (FETUS \u2013A MATERNAL RIGHT) and  31 weeks 6  day (+/- 1 week)  (FETUS \u2013B  MATERNAL LEFT )  gestational age.",
    defaultRecommendations: "ice follow up. This is not anomaly scan. (It must be noted that detailed fetal anatomy may not always be visible due to technical difficulties related to fetal position, amniotic fluid volume, fetal movement and abdominal wall thickness . Therefore all fetal anomalies may not necessarily be detected at every examination). I, Dr NIVEDITA PRAJAPATI  declare that while conducting USG on MRS SANA HUSSAIN I have neither detected nor disclosed the sex of her fetus to anybody in any manner."
  },
  {
    id: "tpl-twins-obst-doppler",
    name: "TWINS OBST DOPPLER",
    category: "Radiology",
    department: "Color Doppler",
    htmlContent: "<h3>COLOR DOPPLER OBSTETRICS SONOGRAPH</h3>\n<ul>\n  <li>LMP-    10/12/2023            GA BY LMP-  35 weeks 5 days                 EDD BY LMP \u2013 15/09/2024</li>\n  <li>Gravid uterus reveal twin live fetuses with fetus A in cephalic presentation and  fetus B is transverse lie with following parameters:</li>\n  <li>FETUS \u2013A (MATERNAL LEFT)</li>\n  <li>BPD</li>\n  <li>8.9 cm</li>\n  <li>36 wks</li>\n  <li>0 days</li>\n  <li>HC</li>\n  <li>32.1 cm</li>\n  <li>36 wks</li>\n  <li>2 days</li>\n  <li>AC</li>\n  <li>30.3 cm</li>\n  <li>34 wks</li>\n  <li>2 days</li>\n  <li>FL</li>\n  <li>6.9 cm</li>\n  <li>35 wks</li>\n  <li>3 days</li>\n  <li>MGA : 35 wks  4 day</li>\n  <li>Fetal cardiac activity is seen & is regular FHR \u2013 154 Bpm. Fetal movements are seen.</li>\n  <li>Amniotic fluid is adequate (AFI  - 6-7 cm) reaching lower limit of normal.</li>\n  <li>Placenta is Anterior & grade II is away from os. Internal os is closed.</li>\n  <li>Cervical length is normal.</li>\n  <li>Estimated fetal Wt. :  2386 gm ( +/-10 %)</li>\n  <li>FETUS \u2013 B  (MATERNAL RIGHT)</li>\n  <li>BPD</li>\n  <li>8.6 cm</li>\n  <li>35 wks</li>\n  <li>0 days</li>\n  <li>HC</li>\n  <li>31.5 cm</li>\n  <li>35 wks</li>\n  <li>2 days</li>\n  <li>AC</li>\n  <li>30.7 cm</li>\n  <li>34  wks</li>\n  <li>5 days</li>\n  <li>FL</li>\n  <li>6.8 cm</li>\n  <li>35 wks</li>\n  <li>3 days</li>\n  <li>MGA :  35 wks  1 day</li>\n  <li>Fetal cardiac activity is seen & is regular FHR \u2013 148 Bpm. Fetal movements are seen.</li>\n  <li>Amniotic fluid is adequate (AFI  - 7-8 cm) .</li>\n  <li>Placenta is Anterior & grade II is away from os. Internal os is closed.</li>\n  <li>Estimated fetal Wt. : 2396   gm ( +/-10 %)</li>\n  <li>DOPPLER</li>\n  <li>Uterine, umbilical & middle cerebral arteries reveal normal wave form & indices</li>\n  <li>for gestational age.</li>\n  <li>Maternal \u2013</li>\n  <li>Uterine                                                  Rt :-</li>\n  <li>0.56</li>\n  <li>0.41</li>\n  <li>Normal</li>\n  <li>Lt :-</li>\n  <li>0.48</li>\n  <li>0.37</li>\n  <li>Normal</li>\n  <li>Fetus \u2013A</li>\n  <li>PI</li>\n  <li>RI</li>\n  <li>Percentile</li>\n  <li>Umbilical</li>\n  <li>0.86</li>\n  <li>0.56</li>\n  <li>Normal</li>\n  <li>Middle cerebral artery</li>\n  <li>1.86</li>\n  <li>0.70</li>\n  <li>Normal</li>\n  <li>CPR:  &gt;2.1 , (Normal)</li>\n  <li>Ductus venous show normal flow and spectrum.</li>\n  <li>Umbilical vein show normal flow.</li>\n  <li>Fetus - B</li>\n  <li>PI</li>\n  <li>RI</li>\n  <li>Percentile</li>\n  <li>Umbilical</li>\n  <li>0.83</li>\n  <li>0.56</li>\n  <li>Normal</li>\n  <li>Middle cerebral artery</li>\n  <li>1.93</li>\n  <li>1.00</li>\n  <li>Normal</li>\n  <li>CPR:  &gt;1.8 , (Normal)</li>\n  <li>Ductus venous show normal flow and spectrum.</li>\n  <li>Umbilical vein show normal flow.</li>\n</ul>",
    defaultImpression: "Twin live intrauterine fetuses of about 35 weeks 4  day (+/- 1 week) (FETUS \u2013A MATERNAL LEFT) and  35 weeks 1  day (+/- 1 week)  (FETUS \u2013B  MATERNAL RIGHT )  gestational age. COLOR DOPPLER OBSTETRICS STUDY IS NORMAL.",
    defaultRecommendations: "ice follow up. This is not anomaly scan (It must be noted that detailed fetal anatomy may not always be visible due to technical difficulties related to fetal position, amniotic fluid volume, fetal movement and abdominal wall thickness . Therefore all fetal anomalies may not necessarily be detected at every examination). I, Dr.   declare that while conducting USG on MRS..I have neither detected nor disclosed the sex of her fetus to anybody in any manner."
  },
  {
    id: "tpl-usg-obst-growth-scan",
    name: "USG  OBST GROWTH SCAN",
    category: "Radiology",
    department: "Obstetric Ultrasound",
    htmlContent: "<h3>OBSTETRIC SONOGRAPHY</h3>\n<ul>\n  <li>LMP \u2013  GA:- wks  days</li>\n  <li>This examination show a single live intra uterine fetus in cephalic presentation.</li>\n  <li>The placenta is  in position, grade    maturation and is well away from internal os.</li>\n  <li>Internal os is closed. Cervical length is normal.</li>\n  <li>Amount of liquor is adequate for gestational age. (AFI cm)</li>\n  <li>Fetal cardiac activity is regular and normal. Spontaneous Fetal Movements are well appreciated.</li>\n  <li>FHR \u2013   BPM.</li>\n  <li>The fetal growth parameters are as follows :</li>\n  <li>BPD</li>\n  <li>cm</li>\n  <li>wks</li>\n  <li>days</li>\n  <li>HC</li>\n  <li>cm</li>\n  <li>wks</li>\n  <li>days</li>\n  <li>AC</li>\n  <li>cm</li>\n  <li>wks</li>\n  <li>days</li>\n  <li>FL</li>\n  <li>cm</li>\n  <li>wks</li>\n  <li>days</li>\n  <li>MGA :  wks  day.</li>\n  <li>Estimated fetal weight is  gm+ 10%  gms .</li>\n  <li>EDD BY USG:-</li>\n</ul>",
    defaultImpression: "Single live intrauterine fetus of estimated gestational age of   wks  days  \u00b1 wks.",
    defaultRecommendations: "ice follow up. This is not anomaly scan. (It must be noted that detailed fetal anatomy may not always be visible due to technical difficulties related to fetal position, amniotic fluid volume, fetal movement and abdominal wall thickness . Therefore all fetal anomalies may not necessarily be detected at every examination). I, Dr RAVINDRA WASKEL declare that while conducting USG on MRS. I have neither detected nor disclosed the sex of her fetus to anybody in any manner."
  },
  {
    id: "tpl-usg-breast-memography",
    name: "USG BREAST (MEMOGRAPHY)",
    category: "Radiology",
    department: "Mammography",
    htmlContent: "<h3>USG BILATERAL BREAST</h3>\n<ul>\n  <li>Bilateral breast parenchyma show normal fibrofatty and glandular tissue.</li>\n  <li>No focal lesion seen in bilateral breast.</li>\n  <li>Bilateral retroareolar region appears normal.</li>\n  <li>Both axillary regions are unremarkable.</li>\n</ul>",
    defaultImpression: "No significant abnormality detected on current sonographic examination.",
    defaultRecommendations: "\u2013 Kindly correlate clinically."
  },
  {
    id: "tpl-usg-carotid-doppler",
    name: "USG CAROTID DOPPLER",
    category: "Radiology",
    department: "Color Doppler",
    htmlContent: "<h3>CAROTID COLOR DOPPLER STUDY</h3>\n<ul>\n  <li>RIGHT</li>\n  <li>LEFT</li>\n  <li>CIMT</li>\n  <li>mm</li>\n  <li>mm</li>\n  <li>CCA-PSV</li>\n  <li>cm/sec</li>\n  <li>cm/sec</li>\n  <li>ICA-PSV</li>\n  <li>cm/sec</li>\n  <li>cm/sec</li>\n  <li>ECA-PSV</li>\n  <li>cm/sec</li>\n  <li>cm/sec</li>\n  <li>ICA-EDV</li>\n  <li>cm/sec</li>\n  <li>cm/sec</li>\n  <li>Right ICA/CCA PSV Ratio-</li>\n  <li>Left ICA/CCA PSV Ratio-</li>\n  <li>Bilateral common carotid arteries, carotid bulb its branches into external carotid and internal carotid upto their visualized part reveals normal caliber and course.</li>\n  <li>Rest of the vessels shows normal flow pattern and corresponding velocities.</li>\n  <li>Bilateral vertebral arteries appear normal in flow pattern.</li>\n  <li>No evidence of plaque or thrombus seen.</li>\n</ul>",
    defaultImpression: "Normal bilateral carotid doppler study. It is a professional opinion, not valid for medico legal purpose",
    defaultRecommendations: "Clinical correlation and follow-up recommended."
  },
  {
    id: "tpl-usg-color-doppler-lower-limb-venous-system",
    name: "USG COLOR DOPPLER LOWER LIMB VENOUS SYSTEM",
    category: "Radiology",
    department: "Color Doppler",
    htmlContent: "<h3>COLOR SPECTRAL DOPPLER BILATERAL LOWER LIMB VENOUS SYSTEM</h3>\n<ul>\n  <li>B - Mode & colour doppler study of venous system of lower limb performed with high frequency (7 to 11 MHz) linear probe.</li>\n  <li>Bilateral CFV, SFV, DFV, Popliteal, ATV, PTV, Peroneal were assessed.</li>\n  <li>All these vessels shows normal flow on color doppler and are normally compressible.</li>\n  <li>Bilateral GSV appear normal in course and caliber. Bilateral SFJ is competent.</li>\n  <li>Bilateral SSV appears normal in course and caliber. Bilateral SPJ is competent normal.</li>\n</ul>",
    defaultImpression: "Normal Bilateral lower limb venous doppler study .",
    defaultRecommendations: ".- clinical correlation and further evaluation suggested.. DR"
  },
  {
    id: "tpl-usg-early-obs-crl",
    name: "USG EARLY OBS (CRL)",
    category: "Radiology",
    department: "Obstetric Ultrasound",
    htmlContent: "<h3>EARLY OBSTETRIC SONOGRAPHY</h3>\n<ul>\n  <li>LMP:09/09/2023GA BY LMP : 12 wks 1 days</li>\n  <li>Uterus is gravid , shows single  intra uterine gestational sac with a live fetus.</li>\n  <li>CRL measures \u2013  5.1 cm corresponding to   11wks6  days of gestational age.</li>\n  <li>Fetal pole is  seen .</li>\n  <li>Fetal cardiac activity is seen. FHR:- 164  BPM.</li>\n  <li>Internal os of cervix is closed & cervical length appears normal</li>\n  <li>EDD BY USG:17/06/2024</li>\n  <li>IMPRESSTION:-</li>\n  <li>Single live intrauterine fetus of estimated gestational age of 11 wks 6 days  \u00b1 1 wks.</li>\n</ul>",
    defaultImpression: "No significant abnormality detected on current sonographic examination.",
    defaultRecommendations: "ice:  Target scan between 18 to 21 wks. This is not anomaly scan I, Dr. declare that while conducting  USG on Mrs , I have neither detected nor disclosed the sex of her fetus to anybody in any manner"
  },
  {
    id: "tpl-usg-early-obst-g-sac",
    name: "USG EARLY OBST (G SAC )",
    category: "Radiology",
    department: "Obstetric Ultrasound",
    htmlContent: "<h3>EARLY OBSTETRIC SONOGRAPHY</h3>\n<ul>\n  <li>LMP: 12/12/2024GA BY LMP : 9 wks 0 days</li>\n  <li>Uterus is gravid, shows single intra uterine gestational sac.</li>\n  <li>G sac \u2013 9.6 cm corresponding to  5 wks 4 days of gestational age.</li>\n  <li>Fetal pole is not seen at present.</li>\n  <li>Internal os of cervix is closed & cervical length appears normal</li>\n  <li>IMPRESSTION:-</li>\n  <li>Single intrauterine G sac of estimated gestational age of 5 wks  4 days  \u00b1 1 wks.</li>\n</ul>",
    defaultImpression: "No significant abnormality detected on current sonographic examination.",
    defaultRecommendations: "ice:  Follow up after 2 weeks. This is not anomaly scan I, Dr. declare that while conducting USG on Mrs., I have neither detected nor disclosed the sex of her fetus to anybody in any manner"
  },
  {
    id: "tpl-usg-early-obst-iugr-fetal-death",
    name: "USG EARLY OBST IUGR (FETAL DEATH)",
    category: "Radiology",
    department: "Obstetric Ultrasound",
    htmlContent: "<h3>EARLY OBSTETRIC SONOGRAPHY</h3>\n<ul>\n  <li>LMP:/12/2024                   EDD by LMP - 12 wks 3 days</li>\n  <li>Uterus is gravid, shows single intra uterine gestational sac with a fetus.</li>\n  <li>CRL measures \u2013 0.9 cm corresponding to 7 wks 0 days of gestational age.</li>\n  <li>Fetal pole is seen.</li>\n  <li>Fetal cardiac activity is not seen in the present scan (examined at two serial intervals of 20-25 minutes).</li>\n  <li>Internal os of cervix is closed & cervical length appears normal</li>\n</ul>",
    defaultImpression: "Single intrauterine fetus of estimated gestational age of 7 wks 0 days \u00b1 1 wks with no evidence of cardiac activity in the present scan (examined at two serial intervals of 20-25 minutes) likely- intrauterine fetal death.",
    defaultRecommendations: "ice:  Follow up I, Dr. declare that while conducting USG on Mrs., I have neither detected nor disclosed the sex of her fetus to anybody in any manner"
  },
  {
    id: "tpl-usg-kub-male",
    name: "USG KUB MALE",
    category: "Radiology",
    department: "Sonography / USG",
    htmlContent: "<h3>SONOGRAPHY - KUB</h3>\n<ul>\n  <li>Both kidneys are normal in size, shape, outlines & echogenicity.</li>\n  <li>Mid cortical thickness and corticomedullary differentiation is normal.</li>\n  <li>Pelvicalyceal system is undilated on both side.</li>\n  <li>Both ureters are undilated.</li>\n  <li>Right kidney.-    cms.                Left kidney.-   cms</li>\n  <li>Urinary bladder is normal in shape & contours .Its wall is normal</li>\n  <li>Prostate is normal in size, shape and echotexture</li>\n  <li>Pre void- cc</li>\n  <li>Post void- cc</li>\n</ul>",
    defaultImpression: "No significant abnormality seen.",
    defaultRecommendations: "(ADV- clinical & pathological correlation.)"
  },
  {
    id: "tpl-usg-local-region",
    name: "USG LOCAL REGION",
    category: "Radiology",
    department: "Sonography / USG",
    htmlContent: "<h3>SONOGRAPHY \u2013 LOCAL REGION</h3>\n<ul>\n  <li>No evidence of solid / cystic lesion noted.</li>\n  <li>No evidence of any collection/abscess noted.</li>\n  <li>No evidence of any inflammation & soft tissue thickening.</li>\n</ul>",
    defaultImpression: "No significant abnormality detected on current sonographic examination.",
    defaultRecommendations: "ice -    Clinical correlation."
  },
  {
    id: "tpl-usg-neck",
    name: "USG NECK",
    category: "Radiology",
    department: "Sonography / USG",
    htmlContent: "<h3>NECK SONOGRAPHY</h3>\n<ul>\n  <li>Both lobes of thyroid and isthmus appears normal in size shape & echogenicity.</li>\n  <li>Right lobe \u2013 cm.</li>\n  <li>Left lobe \u2013  cm.</li>\n  <li>Bilateral parotid and submandibular glands appears normal size, shape & echogenicity.</li>\n  <li>No focal lesion seen.</li>\n</ul>",
    defaultImpression: "\u2013",
    defaultRecommendations: "\u2013 Clinical correlation and further evaluation suggested."
  },
  {
    id: "tpl-usg-nt-scan-for-twin",
    name: "USG NT SCAN FOR TWIN",
    category: "Radiology",
    department: "Sonography / USG",
    htmlContent: "<h3>OBSTETRIC SONOGRAPHY NT SCAN</h3>\n<ul>\n  <li>LMP \u201310/12/2023              GA BY LMP:  12 wks 6 day       EDD BY LMP: 15/09/2024</li>\n  <li>This examination shows twin live dichorionic diamniotic intra uterine fetuses in changing presentation.</li>\n  <li>The placenta of both fetuses seen forming Anteriorly and away from internal OS. Internal OS is closed.</li>\n  <li>Amount of liquor is adequate for gestational age in both fetuses.</li>\n  <li>Fetal cardiac activity is regular and normal.</li>\n  <li>Spontaneous Fetal Movements are well appreciated.</li>\n  <li>FHR \u2013 Twin I-    156  B/M</li>\n  <li>Twin II-   158 B/M</li>\n  <li>Parameters-</li>\n  <li>( Twin I )                                                                                  ( Twin II )</li>\n  <li>FL - 0.9 cm corresponding to 12 wks 6 days                     FL - 0.9 cm corresponding to 12 wks 6 days</li>\n  <li>CRL- 6.39 cm corresponding to 12 wks 6 days                CRL- 6.30 cm corresponding to 12 wks 5 days</li>\n  <li>N.T. measures-  2 mm (within normal range)                  N.T. measures- 2 mm (within normal range)</li>\n  <li>Nasal bone seen in both the fetuses.</li>\n  <li>Premaxillary triangle and mandibular gap sign seen.</li>\n  <li>Fetal skull & lateral ventricle appear normal.</li>\n  <li>Fetal Heart & Stomach seen. Cardiac situs normal.</li>\n  <li>Anterior abdomen wall appears intact.</li>\n  <li>All four limbs seen.</li>\n  <li>Three vessel cord seen.</li>\n  <li>Normal flow spectrum of ductus venosus seen.</li>\n  <li>Cervical length measures 3.4 cm</li>\n  <li>EDD by USG: 15/09/2024</li>\n  <li>IMPRESSTION :</li>\n  <li>Twin live dichorionic diamniotic intra uterine fetuses in changing presentation of gestational age of 12  Wks 6 days  + 1  Wks.</li>\n  <li>N.T. of both fetuses measures \u2013  2 mm (within normal range)</li>\n  <li>Suggested target scan between -19 to 22 week.</li>\n</ul>",
    defaultImpression: "No significant abnormality detected on current sonographic examination.",
    defaultRecommendations: "ice follow up This is not anomaly scan (It must be noted that detailed fetal anatomy may not  always be visible due to technical difficulties related to fetal position, amniotic fluid volume , fetal movement and abdominal wall thickness . Therefore all fetal anomalies may not necessarily be detected at every examination) . I, Dr. declare that while conduting  USG on MRS. I have neither detected nor disclosed the sex of her fetus to anybody in any manner ."
  },
  {
    id: "tpl-usg-nt-scan",
    name: "USG NT SCAN",
    category: "Radiology",
    department: "Sonography / USG",
    htmlContent: "<h3>OBSTETRIC SONOGRAPHY NT SCAN</h3>\n<ul>\n  <li>LMP \u201328/01/2024              GA BY LMP:  wks  day        EDD BY LMP:</li>\n  <li>This examination show single live intra uterine fetus in changing presentation.</li>\n  <li>The placenta \u2013 \u2026..  and Grade I , away from internal OS. Internal OS is closed.</li>\n  <li>Cervical length measures \u2026. cm.</li>\n  <li>Amount of liquor is adequate for gestational age.</li>\n  <li>Fetal cardiac activity is regular and normal. Spontaneous</li>\n  <li>Fetal Movements are well appreciated. FHR \u2013  B/M</li>\n  <li>CRL-   cm corresponding to    wks    days</li>\n  <li>BPD-   cm corresponding to    wks    days</li>\n  <li>HC-     cm corresponding to    wks    days</li>\n  <li>AC -    cm corresponding to    wks    days</li>\n  <li>FL-      cm corresponding to    wks    days</li>\n  <li>Estimated fetal weight -    gms.</li>\n  <li>N.T. measures \u2013  mm (within normal range)</li>\n  <li>Nasal bone seen.</li>\n  <li>Premaxillary triangle and mandibular gap sign seen.</li>\n  <li>Fetal skull & lateral ventricle appear normal.</li>\n  <li>Fetal Heart & Stomach seen. Cardiac situs normal.</li>\n  <li>Anterior abdomen wall appears intact.</li>\n  <li>All four limbs seen.</li>\n  <li>Three vessel cord seen.</li>\n  <li>Normal flow spectrum of ductus venosus seen.</li>\n  <li>PI of bilateral uterine arteries are 1.92 & 1.07 on right & left side respectively and are normal for gestational age.</li>\n  <li>EDD by USG:</li>\n  <li>IMPRESSTION:</li>\n  <li>Single live intra uterine fetus of estimated gestational age of   Wks   days  + 1  Wks.</li>\n  <li>N.T. measures \u2013   mm (within normal range)</li>\n  <li>Suggested target scan between -19 to 22 week.</li>\n</ul>",
    defaultImpression: "No significant abnormality detected on current sonographic examination.",
    defaultRecommendations: "ice follow up This is not anomaly scan (It must be noted that detailed fetal anatomy may not always be visible due to technical difficulties related to fetal position, amniotic fluid volume , fetal movement and abdominal wall thickness . Therefore all fetal anomalies may not necessarily be detected at every examination). I, Dr. declare that while conducting USG on MRS. I have neither detected nor disclosed the sex of her fetus to anybody in any manner."
  },
  {
    id: "tpl-usg-obst-doppler",
    name: "USG OBST DOPPLER",
    category: "Radiology",
    department: "Color Doppler",
    htmlContent: "<h3>COLOR DOPPLER OBSTETRICS SONOGRAPH</h3>\n<ul>\n  <li>LMP-               GA BY LMP-  weeks  days                 EDD BY LMP \u2013</li>\n  <li>Gravid uterus reveal single live fetus in cephalic presentation with following parameters:</li>\n  <li>BPD</li>\n  <li>cm</li>\n  <li>Wks</li>\n  <li>days</li>\n  <li>HC</li>\n  <li>cm</li>\n  <li>wks</li>\n  <li>days</li>\n  <li>AC</li>\n  <li>cm</li>\n  <li>wks</li>\n  <li>days</li>\n  <li>FL</li>\n  <li>cm</li>\n  <li>wks</li>\n  <li>days</li>\n  <li>MGA :  35 wks   0day</li>\n  <li>Fetal cardiac activity is seen & is regular FHR \u2013  Bpm. Fetal movements are seen.</li>\n  <li>Amniotic fluid is adequate (AFI  - cm) .</li>\n  <li>Placenta is posterior & grade II is away from os. Internal os is closed.</li>\n  <li>Estimated fetal Wt. :  gm ( +/-10 %)</li>\n  <li>EDD BY USG \u2013</li>\n  <li>DOPPLER</li>\n  <li>Uterine umbilical & middle cerebral artery reveal normal wave form & indices</li>\n  <li>for gestational age.</li>\n  <li>PI</li>\n  <li>RI</li>\n  <li>Percentile</li>\n  <li>Umbilical</li>\n  <li>0.8</li>\n  <li>0.5</li>\n  <li>Normal</li>\n  <li>Middle cerebral artery</li>\n  <li>1.61</li>\n  <li>0.79</li>\n  <li>Normal</li>\n  <li>Uterine                                                  Rt :-</li>\n  <li>0.77</li>\n  <li>0.52</li>\n  <li>Normal</li>\n  <li>Lt :-</li>\n  <li>0.62</li>\n  <li>0.44</li>\n  <li>Normal</li>\n  <li>CPR:  2(Normal)</li>\n  <li>Ductus venous show normal flow and spectrum.</li>\n  <li>Umbilical vein show normal flow.</li>\n</ul>",
    defaultImpression: "Single live intrauterine fetus of about   weeks  days (+/- 2 week) of gestational age. COLOR DOPPLER OBSTETRICS STUDY IS NORMAL.",
    defaultRecommendations: "ice follow up. This is not anomaly scan (It must be noted that detailed fetal anatomy may not always be visible due to technical difficulties related to fetal position, amniotic fluid volume, fetal movement and abdominal wall thickness . Therefore all fetal anomalies may not necessarily be detected at every examination). I, Dr.  declare that while conducting USG on MRS.  I have neither detected nor disclosed the sex of her fetus to anybody in any manner. s"
  },
  {
    id: "tpl-usg-ovulation-study-folicular-study",
    name: "USG OVULATION STUDY (FOLICULAR STUDY)",
    category: "Radiology",
    department: "Sonography / USG",
    htmlContent: "<h3>SONOGRAPHY OVULATION STUDY</h3>\n<ul>\n  <li>LMP:-</li>\n  <li>Uterus is anteverted & normal in size for age shape & outlines.</li>\n  <li>Myometrial echotexture is smooth & homogenous.</li>\n  <li>Endometrial echoes are normal. Cervix & endocervical canal are normal.</li>\n  <li>Both ovaries are normal in size, shape & echotexture.</li>\n  <li>DATE</li>\n  <li>DAY OF MENSES</li>\n  <li>RT OVARY</li>\n  <li>LT OVARY</li>\n  <li>ENDOMETRIUM</li>\n  <li>POD</li>\n  <li>Day</li>\n  <li>6 x 5.5 mm</li>\n  <li>10 x 9mm</li>\n  <li>4.6 mm</li>\n  <li>DR</li>\n</ul>",
    defaultImpression: "No significant abnormality detected on current sonographic examination.",
    defaultRecommendations: "Clinical correlation and follow-up recommended."
  },
  {
    id: "tpl-usg-pelvic",
    name: "USG PELVIC",
    category: "Radiology",
    department: "Sonography / USG",
    htmlContent: "<h3>SONOGRAPHY PELVIC REGION</h3>\n<ul>\n  <li>Uterus is anteverted & normal in size, shape & outlines.</li>\n  <li>Uterus Size: cms .</li>\n  <li>Myometrial echotexture is smooth & homogenous.</li>\n  <li>Endometrial is (mm) normal in thickness.</li>\n  <li>Cervix & endocervical canal are normal.</li>\n  <li>Both ovaries are normal in size. Stroma is normal.</li>\n  <li>Right ovary vol.- cc</li>\n  <li>Left ovary vol.- cc</li>\n  <li>No evidence of free fluid seen in pouch of douglas.</li>\n</ul>",
    defaultImpression: "\u2013 NO REMARKABLE ABNORMALTITY SEEN.",
    defaultRecommendations: ".-Clinical correlation suggested."
  },
  {
    id: "tpl-usg-perenium",
    name: "USG PERENIUM",
    category: "Radiology",
    department: "Sonography / USG",
    htmlContent: "<h3>SONOGRAPHY \u2013 LOCAL REGION ( PERIANAL)</h3>\n<ul>\n  <li>No evidence of soft thickening / edema noted.</li>\n  <li>No evidence of solid / cystic lesion noted.</li>\n  <li>Underlying soft tissue appears normal.</li>\n  <li>No evidence of collection / abscess.</li>\n</ul>",
    defaultImpression: "No significant abnormality detected on current sonographic examination.",
    defaultRecommendations: "ice -  Clinical correlation and further evaluation if clinically indicated."
  },
  {
    id: "tpl-usg-perinial",
    name: "USG PERINIAL",
    category: "Radiology",
    department: "Sonography / USG",
    htmlContent: "<h3>SONOGRAPHY \u2013 LOCAL REGION ( PERIANAL)</h3>\n<ul>\n  <li>No evidence of soft thickening / edema noted.</li>\n  <li>No evidence of solid / cystic lesion noted.</li>\n  <li>Underlying soft tissue appears normal.</li>\n  <li>No evidence of collection / abscess.</li>\n</ul>",
    defaultImpression: "No significant abnormality detected on current sonographic examination.",
    defaultRecommendations: "ice -  Clinical correlation and further evaluation if clinically indicated."
  },
  {
    id: "tpl-usg-renal-doppler",
    name: "USG RENAL DOPPLER",
    category: "Radiology",
    department: "Color Doppler",
    htmlContent: "<h3>COLOR RENAL ARTERIAL DOPPLER</h3>\n<ul>\n  <li>Right kidney (10.7 x 5.2 cm) is normal in size, shape, outlines & echogenicity.</li>\n  <li>Mid cortical thickness and corticomedullary differentiation is normal.</li>\n  <li>Pelvicalyceal system and ureter is undilated on right side.</li>\n  <li>Left kidney (10.3 x 5.0 cm) is normal in size, shape, outlines & echogenicity.</li>\n  <li>Mid cortical thickness and corticomedullary differentiation is normal.</li>\n  <li>Pelvicalyceal system and ureter is undilated on left side.</li>\n  <li>Doppler evaluation (RIGHT KIDNEY)-</li>\n  <li>Right renal artery, segmental, interlobar, intralobular & arcuate arteries shows prominent flow with normal low resistance forward flow and normal spectral waveform.</li>\n  <li>Resistive index appears within normal limits (0.7)</li>\n  <li>RAR appears within normal limits.</li>\n  <li>Acceleration index & acceleration time appears within normal limits.</li>\n  <li>Doppler evaluation (LEFT KIDNEY)-</li>\n  <li>Left renal artery, segmental, interlobar, intralobular & arcuate arteries shows prominent flow with normal low resistance forward flow and normal spectral waveform.</li>\n  <li>Resistive index appears within normal limits (0.7)</li>\n  <li>RAR appears within normal limits.</li>\n  <li>Acceleration index & acceleration time appears within normal limits.</li>\n</ul>",
    defaultImpression: "Normal USG B mode & colour doppler study.",
    defaultRecommendations: "Clinic correlation & further evaluation"
  },
  {
    id: "tpl-usg-scrotal-normal",
    name: "USG SCROTAL NORMAL",
    category: "Radiology",
    department: "Sonography / USG",
    htmlContent: "<h3>SCROTAL SONOGRAPHY</h3>\n<ul>\n  <li>Bilateral testis appears normal in size shape and echotexture.</li>\n  <li>Bilateral epididymis and spermatic cord appears normal in size shape and echotexture.</li>\n  <li>Right testis \u2013 3.7 x 2.9 x 1.8 cm (vol \u2013 10 cc)</li>\n  <li>Left testis \u2013 3.7 x 2.6 x 2.7 cm (vol \u2013 14 cc)</li>\n  <li>No focal lesion seen.</li>\n  <li>No e/o hydrocele.</li>\n  <li>No evidence of varicocele.</li>\n  <li>Testicular artery, capsular artery and intra testicular arteries shows normal flow bilaterally.</li>\n</ul>",
    defaultImpression: "\u2013 No remarkable abnormality seen.",
    defaultRecommendations: "(ADV- Follow up and clinico pathological correlation.) DR"
  },
  {
    id: "tpl-usg-shoulder",
    name: "USG SHOULDER",
    category: "Radiology",
    department: "Sonography / USG",
    htmlContent: "<h3>SONOGRAPHY \u2013\u00a0LEFT\u00a0SHOULDER (ROTATOR CUFF)</h3>\n<ul>\n  <li>Left subscapularis, supra-spinatus infra-spinatus tendon appear normal in sonomorphology.</li>\n  <li>Left\u00a0long head of bicep Tendon present in bicipital grove.</li>\n  <li>Bicipital grove appears normal.</li>\n  <li>Tendon appears normal in sonomorphology.</li>\n  <li>Left\u00a0subscapularis, infra-spinatus tendon appear normal in sonomorphology.</li>\n  <li>Left acromio-clavicular joint appears normal.</li>\n  <li>No obvious tendon tear seen.</li>\n  <li>No obvious peritendinous collection / increased vascularity noted.</li>\n  <li>No obvious bursal fluid seen.</li>\n  <li>Visualized muscles show normal sonomorphology.</li>\n  <li>No collection/ focal lesion seen.</li>\n</ul>",
    defaultImpression: "NO REMARKABLE SONOGRAPHIC ABNORMALITY SEEN.. Clinical correlation and further evaluation (MRI shoulder) suggested. DR",
    defaultRecommendations: "Clinical correlation and follow-up recommended."
  },
  {
    id: "tpl-usg-upper-limb-arterial-venous-system",
    name: "USG UPPER LIMB ARTERIAL VENOUS SYSTEM",
    category: "Radiology",
    department: "Sonography / USG",
    htmlContent: "<h3>B - MODE & COLOUR DOPPLER STUDY OF ARTERIAL AND VENOUS  SYSTEM OF LEFT UPPER LIMB PERFORMED WITH HIGH FREQUENCY (7 TO 11 MHZ) LINEAR PROBE.</h3>\n<ul>\n  <li>Findings:-</li>\n  <li>Bilateral  subclavian, axillary, brachial, radial and ulnar artery shows normal colour flow, spectrum and velocity.</li>\n  <li>Vessels (venous) examined are subclavian vein, axillary, cephalic, basilic, radial, ulnar veins which are normal in coarse and caliber & are normally compressible.</li>\n  <li>No evidence of thrombus noted.</li>\n</ul>",
    defaultImpression: "Normal bilateral upper limb arterial and venous doppler study.",
    defaultRecommendations: "Clinical correlation and further evaluation."
  },
  {
    id: "tpl-usg-whole-abdomen-female-1",
    name: "USG WHOLE ABDOMEN FEMALE (1)",
    category: "Radiology",
    department: "Sonography / USG",
    htmlContent: "<h3>SONOGRAPHY - WHOLE ABDOMEN</h3>\n<ul>\n  <li>Liver is normal in size ( cm) and echotexture.</li>\n  <li>Intra and extra-hepatic biliary radicals are not dilated.</li>\n  <li>Hepatic vein & Portal vein appear normal & un-dilated.</li>\n  <li>CBD is normal in caliber & un-dilated.</li>\n  <li>Gall bladder is well distended with echo-free lumen. Wall thickness is normal.</li>\n  <li>Spleen is normal in size ( cms) and echotexture.</li>\n  <li>Pancreas is normal in size and echotexture.</li>\n  <li>Right kidney is normal in size (x cms), shape, outlines & echotexture.</li>\n  <li>Mid cortical thickness and cortico-medullary differentiation is normal.</li>\n  <li>Pelvicalyceal system is un-dilated on right side.</li>\n  <li>Right ureter is undilated. No calculi seen at VUJ & PUJ.</li>\n  <li>Left kidney is normal in size ( x cms), shape, outlines & echotexture.</li>\n  <li>Mid cortical thickness and cortico-medullary differentiation is normal.</li>\n  <li>Pelvicalyceal system is un-dilated on left side.</li>\n  <li>Left ureter is undilated. No calculi seen at VUJ & PUJ.</li>\n  <li>IVC and abdominal aorta are normal in caliber.</li>\n  <li>Urinary bladder is normal in shape & contours. Its wall is normal.</li>\n  <li>Uterus is anteverted and normal in size ( x  x  cm) shape and echotexture. Myometrial echotexture is homogenous.</li>\n  <li>Cervix and endocervical canal appears normal.</li>\n  <li>Endometrium echoes are normal\u00a0mm.</li>\n  <li>Both ovaries are normal in size, shape and echotexture.</li>\n  <li>Right ovary approx. vol.- cc</li>\n  <li>Left ovary approx. vol.-\u00a0cc</li>\n  <li>There is no definite evidence of lymphadenopathy.</li>\n</ul>",
    defaultImpression: "\u2013\u00a0No significant abnormality seen.",
    defaultRecommendations: ".-Clinical correlation suggested."
  },
  {
    id: "tpl-usg-whole-abdomen-female-nivedita-maam-copy",
    name: "USG WHOLE ABDOMEN FEMALE NIVEDITA MAAM  - Copy",
    category: "Radiology",
    department: "Sonography / USG",
    htmlContent: "<h3>SONOGRAPHY - WHOLE ABDOMEN</h3>\n<ul>\n  <li>Liver is normal in size (cm) and echotexture.</li>\n  <li>Intra and extra-hepatic biliary radicals are not dilated.</li>\n  <li>Hepatic vein & Portal vein appear normal & un-dilated.</li>\n  <li>CBD is normal in caliber & un-dilated.</li>\n  <li>Gall bladder is well distended with echo-free lumen. Wall thickness is normal.</li>\n  <li>Spleen is normal in size (cms) and echotexture.</li>\n  <li>Pancreas is normal in size and echotexture.</li>\n  <li>Both kidneys are normal in size  shape, outlines & echotexture.</li>\n  <li>Cortico-medullary differentiation is normal.</li>\n  <li>Pelvicalyceal system is un-dilated on both sides.</li>\n  <li>Both ureters are undilated.</li>\n  <li>Right kidney \u2013 cm                                               Left kidney - cm</li>\n  <li>Urinary bladder is normal in shape & contours. Its wall is normal.</li>\n  <li>No evidence of intra-abdominal lymphadenopathy.</li>\n  <li>No e/o ascites.</li>\n  <li>Uterus is anteverted and normal in size (cm) shape and echotexture. Myometrial echotexture is homogenous.</li>\n  <li>Cervix and endocervical canal appears normal.</li>\n  <li>Endometrium echoes are normal\u00a0mm.</li>\n  <li>Both ovaries are normal in size, shape and echotexture.</li>\n  <li>Right ovary approx. cm vol.- cc</li>\n  <li>Left ovary approx.  cm vol- cc</li>\n</ul>",
    defaultImpression: "\u2013\u00a0No significant abnormality seen.",
    defaultRecommendations: ".-Clinical correlation suggested."
  },
  {
    id: "tpl-usg-wholw-abdomen-male-nivedita-maam-copy",
    name: "USG WHOLW ABDOMEN MALE NIVEDITA MAAM - Copy",
    category: "Radiology",
    department: "Sonography / USG",
    htmlContent: "<h3>SONOGRAPHY - WHOLE ABDOMEN</h3>\n<ul>\n  <li>Liver is normal in size ( cm) and echotexture.</li>\n  <li>Intra and extra-hepatic biliary radicals are not dilated.</li>\n  <li>Hepatic vein & Portal vein appear normal & un-dilated.</li>\n  <li>CBD is normal in caliber & un-dilated.</li>\n  <li>Gall bladder is well distended with echo-free lumen. Wall thickness is normal.</li>\n  <li>Spleen is normal in size (cms) and echotexture.</li>\n  <li>Pancreas is normal in size and echotexture.</li>\n  <li>Both kidneys are normal in size  shape, outlines & echotexture.</li>\n  <li>Cortico-medullary differentiation is normal.</li>\n  <li>Pelvicalyceal system is un-dilated on both sides.</li>\n  <li>Both ureters are undilated.</li>\n  <li>Right kidney \u2013 cm                                               Left kidney \u2013 cm</li>\n  <li>Urinary bladder is normal in shape & contours .Its wall is normal.</li>\n  <li>No evidence of intra-abdominal lymphadenopathy.</li>\n  <li>No e/o ascites.</li>\n  <li>Prostate is normal in size, shape and echotexture.</li>\n</ul>",
    defaultImpression: "No significant abnormality seen.",
    defaultRecommendations: "(ADV- clinical & pathological correlation.)"
  },
  {
    id: "tpl-usg-wholw-abdomen-male",
    name: "USG WHOLW ABDOMEN MALE",
    category: "Radiology",
    department: "Sonography / USG",
    htmlContent: "<h3>SONOGRAPHY - WHOLE ABDOMEN</h3>\n<ul>\n  <li>Liver is normal in size (cm) and shows normal echotexture.</li>\n  <li>Intra and extra-hepatic biliary radicales are not dilated.</li>\n  <li>Hepatic vein & Portal vein appear normal & undilated.</li>\n  <li>CBD is normal in caliber & undilated.</li>\n  <li>Gall bladder is well distended with echo-free lumen. Wall thickness is normal.</li>\n  <li>Spleen is normal in size (cm) and echotexture.</li>\n  <li>Visualized part of Pancreas is normal in size and echotexture.</li>\n  <li>Right kidney is normal in size (cms), shape, outlines & echotexture.</li>\n  <li>Mid cortical thickness and cortico-medullary differentiation is normal.</li>\n  <li>Pelvicalyceal system is un-dilated on right side.</li>\n  <li>Right ureter is undilated. No calculi seen at VUJ & PUJ.</li>\n  <li>Left kidney is normal in size (cms), shape, outlines & echotexture.</li>\n  <li>Mid cortical thickness and cortico-medullary differentiation is normal.</li>\n  <li>Pelvicalyceal system is un-dilated on left side.</li>\n  <li>Left ureter is undilated. No calculi seen at VUJ & PUJ.</li>\n  <li>IVC and abdominal aorta are normal in caliber.</li>\n  <li>No evidence of intra-abdominal lymphadenopathy & ascites.</li>\n  <li>Urinary bladder is normal in shape & contours .Its wall is normal.</li>\n  <li>Prostate is normal in size, shape and echotexture.</li>\n</ul>",
    defaultImpression: "No significant abnormality seen.",
    defaultRecommendations: "(ADV- clinical & pathological correlation.)"
  },
  {
    id: "tpl-echo-normal-report",
    name: "echo normal report",
    category: "Cardiology",
    department: "2D Echocardiography",
    htmlContent: "<h3>ECHOCARDIOGRAPHY REPORT</h3>\n<ul>\n  <li>M MODE DIMENSIONS</li>\n  <li>Aorta  :    2.5         cmIVS (d)       :  0.8        cm</li>\n  <li>Left atrium:    2.6        cmIVS(s)       :    1.2      cm</li>\n  <li>LVPW (d):    0.9        cm LVID (d)    :   3.7       cm</li>\n  <li>LVPW(s):    1.3        cm LVID (s)   :     2.5      cm</li>\n  <li>RVID (d):                MPA :</li>\n  <li>LVEF                 :   65         %</li>\n  <li>CHAMBERS</li>\n  <li>Left atrium: Normal</li>\n  <li>Left atrial appendage:            Visualized/clear</li>\n  <li>Left ventricle:            Normal</li>\n  <li>Aorta:Normal</li>\n  <li>IVC:Normal</li>\n  <li>Right Atrium:Normal</li>\n  <li>Right ventricle:Normal</li>\n  <li>Pulmonary artery:Normal</li>\n  <li>Inter ventricular septum:Intact</li>\n  <li>IVS motion:Normal</li>\n  <li>Inter atrial septum          :Intact</li>\n  <li>VALVES:</li>\n  <li>MorphologyAnte grade flow          Regurgitation</li>\n  <li>PulmonaryNormalV (max) = 0.97        m/s                  NO PR</li>\n  <li>AorticNormalV (max) = 1.22         m/s         NO AR</li>\n  <li>MitralAML: NormalE wave = 0.73          m/s         TRIVIAL MR</li>\n  <li>PML NormalA wave = 0.47          m/s</li>\n  <li>E/A ratio &gt; 1</li>\n  <li>DT = 141       ms</li>\n  <li>Tricuspid Normal                           V (max) = 2.34 m/s(21 mmHg)     TRIVIAL TR</li>\n  <li>RWMA                    NONE.</li>\n  <li>PERICARDIUM      NORMAL.</li>\n  <li>Wilkin\u2019s Score:RigiditycalcificationThicknesssubvalvular</li>\n  <li>REMARKS:</li>\n  <li>Echogenicity good. Echo window good.</li>\n</ul>",
    defaultImpression: "FINAL IMPRESSION: NORMAL VALVULAR ECHOES AND CHAMBER DIMENSIONS. NO RWMA. TRIVIAL MR, TRIVIAL TR (PASP 26 mmHg). NORMAL LV SYSTOLIC FUNCTION. LVEF 65 %. NO CLOT / VEGETATION / EFFUSION. Please correlate clinically & with other investigations:",
    defaultRecommendations: "Clinical correlation and follow-up recommended."
  },
  {
    id: "tpl-findings",
    name: "findings",
    category: "Radiology",
    department: "Sonography / USG",
    htmlContent: "<h3>FINDINGS</h3>\n<ul>\n  <li>No significant abnormality detected.</li>\n  <li>Few sub centimetric sized lymph nodes are note in pre and paraaortic region largest measuring 7.0 x 2.5 mm.</li>\n  <li>Multiple variable size mesenteric lymph node noted in pre and paraaortic region largest measuring of approx. 1.3 x 0.7 cm. S/O Mesenteric lymphadenopathy.</li>\n  <li>MESENTERIC LYMPHADENOPATHY.</li>\n  <li>PROSTATE</li>\n  <li>BENIGN PROSTATIC HYPERPLASIA</li>\n  <li>Prostate- is enlarged and Measures approx. (  4.7 x 4.7 x 3.7) cm with weight approx. (43.0) gm with median lobe indentation into the lumen of urinary bladder. Per prostatic fat planes are well maintained. No calcification is seen.</li>\n</ul>",
    defaultImpression: "No significant abnormality detected on current sonographic examination.",
    defaultRecommendations: "PROSTATOMEGALY WITH WEIGHT APPROX. (43.0) GM WITH MEDIAN LOBE INDENTATION INTO THE LUMEN OF URINARY BLADDER S/O BENIGN PROSTATIC HYPERPLASIA. (Adv: Serum PSA correlation) LIVER . BOWEL WALL MILD SPLENOMEGALY. A 1.1 x 0.3 cm calcified granuloma is seen in right lobe segment VII. S/O calcified granuloma. CALCIFIED GRANULOMA IN RIGHT LOBE SEGMENT VII OF THE LIVER. BOWEL There is evidence of increased symmetrical wall thickening and submucosal echogenicity in large bowel loops (descending and sigmoid colon) s/o Colitis. COLITIS AS DECRIBED. EXCESSIVE BOWEL GASEOUS SHADOWS. GALL BLADDER Gall Bladder is contracted (Post prandial status). Gall Bladder Well distended with a calculus of approx. size 16mm noted within GB lumen S/O cholelithiasis. No evidence of cholecystitis at current scan. CHOLELITHIASIS. Gall bladder show multiple (5-6) calculi in gall bladder lumen, largest measuring/average measuring 5.7 mm. No evidence of cholecystitis at current scan. CHOLELITHIASIS Gall Bladder Well distended. Normal  wall. Lumen echofree. There is evidence of an echogenic calculus of approx. size 4 mm within proximal part of CBD s/o choledocholithiasis. CHOLEDOCHOLITHIASIS. Gall Bladder is partially contracted a with slightly thickened wall (maximum wall thickness approx.5.2 mm) and few (3-4)  echogenic foci - calculi  largest measuring~ (13.1) mm in size with sliver of sludge  noted within the lumen of gall bladder .Findings are concerning for  calculus  cholecystitis . F/S/O CALCULUS CHOLECYSTITIS Gall Bladder partially distended. Wall  appears oedematous and thickened (maximum wall thickness approx.5.2 mm), with mild pericholecystic fluid. Lumen is echofree.Findings are concerning for acalculus cholecystitis. F/S/O ACALCULUS CHOLECYSTITIS URINARY BLADDER Cystitis Urinary Bladder Well distended. Normal wall. No evidence of any filling defect is seen within it. There is e/o low level echoes noted within the lumen of urinary bladder \u2026s/o\u2026cystitis. CYSTITIS AS DESCRIBED (ADV: URINE R/M CORRELATION). Urinary Bladder Well distended. Wall appears mildly thickened and irregular  (maximum thickness approx. 0.60 cm ) with e/o  multiple echoes noted within the lumen of urinary bladder \u2026s/o\u2026chronic cystitis. Chronic cystitis as described (Adv: Urine r/m correlation). Urinary Bladder Well distended. Normal wall.  An echogenic focus --- calculus is noted within the lumen of urinary bladder measuring ~(0.92)cm in size. Vesical calculus as described above. KIDNEY There is e/o a left renal calculus , measuring ~(7.9)mm, noted at middle calyx of left kidney. No dilatation of pelvicalyceal system noted. LEFT RENAL CALCULUS There are few calculi (2-3) with distal posterior acoustic shadowing noted in left kidney measuring 7 mm at lower calyx, 6mm at middle calyx and 8mm at upper calyx. No dilatation of pelvicalyceal system noted. FEW LEFT RENAL CALCULI AS DESCRIBED. There are few calculi (2-3) with distal posterior acoustic shadowing noted at middle calyx of left kidney largest measuring 8 mm. No dilatation of pelvicalyceal system noted. FEW LEFT RENAL CALCULI AS DESCRIBED. Multiple left renal calculi are noted, largest of the few measuring approx. (1.27)cm at upper calyx, approx. (1.32)cm at middle calyx and approx. ( 0.77)cm in size at lower calyx of left kidney. MULTIPLE LEFT RENAL CALCULI AS DESCRIBED. There are few tiny ( 2-3)  concretion of average size 2-3 mm  with distal posterior acoustic shadowing noted  at lower calyx of left kidney. LEFT RENAL CONCRETIONS. There is e/o a right upper/mid/lower ureteric calculus measuring ~(16.4)mm in size,3.5 cm from PUJ (pelvi-ureteric junction) leading to right sided upstream mild hydro-ureteronephrosis. RIGHT UPPER URETERIC CALCULUS LEADING TO MILD HYDRO-URETERONEPHROSIS. There is e/o a right lower ureteric calculus measuring ~(16.4)mm in size,just at crossing over of pelvic vessels, leading to right sided upstream mild hydro-ureteronephrosis. RIGHT LOWER URETERIC CALCULUS LEADING TO MILD HYDRO-URETERONEPHROSIS as described. There is e/o an echogenic focus --- calculus, measuring ~(7.9)mm, noted at left vesico-ureteric junction (VUJ) leading to left sided upstream mild hydroureteronephrosis. LEFT VUJ CALCULUS LEADING TO MILD HYDRO-URETERONEPHROSIS. There is e/o an echogenic focus --- calculus, measuring ~(7.9)mm, noted at left pelvi-ureteric junction (PUJ) leading to left sided upstream mild hydronephrosis. LEFT PUJ CALCULUS LEADING TO MILD HYDRONEPHROSIS. There is a simple cystic lesion seen at mid pole of right kidney, largest measuring approx. 1.3 x 1.2 cm seen. RIGHT SIMPLE RENAL CYST. OBSTRETRICS The limitations of ultrasound in detection of congenital anomalies in pregnant female with thick abdomen was described in detail to the patient. Placenta (Developing) posterior. Grade 0,\u00a0low lying reaching the internal os. Need follow up F/S/O LOW LYING PLACENTA. A mild subchorionic haemorrhage is noted ,measuring approx.  (0.38 x 0.23)cm in size. (Involving less than 5% of the periphery.) F/S/O MILD SUBCHORIONIC HEMORRHAGE. Endometrium is heterogeneously hyperechoic. It measures 2.03 X 0.82 cm involving posterior and anterior lip at fundal  region. On doppler there is low resistance peripheral flow. F/S/O RETAINED PRODUCT OF CONCEPTION. F/S/O RETAINED PRODUCT OF CONCEPTION-LOW FLOW. ice -follow up scan. UTERUS Uterus is not visualised H/O surgery. Vaginal stump appears unremarkable. Bilateral adnexa appear unremarkable. Uterus is anteverted & bulky in size, (6x 5.9 x 4.4 )cm and shows heterogeneous myometrial Bulky uterus with heterogeneous myometrial echotexture Mild free fluid noted in P.O.D. A dominant follicle of approx. size x   cm noted in left ovary. A subcentimetric nabothian cyst noted in posterior cervical myometrium. ADENOMYOSIS Uterus is globular and bulky in size measuring ~(7.79 x 7.85 x 8.58)cm with volume ~(274.91)cc with asymmetrical wall thickness. here are diffuse areas of heterogeneously hyperechoic echogenicity with venetian blind appearance, with focal nodules and myometrial thickening present with indistinct margins and tiny cystic spaces within the myometrium. On. Colour doppler tortuous vessels are seen coursing through the abnormality. Endo-myometrial junction is lost at multiple places. F/S/O Adenomyotic changes. CERVICITES Cervix measures: 3.8 cm. There is minimal free fluid in cervical canal with hyperechoic bulky cervical lips. BULKY CERVIX-F/S/O CERVICITES. Cervix measures: 3.8 cm with bulky cervical lips. BULKY CERVIX-F/S/O CERVICITES. PCOD Both ovaries are bulky with multiple small follicles (more than 10 in each ovary, more than 2 mm size of each follicle) of varying sizes. These follicles are noted in the periphery of the ovaries with central echogenic stroma. Right ovary measures 2.7 x 3.4 x 2.3 cm volume approx. (11.6) cc. Left ovary measures 3.1 x 3.4 x 2.44 cm volume approx. (13.2) cc. BILATERAL POLYCYSTIC OVARIES. ise :- Hormonal Study & Clinical Correlation MORPHOLOGY Ovaries Both ovaries are bulky with multiple small follicles of varying sizes. These follicles are noted in the periphery of the ovaries with central echogenic stroma. Right ovary measures (3.4 x 2.7 x 3.8) cm volume approx. (18.4) cc. Left ovary measures (3.6 x 2.2 x 3.3) cm volume approx. (14.6) cc. BILATERAL POLYCYSTIC OVARIAN MORPHOLOGY. ise: - Hormonal Study & Clinical Correlation CYSTIC ENDOMETRIAL HYPERPLASIA Endometrial is thickened and hyperechoic with multiple small cystic changes S/O CYSTIC ENDOMETRIAL HYPERPLASIA. F/S/O CYSTIC ENDOMETRIAL HYPERPLASIA. HEMATOMETRA Endometrium is trilaminar. The endometrial lips are splayed with minimal anechoic fluid noted within the cavity. F/S/O MINIMAL HEMATOMETRA. SIMPLE CYST There is an anechoic thin walled cystic lesion of size x   x cm corresponding to () cc noted in the left ovary. The peripheral stroma of ovary appears normal ( meniscus sign noted). F/S/O LEFT OVARIAN SIMPLE CYST- BENIGN - O-RADS 2 HEMORRHAGIC CYST There is a thin walled unilocular cystic lesion with multiple thin septations ( avascular) of size x   x cm corresponding to () cc noted in the right ovary. The peripheral stroma of ovary appears normal ( meniscus sign noted). F/S/O RIGHT OVARIAN HEMORRHAGIC CYST- BENIGN - O-RADS 2 ENDOMETRIOMA There is a thin walled unilocular cystic lesion with low level internal echoes (avascular) of size 3.4 x 3.5x 2.8 cm corresponding to () cc noted in the right ovary. The peripheral stroma of ovary appears normal (meniscus sign noted). F/S/O RIGHT OVARIAN ENDOMETRIOMA - BENIGN - O-RADS 2. F/S/O RIGHT OVARIAN ENDOMETRIOMA - BENIGN - O-RADS 2 INTRAMURAL LEIOMYOMA There is evidence of a well-defined intramural hypoechoic mass lesion noted in the anterior wall of uterus. F/S/O intramural leiomyoma (category 4). NECK A well- defined spongiform hypoechoic lesion with few cystic areas and smooth margins noted in right lobe of thyroid. The lesion is wider than taller and shows no echogenic foci within. It measures (1.5x1.1) cm and shows mild internal & peripheral vascularity. F/S/O TIRADS-2 lesion likely adenoma. TIRADS-2 LESION LIKELY ADENOMA IN RIGHT LOBE OF THYROID AS DESCRIBED."
  },
  {
    id: "tpl-lower-limb-artrial-and-venous-both",
    name: "lower limb artrial and venous both",
    category: "Radiology",
    department: "Sonography / USG",
    htmlContent: "<h3>COLOR SPECTRAL DOPPLER BILATERAL LOWER LIMB ARTERIAL AND VENOUS SYSTEM</h3>\n<ul>\n  <li>B - Mode & colour doppler study of arterial and venous system of lower limb performed with high frequency (7 to 11 MHz) linear probe.</li>\n  <li>Findings \u2013</li>\n  <li>ARTERIAL-</li>\n  <li>Bilateral CFA, SFA, DFA, popliteal artery, ATA & DPA show normal triphasic flow with normal PSV.</li>\n  <li>No significant stenosis seen upto DPA and distal PTA.</li>\n  <li>No evidence of thrombus/ plaque.</li>\n  <li>VENOUS -</li>\n  <li>Bilateral CFV, SFV, DFV, Popliteal, ATV, PTV, Peroneal were assessed.</li>\n  <li>All these vessels shows normal flow on color doppler and are normally compressible.</li>\n  <li>Bilateral GSV appear normal in course and caliber. Bilateral SFJ is competent.</li>\n  <li>Bilateral SSV appears normal in course and caliber. Bilateral SPJ is competent normal.</li>\n</ul>",
    defaultImpression: "Normal Bilateral lower limb arterial and venous doppler study .",
    defaultRecommendations: ".- clinical correlation and further evaluation suggested. DR"
  },
  {
    id: "tpl-usg-skull-head",
    name: "usg skull head",
    category: "Radiology",
    department: "Sonography / USG",
    htmlContent: "<h3>USG TRANS FONTANELLE</h3>\n<ul>\n  <li>Brain Parenchyma with bilateral hemispheres appears normal.</li>\n  <li>Ventricular system appears normal.</li>\n  <li>No evidence of mid line shift.</li>\n  <li>No evidence of any solid or cystic lesion noted.</li>\n  <li>Posterior fossa appears normal.</li>\n  <li>No evidence of herniation noted.</li>\n</ul>",
    defaultImpression: "Normal USG trans fontanelle study.",
    defaultRecommendations: "ised :- Clinical correlation"
  },
];
