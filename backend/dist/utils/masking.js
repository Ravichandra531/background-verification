export const maskAadhaar = (val) => {
    if (!val || val.length !== 12)
        return 'XXXX-XXXX-XXXX';
    return `XXXX-XXXX-${val.slice(-4)}`;
};
export const maskPan = (val) => {
    if (!val || val.length !== 10)
        return 'XXXXXXXXXX';
    return `XXXXX${val.slice(5, 9)}X`;
};
export const maskEmail = (val) => {
    if (!val || !val.includes('@'))
        return '***@***.***';
    const [local, domain] = val.split('@');
    const maskedLocal = local.charAt(0) + '*'.repeat(local.length - 2) + local.charAt(local.length - 1);
    return `${maskedLocal}@${domain}`;
};
export const maskPhone = (val) => {
    if (!val || val.length !== 10)
        return 'XXXXXXXXXX';
    return `XXXXXX${val.slice(-4)}`;
};
//# sourceMappingURL=masking.js.map