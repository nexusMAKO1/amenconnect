# Contributing to AmenConnect

Thank you for your interest in contributing to **AmenConnect**! We welcome contributions to make our omnichannel digital banking and self-service kiosk platform more secure, robust, and accessible.

Please review this guide before submitting issues or pull requests.

---

## Table of Contents
1. [Code of Conduct](#code-of-conduct)
2. [Getting Started](#getting-started)
3. [Branching & Workflow](#branching--workflow)
4. [Development Guidelines](#development-guidelines)
5. [Commit Message Conventions](#commit-message-conventions)
6. [Pull Request Process](#pull-request-process)
7. [Reporting Security Issues](#reporting-security-issues)

---

## Code of Conduct

All contributors and maintainers are expected to adhere to our [Code of Conduct](CODE_OF_CONDUCT.md). Please report unacceptable behavior to the project maintainers.

---

## Getting Started

### 1. Prerequisites
- **Node.js**: `v20.x` or higher
- **npm**: `v10.x` or higher
- **Python**: `v3.10` or higher
- **MongoDB**: `v6.x` or higher (local or MongoDB Atlas)
- **Git**

### 2. Fork and Clone
```bash
git clone https://github.com/nexusMAKO1/amenconnect.git
cd amenconnect
```

### 3. Setup Components
Refer to the [README.md](README.md) for detailed instructions on running:
- **Backend API**: `cd Backend && npm install && cp .env.example .env`
- **AmenConnect App**: `cd AmenConnect && npm install && cp .env.example .env`
- **AmenKiosk Terminal**: `cd AmenKiosk && npm install && cp .env.example .env`
- **AmenBot Service**: `cd bot && pip install -r requirements.txt && cp .env.example .env`

---

## Branching & Workflow

We follow a Git Flow / Feature Branch model:

- `main`: Production-ready release branch.
- `develop`: Integration branch for upcoming releases.
- `feature/<feature-name>`: New capabilities and features.
- `bugfix/<issue-name>`: Bug fixes and patches.
- `hotfix/<patch-name>`: Urgent production fixes.

Always branch from `develop` (or `main` for hotfixes):
```bash
git checkout -b feature/my-new-feature
```

---

## Development Guidelines

### Code Style & Quality
- **TypeScript & React**: Follow standard ESLint rules. Always use strict typing; avoid `any`.
- **Node.js & Express**: Follow modular MVC patterns (routes, controllers, models, middleware).
- **Python**: Adhere to PEP 8 standards. Run `flake8` to check formatting.
- **Secrets Management**: NEVER commit credentials, private keys, `.env` files, or service account tokens. Always use environment variables.

### Testing
Ensure all existing tests pass before submitting code:
```bash
# Frontend unit tests
cd AmenConnect && npm run test.unit
cd ../AmenKiosk && npm run test.unit
```

---

## Commit Message Conventions

We follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

```
<type>(<scope>): <short description>

[optional body]

[optional footer(s)]
```

### Supported Types:
- `feat`: A new feature
- `fix`: A bug fix
- `docs`: Documentation only changes
- `style`: Changes that do not affect the meaning of the code (white-space, formatting, etc.)
- `refactor`: A code change that neither fixes a bug nor adds a feature
- `perf`: A code change that improves performance
- `test`: Adding missing tests or correcting existing tests
- `chore`: Changes to the build process, auxiliary tools, or libraries

### Example:
```
feat(kiosk): add thermal receipt printing support via jsPDF
fix(auth): sanitize JWT token verification payload
```

---

## Pull Request Process

1. Update the `README.md` and documentation with details of changes where applicable.
2. Verify that CI passes for your branch.
3. Submit a PR against `develop` (or `main`) using the [Pull Request Template](.github/PULL_REQUEST_TEMPLATE.md).
4. Solicit reviews from project maintainers and address any feedback promptly.
5. Once approved, PRs will be squashed and merged.

---

## Reporting Security Issues

Please **do not** report sensitive security vulnerabilities through public GitHub issues. Refer to [SECURITY.md](SECURITY.md) for instructions on confidential disclosure.

