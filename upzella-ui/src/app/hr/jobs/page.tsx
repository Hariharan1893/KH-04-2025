'use client';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/lib/supabase';
import { Copy, Edit, Trash2 } from 'lucide-react';
import Link from 'next/link';
import React, { useEffect, useState } from 'react'

function page() {
    const [loading, setLoading] = useState(true);
    const [jobs, setJobs] = useState<any[]>([]);
    const [selectedJob, setSelectedJob] = useState<any>(null);
    const [copied, setCopied] = useState(false);


    useEffect(() => {
        const fetchJobs = async () => {
            setLoading(true);
            const { data, error } = await supabase.from("Jobs").select("*");
            if (error) console.error("Error fetching jobs:", error);
            else setJobs(data);
            console.log(data)
            setLoading(false);
        };
        fetchJobs();
    }, []);

    const handleEditJob = async () => {
        if (selectedJob) {
            const { error } = await supabase
                .from("Jobs")
                .update({
                    job_name: selectedJob.job_name,
                    job_description: selectedJob.job_description,
                    skills_required: selectedJob.skills_required,
                    experienced_required: selectedJob.experienced_required,
                    mandatory_questions: selectedJob.mandatory_questions,
                    resume_threshold: selectedJob.resume_threshold,
                })
                .eq("id", selectedJob.id);

            if (error) console.error("Error updating job:", error);
        }
    };

    // const handleMandatoryQuestionChange = (index: any, value: any) => {
    //     const newQuestions = [...jobs.mand_questions];
    //     newQuestions[index] = value;
    //     setSelectedJob((prev) => ({
    //         ...prev,
    //         mand_quetsions: newQuestions,
    //     }));
    // };

    const addMandatoryQuestion = () => {
        setSelectedJob((prev: any) => ({
            ...prev,
            mand_questions: [...prev.mand_questions, ''],
        }));
    };

    const handleRemoveJob = async (jobId: any) => {
        const { error } = await supabase
            .from("Jobs")
            .delete()
            .eq("id", jobId);

        if (error) {
            console.error("Error deleting job:", error);
        } else {
            setJobs((prev) => prev.filter((job) => job.id !== jobId));
            if (selectedJob?.id === jobId) {
                setSelectedJob(null);
            }
        }
    };


    const handleCopy = (url: string) => {
        navigator.clipboard.writeText(`${url}`);
        setCopied(true);
        setTimeout(() => setCopied(false), 3000);
    };

    return (
        <div className="p-4 w-full">
            <h2 className="text-lg font-semibold mb-4">Job Created</h2>
            {loading ? (
                <div>
                    Loading...
                </div>
            ) : (
                <div className="grid gap-4 w-full">
                    {jobs.map((job: any, index: any) => (
                        <Card
                            key={job.id}
                            className="p-6 border rounded-md w-full"
                        >
                            <div className="flex flex-col items-center justify-start gap-5">
                                <div className='flex justify-between items-center w-full'>
                                    <p className="text-md font-bold">{job.job_name}</p>
                                    <div className='flex gap-2 text-white fill-white'>
                                        <Link href={`/hr/view-candidates/${job.job_id}`} className='text-blue-500 underline'>View Candidates</Link>
                                        <Button
                                            className='bg-blue-500'
                                            variant="ghost" onClick={() => setSelectedJob(selectedJob?.id === job.id ? null : job)}>
                                            <Edit />
                                        </Button>
                                        <Button
                                            className='bg-red-500'
                                            variant="ghost"
                                            onClick={() => handleRemoveJob(job.id)}
                                        >
                                            <Trash2 />
                                        </Button>
                                    </div>


                                </div>
                                <div className='relative'>
                                    <div className='flex gap-5'>
                                        <p >Job Invite link: </p>
                                        <p className='border-2 px-2'>{job.url}</p>
                                        <button
                                            onClick={() => handleCopy(job.url)}
                                            className='bg-yellow-400 p-1 rounded-md'
                                        >
                                            <Copy />
                                        </button>
                                    </div>
                                    {copied && (
                                        <div className='absolute top-0 right-0 bg-green-500 text-white p-2 rounded-md'>
                                            Copied!
                                        </div>
                                    )}
                                </div>

                            </div>
                            {selectedJob?.id === job.id && (
                                <>
                                    <h2 className="text-2xl font-bold mb-4">Job Details</h2>
                                    <Input
                                        placeholder="Job Title"
                                        value={job.job_name}
                                        onChange={(e) =>
                                            setSelectedJob({ ...job, job_name: e.target.value })
                                        }
                                        className="mb-4"
                                    />
                                    <Textarea
                                        placeholder="Job Description"
                                        value={job.job_description}
                                        onChange={(e) =>
                                            setSelectedJob({ ...job, job_description: e.target.value })
                                        }
                                        className="mb-4"
                                    />
                                    <Input
                                        placeholder="Skills Required"
                                        value={job.skills}
                                        onChange={(e) =>
                                            setSelectedJob({ ...job, skills: e.target.value })
                                        }
                                        className="mb-4"
                                    />
                                    <Input
                                        placeholder="Experience Required"
                                        value={job.experience}
                                        onChange={(e) =>
                                            setSelectedJob({ ...job, experience: e.target.value })
                                        }
                                        className="mb-4"
                                    />
                                    <div className="mb-4  ">
                                        <h3 className="font-semibold mb-2">Mandatory Questions</h3>
                                        <div className='flex gap-5'>
                                            <div className='flex flex-col gap-3'>
                                                {JSON.parse(job.mand_questions).forEach((question: any, index: any) => (
                                                    // <Input
                                                    //     key={index}
                                                    //     placeholder={`Mandatory Question ${index + 1}`}
                                                    //     value={question}
                                                    //     onChange={(e) =>
                                                    //         handleMandatoryQuestionChange(index, e.target.value)
                                                    //     }
                                                    //     className="mb-2 w-[400px]"
                                                    // />
                                                    <p>{index}</p>
                                                ))}
                                            </div>
                                            <Button onClick={addMandatoryQuestion}>Add Question</Button>
                                        </div>
                                    </div>
                                    <Input
                                        placeholder="Job url"
                                        value={job.url}
                                        onChange={(e) =>
                                            setSelectedJob({ ...job, url: e.target.value })
                                        }
                                        className="mb-4"
                                    />
                                    <Button onClick={handleEditJob}>Save</Button>
                                </>
                            )}
                        </Card>
                    ))}
                </div>
            )}
        </div>
    )
}

export default page
