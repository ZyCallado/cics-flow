# CICS Flow | Document Management System

CICS Flow is a high-fidelity document management portal specifically designed for the **College of Information and Computing Sciences (CICS)**. It streamlines the distribution of academic resources while providing administrators with robust oversight and AI-driven security insights.

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

## ⚙️ Setup & Deployment

1. **Environment Variables**:
   Ensure you have a `.env` file with your `GOOGLE_GENAI_API_KEY` for AI features.
   
2. **Firebase Configuration**:
   Update `src/firebase/config.ts` with your specific Firebase Project credentials.

3. **Firebase Console Steps**:
   - Enable **Email/Password** and **Google** sign-in providers.
   - Add your production domain to the **Authorized Domains** list in the Authentication settings.
   - Create a `roles_admin` collection and add a document with the UID of your admin user to grant administrative access.

4. **Development**:
   ```bash
   npm run dev
   ```

5. **Deployment**:
   The project is configured for **Firebase App Hosting**. Configuration is managed via `apphosting.yaml`.

---
*Developed for CICS Faculty and Students.*
