// app/api/send-email/route.ts

import { sendEmail } from "@/lib/mailer/mailer";
import { NextRequest, NextResponse } from "next/server";

interface CandidateDetail {
  candidate_id: string;
  candidate_email: string;
  candidate_name: string;
}

interface EmailRequestBody {
  candidateDetails: CandidateDetail[];
  subject: string;
  provider: "zoho" | "gmail";
  message: string;
  jobId: string;
}

const INTERVIEW_BASE_URL = process.env.INTERVIEW_BASE_URL || "http://localhost:3000/interview";

async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const { candidateDetails, subject, provider, message, jobId }: EmailRequestBody = await req.json();

    for (const candidate of candidateDetails) {
      const interviewUrl = `${INTERVIEW_BASE_URL}/${jobId}--${candidate.candidate_id}`;
      const personalizedMessage = `${message}\n\nInterview Link: ${interviewUrl}`;

      await sendEmail(candidate.candidate_email, subject, provider, personalizedMessage);
    }

    return NextResponse.json({ message: "Emails sent successfully!" });
  } catch (error: any) {
    console.error('Error:', error);
    return NextResponse.json({ message: "Failed to send email.", error: error.message }, { status: 500 });
  }
}

export { POST };
