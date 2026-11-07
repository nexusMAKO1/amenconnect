# Security Policy

## Supported Versions

Security updates are actively maintained for the following versions of AmenConnect:

| Version | Supported          |
| ------- | ------------------ |
| 1.x.x   | :white_check_mark: |
| < 1.0.0 | :x:                |

---

## Reporting a Vulnerability

As a digital banking and kiosk platform, **AmenConnect takes security and data privacy with utmost priority**.

If you discover a security vulnerability within this project:

1. **Do not create a public issue**: Please do NOT open a public GitHub issue or disclose the vulnerability publicly until it has been reviewed and addressed.
2. **Submit a Private Vulnerability Report**:
   - Use [GitHub Private Vulnerability Reporting](https://github.com/nexusMAKO1/amenconnect/security/advisories/new) if available.
   - Or contact the maintainers directly via repository owner contact channels.
3. **Include details**:
   - Description of the vulnerability and attack vector.
   - Proof-of-Concept (PoC) or step-by-step reproduction instructions.
   - Affected components (`Backend`, `AmenConnect`, `AmenKiosk`, `bot`, or `api.py`).
   - Potential impact on customer data, accounts, or kiosk hardware.

### Response Timeline
- **Acknowledgment**: Within 48 hours of receipt.
- **Assessment**: Within 5 business days with vulnerability confirmation and severity scoring.
- **Remediation**: A hotfix or patch release will be created and deployed.

---

## Security Best Practices for Operators

1. **Environment Variables**: Always store sensitive credentials (JWT keys, DB passwords, Firebase tokens, mailer secrets) in `.env` files and never check them into source control.
2. **HTTPS / TLS**: Always enforce HTTPS in production environments, especially for biometric data, webcam video conferences, and kiosk-to-backend communication.
3. **Hardware Kiosks**: Isolate kiosk network traffic using dedicated VLANs and apply operating system lock-down policies (kiosk mode).
