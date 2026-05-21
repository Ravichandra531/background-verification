export const verifyAadhaar = async (req, res) => {
    try {
        const { aadhaarNumber } = req.body;
        const resData = {
            status: 'verified',
            nameMatch: true,
            dobMatch: true,
            message: 'Aadhaar verified successfully',
            aadhaarNumber: aadhaarNumber.replace(/\d(?=\d{4})/g, 'X'),
            verifiedAt: new Date().toISOString(),
        };
        await new Promise((resolve) => setTimeout(resolve, 1000));
        res.status(200).json(resData);
    }
    catch (err) {
        console.error('Aadhaar verification error:', err);
        res.status(500).json({ error: 'Verification service error' });
    }
};
export const verifyPAN = async (req, res) => {
    try {
        const { panNumber: rawPan } = req.body;
        const panNumber = rawPan.trim().toUpperCase();
        const resData = {
            status: 'verified',
            panStatus: 'active',
            message: 'PAN verified successfully',
            panNumber,
            verifiedAt: new Date().toISOString(),
        };
        await new Promise((resolve) => setTimeout(resolve, 1000));
        res.status(200).json(resData);
    }
    catch (err) {
        console.error('PAN verification error:', err);
        res.status(500).json({ error: 'Verification service error' });
    }
};
//# sourceMappingURL=mockVerification.controller.js.map