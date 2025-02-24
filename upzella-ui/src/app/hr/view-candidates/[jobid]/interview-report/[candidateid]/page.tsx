'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import { FaLinkedin, FaGithub, FaDownload } from 'react-icons/fa';

export default function ViewCandidates() {
    const { jobid, candidateid }: any = useParams();
    const candidateId = candidateid;

    const [interviewData, setInterviewData] = useState<any>(null);
    const [candidateData, setCandidateData] = useState<any>(null);

    useEffect(() => {
        const fetchInterviewData = async () => {
            const { data, error } = await supabase
                .from('InterviewDetails')
                .select('*')
                .eq('candidate_id', candidateId)
                .order('created_at', { ascending: false })
                .limit(1)
                .single();

            if (error) {
                console.error('Error fetching interview data:', error);
            } else {
                setInterviewData(data);
            }
        };

        const fetchCandidateData = async () => {
            const { data, error } = await supabase
                .from('CandidateApply')
                .select('*')
                .eq('candidate_id', candidateId)
                .single();

            if (error) {
                console.error('Error fetching candidate data:', error);
            } else {
                setCandidateData(data);
            }
        };

        fetchCandidateData();
        fetchInterviewData();
    }, [candidateId]);

    console.log(candidateData)
    console.log(interviewData)

    if (!interviewData || !candidateData) {
        return (
            <div className="flex flex-col items-center justify-center h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-blue-500"></div>
                <p className="mt-4 text-lg text-gray-700">Generating Report...</p>
            </div>
        );
    }

    const { total_score, max_possible_score, overall_reasoning, result } = interviewData;
    const { name, email, linkedin_url, github_url, resume_data } = candidateData;

    // Convert total_score to percentage
    const scorePercentage = (parseInt(total_score) / parseInt(max_possible_score)) * 100;

    // Score Breakdown Data for Donut Chart
    const scoreBreakdown = JSON.parse(result).map((item: any) => ({
        name: item.category,
        value: item.score,
    }));

    console.log(scoreBreakdown, JSON.parse(result))

    const COLORS = ["#4CAF50", "#FF9800", "#F44336"];

    return (
        <div className="p-6 space-y-6">
            {/* Candidate Profile */}
            <Card className="shadow-lg">
                <CardHeader>
                    <CardTitle>Candidate Profile</CardTitle>
                </CardHeader>
                <CardContent className="flex items-center justify-between">
                    <div>
                        <h2 className="text-xl font-semibold">{name}</h2>
                        <p className="text-gray-500">{email}</p>
                        <div className="mt-2 flex space-x-4">
                            {linkedin_url && (
                                <a href={linkedin_url} target="_blank" className="text-blue-600 hover:underline flex items-center">
                                    <FaLinkedin className="mr-1" /> LinkedIn
                                </a>
                            )}
                            {github_url && (
                                <a href={github_url} target="_blank" className="text-gray-800 hover:underline flex items-center">
                                    <FaGithub className="mr-1" /> GitHub
                                </a>
                            )}
                        </div>
                    </div>
                    <a href={resume_data.resumeUrl.publicUrl} download className="bg-blue-500 text-white p-2 rounded-lg flex items-center">
                        <FaDownload className="mr-2" /> Download Resume
                    </a>
                </CardContent>
            </Card>

            {/* Performance Overview */}
            <Card className="shadow-lg">
                <CardHeader>
                    <CardTitle>Performance Overview</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Score Progress */}
                    <div className="p-4 border rounded-lg shadow-md">
                        <h2 className="text-lg font-semibold mb-2">Overall Score</h2>

                        <p className="mt-2 text-gray-700 font-medium text-center">
                            {total_score} / {max_possible_score} ({scorePercentage.toFixed(2)}%)
                        </p>
                    </div>

                    {/* Score Breakdown Donut Chart */}
                    <div className="p-4 border rounded-lg shadow-md">
                        <h2 className="text-lg font-semibold mb-2">Score Breakdown</h2>
                        <ResponsiveContainer width="100%" height={250}>
                            <PieChart>
                                <Pie
                                    data={scoreBreakdown}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={50}
                                    outerRadius={80}
                                    fill="#8884d8"
                                    dataKey="value"
                                    label={({ name, value }) => `${name}: ${value}`}
                                >
                                    {scoreBreakdown.map((entry: any, index: number) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip formatter={(value, name) => [`${value} Points`, `Category: ${name}`]} />
                            </PieChart>
                        </ResponsiveContainer>

                        {/* Score Insights */}
                        <div className="mt-4 space-y-2">
                            {scoreBreakdown.map((item: any, index: number) => (
                                <div key={index} className="flex items-center justify-between">
                                    <span className="flex items-center">
                                        <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                                        {item.name}
                                    </span>
                                    <span className="font-medium">{((item.value / max_possible_score) * 100).toFixed(1)}%</span>
                                </div>
                            ))}
                        </div>
                    </div>

                </CardContent>
            </Card>

            {/* Interview Questions & Answers */}
            <Card className="shadow-lg">
                <CardHeader>
                    <CardTitle>Interview Insights</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {JSON.parse(result).map((item: any, index: number) => (
                            <div key={index} className="p-4 border rounded-lg shadow-md">
                                <h3 className="text-md font-semibold">{item.question}</h3>
                                <p className="text-gray-700"><strong>Answer:</strong> {item.answer}</p>
                                <p className="text-gray-500"><strong>Feedback:</strong> {item.reasoning}</p>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* Feedback & Recommendations */}
            <Card className="shadow-lg">
                <CardHeader>
                    <CardTitle>Feedback & Recommendations</CardTitle>
                </CardHeader>
                <CardContent>
                    <ul className="list-disc ml-5 text-gray-700">
                        {overall_reasoning.split('.').map((sentence: string, index: number) =>
                            sentence.trim() ? <li key={index}>{sentence.trim()}.</li> : null
                        )}
                    </ul>
                </CardContent>
            </Card>
        </div>
    );
}
