'use server';
/**
 * @fileOverview An AI agent for administrators to analyze audit logs for unusual login patterns or potential security concerns.
 *
 * - adminAuditLogAnalysis - A function that handles the audit log analysis process.
 * - AdminAuditLogAnalysisInput - The input type for the adminAuditLogAnalysis function.
 * - AdminAuditLogAnalysisOutput - The return type for the adminAuditLogAnalysis function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AdminAuditLogAnalysisInputSchema = z.object({
  auditLogs: z
    .string()
    .describe(
      'A multi-line string containing recent audit log entries for analysis.'
    ),
});
export type AdminAuditLogAnalysisInput = z.infer<
  typeof AdminAuditLogAnalysisInputSchema
>;

const AdminAuditLogAnalysisOutputSchema = z.object({
  findings: z
    .array(
      z.object({
        description: z
          .string()
          .describe('A description of the identified pattern or security concern.'),
        severity: z
          .enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'])
          .describe('The severity level of the concern.'),
        relevantLogs: z
          .array(z.string())
          .describe('Specific log entries that are relevant to this finding.'),
        suggestion: z
          .string()
          .describe('A suggested action or recommendation for this finding.'),
      })
    )
    .describe('A list of identified unusual patterns or security concerns.'),
});
export type AdminAuditLogAnalysisOutput = z.infer<
  typeof AdminAuditLogAnalysisOutputSchema
>;

export async function adminAuditLogAnalysis(
  input: AdminAuditLogAnalysisInput
): Promise<AdminAuditLogAnalysisOutput> {
  return adminAuditLogAnalysisFlow(input);
}

const prompt = ai.definePrompt({
  name: 'adminAuditLogAnalysisPrompt',
  input: {schema: AdminAuditLogAnalysisInputSchema},
  output: {schema: AdminAuditLogAnalysisOutputSchema},
  prompt: `You are an expert security analyst specializing in identifying unusual login patterns and potential security threats from audit logs.

Analyze the following audit logs to detect any suspicious activities, anomalous login behaviors, or security concerns. Provide a clear description of each finding, its severity, the specific log entries that support your finding, and a practical suggestion for resolution or further investigation.

Focus on patterns such as:
- Repeated failed login attempts from unusual IP addresses or locations.
- Successful logins from new or unexpected geographical locations.
- Logins outside of typical working hours for a user.
- Access to sensitive resources by unusual users or roles.
- Rapid consecutive logins/logouts.

Audit Logs:
{{{auditLogs}}}`,
});

const adminAuditLogAnalysisFlow = ai.defineFlow(
  {
    name: 'adminAuditLogAnalysisFlow',
    inputSchema: AdminAuditLogAnalysisInputSchema,
    outputSchema: AdminAuditLogAnalysisOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
