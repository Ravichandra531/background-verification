import PDFDocument from 'pdfkit';
import { ReportData } from '../types/index.js';

export const generateReportPDF = (report: ReportData): Promise<Buffer> => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: 'A4',
        margin: 50,
      });

      const chunks: Buffer[] = [];

      doc.on('data', (chunk: Buffer) => {
        chunks.push(chunk);
      });

      doc.on('end', () => {
        resolve(Buffer.concat(chunks));
      });

      doc.on('error', reject);

      // Header
      doc.fontSize(24).font('Helvetica-Bold').text('Background Verification Report', {
        align: 'center',
      });

      doc.moveDown(0.5);
      doc.fontSize(10).font('Helvetica').fillColor('#666666').text(
        `Generated: ${new Date(report.generatedAt).toLocaleString('en-GB')}`,
        {
          align: 'center',
        }
      );

      doc.moveDown(1);

      // Candidate Information Section
      doc.fontSize(14).font('Helvetica-Bold').fillColor('#000000').text('Candidate Information');
      doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
      doc.moveDown(0.5);

      const candidateInfo = [
        ['Name:', report.candidateInfo.fullName],
        ['Email:', report.candidateInfo.email],
        ['ID:', report.candidateInfo.candidateId],
      ];

      candidateInfo.forEach(([label, value]) => {
        doc.fontSize(11).font('Helvetica-Bold').text(label, { width: 100, continued: true });
        doc.font('Helvetica').text(value as string);
      });

      doc.moveDown(1);

      // Verification Status Section
      doc.fontSize(14).font('Helvetica-Bold').text('Verification Status');
      doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
      doc.moveDown(0.5);

      const statusColor =
        report.verificationStatus === 'verified'
          ? '#059669'
          : report.verificationStatus === 'partial'
            ? '#d97706'
            : '#dc2626';

      doc.fontSize(12).font('Helvetica-Bold').fillColor(statusColor).text(
        report.verificationStatus.toUpperCase(),
        {
          align: 'center',
        }
      );

      doc.fillColor('#000000');
      doc.moveDown(1);

      // Verification Details Table
      doc.fontSize(14).font('Helvetica-Bold').text('Verification Details');
      doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
      doc.moveDown(0.5);

      // Table header
      const tableTop = doc.y;
      const col1 = 70;
      const col2 = 200;
      const col3 = 350;
      const col4 = 480;
      const rowHeight = 25;

      doc.fontSize(10).font('Helvetica-Bold').fillColor('#ffffff');
      doc.rect(50, tableTop, 500, rowHeight).fill('#1f2937');

      doc.text('Type', col1, tableTop + 5);
      doc.text('Status', col2, tableTop + 5);
      doc.text('Verified Date', col3, tableTop + 5);
      doc.text('Result', col4, tableTop + 5);

      doc.fillColor('#000000').font('Helvetica');

      let currentY = tableTop + rowHeight;

      report.verifications.forEach((verification: { type: string; status: string; verifiedAt: Date }, index: number) => {
        const bgColor = index % 2 === 0 ? '#f9fafb' : '#ffffff';
        doc.rect(50, currentY, 500, rowHeight).fill(bgColor);

        const statusText = verification.status === 'completed' ? 'Verified' : 'Failed';
        const statusColor = verification.status === 'completed' ? '#059669' : '#dc2626';

        doc.fillColor('#000000').fontSize(9);
        doc.text(verification.type.toUpperCase(), col1, currentY + 5);
        doc.fillColor(statusColor).text(statusText, col2, currentY + 5);
        doc.fillColor('#000000').text(
          new Date(verification.verifiedAt).toLocaleDateString('en-GB'),
          col3,
          currentY + 5
        );
        doc.text(statusText, col4, currentY + 5);

        currentY += rowHeight;
      });

      doc.moveDown(2);

      // Summary Section
      doc.fontSize(14).font('Helvetica-Bold').fillColor('#000000').text('Summary');
      doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
      doc.moveDown(0.5);

      const summaryText =
        report.verificationStatus === 'verified'
          ? 'All verifications have been completed successfully. The candidate has passed all identity checks.'
          : report.verificationStatus === 'partial'
            ? 'Some verifications have been completed. Please review the details above for more information.'
            : 'Verification failed. Please contact support for more information.';

      doc.fontSize(11).font('Helvetica').fillColor('#374151').text(summaryText, {
        align: 'left',
        width: 500,
      });

      doc.moveDown(2);

      // Footer
      doc.fontSize(9).fillColor('#9ca3af').text('This is an automatically generated report. For official use only.', {
        align: 'center',
      });

      doc.fontSize(8).text(`Report ID: ${report.candidateInfo.candidateId}`, {
        align: 'center',
      });

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
};
