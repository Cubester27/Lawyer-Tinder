import fs from 'fs';
import path from 'path';

const dict = {
  "Arbeitsrecht": "Employment Law",
  "Zivilrecht": "Civil Law",
  "Strafrecht": "Criminal Law",
  "Handelsrecht": "Commercial Law",
  "Vertragsrecht": "Contract Law",
  "Mietrecht": "Tenancy Law",
  "Medizinrecht": "Medical Law",
  "Datenschutz": "Data Protection",
  "Gesellschaftsrecht": "Corporate Law",
  "Verwaltungsrecht": "Administrative Law",
  "Zivilprozessrecht": "Civil Procedure Law",
  "Familienrecht": "Family Law",
  "Wirtschaftsstrafrecht": "White-Collar Crime",
  "Betriebsverfassungsrecht": "Works Constitution Law",
  "KSchG": "Dismissal Protection Act",
  "ArbZG": "Working Hours Act",
  "BetrVG": "Works Council Act",
  "HGB": "Commercial Code",
  "BGB": "Civil Code",
  "StGB": "Criminal Code",
  "StPO": "Code of Criminal Procedure",
  "ZPO": "Code of Civil Procedure",
  "VwGO": "Code of Administrative Court Procedure",
  "GmbHG": "LLC Law",
  "Mahnverfahren": "Dunning Procedure",
  "Klageschrift": "Statement of Claim",
  "Kaufrecht": "Sales Law",
  "Schadensersatz": "Damages",
  "Behandlungsfehler": "Treatment Error",
  "Arzthaftung": "Medical Liability",
  "Kapitalverbrechen": "Capital Crimes",
  "Strafverteidigung": "Criminal Defense",
  "Abmahnung": "Warning Letter",
  "Kündigungsschutz": "Dismissal Protection",
  "Auskunftsanspruch": "Right to Information",
  "Kaufmannsrecht": "Merchant Law",
  "Verwaltungsakt": "Administrative Act",
  "Widerspruch": "Objection",
  "Scheidung": "Divorce",
  "Sorgerecht": "Child Custody",
  "Betrug": "Fraud",
  "Untreue": "Embezzlement",
  "Betriebsrat": "Works Council",
  "DSGVO": "GDPR",
  "BDSG": "Federal Data Protection Act",
  "München": "Munich",
  "NRW": "North Rhine-Westphalia"
};

const file = path.join(process.cwd(), 'backend', 'data', 'lawyers.json');
let content = fs.readFileSync(file, 'utf8');

for (const [de, en] of Object.entries(dict)) {
  const regex = new RegExp(`\\b${de}\\b`, 'g');
  content = content.replace(regex, en);
}

fs.writeFileSync(file, content);
console.log('Successfully translated lawyers.json to English');
