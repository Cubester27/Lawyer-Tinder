import PDFDocument from 'pdfkit';

export function generateEngagementLetter(caseApproval) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50 });
      const buffers = [];

      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => {
        const pdfData = Buffer.concat(buffers);
        resolve(pdfData);
      });

      const { selectedLawyer, caseTitle, caseDetails, approvedAt } = caseApproval;
      const dateStr = new Date(approvedAt).toLocaleDateString();

      // Header
      doc
        .fontSize(24)
        .font('Helvetica-Bold')
        .text('Lawyer Tinder Firm', { align: 'center' })
        .moveDown();

      doc
        .fontSize(16)
        .font('Helvetica')
        .text('Engagement & Retainer Agreement', { align: 'center' })
        .moveDown(2);

      const details = caseDetails || {};

      // Info Block
      doc.fontSize(12).text(`Date: ${dateStr}`, { align: 'right' });
      doc.text(`Attorney: ${selectedLawyer}`, { align: 'left' });
      doc.text(`Case Title: ${caseTitle}`, { align: 'left' });
      doc.text(`Practice Area: ${details.practiceArea || 'General'}`, { align: 'left' });
      doc.moveDown(2);

      // Body
      doc.font('Helvetica-Bold').text('1. Scope of Representation');
      doc.font('Helvetica').text(`The Client retains Attorney ${selectedLawyer} to provide legal representation in the matter of: ${caseTitle}. The representation is currently focused on the following facts:`, { align: 'justify' }).moveDown(0.5);
      
      doc.font('Helvetica-Oblique').text(`"${details.summary || 'Details to be provided.'}"`, { align: 'justify' }).moveDown(1);
      doc.font('Helvetica').text(`Relevant Legal Framework: ${details.applicableCode || 'TBD'}`).moveDown(2);

      doc.font('Helvetica-Bold').text('2. Legal Fees & Retainer');
      doc.font('Helvetica').text('The Client agrees to pay a standard retainer fee prior to the commencement of any legal action. Hourly rates for the assigned attorney apply unless a flat fee is agreed upon in writing.', { align: 'justify' }).moveDown(2);

      doc.font('Helvetica-Bold').text('3. Client Cooperation');
      doc.font('Helvetica').text('The Client agrees to provide all necessary documentation and cooperate fully with the Attorney. Failure to do so may result in the termination of this agreement.', { align: 'justify' }).moveDown(4);

      // Signatures
      doc.text('_____________________________', 50, doc.y);
      doc.text(`Attorney Signature: ${selectedLawyer}`, 50, doc.y + 10);

      doc.text('_____________________________', 300, doc.y + 5);
      doc.text(`Client Signature: ${details.clientName || 'Client'}`, 300, doc.y +5);

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}
