import { Response } from 'express';
import prisma from '../config/database.js';
import { AuthRequest } from '../types/index.js';
import { decrypt } from '../utils/encryption.js';
import { maskAadhaar, maskPan } from '../utils/masking.js';
import { generateReportPDF } from '../utils/pdfGenerator.js';

type CandidateWithLogs = Awaited<ReturnType<typeof loadCandidateForReport>>;

const loadCandidateForReport = async (id: string, req: AuthRequest) => {
  const whereClause =
    req.user?.role === 'admin' ? { id } : { id, createdById: req.user?.userId };

  return prisma.candidate.findFirst({
    where: whereClause,
    include: {
      verificationLogs: {
        orderBy: { verifiedAt: 'desc' },
      },
      createdBy: {
        select: { name: true, email: true },
      },
    },
  });
};

const buildReportData = (candidate: NonNullable<CandidateWithLogs>, req: AuthRequest) => {
  const aadhaar = decrypt(candidate.aadhaarNumber);
  const pan = decrypt(candidate.panNumber);

  return {
    candidateInfo: {
      candidateId: candidate.id,
      fullName: candidate.fullName,
      email: candidate.email,
      phone: candidate.phone,
      aadhaarNumber: maskAadhaar(aadhaar),
      panNumber: maskPan(pan),
      dob: candidate.dob.toISOString(),
      address: candidate.address,
    },
    verificationStatus: candidate.status,
    verifications: candidate.verificationLogs.map((log) => ({
      type: log.verificationType,
      status: log.verificationStatus,
      verifiedAt: log.verifiedAt,
    })),
    generatedAt: new Date(),
    verifiedBy: candidate.createdBy?.name || 'Unknown',
    verifiedByEmail: candidate.createdBy?.email || req.user?.email,
  };
};

export const downloadReport = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params as { id: string };
    const candidate = await loadCandidateForReport(id, req);

    if (!candidate) {
      res.status(404).json({ error: 'Candidate not found' });
      return;
    }

    res.status(200).json({
      message: 'Report generated successfully',
      report: buildReportData(candidate, req),
    });
  } catch (err) {
    console.error('Download report error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const downloadReportPDF = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params as { id: string };
    const candidate = await loadCandidateForReport(id, req);

    if (!candidate) {
      res.status(404).json({ error: 'Candidate not found' });
      return;
    }

    const reportData = buildReportData(candidate, req);
    const pdfBuffer = await generateReportPDF(reportData);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="verification-report-${candidate.id}-${Date.now()}.pdf"`
    );
    res.setHeader('Content-Length', pdfBuffer.length);
    res.send(pdfBuffer);
  } catch (error) {
    console.error('PDF generation error:', error);
    res.status(500).json({ error: 'Failed to generate PDF' });
  }
};
