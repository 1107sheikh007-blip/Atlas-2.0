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
    id: 'tpl-ap-obs-anomaly-scan',
    name: 'OBSTETRIC ANOMALY SCAN (LEVEL II / TARGET SCAN)',
    category: 'Radiology',
    department: 'Obstetric Ultrasound',
    htmlContent: `
      <h3>OBSTETRIC ANOMALY SCAN</h3>
      <p><strong>Clinical LMP:</strong> &nbsp;&nbsp;&nbsp;&nbsp; <strong>Avg. Gestation:</strong> &nbsp;&nbsp; Wks &nbsp;&nbsp; Days &nbsp;&nbsp;&nbsp;&nbsp; <strong>Clinical EDD:</strong></p>
      <p>Single live intrauterine fetus seen with Changing presentation at the time of scanning.</p>
      <p>Fetal cardiac activity is regular (FHR = … bpm). Fetal movements are normal.</p>
      <p>Placenta is …… with grade “ ” maturity. Liquor is adequate.</p>
      <p><strong>The fetal growth parameters are as follow :</strong></p>
      <table style="width: 100%; border-collapse: collapse; margin-top: 8px; margin-bottom: 12px; border: 1px solid #000;">
        <thead>
          <tr style="background-color: #f1f5f9; border-bottom: 1px solid #000;">
            <th style="border: 1px solid #000; padding: 6px 10px; text-align: left; font-weight: bold;">Parameters</th>
            <th style="border: 1px solid #000; padding: 6px 10px; text-align: left; font-weight: bold;">Value (cm)</th>
            <th style="border: 1px solid #000; padding: 6px 10px; text-align: left; font-weight: bold;">Weeks</th>
            <th style="border: 1px solid #000; padding: 6px 10px; text-align: left; font-weight: bold;">Days</th>
          </tr>
        </thead>
        <tbody>
          <tr><td style="border: 1px solid #000; padding: 6px 10px; font-weight: bold;">Bi-parietal Diameter (BPD)</td><td style="border: 1px solid #000; padding: 6px 10px;">&nbsp;</td><td style="border: 1px solid #000; padding: 6px 10px;">&nbsp;</td><td style="border: 1px solid #000; padding: 6px 10px;">&nbsp;</td></tr>
          <tr><td style="border: 1px solid #000; padding: 6px 10px; font-weight: bold;">Head Circumference (HC)</td><td style="border: 1px solid #000; padding: 6px 10px;">&nbsp;</td><td style="border: 1px solid #000; padding: 6px 10px;">&nbsp;</td><td style="border: 1px solid #000; padding: 6px 10px;">&nbsp;</td></tr>
          <tr><td style="border: 1px solid #000; padding: 6px 10px; font-weight: bold;">Abdominal Circumference (AC)</td><td style="border: 1px solid #000; padding: 6px 10px;">&nbsp;</td><td style="border: 1px solid #000; padding: 6px 10px;">&nbsp;</td><td style="border: 1px solid #000; padding: 6px 10px;">&nbsp;</td></tr>
          <tr><td style="border: 1px solid #000; padding: 6px 10px; font-weight: bold;">Femoral Length (FL)</td><td style="border: 1px solid #000; padding: 6px 10px;">&nbsp;</td><td style="border: 1px solid #000; padding: 6px 10px;">&nbsp;</td><td style="border: 1px solid #000; padding: 6px 10px;">&nbsp;</td></tr>
          <tr><td style="border: 1px solid #000; padding: 6px 10px; font-weight: bold;">Tibial Length</td><td style="border: 1px solid #000; padding: 6px 10px;">&nbsp;</td><td style="border: 1px solid #000; padding: 6px 10px;">&nbsp;</td><td style="border: 1px solid #000; padding: 6px 10px;">&nbsp;</td></tr>
          <tr><td style="border: 1px solid #000; padding: 6px 10px; font-weight: bold;">Humerus Length</td><td style="border: 1px solid #000; padding: 6px 10px;">&nbsp;</td><td style="border: 1px solid #000; padding: 6px 10px;">&nbsp;</td><td style="border: 1px solid #000; padding: 6px 10px;">&nbsp;</td></tr>
          <tr><td style="border: 1px solid #000; padding: 6px 10px; font-weight: bold;">Ulnar Length</td><td style="border: 1px solid #000; padding: 6px 10px;">&nbsp;</td><td style="border: 1px solid #000; padding: 6px 10px;">&nbsp;</td><td style="border: 1px solid #000; padding: 6px 10px;">&nbsp;</td></tr>
          <tr><td style="border: 1px solid #000; padding: 6px 10px; font-weight: bold;">Outer Orbital Distance (OOD)</td><td style="border: 1px solid #000; padding: 6px 10px;">&nbsp;</td><td style="border: 1px solid #000; padding: 6px 10px;">&nbsp;</td><td style="border: 1px solid #000; padding: 6px 10px;">&nbsp;</td></tr>
          <tr><td style="border: 1px solid #000; padding: 6px 10px; font-weight: bold;">Transverse Cerebellar Distance (TCD)</td><td style="border: 1px solid #000; padding: 6px 10px;">&nbsp;</td><td style="border: 1px solid #000; padding: 6px 10px;">&nbsp;</td><td style="border: 1px solid #000; padding: 6px 10px;">&nbsp;</td></tr>
        </tbody>
      </table>
      <p><strong>Average gestation by USG:</strong> &nbsp;&nbsp;&nbsp; wks &nbsp;&nbsp; days &plusmn; 1 wk<br/>
      <strong>EDD [USG]:</strong> &nbsp;&nbsp;&nbsp;&nbsp; <strong>Fetal weight:</strong> &nbsp;&nbsp;&nbsp; grams &plusmn; 10%</p>
      <h4>FETAL MORPHOLOGY:</h4>
      <ul>
        <li><strong>FETAL CNS:</strong> Fetal skull bones are normal. Midline echo is seen. Cavum Septum pellucidum (CSP) is visualized. The atriums of the lateral ventricles are normal (&lt;10mm). Cisterna magna is normal (2-11mm).</li>
        <li><strong>FETAL SPINE:</strong> Fetal spine appears grossly normal. Curvatures appear normal. Intact skin cover over the vertebrae is seen.</li>
        <li><strong>FETAL FACE:</strong> Facial profile appears normal. Nasal bone seen. Visualized orbits, lips and mandible appear normal.</li>
        <li><strong>FETAL THORAX:</strong> Cardiac four chambers visualized. Cardiac apex to the left. Outflow tracts (LVOT and RVOT) appear normal. Lungs echogenic and normal.</li>
        <li><strong>FETAL ABDOMEN:</strong> Stomach bubble visualized on left. Both kidneys visualized and normal. Urinary bladder seen. Anterior abdominal wall intact.</li>
        <li><strong>FETAL EXTREMITIES:</strong> All 4 limbs seen to visible extent. Length of long bones corresponds to GA.</li>
        <li><strong>UMBILICAL CORD:</strong> Three vessels seen with normal insertion and vascularity.</li>
      </ul>
      <p style="font-size: 0.9em; margin-top: 14px; color: #333;">(It must be noted that detailed fetal anatomy may not always be visible due to technical difficulties related to fetal position, amniotic fluid volume, fetal movement and abdominal wall thickness. Therefore, all fetal anomalies may not necessarily be detected at every examination).</p>
      <p style="font-size: 0.9em; font-weight: bold; color: #111;">I, Dr. SHRUTI KUCHARIYA declare that while conducting USG on MRS. I have neither detected nor disclosed the sex of her fetus to anybody in any manner.</p>
    `,
    defaultImpression: 'Single live intrauterine fetus of estimated gestational age corresponding to clinical dates. No gross congenital malformation detected at current scan.',
    defaultRecommendations: 'Clinical correlation and follow-up.'
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
    id: 'tpl-twing-obst-growth-scan',
    name: 'TWIN OBSTETRIC GROWTH SCAN',
    category: 'Radiology',
    department: 'Obstetric Ultrasound',
    htmlContent: `
      <h3>TWIN OBSTETRIC SONOGRAPHY</h3>
      <p><strong>LMP:</strong> 30/01/2026 &nbsp;&nbsp;&nbsp;&nbsp; <strong>GA BY LMP:</strong> 31 weeks 6 days &nbsp;&nbsp;&nbsp;&nbsp; <strong>EDD BY LMP:</strong> 06/11/2026</p>
      <p>Gravid uterus reveals twin live fetuses (monochorionic diamniotic).</p>
      <h4>FETUS – A (Towards Maternal Right)</h4>
      <p>Presentation: Transverse lie. Fetal cardiac activity regular (FHR: 137 BPM). Spontaneous fetal movements seen.</p>
      <table style="width: 100%; border-collapse: collapse; margin-top: 8px; margin-bottom: 12px; border: 1px solid #000;">
        <tbody>
          <tr><td style="border: 1px solid #000; padding: 6px 12px; font-weight: bold; width: 25%;">BPD</td><td style="border: 1px solid #000; padding: 6px 12px; width: 25%;">7.9 cm</td><td style="border: 1px solid #000; padding: 6px 12px; width: 25%;">32 wks</td><td style="border: 1px solid #000; padding: 6px 12px; width: 25%;">0 days</td></tr>
          <tr><td style="border: 1px solid #000; padding: 6px 12px; font-weight: bold;">HC</td><td style="border: 1px solid #000; padding: 6px 12px;">29.2 cm</td><td style="border: 1px solid #000; padding: 6px 12px;">32 wks</td><td style="border: 1px solid #000; padding: 6px 12px;">2 days</td></tr>
          <tr><td style="border: 1px solid #000; padding: 6px 12px; font-weight: bold;">AC</td><td style="border: 1px solid #000; padding: 6px 12px;">27.1 cm</td><td style="border: 1px solid #000; padding: 6px 12px;">31 wks</td><td style="border: 1px solid #000; padding: 6px 12px;">2 days</td></tr>
          <tr><td style="border: 1px solid #000; padding: 6px 12px; font-weight: bold;">FL</td><td style="border: 1px solid #000; padding: 6px 12px;">6.1 cm</td><td style="border: 1px solid #000; padding: 6px 12px;">31 wks</td><td style="border: 1px solid #000; padding: 6px 12px;">5 days</td></tr>
        </tbody>
      </table>
      <p><strong>MGA Fetus A:</strong> 31 wks 6 day &nbsp;&nbsp;&nbsp;&nbsp; <strong>Estimated Fetal Weight:</strong> 1789 gm (±10%)</p>
      <h4>FETUS – B (Towards Maternal Left)</h4>
      <p>Presentation: Cephalic lie. Fetal cardiac activity regular (FHR: 136 BPM). Spontaneous fetal movements seen.</p>
      <table style="width: 100%; border-collapse: collapse; margin-top: 8px; margin-bottom: 12px; border: 1px solid #000;">
        <tbody>
          <tr><td style="border: 1px solid #000; padding: 6px 12px; font-weight: bold; width: 25%;">BPD</td><td style="border: 1px solid #000; padding: 6px 12px; width: 25%;">8.0 cm</td><td style="border: 1px solid #000; padding: 6px 12px; width: 25%;">32 wks</td><td style="border: 1px solid #000; padding: 6px 12px; width: 25%;">1 days</td></tr>
          <tr><td style="border: 1px solid #000; padding: 6px 12px; font-weight: bold;">HC</td><td style="border: 1px solid #000; padding: 6px 12px;">28.9 cm</td><td style="border: 1px solid #000; padding: 6px 12px;">31 wks</td><td style="border: 1px solid #000; padding: 6px 12px;">6 days</td></tr>
          <tr><td style="border: 1px solid #000; padding: 6px 12px; font-weight: bold;">AC</td><td style="border: 1px solid #000; padding: 6px 12px;">27.2 cm</td><td style="border: 1px solid #000; padding: 6px 12px;">31 wks</td><td style="border: 1px solid #000; padding: 6px 12px;">2 days</td></tr>
          <tr><td style="border: 1px solid #000; padding: 6px 12px; font-weight: bold;">FL</td><td style="border: 1px solid #000; padding: 6px 12px;">6.1 cm</td><td style="border: 1px solid #000; padding: 6px 12px;">31 wks</td><td style="border: 1px solid #000; padding: 6px 12px;">5 days</td></tr>
        </tbody>
      </table>
      <p><strong>MGA Fetus B:</strong> 31 wks 6 day &nbsp;&nbsp;&nbsp;&nbsp; <strong>Estimated Fetal Weight:</strong> 1796 gm (±10%)</p>
      <p>Placenta is anterior more towards right, grade II maturity, well away from os. Internal os is closed. Liquor is adequate in both sacs.</p>
      <p style="font-size: 0.9em; margin-top: 14px; color: #333;">(It must be noted that detailed fetal anatomy may not always be visible due to technical difficulties related to fetal position, amniotic fluid volume, fetal movement and abdominal wall thickness. Therefore, all fetal anomalies may not necessarily be detected at every examination).</p>
      <p style="font-size: 0.9em; font-weight: bold; color: #111;">I, Dr. SHRUTI KUCHARIYA declare that while conducting USG on MRS. I have neither detected nor disclosed the sex of her fetus to anybody in any manner.</p>
    `,
    defaultImpression: 'Twin live monochorionic diamniotic intrauterine fetuses of average gestational age 31-32 weeks with adequate growth concordance.',
    defaultRecommendations: 'Follow-up scan after 2-3 weeks for interval growth monitoring.'
  },
  {
    id: 'tpl-twins-obst-doppler',
    name: 'TWIN OBSTETRICS COLOR DOPPLER',
    category: 'Radiology',
    department: 'Obstetric Ultrasound',
    htmlContent: `
      <h3>TWIN OBSTETRICS COLOR DOPPLER</h3>
      <p><strong>LMP:</strong> 10/12/2023 &nbsp;&nbsp;&nbsp;&nbsp; <strong>GA BY LMP:</strong> 35 weeks 5 days &nbsp;&nbsp;&nbsp;&nbsp; <strong>EDD BY LMP:</strong> 15/09/2024</p>
      <p>Gravid uterus reveals twin live fetuses with Fetus A in cephalic presentation and Fetus B in transverse lie:</p>
      <h4>FETUS – A (Maternal Left)</h4>
      <table style="width: 100%; border-collapse: collapse; margin-top: 8px; margin-bottom: 12px; border: 1px solid #000;">
        <tbody>
          <tr><td style="border: 1px solid #000; padding: 6px 12px; font-weight: bold; width: 25%;">BPD</td><td style="border: 1px solid #000; padding: 6px 12px; width: 25%;">8.9 cm</td><td style="border: 1px solid #000; padding: 6px 12px; width: 25%;">36 wks</td><td style="border: 1px solid #000; padding: 6px 12px; width: 25%;">0 days</td></tr>
          <tr><td style="border: 1px solid #000; padding: 6px 12px; font-weight: bold;">HC</td><td style="border: 1px solid #000; padding: 6px 12px;">32.1 cm</td><td style="border: 1px solid #000; padding: 6px 12px;">36 wks</td><td style="border: 1px solid #000; padding: 6px 12px;">2 days</td></tr>
          <tr><td style="border: 1px solid #000; padding: 6px 12px; font-weight: bold;">AC</td><td style="border: 1px solid #000; padding: 6px 12px;">30.3 cm</td><td style="border: 1px solid #000; padding: 6px 12px;">34 wks</td><td style="border: 1px solid #000; padding: 6px 12px;">2 days</td></tr>
          <tr><td style="border: 1px solid #000; padding: 6px 12px; font-weight: bold;">FL</td><td style="border: 1px solid #000; padding: 6px 12px;">6.9 cm</td><td style="border: 1px solid #000; padding: 6px 12px;">35 wks</td><td style="border: 1px solid #000; padding: 6px 12px;">3 days</td></tr>
        </tbody>
      </table>
      <p><strong>MGA Fetus A:</strong> 35 wks 4 day &nbsp;&nbsp;&nbsp;&nbsp; <strong>FHR:</strong> 154 BPM &nbsp;&nbsp;&nbsp;&nbsp; <strong>AFI:</strong> 6-7 cm &nbsp;&nbsp;&nbsp;&nbsp; <strong>EFW:</strong> 2390 gm (±10%)</p>
      <h4>FETUS – B (Maternal Right)</h4>
      <table style="width: 100%; border-collapse: collapse; margin-top: 8px; margin-bottom: 12px; border: 1px solid #000;">
        <tbody>
          <tr><td style="border: 1px solid #000; padding: 6px 12px; font-weight: bold; width: 25%;">BPD</td><td style="border: 1px solid #000; padding: 6px 12px; width: 25%;">8.5 cm</td><td style="border: 1px solid #000; padding: 6px 12px; width: 25%;">34 wks</td><td style="border: 1px solid #000; padding: 6px 12px; width: 25%;">2 days</td></tr>
          <tr><td style="border: 1px solid #000; padding: 6px 12px; font-weight: bold;">HC</td><td style="border: 1px solid #000; padding: 6px 12px;">31.4 cm</td><td style="border: 1px solid #000; padding: 6px 12px;">35 wks</td><td style="border: 1px solid #000; padding: 6px 12px;">0 days</td></tr>
          <tr><td style="border: 1px solid #000; padding: 6px 12px; font-weight: bold;">AC</td><td style="border: 1px solid #000; padding: 6px 12px;">29.4 cm</td><td style="border: 1px solid #000; padding: 6px 12px;">33 wks</td><td style="border: 1px solid #000; padding: 6px 12px;">2 days</td></tr>
          <tr><td style="border: 1px solid #000; padding: 6px 12px; font-weight: bold;">FL</td><td style="border: 1px solid #000; padding: 6px 12px;">6.6 cm</td><td style="border: 1px solid #000; padding: 6px 12px;">34 wks</td><td style="border: 1px solid #000; padding: 6px 12px;">0 days</td></tr>
        </tbody>
      </table>
      <p><strong>MGA Fetus B:</strong> 34 wks 0 day &nbsp;&nbsp;&nbsp;&nbsp; <strong>FHR:</strong> 142 BPM &nbsp;&nbsp;&nbsp;&nbsp; <strong>AFI:</strong> 6-7 cm &nbsp;&nbsp;&nbsp;&nbsp; <strong>EFW:</strong> 2150 gm (±10%)</p>
      <h4>TWIN COLOR DOPPLER INDICES</h4>
      <table style="width: 100%; border-collapse: collapse; margin-top: 8px; margin-bottom: 12px; border: 1px solid #000;">
        <thead>
          <tr style="background-color: #f1f5f9; border-bottom: 1px solid #000;">
            <th style="border: 1px solid #000; padding: 6px 10px; text-align: left; font-weight: bold;">Vessel / Parameter</th>
            <th style="border: 1px solid #000; padding: 6px 10px; text-align: center; font-weight: bold;">Fetus A (PI / RI)</th>
            <th style="border: 1px solid #000; padding: 6px 10px; text-align: center; font-weight: bold;">Fetus B (PI / RI)</th>
            <th style="border: 1px solid #000; padding: 6px 10px; text-align: center; font-weight: bold;">Remarks</th>
          </tr>
        </thead>
        <tbody>
          <tr><td style="border: 1px solid #000; padding: 6px 10px; font-weight: bold;">Umbilical Artery</td><td style="border: 1px solid #000; padding: 6px 10px; text-align: center;">0.82 / 0.52</td><td style="border: 1px solid #000; padding: 6px 10px; text-align: center;">0.85 / 0.54</td><td style="border: 1px solid #000; padding: 6px 10px; text-align: center;">Normal forward diastolic flow</td></tr>
          <tr><td style="border: 1px solid #000; padding: 6px 10px; font-weight: bold;">Middle Cerebral Artery (MCA)</td><td style="border: 1px solid #000; padding: 6px 10px; text-align: center;">1.58 / 0.78</td><td style="border: 1px solid #000; padding: 6px 10px; text-align: center;">1.62 / 0.80</td><td style="border: 1px solid #000; padding: 6px 10px; text-align: center;">Normal resistance, no sparing</td></tr>
          <tr><td style="border: 1px solid #000; padding: 6px 10px; font-weight: bold;">Ductus Venosus / CPR</td><td style="border: 1px solid #000; padding: 6px 10px; text-align: center;">Positive a-wave / 1.9</td><td style="border: 1px solid #000; padding: 6px 10px; text-align: center;">Positive a-wave / 1.9</td><td style="border: 1px solid #000; padding: 6px 10px; text-align: center;">Normal hemodynamic status</td></tr>
        </tbody>
      </table>
      <p style="font-size: 0.9em; margin-top: 14px; color: #333;">(It must be noted that detailed fetal anatomy may not always be visible due to technical difficulties related to fetal position, amniotic fluid volume, fetal movement and abdominal wall thickness. Therefore, all fetal anomalies may not necessarily be detected at every examination).</p>
      <p style="font-size: 0.9em; font-weight: bold; color: #111;">I, Dr. SHRUTI KUCHARIYA declare that while conducting USG on MRS. I have neither detected nor disclosed the sex of her fetus to anybody in any manner.</p>
    `,
    defaultImpression: 'Twin live intrauterine fetuses of average gestational age 34-36 weeks with normal biophysical profile and normal Doppler waveform indices in both fetuses.',
    defaultRecommendations: 'Close clinical monitoring and antenatal follow-up.'
  },
  {
    id: 'tpl-usg-obst-growth-scan',
    name: 'OBSTETRIC SONOGRAPHY (USG OBST GROWTH SCAN)',
    category: 'Radiology',
    department: 'Obstetric Ultrasound',
    htmlContent: `
      <h3>OBSTETRIC SONOGRAPHY</h3>
      <p><strong>LMP –</strong> 27/05/2026 &nbsp;&nbsp;&nbsp;&nbsp; <strong>GA:-</strong> 25 wks 0 days &nbsp;&nbsp;&nbsp;&nbsp; <strong>EDD BY LMP –</strong> 03/03/2027</p>
      <p>This examination shows a single live intra uterine fetus in breech presentation at the time of scanning.</p>
      <p>The placenta is posterior in position, grade I maturation with completely covering the internal os of cervix s/o placenta previa at present scan.</p>
      <p>Cervical length is normal.</p>
      <p>Amount of liquor is adequate for gestational age.</p>
      <p>Fetal cardiac activity is regular and normal. Spontaneous Fetal Movements are well appreciated.<br/>
      <strong>FHR –</strong> 144 BPM.</p>
      <p><strong>The fetal growth parameters are as follows :</strong></p>
      <table style="width: 100%; border-collapse: collapse; margin-top: 8px; margin-bottom: 12px; border: 1px solid #000;">
        <tbody>
          <tr>
            <td style="border: 1px solid #000; padding: 6px 12px; font-weight: bold; width: 25%;">BPD</td>
            <td style="border: 1px solid #000; padding: 6px 12px; width: 25%;">6.0 cm</td>
            <td style="border: 1px solid #000; padding: 6px 12px; width: 25%;">24 wks</td>
            <td style="border: 1px solid #000; padding: 6px 12px; width: 25%;">5 days</td>
          </tr>
          <tr>
            <td style="border: 1px solid #000; padding: 6px 12px; font-weight: bold;">HC</td>
            <td style="border: 1px solid #000; padding: 6px 12px;">22.7 cm</td>
            <td style="border: 1px solid #000; padding: 6px 12px;">24 wks</td>
            <td style="border: 1px solid #000; padding: 6px 12px;">6 days</td>
          </tr>
          <tr>
            <td style="border: 1px solid #000; padding: 6px 12px; font-weight: bold;">AC</td>
            <td style="border: 1px solid #000; padding: 6px 12px;">20.0 cm</td>
            <td style="border: 1px solid #000; padding: 6px 12px;">24 wks</td>
            <td style="border: 1px solid #000; padding: 6px 12px;">5 days</td>
          </tr>
          <tr>
            <td style="border: 1px solid #000; padding: 6px 12px; font-weight: bold;">FL</td>
            <td style="border: 1px solid #000; padding: 6px 12px;">4.5 cm</td>
            <td style="border: 1px solid #000; padding: 6px 12px;">25 wks</td>
            <td style="border: 1px solid #000; padding: 6px 12px;">1 days</td>
          </tr>
        </tbody>
      </table>
      <p><strong>MGA :</strong> 24 wks 6 day.<br/>
      <strong>Estimated fetal weight is</strong> 744 gm&plusmn; 109 gms .<br/>
      <strong>EDD BY USG:-</strong> 04/03/2027</p>
      <p><strong>Advice follow up.</strong><br/>
      <strong>This is not anomaly scan.</strong></p>
      <p style="font-size: 0.9em; margin-top: 14px; color: #333;">(It must be noted that detailed fetal anatomy may not always be visible due to technical difficulties related to fetal position, amniotic fluid volume, fetal movement and abdominal wall thickness. Therefore, all fetal anomalies may not necessarily be detected at every examination).</p>
      <p style="font-size: 0.9em; font-weight: bold; color: #111;">I, Dr. SHRUTI KUCHARIYA declare that while conducting USG on MRS. I have neither detected nor disclosed the sex of her fetus to anybody in any manner.</p>
    `,
    defaultImpression: 'Single live intrauterine fetus of estimated gestational age of 24 wks 6 days ± 1 wks.',
    defaultRecommendations: 'Advice follow up. This is not anomaly scan.'
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
    id: 'tpl-usg-carotid-doppler',
    name: 'CAROTID COLOR DOPPLER STUDY',
    category: 'Radiology',
    department: 'Vascular Doppler',
    htmlContent: `
      <h3>CAROTID COLOR DOPPLER STUDY</h3>
      <p>High-resolution real-time B-mode and colour spectral Doppler examination of bilateral carotid arterial system was performed:</p>
      <table style="width: 100%; border-collapse: collapse; margin-top: 8px; margin-bottom: 12px; border: 1px solid #000;">
        <thead>
          <tr style="background-color: #f1f5f9; border-bottom: 1px solid #000;">
            <th style="border: 1px solid #000; padding: 6px 10px; text-align: left; font-weight: bold;">Parameter</th>
            <th style="border: 1px solid #000; padding: 6px 10px; text-align: center; font-weight: bold;">RIGHT CAROTID</th>
            <th style="border: 1px solid #000; padding: 6px 10px; text-align: center; font-weight: bold;">LEFT CAROTID</th>
          </tr>
        </thead>
        <tbody>
          <tr><td style="border: 1px solid #000; padding: 6px 10px; font-weight: bold;">CIMT (Intima-Media Thickness)</td><td style="border: 1px solid #000; padding: 6px 10px; text-align: center;">0.6 mm</td><td style="border: 1px solid #000; padding: 6px 10px; text-align: center;">0.6 mm</td></tr>
          <tr><td style="border: 1px solid #000; padding: 6px 10px; font-weight: bold;">CCA-PSV (Common Carotid Artery)</td><td style="border: 1px solid #000; padding: 6px 10px; text-align: center;">75 cm/sec</td><td style="border: 1px solid #000; padding: 6px 10px; text-align: center;">78 cm/sec</td></tr>
          <tr><td style="border: 1px solid #000; padding: 6px 10px; font-weight: bold;">ICA-PSV (Internal Carotid Artery)</td><td style="border: 1px solid #000; padding: 6px 10px; text-align: center;">68 cm/sec</td><td style="border: 1px solid #000; padding: 6px 10px; text-align: center;">72 cm/sec</td></tr>
          <tr><td style="border: 1px solid #000; padding: 6px 10px; font-weight: bold;">ECA-PSV (External Carotid Artery)</td><td style="border: 1px solid #000; padding: 6px 10px; text-align: center;">85 cm/sec</td><td style="border: 1px solid #000; padding: 6px 10px; text-align: center;">82 cm/sec</td></tr>
          <tr><td style="border: 1px solid #000; padding: 6px 10px; font-weight: bold;">ICA-EDV (End Diastolic Velocity)</td><td style="border: 1px solid #000; padding: 6px 10px; text-align: center;">25 cm/sec</td><td style="border: 1px solid #000; padding: 6px 10px; text-align: center;">26 cm/sec</td></tr>
          <tr><td style="border: 1px solid #000; padding: 6px 10px; font-weight: bold;">ICA / CCA PSV Ratio</td><td style="border: 1px solid #000; padding: 6px 10px; text-align: center;">0.90</td><td style="border: 1px solid #000; padding: 6px 10px; text-align: center;">0.92</td></tr>
        </tbody>
      </table>
      <p>Bilateral common carotid arteries, carotid bulbs, external and internal carotid arteries reveal normal caliber and course. No evidence of significant atherosclerotic plaque or hemodynamic stenosis seen. Bilateral vertebral arteries demonstrate normal antegrade flow with normal spectral waveforms.</p>
    `,
    defaultImpression: 'Normal bilateral carotid and vertebral Doppler study. No evidence of significant stenosis or hemodynamically significant plaque.',
    defaultRecommendations: 'Clinical correlation suggested.'
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
    id: "tpl-usg-kub-female",
    name: "USG KUB & PELVIS FEMALE",
    category: "Radiology",
    department: "Sonography / USG",
    htmlContent: `<h3>SONOGRAPHY - KUB & PELVIS (FEMALE)</h3>
<ul>
  <li><strong>Kidneys:</strong> Both kidneys are normal in size, position, shape, and cortical echogenicity. Corticomedullary differentiation is well preserved. No evidence of renal calculus, hydronephrosis, or focal mass lesion. Pelvicalyceal systems are undilated bilaterally.</li>
  <li><strong>Ureters:</strong> Both ureters are undilated without acoustic shadowing or calculus.</li>
  <li><strong>Urinary Bladder:</strong> Well distended with smooth mucosal contours and uniform wall thickness. Luminal contents are completely anechoic. No vesical calculus, diverticulum, or mass lesion.</li>
  <li><strong>Pelvic Organs:</strong> Visualized uterus is normal in size and uniform myometrial echotexture. Bilateral ovaries and adnexa appear unremarkable. No adnexal cyst or free pelvic fluid in P.O.D.</li>
</ul>`,
    defaultImpression: "Normal ultrasound examination of KUB & Pelvis in female patient. No evidence of nephrolithiasis, obstructive uropathy, or pelvic mass.",
    defaultRecommendations: "Clinical correlation recommended."
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
    id: 'tpl-usg-nt-scan-for-twin',
    name: 'USG NT SCAN FOR TWIN',
    category: 'Radiology',
    department: 'Obstetric Ultrasound',
    htmlContent: `
      <h3>OBSTETRIC SONOGRAPHY NT SCAN FOR TWIN</h3>
      <p><strong>LMP:</strong> 10/12/2023 &nbsp;&nbsp;&nbsp;&nbsp; <strong>GA BY LMP:</strong> 12 wks 6 day &nbsp;&nbsp;&nbsp;&nbsp; <strong>EDD BY LMP:</strong> 15/09/2024</p>
      <p>This examination shows twin live dichorionic diamniotic intra uterine fetuses in changing presentation.</p>
      <p>The placenta of both fetuses is seen forming anteriorly and away from internal OS. Internal OS is closed. Amount of liquor is adequate for gestational age in both fetuses.</p>
      <p><strong>Early Fetal Biometry & NT Markers (Twin Comparison):</strong></p>
      <table style="width: 100%; border-collapse: collapse; margin-top: 8px; margin-bottom: 12px; border: 1px solid #000;">
        <thead>
          <tr style="background-color: #f1f5f9; border-bottom: 1px solid #000;">
            <th style="border: 1px solid #000; padding: 6px 10px; text-align: left; font-weight: bold;">Parameters</th>
            <th style="border: 1px solid #000; padding: 6px 10px; text-align: center; font-weight: bold;">Twin I</th>
            <th style="border: 1px solid #000; padding: 6px 10px; text-align: center; font-weight: bold;">Twin II</th>
          </tr>
        </thead>
        <tbody>
          <tr><td style="border: 1px solid #000; padding: 6px 10px; font-weight: bold;">Crown Rump Length (CRL)</td><td style="border: 1px solid #000; padding: 6px 10px; text-align: center;">6.39 cm (12 wks 6 d)</td><td style="border: 1px solid #000; padding: 6px 10px; text-align: center;">6.30 cm (12 wks 5 d)</td></tr>
          <tr><td style="border: 1px solid #000; padding: 6px 10px; font-weight: bold;">Femur Length (FL)</td><td style="border: 1px solid #000; padding: 6px 10px; text-align: center;">0.9 cm (12 wks 6 d)</td><td style="border: 1px solid #000; padding: 6px 10px; text-align: center;">0.9 cm (12 wks 6 d)</td></tr>
          <tr><td style="border: 1px solid #000; padding: 6px 10px; font-weight: bold;">Nuchal Translucency (NT)</td><td style="border: 1px solid #000; padding: 6px 10px; text-align: center;">2.0 mm (Normal)</td><td style="border: 1px solid #000; padding: 6px 10px; text-align: center;">2.0 mm (Normal)</td></tr>
          <tr><td style="border: 1px solid #000; padding: 6px 10px; font-weight: bold;">Nasal Bone</td><td style="border: 1px solid #000; padding: 6px 10px; text-align: center;">Visualized</td><td style="border: 1px solid #000; padding: 6px 10px; text-align: center;">Visualized</td></tr>
          <tr><td style="border: 1px solid #000; padding: 6px 10px; font-weight: bold;">Fetal Heart Rate (FHR)</td><td style="border: 1px solid #000; padding: 6px 10px; text-align: center;">156 BPM</td><td style="border: 1px solid #000; padding: 6px 10px; text-align: center;">158 BPM</td></tr>
        </tbody>
      </table>
      <p>Premaxillary triangle and mandibular gap sign seen in both fetuses. Fetal skull, lateral ventricles, stomach bubble and intact anterior abdominal wall visualized in both fetuses. Three-vessel umbilical cord and normal ductus venosus flow spectrum seen.</p>
      <p><strong>Cervical length:</strong> 3.4 cm &nbsp;&nbsp;&nbsp;&nbsp; <strong>EDD by USG:</strong> 15/09/2024</p>
      <p style="font-size: 0.9em; margin-top: 14px; color: #333;">(It must be noted that detailed fetal anatomy may not always be visible due to technical difficulties related to fetal position, amniotic fluid volume, fetal movement and abdominal wall thickness. Therefore, all fetal anomalies may not necessarily be detected at every examination).</p>
      <p style="font-size: 0.9em; font-weight: bold; color: #111;">I, Dr. SHRUTI KUCHARIYA declare that while conducting USG on MRS. I have neither detected nor disclosed the sex of her fetus to anybody in any manner.</p>
    `,
    defaultImpression: 'Twin live dichorionic diamniotic intra uterine fetuses of gestational age 12 wks 6 days ± 1 wk. NT of both fetuses within normal limits.',
    defaultRecommendations: 'Suggested target / anomaly scan between 19 to 22 weeks.'
  },
  {
    id: 'tpl-usg-nt-scan',
    name: 'USG NT SCAN (FIRST TRIMESTER SCREENING)',
    category: 'Radiology',
    department: 'Obstetric Ultrasound',
    htmlContent: `
      <h3>OBSTETRIC SONOGRAPHY NT SCAN (11 - 13+6 WEEKS)</h3>
      <p><strong>LMP:</strong> &nbsp;&nbsp;&nbsp;&nbsp; <strong>GA BY LMP:</strong> &nbsp;&nbsp; wks &nbsp;&nbsp; day &nbsp;&nbsp;&nbsp;&nbsp; <strong>EDD BY LMP:</strong></p>
      <p>This examination shows single live intra uterine fetus in changing presentation.</p>
      <p>The placenta is seen forming away from internal OS. Internal OS is closed. Cervical length measures … cm. Amount of liquor is adequate for gestational age.</p>
      <p>Fetal cardiac activity is regular and normal. Spontaneous fetal movements are well appreciated (FHR: … BPM).</p>
      <p><strong>Early Fetal Biometry & Aneuploidy Markers :</strong></p>
      <table style="width: 100%; border-collapse: collapse; margin-top: 8px; margin-bottom: 12px; border: 1px solid #000;">
        <thead>
          <tr style="background-color: #f1f5f9; border-bottom: 1px solid #000;">
            <th style="border: 1px solid #000; padding: 6px 10px; text-align: left; font-weight: bold;">Parameter</th>
            <th style="border: 1px solid #000; padding: 6px 10px; text-align: left; font-weight: bold;">Measurement</th>
            <th style="border: 1px solid #000; padding: 6px 10px; text-align: left; font-weight: bold;">Corresponding Gestational Age</th>
          </tr>
        </thead>
        <tbody>
          <tr><td style="border: 1px solid #000; padding: 6px 10px; font-weight: bold;">Crown Rump Length (CRL)</td><td style="border: 1px solid #000; padding: 6px 10px;">&nbsp; cm</td><td style="border: 1px solid #000; padding: 6px 10px;">&nbsp; wks &nbsp; days</td></tr>
          <tr><td style="border: 1px solid #000; padding: 6px 10px; font-weight: bold;">Biparietal Diameter (BPD)</td><td style="border: 1px solid #000; padding: 6px 10px;">&nbsp; cm</td><td style="border: 1px solid #000; padding: 6px 10px;">&nbsp; wks &nbsp; days</td></tr>
          <tr><td style="border: 1px solid #000; padding: 6px 10px; font-weight: bold;">Nuchal Translucency (NT)</td><td style="border: 1px solid #000; padding: 6px 10px; font-weight: bold;">&nbsp; mm</td><td style="border: 1px solid #000; padding: 6px 10px;">Normal Range (&lt; 2.5 mm)</td></tr>
          <tr><td style="border: 1px solid #000; padding: 6px 10px; font-weight: bold;">Nasal Bone</td><td style="border: 1px solid #000; padding: 6px 10px;">Present</td><td style="border: 1px solid #000; padding: 6px 10px;">Normal marker</td></tr>
        </tbody>
      </table>
      <p><strong>First Trimester Anatomy Survey:</strong></p>
      <ul>
        <li>Fetal skull contour and midline falx are normal. Lateral ventricles visualized.</li>
        <li>Premaxillary triangle and mandibular gap sign seen. Facial profile normal.</li>
        <li>Fetal heart rate and 4 chamber view visualized. Stomach bubble seen in left upper quadrant.</li>
        <li>Anterior abdominal wall is intact with normal cord insertion. Both upper and lower limb buds identified.</li>
        <li>Ductus venosus shows normal triphasic flow with positive 'a' wave. Tricuspid regurgitation is absent.</li>
      </ul>
      <p><strong>EDD by USG:</strong></p>
      <p style="font-size: 0.9em; margin-top: 14px; color: #333;">(It must be noted that detailed fetal anatomy may not always be visible due to technical difficulties related to fetal position, amniotic fluid volume, fetal movement and abdominal wall thickness. Therefore, all fetal anomalies may not necessarily be detected at every examination).</p>
      <p style="font-size: 0.9em; font-weight: bold; color: #111;">I, Dr. SHRUTI KUCHARIYA declare that while conducting USG on MRS. I have neither detected nor disclosed the sex of her fetus to anybody in any manner.</p>
    `,
    defaultImpression: 'Single live intrauterine fetus of estimated gestational age   wks   days ± 1 wk. Nuchal translucency is normal and nasal bone is present.',
    defaultRecommendations: 'Suggested detailed anomaly / target scan between 18 - 20 weeks.'
  },
  {
    id: 'tpl-usg-obst-doppler',
    name: 'COLOR DOPPLER OBSTETRICS SONOGRAPHY',
    category: 'Radiology',
    department: 'Obstetric Ultrasound',
    htmlContent: `
      <h3>COLOR DOPPLER OBSTETRICS SONOGRAPHY</h3>
      <p><strong>LMP:</strong> &nbsp;&nbsp;&nbsp;&nbsp; <strong>GA BY LMP:</strong> &nbsp;&nbsp; weeks &nbsp;&nbsp; days &nbsp;&nbsp;&nbsp;&nbsp; <strong>EDD BY LMP:</strong></p>
      <p>Gravid uterus reveals single live fetus in cephalic presentation with regular cardiac activity and movements (FHR: … BPM).</p>
      <p>Amniotic fluid is adequate (AFI: … cm). Placenta is posterior & grade II maturity, well away from internal os. Internal os is closed.</p>
      <p><strong>The fetal growth parameters are as follows :</strong></p>
      <table style="width: 100%; border-collapse: collapse; margin-top: 8px; margin-bottom: 12px; border: 1px solid #000;">
        <tbody>
          <tr><td style="border: 1px solid #000; padding: 6px 12px; font-weight: bold; width: 25%;">BPD</td><td style="border: 1px solid #000; padding: 6px 12px; width: 25%;">&nbsp; cm</td><td style="border: 1px solid #000; padding: 6px 12px; width: 25%;">&nbsp; wks</td><td style="border: 1px solid #000; padding: 6px 12px; width: 25%;">&nbsp; days</td></tr>
          <tr><td style="border: 1px solid #000; padding: 6px 12px; font-weight: bold;">HC</td><td style="border: 1px solid #000; padding: 6px 12px;">&nbsp; cm</td><td style="border: 1px solid #000; padding: 6px 12px;">&nbsp; wks</td><td style="border: 1px solid #000; padding: 6px 12px;">&nbsp; days</td></tr>
          <tr><td style="border: 1px solid #000; padding: 6px 12px; font-weight: bold;">AC</td><td style="border: 1px solid #000; padding: 6px 12px;">&nbsp; cm</td><td style="border: 1px solid #000; padding: 6px 12px;">&nbsp; wks</td><td style="border: 1px solid #000; padding: 6px 12px;">&nbsp; days</td></tr>
          <tr><td style="border: 1px solid #000; padding: 6px 12px; font-weight: bold;">FL</td><td style="border: 1px solid #000; padding: 6px 12px;">&nbsp; cm</td><td style="border: 1px solid #000; padding: 6px 12px;">&nbsp; wks</td><td style="border: 1px solid #000; padding: 6px 12px;">&nbsp; days</td></tr>
        </tbody>
      </table>
      <p><strong>MGA :</strong> &nbsp;&nbsp;&nbsp; wks &nbsp;&nbsp; days &nbsp;&nbsp;&nbsp;&nbsp; <strong>Estimated fetal Wt. :</strong> &nbsp;&nbsp;&nbsp; gm (±10%)<br/><strong>EDD BY USG:</strong></p>
      <p><strong>FETAL & UTERINE DOPPLER EVALUATION:</strong></p>
      <table style="width: 100%; border-collapse: collapse; margin-top: 8px; margin-bottom: 12px; border: 1px solid #000;">
        <thead>
          <tr style="background-color: #f1f5f9; border-bottom: 1px solid #000;">
            <th style="border: 1px solid #000; padding: 6px 10px; text-align: left; font-weight: bold;">Vessel</th>
            <th style="border: 1px solid #000; padding: 6px 10px; text-align: center; font-weight: bold;">PI</th>
            <th style="border: 1px solid #000; padding: 6px 10px; text-align: center; font-weight: bold;">RI</th>
            <th style="border: 1px solid #000; padding: 6px 10px; text-align: center; font-weight: bold;">Percentile / Remarks</th>
          </tr>
        </thead>
        <tbody>
          <tr><td style="border: 1px solid #000; padding: 6px 10px; font-weight: bold;">Umbilical Artery</td><td style="border: 1px solid #000; padding: 6px 10px; text-align: center;">0.80</td><td style="border: 1px solid #000; padding: 6px 10px; text-align: center;">0.50</td><td style="border: 1px solid #000; padding: 6px 10px; text-align: center;">Normal</td></tr>
          <tr><td style="border: 1px solid #000; padding: 6px 10px; font-weight: bold;">Middle Cerebral Artery (MCA)</td><td style="border: 1px solid #000; padding: 6px 10px; text-align: center;">1.61</td><td style="border: 1px solid #000; padding: 6px 10px; text-align: center;">0.79</td><td style="border: 1px solid #000; padding: 6px 10px; text-align: center;">Normal</td></tr>
          <tr><td style="border: 1px solid #000; padding: 6px 10px; font-weight: bold;">Uterine Artery (Right)</td><td style="border: 1px solid #000; padding: 6px 10px; text-align: center;">0.77</td><td style="border: 1px solid #000; padding: 6px 10px; text-align: center;">0.52</td><td style="border: 1px solid #000; padding: 6px 10px; text-align: center;">Normal</td></tr>
          <tr><td style="border: 1px solid #000; padding: 6px 10px; font-weight: bold;">Uterine Artery (Left)</td><td style="border: 1px solid #000; padding: 6px 10px; text-align: center;">0.62</td><td style="border: 1px solid #000; padding: 6px 10px; text-align: center;">0.44</td><td style="border: 1px solid #000; padding: 6px 10px; text-align: center;">Normal</td></tr>
        </tbody>
      </table>
      <p><strong>Cerebroplacental Ratio (CPR):</strong> 2.0 (Normal &gt; 1.08)<br/>Ductus venosus shows normal forward flow with positive A wave. Umbilical vein shows normal non-pulsatile flow.</p>
      <p style="font-size: 0.9em; margin-top: 14px; color: #333;">(It must be noted that detailed fetal anatomy may not always be visible due to technical difficulties related to fetal position, amniotic fluid volume, fetal movement and abdominal wall thickness. Therefore, all fetal anomalies may not necessarily be detected at every examination).</p>
      <p style="font-size: 0.9em; font-weight: bold; color: #111;">I, Dr. SHRUTI KUCHARIYA declare that while conducting USG on MRS. I have neither detected nor disclosed the sex of her fetus to anybody in any manner.</p>
    `,
    defaultImpression: 'Single live intrauterine fetus of about   weeks  days (± 2 week) of gestational age. COLOR DOPPLER OBSTETRICS INDICES ARE NORMAL.',
    defaultRecommendations: 'Follow-up growth and Doppler scan as clinically advised.'
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
  {
    id: 'tpl-urine-routine',
    name: 'Urine Routine & Microscopic Examination (Urinalysis)',
    category: 'Pathology',
    department: 'Clinical Pathology',
    htmlContent: `
      <h3>CLINICAL PATHOLOGY - URINE ROUTINE & MICROSCOPY</h3>
      <table style="width: 100%; border: 1px solid #cbd5e1; text-align: left; margin-bottom: 12px;">
        <thead>
          <tr style="background-color: #f1f5f9;">
            <th colspan="4" style="padding: 6px 8px; border: 1px solid #cbd5e1; font-weight: bold; color: #1e293b;">PHYSICAL & CHEMICAL EXAMINATION</th>
          </tr>
          <tr style="background-color: #f8fafc; font-size: 11px;">
            <th style="padding: 6px 8px; border: 1px solid #cbd5e1;">Parameter</th>
            <th style="padding: 6px 8px; border: 1px solid #cbd5e1;">Observed Value</th>
            <th style="padding: 6px 8px; border: 1px solid #cbd5e1;">Biological Reference</th>
            <th style="padding: 6px 8px; border: 1px solid #cbd5e1;">Method</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style="padding: 5px 8px; border: 1px solid #cbd5e1;">Quantity</td>
            <td style="padding: 5px 8px; border: 1px solid #cbd5e1; font-weight: bold;">25</td>
            <td style="padding: 5px 8px; border: 1px solid #cbd5e1;">mL</td>
            <td style="padding: 5px 8px; border: 1px solid #cbd5e1;">Visual</td>
          </tr>
          <tr>
            <td style="padding: 5px 8px; border: 1px solid #cbd5e1;">Colour</td>
            <td style="padding: 5px 8px; border: 1px solid #cbd5e1; font-weight: bold;">Pale Yellow</td>
            <td style="padding: 5px 8px; border: 1px solid #cbd5e1;">Pale Yellow / Straw</td>
            <td style="padding: 5px 8px; border: 1px solid #cbd5e1;">Visual</td>
          </tr>
          <tr>
            <td style="padding: 5px 8px; border: 1px solid #cbd5e1;">Transparency / Appearance</td>
            <td style="padding: 5px 8px; border: 1px solid #cbd5e1; font-weight: bold;">Clear</td>
            <td style="padding: 5px 8px; border: 1px solid #cbd5e1;">Clear</td>
            <td style="padding: 5px 8px; border: 1px solid #cbd5e1;">Visual</td>
          </tr>
          <tr>
            <td style="padding: 5px 8px; border: 1px solid #cbd5e1;">Specific Gravity</td>
            <td style="padding: 5px 8px; border: 1px solid #cbd5e1; font-weight: bold;">1.020</td>
            <td style="padding: 5px 8px; border: 1px solid #cbd5e1;">1.010 - 1.030</td>
            <td style="padding: 5px 8px; border: 1px solid #cbd5e1;">Refractometer</td>
          </tr>
          <tr>
            <td style="padding: 5px 8px; border: 1px solid #cbd5e1;">Reaction (pH)</td>
            <td style="padding: 5px 8px; border: 1px solid #cbd5e1; font-weight: bold;">6.5 (Slightly Acidic)</td>
            <td style="padding: 5px 8px; border: 1px solid #cbd5e1;">4.6 - 8.0</td>
            <td style="padding: 5px 8px; border: 1px solid #cbd5e1;">Strip Indicator</td>
          </tr>
          <tr>
            <td style="padding: 5px 8px; border: 1px solid #cbd5e1;">Urine Protein (Albumin)</td>
            <td style="padding: 5px 8px; border: 1px solid #cbd5e1; font-weight: bold; color: #16a34a;">NIL</td>
            <td style="padding: 5px 8px; border: 1px solid #cbd5e1;">NIL (Negative)</td>
            <td style="padding: 5px 8px; border: 1px solid #cbd5e1;">Colorimetric Strip</td>
          </tr>
          <tr>
            <td style="padding: 5px 8px; border: 1px solid #cbd5e1;">Urine Sugar (Glucose)</td>
            <td style="padding: 5px 8px; border: 1px solid #cbd5e1; font-weight: bold; color: #16a34a;">NIL</td>
            <td style="padding: 5px 8px; border: 1px solid #cbd5e1;">NIL (Negative)</td>
            <td style="padding: 5px 8px; border: 1px solid #cbd5e1;">Enzymatic / Strip</td>
          </tr>
          <tr>
            <td style="padding: 5px 8px; border: 1px solid #cbd5e1;">Ketone Bodies (Acetone)</td>
            <td style="padding: 5px 8px; border: 1px solid #cbd5e1; font-weight: bold;">Negative</td>
            <td style="padding: 5px 8px; border: 1px solid #cbd5e1;">Negative</td>
            <td style="padding: 5px 8px; border: 1px solid #cbd5e1;">Legal's Strip</td>
          </tr>
          <tr>
            <td style="padding: 5px 8px; border: 1px solid #cbd5e1;">Bile Salts & Bile Pigments</td>
            <td style="padding: 5px 8px; border: 1px solid #cbd5e1; font-weight: bold;">Negative</td>
            <td style="padding: 5px 8px; border: 1px solid #cbd5e1;">Negative</td>
            <td style="padding: 5px 8px; border: 1px solid #cbd5e1;">Hay's / Fouchet's</td>
          </tr>
          <tr>
            <td style="padding: 5px 8px; border: 1px solid #cbd5e1;">Urobilinogen</td>
            <td style="padding: 5px 8px; border: 1px solid #cbd5e1; font-weight: bold;">Normal (0.2 mg/dL)</td>
            <td style="padding: 5px 8px; border: 1px solid #cbd5e1;">Normal (&lt; 1.0 mg/dL)</td>
            <td style="padding: 5px 8px; border: 1px solid #cbd5e1;">Ehrlich's Reaction</td>
          </tr>
        </tbody>
      </table>

      <table style="width: 100%; border: 1px solid #cbd5e1; text-align: left;">
        <thead>
          <tr style="background-color: #f1f5f9;">
            <th colspan="4" style="padding: 6px 8px; border: 1px solid #cbd5e1; font-weight: bold; color: #1e293b;">MICROSCOPIC EXAMINATION (Centrifuged Sediment)</th>
          </tr>
          <tr style="background-color: #f8fafc; font-size: 11px;">
            <th style="padding: 6px 8px; border: 1px solid #cbd5e1;">Element</th>
            <th style="padding: 6px 8px; border: 1px solid #cbd5e1;">Observed</th>
            <th style="padding: 6px 8px; border: 1px solid #cbd5e1;">Reference Interval</th>
            <th style="padding: 6px 8px; border: 1px solid #cbd5e1;">Unit</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style="padding: 5px 8px; border: 1px solid #cbd5e1;">Pus Cells (Leucocytes)</td>
            <td style="padding: 5px 8px; border: 1px solid #cbd5e1; font-weight: bold;">1 - 2</td>
            <td style="padding: 5px 8px; border: 1px solid #cbd5e1;">0 - 5</td>
            <td style="padding: 5px 8px; border: 1px solid #cbd5e1;">/ HPF</td>
          </tr>
          <tr>
            <td style="padding: 5px 8px; border: 1px solid #cbd5e1;">Red Blood Cells (RBCs)</td>
            <td style="padding: 5px 8px; border: 1px solid #cbd5e1; font-weight: bold;">NIL</td>
            <td style="padding: 5px 8px; border: 1px solid #cbd5e1;">0 - 2</td>
            <td style="padding: 5px 8px; border: 1px solid #cbd5e1;">/ HPF</td>
          </tr>
          <tr>
            <td style="padding: 5px 8px; border: 1px solid #cbd5e1;">Epithelial Cells</td>
            <td style="padding: 5px 8px; border: 1px solid #cbd5e1; font-weight: bold;">2 - 4</td>
            <td style="padding: 5px 8px; border: 1px solid #cbd5e1;">Occasional (0 - 5)</td>
            <td style="padding: 5px 8px; border: 1px solid #cbd5e1;">/ HPF</td>
          </tr>
          <tr>
            <td style="padding: 5px 8px; border: 1px solid #cbd5e1;">Casts</td>
            <td style="padding: 5px 8px; border: 1px solid #cbd5e1; font-weight: bold;">Not Seen</td>
            <td style="padding: 5px 8px; border: 1px solid #cbd5e1;">Absent</td>
            <td style="padding: 5px 8px; border: 1px solid #cbd5e1;">/ LPF</td>
          </tr>
          <tr>
            <td style="padding: 5px 8px; border: 1px solid #cbd5e1;">Crystals</td>
            <td style="padding: 5px 8px; border: 1px solid #cbd5e1; font-weight: bold;">Not Seen</td>
            <td style="padding: 5px 8px; border: 1px solid #cbd5e1;">Absent</td>
            <td style="padding: 5px 8px; border: 1px solid #cbd5e1;">/ HPF</td>
          </tr>
          <tr>
            <td style="padding: 5px 8px; border: 1px solid #cbd5e1;">Bacteria / Yeast</td>
            <td style="padding: 5px 8px; border: 1px solid #cbd5e1; font-weight: bold;">Absent</td>
            <td style="padding: 5px 8px; border: 1px solid #cbd5e1;">Absent</td>
            <td style="padding: 5px 8px; border: 1px solid #cbd5e1;">/ HPF</td>
          </tr>
        </tbody>
      </table>
    `,
    defaultImpression: 'Routine and microscopic examination of urine is within physiological biological reference intervals. No active urinary sediment or signs of acute UTI.',
    defaultRecommendations: 'Please correlate with clinical presentation.'
  },
  {
    id: 'tpl-kft-biochem',
    name: 'Kidney Function Test (KFT / Renal Profile)',
    category: 'Pathology',
    department: 'Biochemistry',
    htmlContent: `
      <h3>BIOCHEMISTRY REPORT - KIDNEY FUNCTION TEST (KFT / RFT)</h3>
      <table style="width: 100%; border: 1px solid #cbd5e1; text-align: left;">
        <thead>
          <tr style="background-color: #f1f5f9;">
            <th style="padding: 8px; border: 1px solid #cbd5e1;">Test Parameter</th>
            <th style="padding: 8px; border: 1px solid #cbd5e1;">Observed Value</th>
            <th style="padding: 8px; border: 1px solid #cbd5e1;">Unit</th>
            <th style="padding: 8px; border: 1px solid #cbd5e1;">Biological Reference Interval</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style="padding: 6px 8px; border: 1px solid #cbd5e1;"><strong>Blood Urea</strong></td>
            <td style="padding: 6px 8px; border: 1px solid #cbd5e1; font-weight: bold; color: #0284c7;">24.0</td>
            <td style="padding: 6px 8px; border: 1px solid #cbd5e1;">mg/dL</td>
            <td style="padding: 6px 8px; border: 1px solid #cbd5e1;">15.0 - 45.0</td>
          </tr>
          <tr>
            <td style="padding: 6px 8px; border: 1px solid #cbd5e1;"><strong>Serum Creatinine</strong></td>
            <td style="padding: 6px 8px; border: 1px solid #cbd5e1; font-weight: bold; color: #0284c7;">0.95</td>
            <td style="padding: 6px 8px; border: 1px solid #cbd5e1;">mg/dL</td>
            <td style="padding: 6px 8px; border: 1px solid #cbd5e1;">0.70 - 1.30 (Male) / 0.50 - 1.10 (Female)</td>
          </tr>
          <tr>
            <td style="padding: 6px 8px; border: 1px solid #cbd5e1;">Blood Urea Nitrogen (BUN)</td>
            <td style="padding: 6px 8px; border: 1px solid #cbd5e1; font-weight: bold;">11.2</td>
            <td style="padding: 6px 8px; border: 1px solid #cbd5e1;">mg/dL</td>
            <td style="padding: 6px 8px; border: 1px solid #cbd5e1;">7.0 - 20.0</td>
          </tr>
          <tr>
            <td style="padding: 6px 8px; border: 1px solid #cbd5e1;">BUN / Creatinine Ratio</td>
            <td style="padding: 6px 8px; border: 1px solid #cbd5e1; font-weight: bold;">11.8</td>
            <td style="padding: 6px 8px; border: 1px solid #cbd5e1;">Ratio</td>
            <td style="padding: 6px 8px; border: 1px solid #cbd5e1;">10.0 - 20.0</td>
          </tr>
          <tr>
            <td style="padding: 6px 8px; border: 1px solid #cbd5e1;"><strong>Serum Uric Acid</strong></td>
            <td style="padding: 6px 8px; border: 1px solid #cbd5e1; font-weight: bold; color: #0284c7;">5.1</td>
            <td style="padding: 6px 8px; border: 1px solid #cbd5e1;">mg/dL</td>
            <td style="padding: 6px 8px; border: 1px solid #cbd5e1;">3.5 - 7.2 (Male) / 2.6 - 6.0 (Female)</td>
          </tr>
          <tr>
            <td style="padding: 6px 8px; border: 1px solid #cbd5e1;">Serum Calcium (Total)</td>
            <td style="padding: 6px 8px; border: 1px solid #cbd5e1; font-weight: bold;">9.4</td>
            <td style="padding: 6px 8px; border: 1px solid #cbd5e1;">mg/dL</td>
            <td style="padding: 6px 8px; border: 1px solid #cbd5e1;">8.8 - 10.6</td>
          </tr>
          <tr>
            <td style="padding: 6px 8px; border: 1px solid #cbd5e1;">Serum Sodium (Na+)</td>
            <td style="padding: 6px 8px; border: 1px solid #cbd5e1; font-weight: bold;">141.0</td>
            <td style="padding: 6px 8px; border: 1px solid #cbd5e1;">mEq/L</td>
            <td style="padding: 6px 8px; border: 1px solid #cbd5e1;">136.0 - 145.0</td>
          </tr>
          <tr>
            <td style="padding: 6px 8px; border: 1px solid #cbd5e1;">Serum Potassium (K+)</td>
            <td style="padding: 6px 8px; border: 1px solid #cbd5e1; font-weight: bold;">4.3</td>
            <td style="padding: 6px 8px; border: 1px solid #cbd5e1;">mEq/L</td>
            <td style="padding: 6px 8px; border: 1px solid #cbd5e1;">3.5 - 5.1</td>
          </tr>
          <tr>
            <td style="padding: 6px 8px; border: 1px solid #cbd5e1;">Serum Chloride (Cl-)</td>
            <td style="padding: 6px 8px; border: 1px solid #cbd5e1; font-weight: bold;">102.0</td>
            <td style="padding: 6px 8px; border: 1px solid #cbd5e1;">mEq/L</td>
            <td style="padding: 6px 8px; border: 1px solid #cbd5e1;">98.0 - 107.0</td>
          </tr>
        </tbody>
      </table>
    `,
    defaultImpression: 'Renal parameters and serum electrolytes are within normal physiological reference intervals.',
    defaultRecommendations: 'Clinical correlation recommended.'
  },
  {
    id: 'tpl-thyroid-profile',
    name: 'Thyroid Function Test (Total T3, Total T4, TSH)',
    category: 'Pathology',
    department: 'Biochemistry / Endocrinology',
    htmlContent: `
      <h3>ENDOCRINOLOGY - THYROID PROFILE (CLIA METHOD)</h3>
      <table style="width: 100%; border: 1px solid #cbd5e1; text-align: left;">
        <thead>
          <tr style="background-color: #f1f5f9;">
            <th style="padding: 8px; border: 1px solid #cbd5e1;">Investigation Parameter</th>
            <th style="padding: 8px; border: 1px solid #cbd5e1;">Observed Value</th>
            <th style="padding: 8px; border: 1px solid #cbd5e1;">Unit</th>
            <th style="padding: 8px; border: 1px solid #cbd5e1;">Reference Biological Interval</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style="padding: 6px 8px; border: 1px solid #cbd5e1;"><strong>Total Triiodothyronine (T3)</strong></td>
            <td style="padding: 6px 8px; border: 1px solid #cbd5e1; font-weight: bold; color: #0284c7;">1.20</td>
            <td style="padding: 6px 8px; border: 1px solid #cbd5e1;">ng/mL</td>
            <td style="padding: 6px 8px; border: 1px solid #cbd5e1;">0.80 - 2.00</td>
          </tr>
          <tr>
            <td style="padding: 6px 8px; border: 1px solid #cbd5e1;"><strong>Total Thyroxine (T4)</strong></td>
            <td style="padding: 6px 8px; border: 1px solid #cbd5e1; font-weight: bold; color: #0284c7;">8.40</td>
            <td style="padding: 6px 8px; border: 1px solid #cbd5e1;">µg/dL</td>
            <td style="padding: 6px 8px; border: 1px solid #cbd5e1;">5.10 - 14.10</td>
          </tr>
          <tr>
            <td style="padding: 6px 8px; border: 1px solid #cbd5e1;"><strong>Thyroid Stimulating Hormone (TSH)</strong></td>
            <td style="padding: 6px 8px; border: 1px solid #cbd5e1; font-weight: bold; color: #0284c7;">2.45</td>
            <td style="padding: 6px 8px; border: 1px solid #cbd5e1;">µIU/mL</td>
            <td style="padding: 6px 8px; border: 1px solid #cbd5e1;">0.35 - 4.94 (Adults)</td>
          </tr>
        </tbody>
      </table>
      <p style="font-size: 11px; color: #64748b; margin-top: 8px;">Method: Chemiluminescence Immunoassay (CLIA). TSH levels are subject to circadian rhythm.</p>
    `,
    defaultImpression: 'Euthyroid status. Serum T3, T4, and TSH are within reference biological limits.',
    defaultRecommendations: 'Correlate with clinical findings and history.'
  },
  {
    id: 'tpl-blood-sugar-panel',
    name: 'Blood Glucose & Diabetic Screen (FBS, PPBS, HbA1c)',
    category: 'Pathology',
    department: 'Biochemistry',
    htmlContent: `
      <h3>BIOCHEMISTRY - BLOOD GLUCOSE & DIABETIC PROFILE</h3>
      <table style="width: 100%; border: 1px solid #cbd5e1; text-align: left;">
        <thead>
          <tr style="background-color: #f1f5f9;">
            <th style="padding: 8px; border: 1px solid #cbd5e1;">Investigation Parameter</th>
            <th style="padding: 8px; border: 1px solid #cbd5e1;">Observed Value</th>
            <th style="padding: 8px; border: 1px solid #cbd5e1;">Unit</th>
            <th style="padding: 8px; border: 1px solid #cbd5e1;">Reference Interval / ADA Criteria</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style="padding: 6px 8px; border: 1px solid #cbd5e1;"><strong>Fasting Blood Sugar (FBS)</strong></td>
            <td style="padding: 6px 8px; border: 1px solid #cbd5e1; font-weight: bold; color: #0284c7;">92.0</td>
            <td style="padding: 6px 8px; border: 1px solid #cbd5e1;">mg/dL</td>
            <td style="padding: 6px 8px; border: 1px solid #cbd5e1;">70.0 - 99.0 (Normal)<br/>100.0 - 125.0 (Pre-Diabetes)<br/>&gt; 126.0 (Diabetes)</td>
          </tr>
          <tr>
            <td style="padding: 6px 8px; border: 1px solid #cbd5e1;"><strong>Post Prandial Blood Sugar (PPBS)</strong></td>
            <td style="padding: 6px 8px; border: 1px solid #cbd5e1; font-weight: bold; color: #0284c7;">124.0</td>
            <td style="padding: 6px 8px; border: 1px solid #cbd5e1;">mg/dL</td>
            <td style="padding: 6px 8px; border: 1px solid #cbd5e1;">&lt; 140.0 (Normal)<br/>140.0 - 199.0 (Impaired Tolerance)<br/>&gt; 200.0 (Diabetes)</td>
          </tr>
          <tr>
            <td style="padding: 6px 8px; border: 1px solid #cbd5e1;"><strong>HbA1c (Glycated Hemoglobin)</strong></td>
            <td style="padding: 6px 8px; border: 1px solid #cbd5e1; font-weight: bold; color: #0284c7;">5.4</td>
            <td style="padding: 6px 8px; border: 1px solid #cbd5e1;">%</td>
            <td style="padding: 6px 8px; border: 1px solid #cbd5e1;">&lt; 5.7% (Non-Diabetic)<br/>5.7 - 6.4% (Pre-Diabetes)<br/>&gt; 6.5% (Diabetes)</td>
          </tr>
          <tr>
            <td style="padding: 6px 8px; border: 1px solid #cbd5e1;">Estimated Average Glucose (eAG)</td>
            <td style="padding: 6px 8px; border: 1px solid #cbd5e1; font-weight: bold;">108</td>
            <td style="padding: 6px 8px; border: 1px solid #cbd5e1;">mg/dL</td>
            <td style="padding: 6px 8px; border: 1px solid #cbd5e1;">Calculated from HbA1c</td>
          </tr>
        </tbody>
      </table>
    `,
    defaultImpression: 'Normoglycemic glycemic status. HbA1c within normal physiological range indicating optimal glycemic control over past 3 months.',
    defaultRecommendations: 'Maintain healthy lifestyle and balanced dietary regimen.'
  },
  {
    id: 'tpl-vitamin-profile',
    name: 'Vitamin Profile (25-OH Vitamin D3 & Vitamin B12)',
    category: 'Pathology',
    department: 'Biochemistry / Immunoassay',
    htmlContent: `
      <h3>IMMUNOASSAY - 25-OH VITAMIN D & VITAMIN B12</h3>
      <table style="width: 100%; border: 1px solid #cbd5e1; text-align: left;">
        <thead>
          <tr style="background-color: #f1f5f9;">
            <th style="padding: 8px; border: 1px solid #cbd5e1;">Investigation</th>
            <th style="padding: 8px; border: 1px solid #cbd5e1;">Observed Value</th>
            <th style="padding: 8px; border: 1px solid #cbd5e1;">Unit</th>
            <th style="padding: 8px; border: 1px solid #cbd5e1;">Biological Reference Interval</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style="padding: 6px 8px; border: 1px solid #cbd5e1;"><strong>25-OH Vitamin D (Total)</strong></td>
            <td style="padding: 6px 8px; border: 1px solid #cbd5e1; font-weight: bold; color: #0284c7;">32.5</td>
            <td style="padding: 6px 8px; border: 1px solid #cbd5e1;">ng/mL</td>
            <td style="padding: 6px 8px; border: 1px solid #cbd5e1;">&lt; 20.0 : Deficient<br/>20.0 - 30.0 : Insufficient<br/>30.0 - 100.0 : Sufficient<br/>&gt; 100.0 : Toxicity Risk</td>
          </tr>
          <tr>
            <td style="padding: 6px 8px; border: 1px solid #cbd5e1;"><strong>Vitamin B12 (Cyanocobalamin)</strong></td>
            <td style="padding: 6px 8px; border: 1px solid #cbd5e1; font-weight: bold; color: #0284c7;">385.0</td>
            <td style="padding: 6px 8px; border: 1px solid #cbd5e1;">pg/mL</td>
            <td style="padding: 6px 8px; border: 1px solid #cbd5e1;">211.0 - 911.0 (Normal)<br/>&lt; 200.0 : Deficient</td>
          </tr>
        </tbody>
      </table>
      <p style="font-size: 11px; color: #64748b; margin-top: 8px;">Method: Fully Automated Chemiluminescent Microparticle Immunoassay (CMIA).</p>
    `,
    defaultImpression: 'Serum 25-OH Vitamin D and Vitamin B12 are within sufficient physiological reference intervals.',
    defaultRecommendations: 'Routine dietary intake and annual clinical surveillance advised.'
  },
  {
    id: 'tpl-serology-widal',
    name: 'Serology Screen (Widal / Typhoid / Dengue / CRP)',
    category: 'Pathology',
    department: 'Microbiology & Serology',
    htmlContent: `
      <h3>SEROLOGY - FEBRILE AGGLUTINATION & INFECTION SCREEN</h3>
      <table style="width: 100%; border: 1px solid #cbd5e1; text-align: left; margin-bottom: 12px;">
        <thead>
          <tr style="background-color: #f1f5f9;">
            <th colspan="3" style="padding: 6px 8px; border: 1px solid #cbd5e1; font-weight: bold;">WIDAL SLIDE / TUBE AGGLUTINATION TEST</th>
          </tr>
          <tr style="background-color: #f8fafc; font-size: 11px;">
            <th style="padding: 6px 8px; border: 1px solid #cbd5e1;">Antigen</th>
            <th style="padding: 6px 8px; border: 1px solid #cbd5e1;">Observed Titer</th>
            <th style="padding: 6px 8px; border: 1px solid #cbd5e1;">Significance Cutoff</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style="padding: 5px 8px; border: 1px solid #cbd5e1;">Salmonella Typhi 'O'</td>
            <td style="padding: 5px 8px; border: 1px solid #cbd5e1; font-weight: bold;">&lt; 1:20 (Negative)</td>
            <td style="padding: 5px 8px; border: 1px solid #cbd5e1;">Titer &gt; 1:80 considered clinically significant</td>
          </tr>
          <tr>
            <td style="padding: 5px 8px; border: 1px solid #cbd5e1;">Salmonella Typhi 'H'</td>
            <td style="padding: 5px 8px; border: 1px solid #cbd5e1; font-weight: bold;">&lt; 1:20 (Negative)</td>
            <td style="padding: 5px 8px; border: 1px solid #cbd5e1;">Titer &gt; 1:160 considered clinically significant</td>
          </tr>
          <tr>
            <td style="padding: 5px 8px; border: 1px solid #cbd5e1;">Salmonella Paratyphi 'AH'</td>
            <td style="padding: 5px 8px; border: 1px solid #cbd5e1; font-weight: bold;">&lt; 1:20 (Negative)</td>
            <td style="padding: 5px 8px; border: 1px solid #cbd5e1;">Titer &gt; 1:80 considered clinically significant</td>
          </tr>
          <tr>
            <td style="padding: 5px 8px; border: 1px solid #cbd5e1;">Salmonella Paratyphi 'BH'</td>
            <td style="padding: 5px 8px; border: 1px solid #cbd5e1; font-weight: bold;">&lt; 1:20 (Negative)</td>
            <td style="padding: 5px 8px; border: 1px solid #cbd5e1;">Titer &gt; 1:80 considered clinically significant</td>
          </tr>
        </tbody>
      </table>

      <table style="width: 100%; border: 1px solid #cbd5e1; text-align: left;">
        <thead>
          <tr style="background-color: #f1f5f9;">
            <th style="padding: 6px 8px; border: 1px solid #cbd5e1;">Parameter</th>
            <th style="padding: 6px 8px; border: 1px solid #cbd5e1;">Observed</th>
            <th style="padding: 6px 8px; border: 1px solid #cbd5e1;">Reference Interval</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style="padding: 5px 8px; border: 1px solid #cbd5e1;"><strong>C-Reactive Protein (CRP, Quantitative)</strong></td>
            <td style="padding: 5px 8px; border: 1px solid #cbd5e1; font-weight: bold; color: #0284c7;">2.1 mg/L</td>
            <td style="padding: 5px 8px; border: 1px solid #cbd5e1;">&lt; 6.0 mg/L (Normal)</td>
          </tr>
        </tbody>
      </table>
    `,
    defaultImpression: 'Widal test negative. No significant agglutination observed. C-Reactive Protein (CRP) within normal physiological baseline.',
    defaultRecommendations: 'Clinical correlation recommended. Repeat testing if fever persists beyond 7 days.'
  },
  {
    id: 'tpl-pathology-general',
    name: 'General Pathology / Biochemistry Report Table',
    category: 'Pathology',
    department: 'Pathology & Laboratory Medicine',
    htmlContent: `
      <h3>DIAGNOSTIC PATHOLOGY LABORATORY INVESTIGATION</h3>
      <table style="width: 100%; border: 1px solid #cbd5e1; text-align: left;">
        <thead>
          <tr style="background-color: #f1f5f9;">
            <th style="padding: 8px; border: 1px solid #cbd5e1;">Investigation / Parameter</th>
            <th style="padding: 8px; border: 1px solid #cbd5e1;">Observed Value</th>
            <th style="padding: 8px; border: 1px solid #cbd5e1;">Unit</th>
            <th style="padding: 8px; border: 1px solid #cbd5e1;">Biological Reference Interval</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style="padding: 6px 8px; border: 1px solid #cbd5e1;"><strong>Primary Diagnostic Marker</strong></td>
            <td style="padding: 6px 8px; border: 1px solid #cbd5e1; font-weight: bold; color: #0284c7;">Normal / Negative</td>
            <td style="padding: 6px 8px; border: 1px solid #cbd5e1;">-</td>
            <td style="padding: 6px 8px; border: 1px solid #cbd5e1;">Reference Norm</td>
          </tr>
        </tbody>
      </table>
      <p style="font-size: 11px; color: #64748b; margin-top: 10px;">Sample Type: Whole Blood / Serum / Plasma. Quality control verified.</p>
    `,
    defaultImpression: 'Laboratory investigation conducted and authorized. Results within biological reference parameters.',
    defaultRecommendations: 'Please correlate with clinical presentation and history.'
  }
];

