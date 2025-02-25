'use client';

import { supabase } from '@/lib/supabase';
import { useParams } from 'next/navigation';
import React, { useEffect, useState } from 'react';
import Editor from '@monaco-editor/react';
import { Button } from '@/components/ui/button';


function page() {
    const { jobid }: any = useParams();
    const data = jobid;
    const jobId = data.split('--')[0];
    const candidateId = data.split('--')[1];

    const [jobData, setJobData] = useState<any>(null);
    const [candidateData, setCandidateData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [code, setCode] = useState('// Write your code here...');
    const [output, setOutput] = useState<string>('');



    useEffect(() => {
        async function fetchData() {
            setLoading(true);
            const { data: jobDataItems } = await supabase
                .from('Jobs')
                .select('job_description, job_name')
                .eq('job_id', jobId)
                .single();
            setJobData(jobDataItems);

            const { data: candidateItems } = await supabase
                .from('CandidateApply')
                .select('resume_data, email')
                .eq('candidate_id', candidateId)
                .single();
            setCandidateData(candidateItems?.email);

            setLoading(false);
        }
        fetchData();
    }, [jobId, candidateId]);

    const runCode = () => {
        try {
            // eslint-disable-next-line no-new-func
            const result = new Function(code)();
            setOutput(String(result));
        } catch (error) {
            setOutput(String(error));
        }
    };

    return (
        <React.Fragment>
            <div className="max-w-4xl mx-auto p-6">
                <h1 className="text-center text-2xl font-bold my-4">Upzella - Code Environment</h1>
                <p className="text-center w-full text-lg">{jobData?.job_name} - (Interview)</p>
                <div className="mt-4 border rounded-lg overflow-hidden">
                    <Editor
                        height="300px"
                        defaultLanguage="javascript"
                        value={code}
                        onChange={(newValue) => setCode(newValue || '')}
                    />
                </div>
                <Button className="mt-4 w-full" onClick={runCode}>Run Code</Button>
                <div className="mt-4 p-3 border rounded-lg bg-gray-100">
                    <h3 className="font-semibold">Output:</h3>
                    <pre className="text-sm text-gray-800">{output || 'No output yet...'}</pre>
                </div>
            </div>

        </React.Fragment>
    )
}

export default page
