// app/api/send-email/route.ts

import { sendEmail } from "@/lib/mailer/mailer";
import { NextRequest, NextResponse } from "next/server";


interface EmailRequestBody {
  candidateDetails: string;
  subject: string;
  provider: "zoho" | "gmail";
  message: string;
  jobId: string;
}


async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const { candidateDetails, subject, provider, message }: EmailRequestBody = await req.json();

    console.log(candidateDetails, subject, provider, message)
    await sendEmail(candidateDetails, subject, provider, message);

    return NextResponse.json({ message: "Emails sent successfully!" });
  } catch (error: any) {
    console.error('Error:', error);
    return NextResponse.json({ message: "Failed to send email.", error: error.message }, { status: 500 });
  }
}

export { POST };