export interface TemplateLookupOptions {
  testName?: string;
  category?: string;
  department?: string;
  gender?: string;
  patientName?: string;
  defaultTemplateId?: string;
}

/**
 * Intelligent gender detection from patient demographics or name honorifics.
 */
export function detectGender(genderStr?: string, patientName?: string): 'male' | 'female' | 'unknown' {
  const g = (genderStr || '').trim().toLowerCase();
  const name = (patientName || '').trim().toLowerCase();

  // Explicit female cues
  if (
    g.startsWith('f') ||
    g.includes('female') ||
    g.includes('/ f') ||
    g.includes('/f') ||
    g === 'female' ||
    name.startsWith('mrs.') ||
    name.startsWith('mrs ') ||
    name.startsWith('ms.') ||
    name.startsWith('ms ') ||
    name.startsWith('miss') ||
    name.startsWith('smt.') ||
    name.startsWith('smt ') ||
    name.includes(' bee') ||
    name.includes(' begum') ||
    name.includes(' bai') ||
    name.includes(' devi') ||
    name.includes(' kaur')
  ) {
    return 'female';
  }

  // Explicit male cues
  if (
    g === 'm' ||
    g.startsWith('m/') ||
    g.includes('/ m') ||
    g.includes('/m') ||
    g === 'male' ||
    name.startsWith('mr.') ||
    name.startsWith('mr ') ||
    name.startsWith('shri') ||
    name.startsWith('master') ||
    name.includes(' khan') ||
    name.includes(' singh') ||
    name.includes(' kumar')
  ) {
    return 'male';
  }

  return 'unknown';
}

