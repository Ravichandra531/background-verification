import { Request, Response } from 'express';

export const verifyAadhaar = async (req: Request, res: Response): Promise<void> => {
  try {
    const { aadhaarNumber } = req.body as { aadhaarNumber: string };

    if (!aadhaarNumber) {
      res.status(400).json({ error: 'Aadhaar number is required' });
      return;
    }

    const aadhaarRe = /^[0-9]{12}$/;
    if (!aadhaarRe.test(aadhaarNumber)) {
      res.status(400).json({ 
        error: 'Invalid Aadhaar format. Must be 12 numeric digits' 
      });
      return;
    }

    const resData = {
      status: 'verified',
      nameMatch: true,
      dobMatch: true,
      message: 'Aadhaar verified successfully',
      aadhaarNumber: aadhaarNumber.replace(/\d(?=\d{4})/g, 'X'),
      verifiedAt: new Date().toISOString(),
    };

    await new Promise(resolve => setTimeout(resolve, 1000));
    res.status(200).json(resData);
  } catch (err) {
    console.error('Aadhaar verification error:', err);
    res.status(500).json({ error: 'Verification service error' });
  }
};

export const verifyPAN = async (req: Request, res: Response): Promise<void> => {
  try {
    const { panNumber: rawPan } = req.body as { panNumber: string };
    const panNumber = rawPan?.trim().toUpperCase();

    if (!panNumber) {
      res.status(400).json({ error: 'PAN number is required' });
      return;
    }

    const panRe = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
    if (!panRe.test(panNumber)) {
      res.status(400).json({ 
        error: 'Invalid PAN format. Must be in format: ABCDE1234F' 
      });
      return;
    }

    const resData = {
      status: 'verified',
      panStatus: 'active',
      message: 'PAN verified successfully',
      panNumber: panNumber,
      verifiedAt: new Date().toISOString(),
    };

    await new Promise(resolve => setTimeout(resolve, 1000));
    res.status(200).json(resData);
  } catch (err) {
    console.error('PAN verification error:', err);
    res.status(500).json({ error: 'Verification service error' });
  }
};
