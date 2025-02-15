'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import Image from 'next/image';
import { supabase } from '@/lib/supabase';
import Confetti from 'react-confetti';
import { v4 as uuidv4 } from 'uuid';

export default function JobCreationWizard() {
  const [currentStep, setCurrentStep] = useState(0);
  const [jobDetails, setJobDetails] = useState({
    title: '',
    description: '',
    skills: '',
    mandatoryQuestions: [''],
    experience: '',
  });
  const [candidateFiltering, setCandidateFiltering] = useState({
    resumeThreshold: '80%',
    weightageTable: [
      { description: 'Education', weightage: '20%' },
      { description: 'Experience', weightage: '30%' },
      { description: 'Technical Skills', weightage: '50%' },
    ],
  });
  const [showConfetti, setShowConfetti] = useState(false);
  const [confettiDimensions, setConfettiDimensions] = useState({ width: 0, height: 0 });


  const integrations = [
    '/images/zoho-crm.jpg',
    '/images/hrmnest.png',
    '/images/hubspot.png'
  ]

  const addMandatoryQuestion = () => {
    setJobDetails((prev) => ({
      ...prev,
      mandatoryQuestions: [...prev.mandatoryQuestions, ''],
    }));
  };

  const handleMandatoryQuestionChange = (index: any, value: any) => {
    const newQuestions = [...jobDetails.mandatoryQuestions];
    newQuestions[index] = value;
    setJobDetails((prev) => ({
      ...prev,
      mandatoryQuestions: newQuestions,
    }));
  };

  const addWeightageRow = () => {
    setCandidateFiltering((prev) => ({
      ...prev,
      weightageTable: [...prev.weightageTable, { description: '', weightage: '' }],
    }));
  };

  const handleWeightageRowChange = (index: any, field: any, value: any) => {
    const newTable = [...candidateFiltering.weightageTable];
    newTable[index] = { ...newTable[index], [field]: value };
    setCandidateFiltering((prev) => ({
      ...prev,
      weightageTable: newTable,
    }));
  };

  const nextStep = () => {
    setCurrentStep((prev) => prev + 1);
  };

  const prevStep = () => {
    setCurrentStep((prev) => prev - 1);
  };

  const uuid = uuidv4();
  const url = 'http://localhost:3000/hr/jobs/invite/' + uuid;

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return (
          <div className=' w-full h-full'>
            <h2 className="text-2xl font-bold mb-4">Job Details</h2>
            <Input
              placeholder="Job Title"
              value={jobDetails.title}
              onChange={(e) =>
                setJobDetails({ ...jobDetails, title: e.target.value })
              }
              className="mb-4 h-8"
            />
            <Textarea
              placeholder="Job Description"
              value={jobDetails.description}
              onChange={(e) =>
                setJobDetails({ ...jobDetails, description: e.target.value })
              }
              className="mb-4"
            />
            <Input
              placeholder="Skills Required"
              value={jobDetails.skills}
              onChange={(e) =>
                setJobDetails({ ...jobDetails, skills: e.target.value })
              }
              className="mb-4"
            />
            <Input
              placeholder="Experience Required"
              value={jobDetails.experience}
              onChange={(e) =>
                setJobDetails({ ...jobDetails, experience: e.target.value })
              }
              className="mb-4"
            />
            <div className="mb-4  ">
              <h3 className="font-semibold mb-2">Mandatory Questions</h3>
              <div className='flex gap-5'>
                <div className='flex flex-col gap-3'>
                  {jobDetails.mandatoryQuestions.map((question, index) => (
                    <Input
                      key={index}
                      placeholder={`Mandatory Question ${index + 1}`}
                      value={question}
                      onChange={(e) =>
                        handleMandatoryQuestionChange(index, e.target.value)
                      }
                      className="mb-2 w-[400px]"
                    />
                  ))}
                </div>
                <Button onClick={addMandatoryQuestion}>Add Question</Button>
              </div>
            </div>
          </div>
        );
      case 1:
        return (
          <div>
            <h2 className="text-2xl font-bold mb-4">Candidate Filtering</h2>
            <Input
              placeholder="Resume Threshold"
              value={candidateFiltering.resumeThreshold}
              onChange={(e) =>
                setCandidateFiltering({
                  ...candidateFiltering,
                  resumeThreshold: e.target.value,
                })
              }
              className="mb-4"
            />
            <div className="mb-4">
              <h3 className="font-semibold mb-2">Resume Parsing Weightage</h3>
              <table className="min-w-full border mb-2">
                <thead>
                  <tr>
                    <th className="border p-2">Description</th>
                    <th className="border p-2">Weightage</th>
                  </tr>
                </thead>
                <tbody>
                  {candidateFiltering.weightageTable.map((row, index) => (
                    <tr key={index}>
                      <td className="border p-2">
                        <Input
                          value={row.description}
                          onChange={(e) =>
                            handleWeightageRowChange(index, 'description', e.target.value)
                          }
                          placeholder="Description"
                        />
                      </td>
                      <td className="border p-2">
                        <Input
                          value={row.weightage}
                          onChange={(e) =>
                            handleWeightageRowChange(index, 'weightage', e.target.value)
                          }
                          placeholder="Weightage"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <Button onClick={addWeightageRow}>Add Row</Button>
            </div>
          </div>
        );
      case 2:
        return (
          <div>
            <h2 className="text-2xl font-bold mb-4">Software Integration</h2>
            <p className="mb-4">Select the software integrations:</p>
            <div className='flex gap-5 items-center'>
              {
                integrations.map((integration, index) => (
                  <div key={index} className="mb-4">
                    <Image
                      src={integration}
                      alt="crm logo"
                      width={100}
                      height={100}
                      className="mb-4"
                    />
                  </div>
                ))
              }
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  const addJob = async () => {
    const { data, error } = await supabase
      .from("Jobs")
      .insert([
        {
          job_id: uuid,
          job_name: jobDetails.title,
          job_description: jobDetails.description,
          skills: jobDetails.skills,
          experience: jobDetails.experience,
          mand_questions: jobDetails.mandatoryQuestions,
          resume_filt_threshold: candidateFiltering.resumeThreshold,
          parsing_weigthage: candidateFiltering.weightageTable,
          url: url
        },
      ])
      .select();
    console.log(data)
    console.log(error)
    if (data) {
      setShowConfetti(true);
      console.log(data)
      setTimeout(() => setShowConfetti(false), 3000);
      window.location.href = "/hr/jobs";
    }

  };

  useEffect(() => {
    setConfettiDimensions({
      width: window.innerWidth,
      height: window.innerHeight,
    });
  }, []);


  return (
    <div className='flex justify-center items-center w-full h-full mt-20 '>
      {showConfetti && (
        <Confetti width={confettiDimensions.width} height={confettiDimensions.height} />
      )}
      <div className="p-6 w-full h-auto max-w-2xl">
        {renderStep()}
        <div className="mt-6 flex justify-between">
          {currentStep > 0 && (
            <Button onClick={prevStep}>Back</Button>
          )}
          {currentStep < 2 && (
            <Button onClick={nextStep}>Next</Button>
          )}
          {currentStep === 2 && (
            <Button onClick={addJob}>Finish</Button>
          )}
        </div>
      </div>
    </div>

  );
}
