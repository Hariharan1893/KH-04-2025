'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import Link from 'next/link';

export default function ViewCandidates() {
  const { jobid }: any = useParams();
  const jobId = jobid;
  const router = useRouter();

  const [candidates, setCandidates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [jobData, setJobData] = useState<any>(null);

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
          console.log("Candidates:", data);
          setCandidates(data);
        }
        setLoading(false);
      };

      const fetchJobData = async () => {
        const { data, error } = await supabase
          .from('Jobs')
          .select('resume_filt_threshold, job_name, parsing_weigthage')
          .eq('job_id', jobId)
          .maybeSingle();
        if (error) {
          console.error('Error fetching job details:', error);
        } else {
          console.log("Job Data:", data);
          setJobData(data);
        }
      };

      fetchCandidates();
      fetchJobData();
    }
  }, [jobId]);

  const startInterview = (candidate: any) => {
    alert(`Starting interview for ${candidate.name} (Candidate ID: ${candidate.candidate_id}).`);
  };



  if (loading) {
    return <p>Loading candidates...</p>;
  }

  // Extract dynamic categories from jobData.parsing_weigthage (an array of objects)
  const categories = jobData?.parsing_weigthage
    ? jobData.parsing_weigthage.map((item: any) => item.description)
    : [];

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">
        Candidates for Job: {jobData?.job_name || jobId}
      </h1>
      <p className='mb-5'>Resume Threshold: {jobData?.resume_filt_threshold}</p>
      {candidates.length === 0 ? (
        <p>No candidate applications found for this job.</p>
      ) : (
        <table className="min-w-full border-collapse border border-gray-300">
          <thead>
            <tr className="bg-gray-100">
              <th className="border p-2">Name</th>
              {jobData?.parsing_weigthage &&
                jobData.parsing_weigthage.map((item: any) => (
                  <th key={item.description} className="border p-2">
                    {item.description} ({item.weightage})
                  </th>
                ))
              }
              <th className="border p-2">Total Score</th>
              <th className="border p-2">Action</th>
            </tr>
          </thead>
          <tbody>
            {candidates.map((candidate) => {
              const resumeData = candidate.resume_data;
              console.log("Candidate resume_data:", resumeData);

              let scoredData: ScoredData = {};
              try {
                scoredData = resumeData && resumeData.scoredData
                  ? resumeData.scoredData
                  : {};
                console.log("Scored Data:", scoredData);
              } catch (error) {
                console.error("Error parsing scoredData", error);
              }

              const totalScore = scoredData.total_score || 0;
              const totalReason = scoredData.total_reason || "No explanation provided.";

              return (
                <tr key={candidate.candidate_id}>
                  <td className="border p-2">
                    <Link href={`${resumeData.resumeUrl.publicUrl}`} target='_blank' className="text-blue-500 hover:underline">
                      {candidate.name}
                    </Link>
                  </td>
                  {categories.map((category: any) => {
                    const scoreKey = `${category}_score`;
                    const reasonKey = `${category}_reason`;
                    const categoryScore = scoredData[scoreKey] || 0;
                    const categoryReason = scoredData[reasonKey] || "No explanation provided.";
                    return (
                      <td key={category} className="border p-2">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span>{categoryScore}%</span>
                          </TooltipTrigger>
                          <TooltipContent className="w-[200px]">
                            <p>{categoryReason}</p>
                          </TooltipContent>
                        </Tooltip>
                      </td>
                    );
                  })}
                  <td className="border p-2">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span>{totalScore}%</span>
                      </TooltipTrigger>
                      <TooltipContent className="w-[200px]">
                        <p>{totalReason}</p>
                      </TooltipContent>
                    </Tooltip>
                  </td>
                  <td className="border p-2 text-center">
                    {jobData && parseInt(jobData.resume_filt_threshold.toString().replace("%", '')) && parseInt(totalScore.toString().replace("%", '')) >= parseInt(jobData.resume_filt_threshold.toString().replace("%", '')) ? (
                      <Button onClick={() => startInterview(candidate)}>
                        Start Interview
                      </Button>
                    ) : (
                      <span>Not fit</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
}
