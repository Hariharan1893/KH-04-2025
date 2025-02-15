'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
import Link from 'next/link';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'react-hot-toast';

export default function ViewCandidates() {
  const { jobid }: any = useParams();
  const jobId = jobid;

  const [candidates, setCandidates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [jobData, setJobData] = useState<any>(null);

  const [interviewData, setInterviewData] = useState<any>(null);


  interface ScoredData {
    [key: string]: any;
    total_score?: number;
    total_reason?: string;
  }

  useEffect(() => {
    if (jobId) {
      const fetchCandidates = async () => {
        const { data, error } = await supabase
          .from('CandidateApply')
          .select('*')
          .eq('job_id', jobId);
        if (error) {
          console.error('Error fetching candidates:', error);
        } else {
          setCandidates(data);
        }
        setLoading(false);
      };

      const fetchJobData = async () => {
        const { data, error } = await supabase
          .from('Jobs')
          .select('resume_filt_threshold, job_name, parsing_weigthage, job_id')
          .eq('job_id', jobId)
          .maybeSingle();
        if (error) {
          console.error('Error fetching job details:', error);
        } else {
          setJobData(data);
        }
      };

      fetchCandidates();
      fetchJobData();
    }
  }, [jobId]);

  const handleSendMail = async () => {
    if (!jobData || !jobData.resume_filt_threshold) return;

    const threshold = parseInt(jobData.resume_filt_threshold.toString().replace('%', ''));

    const qualifiedCandidates = candidates.filter((candidate) => {
      const resumeData = candidate.resume_data;
      let scoredData: any = {};
      try {
        scoredData = resumeData && resumeData.scoredData ? resumeData.scoredData : {};
      } catch (error) {
        console.error('Error parsing scoredData', error);
      }
      const totalScore = scoredData?.total_score || 0;
      return totalScore >= threshold;
    });

    if (qualifiedCandidates.length === 0) {
      toast.error('No qualified candidates to send emails to.');
      return;
    }

    const candidateDetails = qualifiedCandidates.map((c) => ({
      candidate_id: c.candidate_id,
      candidate_email: c.email,
      candidate_name: c.name,
    }));

    try {
      await fetch('/api/send-mail', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          candidateDetails,
          provider: 'gmail',
          subject: `Interview Invitation for ${jobData.job_name}`,
          message: `Dear candidate,\n\nYou have been shortlisted for an interview for the position of ${jobData.job_name}. `,
          jobId: jobId,
        }),
      });
      toast.success('Emails sent successfully!');
    } catch (error) {
      console.error('Error sending emails:', error);
      toast.error('Failed to send emails.');
    }
  };

  if (loading) {
    return <div className="flex flex-col items-center justify-center h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-blue-500"></div>

      <p className="mt-4 text-lg text-gray-700 flex">
        Loading candidates...
      </p>
    </div>
  }

  return (
    <TooltipProvider>
      <Card className="p-4">
        <CardHeader>
          <CardTitle>Candidates for Job: {jobData?.job_name || jobId}</CardTitle>
          <p className="text-muted-foreground">Resume Threshold: {jobData?.resume_filt_threshold}</p>
        </CardHeader>
        <CardContent>
          <Button onClick={handleSendMail} className="mb-4">Send Mail to All Qualified Candidates</Button>
          {candidates.length === 0 ? (
            <p>No candidate applications found for this job.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Education Score</TableHead>
                  <TableHead>Experience Score</TableHead>
                  <TableHead>Technical Score</TableHead>
                  <TableHead>Total Score</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Interview Status</TableHead>
                  <TableHead>Report</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {candidates.map((candidate: any) => {
                  const resumeData = candidate.resume_data;
                  let scoredData: ScoredData = {};
                  try {
                    scoredData = resumeData && resumeData.scoredData ? resumeData.scoredData : {};
                  } catch (error) {
                    console.error('Error parsing scoredData', error);
                  }

                  const totalScore = scoredData.total_score || 0;
                  const totalReason = scoredData.total_reason || 'No explanation provided.';

                  const educationScore = scoredData.Education_score || 0;
                  const experienceScore = scoredData.Experience_score || 0;
                  const technicalScore = scoredData['Technical Skills_score'] || 0;

                  const educationReason = scoredData.Education_reason || 'No explanation provided.';
                  const experienceReason = scoredData.Experience_reason || 'No explanation provided.';
                  const technicalReason = scoredData['Technical Skills_reason'] || 'No explanation provided.';


                  const getActionStatus = () => {
                    if (
                      jobData?.resume_filt_threshold &&
                      totalScore >= parseInt(jobData.resume_filt_threshold.toString().replace('%', ''))
                    ) {
                      return <Button>Start Interview</Button>;
                    }

                    return <span>Not fit</span>;
                  };

                  const getInterviewStatus = (interviewData: any) => {

                    const actionStatus: any = getActionStatus();
                    const isNotFit = React.isValidElement(actionStatus) && (actionStatus?.props.children as any) === "Not fit";

                    if (isNotFit) {
                      return "Not fit";
                    }
                    if (!interviewData) return "Pending";

                    return "Done";
                  };



                  const fetchInterviewData = async () => {
                    try {
                      const { data, error } = await supabase
                        .from('InterviewDetails')
                        .select('*')
                        .eq('candidate_id', candidate?.candidate_id).order('created_at', { ascending: false }) // Sort by latest first
                        .limit(1)
                        .maybeSingle();
                      if (error) {
                        console.error('Error fetching candidates:', error);
                        setInterviewData(null)
                      } else {
                        setInterviewData(data);
                      }
                    } catch (e) { }
                  };

                  fetchInterviewData();


                  return (
                    <TableRow key={candidate.candidate_id}>
                      <TableCell>
                        {resumeData?.resumeUrl?.publicUrl ? (
                          <Link href={resumeData.resumeUrl.publicUrl} target="_blank" className="text-blue-500 hover:underline">
                            {candidate.name}
                          </Link>
                        ) : (
                          candidate.name
                        )}
                      </TableCell>
                      <TableCell>{candidate.email}</TableCell>

                      <TableCell>
                        <Tooltip >
                          <TooltipTrigger asChild>
                            <span>{educationScore}%</span>
                          </TooltipTrigger>
                          <TooltipContent className='max-w-[300px]'>
                            <p>{educationReason}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TableCell>

                      <TableCell>
                        <Tooltip >
                          <TooltipTrigger asChild>
                            <span>{experienceScore}%</span>
                          </TooltipTrigger>
                          <TooltipContent className='max-w-[300px]'>
                            <p>{experienceReason}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TableCell>

                      <TableCell>
                        <Tooltip >
                          <TooltipTrigger asChild>
                            <span>{technicalScore}%</span>
                          </TooltipTrigger>
                          <TooltipContent className='max-w-[300px]'>
                            <p>{technicalReason}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TableCell>

                      <TableCell>
                        <Tooltip >
                          <TooltipTrigger asChild>
                            <span>{totalScore}%</span>
                          </TooltipTrigger>
                          <TooltipContent className='max-w-[300px]'>
                            <p>{totalReason}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TableCell>
                      <TableCell>
                        {getActionStatus()}
                      </TableCell>
                      <TableCell>
                        {getInterviewStatus(interviewData)}
                      </TableCell>

                      <TableCell>
                        {getInterviewStatus(interviewData) === 'Done' ? (
                          <Link className='text-blue-400 underline' target='_blank' href={`/hr/view-candidates/${jobId}/interview-report/${candidate.candidate_id}`}>
                            View Report
                          </Link>
                        ) : (
                          <span>NA</span>
                        )}
                      </TableCell>

                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </TooltipProvider>
  );
}