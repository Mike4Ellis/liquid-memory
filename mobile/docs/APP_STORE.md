# Liquid Memory Mobile - App Store Release Guide

## US-024: App Store Release Checklist

### Pre-Release Checklist

#### Assets
- [x] App Icon (1024x1024) - `assets/icon.png`
- [x] Adaptive Icon (Android) - `assets/adaptive-icon.png`
- [x] Splash Screen - `assets/splash-icon.png`
- [ ] Screenshots for App Store (5.5", 6.5", iPad)
- [ ] Screenshots for Play Store (phone, tablet)
- [ ] App Preview Video (optional)

#### Configuration
- [x] App Name: Liquid Memory
- [x] Bundle ID: com.mike4ellis.liquidmemory
- [x] Version: 1.0.0
- [x] Build Number: 1
- [x] Privacy Policy URL
- [x] Support URL

#### Legal
- [x] Privacy Policy (`docs/PRIVACY.md`)
- [ ] Terms of Service (if needed)
- [ ] Content Rating Questionnaire

### Build Commands

```bash
# iOS Build
eas build --platform ios

# Android Build
eas build --platform android

# Or both
eas build --platform all
```

### App Store Submission

1. Create App Store Connect record
2. Upload build with Transporter or EAS
3. Fill app information:
   - Description
   - Keywords
   - Support URL
   - Marketing URL (optional)
4. Submit for review

### Play Store Submission

1. Create Google Play Console record
2. Upload AAB bundle
3. Fill store listing:
   - Short description (80 chars)
   - Full description (4000 chars)
   - Screenshots
4. Set content rating
5. Choose pricing & distribution
6. Submit for review

### Post-Launch

- [ ] Monitor crash reports
- [ ] Respond to user reviews
- [ ] Plan update schedule
