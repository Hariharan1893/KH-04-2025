'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/lib/supabase';
import { v4 as uuidv4 } from 'uuid';

export default function CandidateApplication() {
  const { jobid }: any = useParams();
  const jobId = jobid;

  const [jobData, setJobData] = useState<any>(null);
  const [jobLoading, setJobLoading] = useState(true);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [resume, setResume] = useState<any>(null);
  const [currentCTC, setCurrentCTC] = useState('');
  const [expectedCTC, setExpectedCTC] = useState('');
  const [github, setGithub] = useState('');
  const [linkedin, setLinkedin] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [countdown, setCountdown] = useState(15);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  let parsedData: any = null;
  let resumeUrl: any = null;

  useEffect(() => {
    if (jobId) {
      const fetchJob = async () => {
        const { data, error } = await supabase
          .from('Jobs')
          .select('*')
          .eq('job_id', jobId)
          .maybeSingle();
        if (error) {
          console.error('Error fetching job:', error);
        } else {
          setJobData(data);
        }
        setJobLoading(false);
      };
      fetchJob();
    }
  }, [jobId]);

  const handleFileChange = (e: any) => {
    setResume(e.target.files[0]);
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    setIsSubmitting(true);
    setCountdown(20);

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setIsSubmitting(false);
          setShowSuccessModal(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    try {
      const candidateId = uuidv4();
      const filePath = `${jobId}/${candidateId}/${resume.name}`;

      const { data: uploadData, error: uploadError } = await supabase
        .storage
        .from('resumes')
        .upload(filePath, resume, {
          cacheControl: '3600',
          upsert: false,
        });


      if (uploadError) {
        console.error('Error uploading file:', uploadError);
        clearInterval(timer);
        setIsSubmitting(false);
        return;
      }

      if (uploadData) {
        const { data: publicURL } = await supabase
          .storage
          .from('resumes')
          .getPublicUrl(filePath);

        if (publicURL) {
          console.log("Public URL:", publicURL);

          try {
            const response = await fetch('http://localhost:5000/parseResume', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ resumeUrl: publicURL, jobDescription: jobData }),
            });
            const data = await response.json();
            resumeUrl = publicURL;

            console.log(data);

            const parsedCurrentCTC = currentCTC.trim() !== "" ? parseFloat(currentCTC) : null;
            const parsedExpectedCTC = expectedCTC.trim() !== "" ? parseFloat(expectedCTC) : null;

            const { data: insertData, error: insertError } = await supabase
              .from('CandidateApply')
              .insert({
                candidate_id: candidateId,
                job_id: jobId,
                name,
                email,
                resume_data: {
                  parsedData: data['parsedText'],
                  scoredData: data['scoredData'],
                  resumeUrl: resumeUrl,
                },
                current_ctc: parsedCurrentCTC,
                expected_ctc: parsedExpectedCTC,
                github_url: github,
                linkedin_url: linkedin,
              })
              .select();

            if (insertError) {
              console.error('Error inserting candidate application:', insertError);
            } else {
              console.log('Insert successful:', insertData);
            }

            console.log("Resume data inserted successfully:", insertData);


          } catch (parseError) {
            console.error('Error parsing resume:', parseError);
          }
        }
      }

    } catch (e) {
    }
  };

  const handleCloseModelPopup = () => {
    setShowSuccessModal(false);
    setName('')
    setEmail('')
    setResume('')
    setCurrentCTC('')
    setExpectedCTC('')
    setGithub('')
    setLinkedin('')
    setIsSubmitting(false)
    setCountdown(20)
  }

  return (
    <div className="max-w-lg mx-auto p-4">
      {jobLoading ? (
        <p>Loading job details...</p>
      ) : jobData ? (
        <div className="my-6">
          <h1 className="text-2xl font-bold my-5">{jobData.job_name}</h1>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="name" className="block mb-1">
                Name *
              </Label>
              <Input
                id="name"
                type="text"
                placeholder="Your Name"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="email" className="block mb-1">
                Email *
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="Your Email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="resume" className="block mb-1">
                Resume (Upload) *
              </Label>
              <Input
                id="resume"
                type="file"
                required
                onChange={handleFileChange}
              />
            </div>
            <div>
              <Label htmlFor="currentCTC" className="block mb-1">
                Current CTC
              </Label>
              <Input
                id="currentCTC"
                type="text"
                placeholder="Current CTC"
                value={currentCTC}
                onChange={(e) => setCurrentCTC(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="expectedCTC" className="block mb-1">
                Expected CTC
              </Label>
              <Input
                id="expectedCTC"
                type="text"
                placeholder="Expected CTC"
                value={expectedCTC}
                onChange={(e) => setExpectedCTC(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="github" className="block mb-1">
                Github Link *
              </Label>
              <Input
                id="github"
                type="url"
                placeholder="https://github.com/yourusername"
                required
                value={github}
                onChange={(e) => setGithub(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="linkedin" className="block mb-1">
                LinkedIn Link *
              </Label>
              <Input
                id="linkedin"
                type="url"
                placeholder="https://linkedin.com/in/yourprofile"
                required
                value={linkedin}
                onChange={(e) => setLinkedin(e.target.value)}
              />
            </div>
            <Button type="submit" className="mt-4" disabled={isSubmitting}>
              {isSubmitting
                ? `Submitting... (${countdown}s)`
                : 'Submit Application'}
            </Button>
          </form>
        </div>
      ) : (
        <p className="mb-6 text-red-500">Job not found.</p>
      )}

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white p-6 rounded-lg text-center">
            <div className="mb-4 flex w-full justify-center">
              <svg
                className="w-16 h-16 text-green-500"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M20 6L9 17l-5-5" />
              </svg>
            </div>
            <p className="text-xl font-semibold text-green-600">
              Application Submitted!
            </p>
            <Button onClick={handleCloseModelPopup} className="mt-4">
              Close
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
