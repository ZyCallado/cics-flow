# CICS Flow | Document Management System

CICS Flow is a high-fidelity document management portal specifically designed for the **College of Information and Computing Studies (CICS)**. It streamlines the distribution of academic resources while providing administrators with robust oversight and AI-driven security insights.

## 🚀 Key Features

### For Students
- **Institutional Access**: Secured strictly for `@neu.edu.ph` email domains.
- **Resource Browser**: Browse lecture notes, research papers, and exam prep materials with advanced filtering.
- **Personal Library**: A "My Downloads" section that automatically tracks and stores previously accessed resources for quick reference.
- **Onboarding**: A tailored setup experience to align the dashboard with your specific degree program.

### For Administrators
- **Real-time Analytics**: A comprehensive dashboard tracking student login frequency, popular resources, and live user activity.
- **Document Registry**: Full CRUD (Create, Read, Update, Delete) capabilities for PDF assets, including automatic file size calculation and metadata management.
- **User Management**: Monitor registered students and the ability to restrict or grant access (Block/Unblock) based on institutional policy.
- **AI Security Auditor**: Leverages **Google Genkit** and Gemini to analyze audit logs for unusual patterns or security threats.
- **Audit Logging**: Comprehensive tracking of all critical system actions (logins, downloads, management changes).

## 🛠 Technology Stack

- **Framework**: [Next.js 15](https://nextjs.org/) (App Router)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) & [ShadCN UI](https://ui.shadcn.com/)
- **Backend**: [Firebase](https://firebase.google.com/) (Authentication, Firestore, Security Rules)
- **AI**: [Google Genkit](https://firebase.google.com/docs/genkit) (Gemini 2.0 Flash)
- **Charts**: [Recharts](https://recharts.org/)
- **Icons**: [Lucide React](https://lucide.dev/)

## 📂 Project Structure

- `src/ai/`: Contains Genkit flow definitions and AI prompt templates.
- `src/app/`: Next.js pages and global layout configurations.
- `src/components/`: Modular UI components categorized by feature (auth, dashboard, ui).
- `src/firebase/`: Firebase initialization, custom hooks (`useCollection`, `useDoc`), and non-blocking database utility functions.
- `src/lib/`: Type definitions and shared utility functions.

## 🔒 Security Model

The application enforces a strict **DBAC (Database-Backed Access Control)** model:
- **Authorization Independence**: Security rules perform independent lookups against a `roles_admin` collection to verify administrative privileges without relying on custom claims.
- **Domain Restriction**: Hard-coded logic ensures only authorized institutional emails can bypass the initial authentication wall.
- **Audit Trail**: Every significant action creates an entry in the `activityLogs` collection, which is used by the AI Auditor to maintain system integrity.


---
*Developed for CICS Faculty and Students.*


# Live Link
[https://cics-flow.vercel.app/](https://cics-flow.vercel.app/)

# Previews
| Login Page | Student Dashboard |
|:---:|:---:|
| <img width="1910" height="946" alt="image" src="https://github.com/user-attachments/assets/a0d7c1b8-74de-4bc6-b98e-93b7b2db1f29" />
 | <img width="1887" height="894" alt="image" src="https://github.com/user-attachments/assets/510dff58-23bb-4b89-bbee-8188c2e94f14" />
 |

| Document Management | Admin Panel |
|:---:|:---:|
|<img width="1891" height="1994" alt="image" src="https://github.com/user-attachments/assets/46974627-b3d0-409f-9735-93c4f5e3b7bb" />| <img width="1893" height="1384" alt="image" src="https://github.com/user-attachments/assets/9f1178d9-88f5-4fea-ad9d-4e47379d2463" />
 |
