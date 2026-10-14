# SOP: Atlas Diagnostics System Architecture & Role Directives

## 1. Objective
Atlas Diagnostics is an enterprise-grade Diagnostic Centre & Pathology / Radiology Information Management System (LIMS/RIS/MIS). It streamlines the end-to-end medical testing lifecycle from patient intake, billing, barcoding, diagnostic reporting with rich text formatting, multi-doctor referral commissions, staff payroll/work-hour tracking, to 1-click WhatsApp delivery and patient portal.

## 2. Five Persona Roles
1. **Owner / Super Admin**:
   - Master control across centers/branches.
   - Doctor Approval Workflow (approving receptionist-submitted doctors and assigning commission %).
   - Staff Management (shifts, hourly wages, monthly salaries, expense tracking).
   - Financial MIS: Revenue, Expenses (Rent, Electricity, Reagents, Maintenance, Salaries), Profit & Loss.
   - Referral Leaderboard (top referrers by gross & net revenue).

2. **Receptionist / Front-Desk**:
   - Register Walk-in, OPD, IPD, and B2B patients.
   - Associate referring doctor (or submit a new doctor for Admin review).
   - Generate bills, handle discounts, collect multiple payment modes (Cash, UPI, Card, Due).
   - Print barcode & route sample to Radiologist/Pathologist.
   - Dispatch verified reports to patients via WhatsApp / SMS / Email with 1-click.

3. **Diagnostics Doctor / Radiologist / Pathologist**:
   - Real-time worklist / test queue.
   - Rich reporting studio: Bold, italic, underline, custom fonts, color highlights, pre-made pathology & radiology templates.
   - Upload scans/PDFs and sign off digitally with authorization stamps.

4. **Referring Doctor / Referral Partner**:
   - View assigned patients and their diagnostic completion statuses.
   - Track earned referral percentage, payouts, and monthly summary.

5. **Patient / Customer**:
   - Search/View diagnostic history and real-time test status.
   - Download signed PDF diagnostic reports with verification QR code.
   - View itemized invoices.
