# Publication and maintenance

Target repository: https://github.com/popovantondev/QuickAnswer

Before publishing, review every source file, image and packaged archive. Run all scripts in `.github/workflows/validate.yml`, including `scripts/audit-public.mjs`. Never upload installed profiles, backups, settings, pairing tokens, real questions or diagnostics. Pattern scanning does not replace visual review.

Publish Edge 1.7.8 separately from Desktop 0.1 Source Preview. Desktop is an untested Windows PowerShell application, not a compiled EXE; bundled Bridge compatibility is not implemented. Keep license status explicit: no original-code license has been selected. Do not copy another project's license.

Pages serves `main/docs`. Verify all three languages after deployment. Release notes must contain changes, compatibility, installation, limitations and checksums. Use exact release links. Download published archives back and compare SHA-256. Do not modify other repositories or the profile catalog as part of this publication.
