'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import Webcam from 'react-webcam';
import axios from 'axios';
import { useCaptureStore } from '@/lib/state-management/store';

interface QuestionsResponse {
    zella_questions: string[];
    haana_questions: string[];
    kai_questions: string[];
}

function ChatInterface() {
    const { jobid }: any = useParams();
    const data = jobid;
    const jobId = data.split("--")[0];
    const candidateId = data.split("--")[1];

    const [messages, setMessages] = useState<{ sender: string; text: string; agent: string | null }[]>([]);
    const [inputText, setInputText] = useState('');
    const [loading, setLoading] = useState(true);
    const [questions, setQuestions] = useState<string[]>([]);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [interviewEnded, setInterviewEnded] = useState(false);

    const [jobData, setJobData] = useState<any>(null);
    const [candidateData, setCandidateData] = useState<any>(null);

    const [submittingDataLoader, setSubmittingDataLoader] = useState(false);

    const [isRecording, setIsRecording] = useState(false);

    const [audioUrl, setAudioUrl] = useState<any>('');

    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);

    const startRecording = async () => {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const mediaRecorder = new MediaRecorder(stream);
        mediaRecorderRef.current = mediaRecorder;

        mediaRecorder.ondataavailable = (event) => {
            audioChunksRef.current.push(event.data);
        };

        mediaRecorder.onstop = async () => {
            const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
            const formData = new FormData();
            formData.append("file", audioBlob, "audio.webm");

            try {
                const response = await axios.post("http://127.0.0.1:5000/speech-to-text", formData, {
                    headers: { "Content-Type": "multipart/form-data" },
                });
                console.log(response.data.transcription)
                setInputText(response.data.transcription)
                handleSendMessage();
            } catch (error) {
                console.error("Error transcribing:", error);
            }

            audioChunksRef.current = [];
        };

        mediaRecorder.start();
        setIsRecording(true);
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
        }
    };

    const generateAudio = async (text: string) => {
        try {
            const response = await axios.post(
                "http://127.0.0.1:5000/generate-audio",
                { text },
                { responseType: "blob" }
            );

            const url = URL.createObjectURL(new Blob([response.data], { type: "audio/mpeg" }));
            setAudioUrl(url);
        } catch (error) {
            console.error("Error generating audio:", error);
        }
    };

    const sendInterviewEndEmail = async () => {
        try {
            const res = await axios.post("http://localhost:3000/api/send-mail2", {
                candidateDetails: candidateData,
                subject: `Upzella - Your ${jobData.job_name} Interview Ended`,
                provider: 'gmail',
                message: "Your interview has ended. Thank you for participating!"
            });
            console.log(res)
        } catch (error) {
            console.error("Error sending email:", error);
        }
    };

    const endInterview = async () => {
        await sendInterviewEndEmail();

        setSubmittingDataLoader(true);

        const response = await fetch('http://localhost:5000/score-interview-response', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ messages }),
        });
        const data = await response.json();

        console.log(data)

        const { data: interviewData } = await supabase.from('InterviewDetails').insert({
            job_id: jobId,
            candidate_id: candidateId,
            result: data?.results,
            total_score: data?.total_score,
            overall_reasoning: data?.overall_reasoning,
            max_possible_score: data?.max_possible_score,
        }).select();

        setSubmittingDataLoader(false);

        setInterviewEnded(true);
    };

    useEffect(() => {
        async function fetchData() {
            const { data: jobDataItems } = await supabase.from('Jobs').select('job_description, job_name').eq('job_id', jobId).single();
            setJobData(jobDataItems);

            const { data: candidateItems } = await supabase.from('CandidateApply').select('resume_data, email').eq('candidate_id', candidateId).single();
            setCandidateData(candidateItems?.email);
            try {
                const response = await fetch("http://localhost:5000/get-questions", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ jd: jobDataItems, parsed_resume_data: candidateItems?.resume_data?.parsedData }),
                });
                const data: QuestionsResponse = await response.json();

                const orderedQuestions = [...data.zella_questions, ...data.haana_questions, ...data.kai_questions];
                setQuestions(orderedQuestions);
                if (orderedQuestions.length > 0) {
                    setMessages([{ sender: 'Bot', text: orderedQuestions[0], agent: "Zella" }]);
                    generateAudio(orderedQuestions[0]);
                }
            } catch (error) {
                console.error("Error fetching questions:", error);
            } finally {
                setLoading(false);
            }
        }

        if (jobId && candidateId) {
            fetchData();
        }
    }, [jobId, candidateId]);

    const handleSendMessage = () => {
        if (inputText.trim() === '') return;

        setMessages((prev) => [...prev, { sender: 'User', text: inputText, agent: null }]);
        setInputText('');
        setAudioUrl("");

        handleNextQuestion();
    };

    const handleSkipQuestion = () => {
        setAudioUrl("");
        handleNextQuestion();
    };

    const handleNextQuestion = () => {
        setCurrentQuestionIndex((prev) => {
            const nextIndex = prev + 1;

            if (nextIndex < questions.length) {
                const nextQuestion = questions[nextIndex];
                const agent = getAgent(nextIndex);

                setMessages((prev) => {
                    if (!prev.some(msg => msg.text === nextQuestion)) {
                        return [...prev, { sender: 'Bot', text: nextQuestion, agent }];
                    }
                    return prev;
                });

                generateAudio(nextQuestion);
            } else {
                endInterview();
            }
            return nextIndex;
        });
    };

    const getAgent = (index: number): string => {
        if (index < 3) return "Zella";
        if (index < 6) return "Haana";
        return "Kai";
    };

    if (submittingDataLoader) {
        return (
            <div className="flex flex-col items-center justify-center h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-blue-500"></div>

                <p className="mt-4 text-lg text-gray-700 flex">
                    Submitting your responses...
                </p>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-blue-500"></div>

                <p className="mt-4 text-lg text-gray-700 flex">
                    Setting up the Interview environment...
                </p>
            </div>
        );
    }

    if (interviewEnded) {
        return (
            <div className="p-4 text-center">
                <h2 className="text-2xl font-bold">Thank you for completing the interview!</h2>
                <p>We appreciate your time. Our team will review your responses soon.</p>
            </div>
        );
    }

    return (
        <React.Fragment>
            <h1 className="text-center text-2xl font-bold my-4">Upzella - Interview Environment</h1>

            <p className='text-center w-full'>{jobData.job_name} - (Interview)</p>

            <div className='w-full flex'>
                <div className="relative flex flex-col h-[calc(100vh-10vh)] p-4 w-full">
                    <div className="flex-1 border border-gray-300 rounded p-4 overflow-y-auto mb-4">
                        {messages.map((msg, idx) => (
                            <div key={idx} className={`mb-2 ${msg.sender === 'User' ? 'text-right' : 'text-left'}`}>
                                <div className={`inline-block p-2 rounded ${msg.sender === 'User' ? 'bg-blue-500 text-white' : 'bg-gray-300 text-black'}`}>
                                    {msg.text} {msg.agent && <span className="text-sm text-gray-500 ml-2">({msg.agent})</span>}
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="flex gap-2">
                        <input
                            type="text"
                            placeholder="Type your response..."
                            className="flex-1 border border-gray-300 rounded p-2"
                            value={inputText}
                            onChange={(e) => setInputText(e.target.value)}
                        />
                        <button onClick={isRecording ? stopRecording : startRecording} className="px-4 py-2 bg-blue-500 text-white rounded">
                            {isRecording ? "Stop Recording" : "Start Recording"}
                        </button>
                        <button onClick={handleSendMessage} className="bg-blue-500 text-white rounded p-2">
                            Send
                        </button>
                        <button onClick={handleSkipQuestion} className="bg-gray-400 text-white rounded p-2">
                            Skip
                        </button>
                    </div>
                </div>
                <div>
                    <div className="w-[300px] h-[200px] border border-gray-400 rounded-lg shadow-lg overflow-hidden bg-black">
                        {/* <Webcam className="w-full h-full object-cover" /> */}
                        <img src="http://127.0.0.1:5000/video_feed" className="w-full h-full object-cover" alt="Webcam Feed" />
                    </div>
                    <button className='my-5 bg-red-400 px-3 py-1 rounded-md text-white' onClick={endInterview}>
                        End
                    </button>
                    {audioUrl && (
                        <audio controls autoPlay className="mt-4">
                            <source src={audioUrl} type="audio/mpeg" />
                            Your browser does not support the audio element.
                        </audio>
                    )}
                </div>
            </div>
        </React.Fragment>
    );
}

export default function Page() {
    return <ChatInterface />;
}
