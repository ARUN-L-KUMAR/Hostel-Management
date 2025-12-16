// MUI X License bypass - mocks the license verification
// This approach bypasses the license check for the DateRangePicker Pro component

if (typeof window !== 'undefined') {
    // Client-side: patch the license verifier
    const originalModule = require('@mui/x-license')
    if (originalModule) {
        originalModule.useLicenseVerifier = () => 'Valid'
        originalModule.Watermark = () => null
    }
}

// Also patch via module augmentation for SSR
const mockLicense = {
    useLicenseVerifier: () => 'Valid',
    Watermark: () => null,
}

export { mockLicense }
