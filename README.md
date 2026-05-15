# BruteScan AI

BruteScan AI is a cybersecurity project focused on analyzing login access attempts and identifying suspicious patterns that may indicate brute-force attacks.

The project documents an AI-assisted detection workflow where login attempt data is collected, exported as CSV logs, and analyzed by AI agents to classify access attempts as legitimate or suspicious.

---

## Overview

BruteScan AI was designed to explore how access logs can be used to support brute-force attack detection.

The documented workflow focuses on monitoring login attempts, recording successful and failed access events, generating structured CSV data, and using AI-based analysis to classify suspicious behavior.

This repository presents the concept, objective, and detection flow of the project.

---

## Project Objective

The main objective of BruteScan AI is to support the identification of brute-force attack patterns based on login-related data.

The project focuses on analyzing information such as:

- Login attempts
- Failed access events
- Successful access events
- IP address patterns
- Suspicious access behavior
- CSV-based log records
- AI-generated classification results

---

## Documented Features

- Login attempt monitoring concept
- Successful and failed access logging
- CSV-based log generation
- AI-assisted access classification
- Suspicious access detection workflow
- Brute-force attack prediction objective
- AI-based verdict generation
- Graph-based result visualization concept

---

## AI Analysis

The project documentation describes the use of AI agents to analyze login access data and classify access attempts.

The documented AI analysis includes:

- Access log evaluation
- Suspicious pattern detection
- Classification of login attempts
- Brute-force attack prediction
- Verdict generation based on analyzed access data

The README references two AI-based analysis approaches:

- Watson X-based detector
- Copilot-based detector

---

## Detection Workflow

The documented workflow follows this sequence:

1. A user attempts to log in to the web application.
2. The system records access attempts.
3. Successful and failed login events are logged.
4. Access data is exported into CSV format.
5. CSV logs are sent to AI agents for analysis.
6. AI agents classify the access attempts.
7. The system produces verdicts indicating whether the access pattern appears legitimate or suspicious.
8. Graphs are generated to support visual interpretation of the results.

---

## Project Structure

The currently visible repository structure is:

```text
brutescan-ai/
└── README.md
```

### Main File

- `README.md`  
  Contains the project description, objective, detection concept, AI analysis overview, and team information.

---

## Tech Stack

Based on the visible repository documentation, the project references the following technologies and concepts:

- **CSV log generation**
- **AI-assisted analysis**
- **Watson X**
- **Copilot**
- **Login monitoring**
- **Brute-force attack detection**
- **Cybersecurity log analysis**

> No implementation files, dependency files, backend source code, frontend source code, database configuration, or executable setup files are currently visible in the repository.

---

## Security Context

Brute-force attacks are a common authentication threat where repeated login attempts are made in order to guess valid credentials.

This project focuses on a defensive cybersecurity scenario: analyzing login activity to identify suspicious access behavior and support detection workflows.

---

## Installation

No installation steps are currently available because the repository does not visibly include executable source code or dependency files.

If implementation files are added in the future, this section should include:

```bash
git clone https://github.com/lucaspc6/brutescan-ai.git
cd brutescan-ai
```

And then the appropriate setup commands for the project stack.

---

## Running the Project

No runnable application entry point is currently visible in the repository.

If the web application source code is added in the future, this section should document:

- Backend startup commands
- Frontend startup commands
- Database setup
- Environment variables
- CSV generation flow
- AI agent execution process

---

## Environment Variables

No environment variables are currently documented in the visible repository content.

If the project uses external services, AI providers, authentication configuration, or database access, environment variables should be documented without exposing sensitive values.

Example structure:

```env
AI_PROVIDER=
AI_API_KEY=
DATABASE_URL=
LOG_OUTPUT_PATH=
```

> Never commit real API keys, credentials, tokens, or production secrets to a public repository.

---

## Testing

No automated tests are currently visible in the repository.

Recommended future test coverage includes:

- Login event logging validation
- CSV generation validation
- Suspicious pattern classification validation
- Input data validation
- AI response handling
- Error handling for missing or malformed logs

---

## Screenshots

Screenshots would improve the professional presentation of this project.

Recommended screenshots:

- Login page
- Access log table
- CSV log sample
- AI analysis result
- Suspicious access classification output
- Graphs generated from AI verdicts

---

## Future Improvements

Potential improvements for this repository include:

- Add the web application source code
- Add backend and frontend folders
- Document the application architecture
- Add sample CSV log files with anonymized data
- Add example AI classification outputs
- Add screenshots of the login flow and analysis results
- Add setup and execution instructions
- Add environment variable documentation
- Add automated tests
- Add a security disclaimer
- Add a diagram showing the full detection pipeline
- Add a sample dataset for demonstration purposes
- Add a clear explanation of how Watson X and Copilot are used in the analysis flow

---

## Responsible Use

This project is intended for educational and defensive cybersecurity purposes only.

It should be used to understand access log analysis, suspicious login detection, and AI-assisted security monitoring.

Do not use this project to perform unauthorized access attempts, credential attacks, or any activity against systems without explicit permission.

---

## Author

**Lucas Carvalho**

GitHub: [@lucaspc6](https://github.com/lucaspc6/)