/**
 * Intelligently matches a diagnostic test to its specialized clinical report template.
 * Guarantees that Pathology tests (CBC, Urine, Blood, Biochemistry) never accidentally open Sonography.
 * Accurately selects gender-appropriate templates (USG Abdomen Female vs Male, KUB Female vs Male).
 */
export function findTemplateForTest(options: TemplateLookupOptions): ClinicalTemplate {
  // 1. Explicit template ID match if configured on test
  if (options.defaultTemplateId) {
    const directMatch = CLINICAL_TEMPLATES.find(t => t.id === options.defaultTemplateId);
    if (directMatch) return directMatch;
  }

  const name = (options.testName || '').trim().toLowerCase();
  const cat = (options.category || '').trim().toLowerCase();
  const dept = (options.department || '').trim().toLowerCase();
  const resolvedGender = detectGender(options.gender, options.patientName);

  // 2. Pathology & Clinical Biochemistry Specific Mappings
  if (/(\bcbc\b|hemogram|haemogram|blood\s*count|complete\s*blood|wbc|tlc|dlc|esr|platelet)/i.test(name)) {
    const tpl = CLINICAL_TEMPLATES.find(t => t.id === 'tpl-cbc-pathology');
    if (tpl) return tpl;
  }

  if (/(\blipid\b|cholesterol|triglyceride|hdl|ldl|vldl)/i.test(name)) {
    const tpl = CLINICAL_TEMPLATES.find(t => t.id === 'tpl-lipid-profile');
    if (tpl) return tpl;
  }

  if (/(\blft\b|liver\s*function|bilirubin|sgot|sgpt|ast|alt|alkaline\s*phosphatase|ggt)/i.test(name)) {
    const tpl = CLINICAL_TEMPLATES.find(t => t.id === 'tpl-lft-biochem');
    if (tpl) return tpl;
  }

  if (/(\bkft\b|\brft\b|kidney\s*function|renal\s*function|creatinine|urea|uric\s*acid|bun|electrolytes)/i.test(name)) {
    const tpl = CLINICAL_TEMPLATES.find(t => t.id === 'tpl-kft-biochem');
    if (tpl) return tpl;
  }

  if (/(\burine\b|urinalysis|urine\s*r\/m|urine\s*routine|urine\s*re|urine\s*me)/i.test(name)) {
    const tpl = CLINICAL_TEMPLATES.find(t => t.id === 'tpl-urine-routine');
    if (tpl) return tpl;
  }

  if (/(\bthyroid\b|\btsh\b|\bt3\b|\bt4\b|\btft\b|\bft3\b|\bft4\b)/i.test(name)) {
    const tpl = CLINICAL_TEMPLATES.find(t => t.id === 'tpl-thyroid-profile');
    if (tpl) return tpl;
  }

  if (/(\bglucose\b|\bsugar\b|\bfbs\b|\bppbs\b|\brbs\b|\bhba1c\b|glycated|diabetes)/i.test(name)) {
    const tpl = CLINICAL_TEMPLATES.find(t => t.id === 'tpl-blood-sugar-panel');
    if (tpl) return tpl;
  }

  if (/(\bvitamin\b|vit-d|25-oh|b12|cobalamin|cholecalciferol)/i.test(name)) {
    const tpl = CLINICAL_TEMPLATES.find(t => t.id === 'tpl-vitamin-profile');
    if (tpl) return tpl;
  }

  if (/(\bwidal\b|typhoid|dengue|ns1|malaria|\bmp\b|\bcrp\b|serology)/i.test(name)) {
    const tpl = CLINICAL_TEMPLATES.find(t => t.id === 'tpl-serology-widal');
    if (tpl) return tpl;
  }

  // 3. Cardiology Mappings
  if (/(\becho\b|echocardiography|2d\s*echo|color\s*doppler\s*eco|eco)/i.test(name)) {
    const tpl = CLINICAL_TEMPLATES.find(t => t.id === 'tpl-echo-normal-report');
    if (tpl) return tpl;
  }

  // 4. Obstetric Ultrasound & Specialized Antenatal Scans
  if (/(\btwin.*obs|obs.*twin|twin.*growth|twin.*doppler|twins)/i.test(name)) {
    if (/(\bdoppler\b)/i.test(name)) {
      const twinDoppler = CLINICAL_TEMPLATES.find(t => t.id === 'tpl-twins-obst-doppler');
      if (twinDoppler) return twinDoppler;
    }
    const twinTpl = CLINICAL_TEMPLATES.find(t => t.id === 'tpl-twing-obst-growth-scan');
    if (twinTpl) return twinTpl;
  }

  if (/(\banomaly\b|target\s*scan|level\s*2|level\s*ii|malformation|fetal\s*echo)/i.test(name)) {
    const tpl = CLINICAL_TEMPLATES.find(t => t.id === 'tpl-ap-obs-anomaly-scan');
    if (tpl) return tpl;
  }

  if (/(\bnt\s*scan\b|nt\/nb|nuchal)/i.test(name)) {
    const tpl = CLINICAL_TEMPLATES.find(t => t.id === 'tpl-usg-nt-scan');
    if (tpl) return tpl;
  }

  if (/(\bearly\s*obs|early\s*obstetric|crl|g\s*sac|gestational\s*sac)/i.test(name)) {
    const tpl = CLINICAL_TEMPLATES.find(t => t.id === 'tpl-usg-early-obs-crl');
    if (tpl) return tpl;
  }

  if (/(\bobs.*doppler\b|obstetric\s*doppler|umbilical\s*doppler)/i.test(name)) {
    const tpl = CLINICAL_TEMPLATES.find(t => t.id === 'tpl-usg-obst-doppler');
    if (tpl) return tpl;
  }

  if (/(\bgrowth\s*scan\b|obstetric\s*growth|fetal\s*growth|fetal\s*biometry|obstetric|obstetrics|\bobs\b|antenatal|anc\b|pregnancy|gravid|fetal)/i.test(name)) {
    const tpl = CLINICAL_TEMPLATES.find(t => t.id === 'tpl-usg-obst-growth-scan');
    if (tpl) return tpl;
  }

  // 5. Vascular Color Doppler Scans
  if (/(\bcarotid\b)/i.test(name)) {
    const tpl = CLINICAL_TEMPLATES.find(t => t.id === 'tpl-usg-carotid-doppler');
    if (tpl) return tpl;
  }

  if (/(\blower\s*limb|dvt|venous\s*doppler)/i.test(name)) {
    const tpl = CLINICAL_TEMPLATES.find(t => t.id === 'tpl-usg-color-doppler-lower-limb-venous-system');
    if (tpl) return tpl;
  }

  if (/(\bupper\s*limb)/i.test(name)) {
    const tpl = CLINICAL_TEMPLATES.find(t => t.id === 'tpl-usg-upper-limb-arterial-venous-system');
    if (tpl) return tpl;
  }

  // 6. Specialized Organ Scans
  if (/(\bbreast\b|mammograph|sonomammo)/i.test(name)) {
    const tpl = CLINICAL_TEMPLATES.find(t => t.id === 'tpl-usg-breast-memography');
    if (tpl) return tpl;
  }

  if (/(\bneck\b|thyroid\s*usg|parotid|submandibular)/i.test(name)) {
    const tpl = CLINICAL_TEMPLATES.find(t => t.id === 'tpl-usg-neck');
    if (tpl) return tpl;
  }

  if (/(\bscrot|testis|testicular)/i.test(name)) {
    const tpl = CLINICAL_TEMPLATES.find(t => t.id === 'tpl-usg-scrotal-normal');
    if (tpl) return tpl;
  }

  if (/(\bpelvic\b|\bpelvis\b|\btvs\b|uterus|adnexa|ovary|ovarian)/i.test(name)) {
    const tpl = CLINICAL_TEMPLATES.find(t => t.id === 'tpl-usg-pelvic');
    if (tpl) return tpl;
  }

  if (/(\bovulation\b|\bfollic|folliculometry)/i.test(name)) {
    const tpl = CLINICAL_TEMPLATES.find(t => t.id === 'tpl-usg-ovulation-study-folicular-study');
    if (tpl) return tpl;
  }

  // KUB (Gender Aware: Female includes Pelvis/Uterus; Male includes Prostate)
  if (/(\bkub\b|kidney\s*ureter\s*bladder)/i.test(name)) {
    if (resolvedGender === 'female') {
      const femaleKub = CLINICAL_TEMPLATES.find(t => t.id === 'tpl-usg-kub-female');
      if (femaleKub) return femaleKub;
    }
    const maleKub = CLINICAL_TEMPLATES.find(t => t.id === 'tpl-usg-kub-male');
    if (maleKub) return maleKub;
  }

  // 7. Radiography & Cross-Sectional Imaging
  if (/(\bx-ray\b|\bxray\b|chest\s*pa|chest\s*ap|radiograph)/i.test(name)) {
    const tpl = CLINICAL_TEMPLATES.find(t => t.id === 'tpl-xray-chest');
    if (tpl) return tpl;
  }

  if (/(\bmri\b|brain\s*mri)/i.test(name)) {
    const tpl = CLINICAL_TEMPLATES.find(t => t.id === 'tpl-mri-brain');
    if (tpl) return tpl;
  }

  // 8. Sonography Whole Abdomen (Gender Aware: Female includes Uterus/Adnexa; Male includes Prostate)
  if (/(\babdomen\b|\babdo\b|sonography|usg|ultrasound)/i.test(name)) {
    if (resolvedGender === 'female') {
      const femaleTpl = CLINICAL_TEMPLATES.find(t => t.id === 'tpl-usg-whole-abdomen-female-1');
      if (femaleTpl) return femaleTpl;
    } else if (resolvedGender === 'male') {
      const maleTpl = CLINICAL_TEMPLATES.find(t => t.id === 'tpl-usg-wholw-abdomen-male');
      if (maleTpl) return maleTpl;
    }
    const generalTpl = CLINICAL_TEMPLATES.find(t => t.id === 'tpl-usg-abdomen');
    if (generalTpl) return generalTpl;
  }

  // 9. Department/Modality Fallback (Never cross-contaminate Pathology with Sonography!)
  if (cat.includes('path') || dept.includes('path') || dept.includes('hema') || dept.includes('bio') || dept.includes('micro') || cat.includes('lab')) {
    const pathTpl = CLINICAL_TEMPLATES.find(t => t.id === 'tpl-pathology-general') || CLINICAL_TEMPLATES.find(t => t.id === 'tpl-cbc-pathology');
    if (pathTpl) return pathTpl;
  }

  if (cat.includes('cardio') || dept.includes('cardio') || dept.includes('echo')) {
    const echoTpl = CLINICAL_TEMPLATES.find(t => t.id === 'tpl-echo-normal-report');
    if (echoTpl) return echoTpl;
  }

  if (cat.includes('radio') || dept.includes('radio') || dept.includes('usg') || dept.includes('sono') || dept.includes('x-ray')) {
    const findingsTpl = CLINICAL_TEMPLATES.find(t => t.id === 'tpl-findings') || CLINICAL_TEMPLATES.find(t => t.id === 'tpl-usg-abdomen');
    if (findingsTpl) return findingsTpl;
  }

  // Final fallback
  return CLINICAL_TEMPLATES[0];
}
