# Secure Cloud Question-Paper Management System

## Project Description

This is a simple front-end prototype of a Secure Cloud Question-Paper Management System. It demonstrates how question papers can be created, protected, reviewed, approved and released at a controlled time.

The project follows the main ideas in the proposed architecture:

- Secure authentication with a simple MFA simulation
- Role-Based Access Control (RBAC)
- AES-256-GCM encryption demonstration
- SHA-256 integrity checking
- Controlled time-based release
- Monitoring and audit logs
- Browser-based local storage

> Note: This is a college micro-project prototype. It runs entirely in the browser and does not connect to a real cloud server. In a production system, authentication, encryption keys, storage and audit logs should be handled by secure backend/cloud services and a KMS/HSM.

## Technologies / Tools Used

- HTML5
- CSS3
- JavaScript
- Web Crypto API
- Browser LocalStorage and SessionStorage
- GitHub

## How to Run

No installation or external dependency is required.

1. Download or clone the repository.
2. Keep `index.html`, `style.css`, and `script.js` in the same folder.
3. Double-click `index.html`.
4. The application opens in a modern web browser.

For the demo login, select any role and enter any non-empty password.

## User Roles

### Question Setter
- Creates a question paper.
- The questions are encrypted using AES-256-GCM.
- A SHA-256 hash is generated for integrity.
- Can delete papers while they are still in the Created state.

### Reviewer
- Views available question papers.
- Moves a created paper to `Under Review`.

### Approving Authority
- Approves papers that have been reviewed.
- Sets a future release time for approved papers.

## Project Structure

```text
secure-cloud-question-paper/
│
├── index.html      # Main application interface
├── style.css       # Page layout and styling
├── script.js       # Authentication, RBAC, encryption, workflow and audit logic
└── README.md       # Project documentation
```

## Workflow

```text
Login
  ↓
Question Setter creates paper
  ↓
AES-256-GCM encryption + SHA-256 hash
  ↓
Reviewer reviews paper
  ↓
Approving Authority approves paper
  ↓
Approving Authority sets release time
  ↓
Audit log records important actions
```

## Sample Input

Role: `Question Setter`

Subject:
`Cloud Computing`

Exam:
`Internal Assessment 1`

Questions:
```text
1. What is cloud computing?
2. Explain IaaS, PaaS and SaaS.
3. What are the advantages of cloud storage?
```

## Sample Output

The application displays:

```text
Cloud Computing
Exam: Internal Assessment 1
Status: Created
Integrity: <SHA-256 hash>
```

After the workflow:

```text
Status: Under Review
        ↓
Status: Approved
        ↓
Release: <selected future date and time>
```

Important actions are also shown in the Monitoring & Audit section.

## Security Features Demonstrated

### RBAC
The interface enables actions according to the selected role.

### AES-256-GCM
Question text is encrypted using the browser's Web Crypto API before it is stored.

### SHA-256
A SHA-256 digest is generated from the original question text to demonstrate integrity verification.

### Audit Logging
Login, creation, review, approval, deletion and time-lock actions are recorded with role and timestamp.

### Controlled Release
Only the Approving Authority can set a future release time for an approved paper.

## Limitations

This implementation is intentionally simple for a micro-project. It is a client-side demonstration rather than a production cloud security system. Browser storage should not be treated as secure cloud storage, and the demo encryption key is stored locally for demonstration purposes.
