'use client';

import React, { useRef, useState, useCallback } from "react";
import Webcam from "react-webcam";
import { Button } from "@/components/ui/button";
import { useParams } from "next/navigation";
import { useCaptureStore } from "@/lib/state-management/store";

export default function CaptureCandidateFace() {
    const { jobid }: any = useParams();
    const data = jobid;
    const jobId = data.split("--")[0];
    const candidateId = data.split("--")[1];

    const { capturedImage, setCapturedImage } = useCaptureStore();

    const capture = async () => {
        try {
            const response = await fetch("http://127.0.0.1:5000/capture_frame");
            if (!response.ok) throw new Error("Failed to capture image");

            const imageBlob = await response.blob();
            const reader = new FileReader();
            reader.readAsDataURL(imageBlob);
            reader.onloadend = () => {
                setCapturedImage(reader.result as string);
            };
        } catch (error) {
            console.error("Capture error:", error);
        }
    };

    const retake = () => {
        setCapturedImage(null);
    };

    return (
        <main className="flex flex-col items-center justify-center min-h-screen p-4">
            <nav className="w-full text-center my-5">
                <h1 className="capitalize font-bold text-3xl">Upzella Face Capture</h1>
            </nav>
            <div className="max-w-md w-full">
                {!capturedImage ? (
                    <div className="flex flex-col items-center">
                        {/* <Webcam
                            audio={false}
                            ref={webcamRef}
                            screenshotFormat="image/jpeg"
                            videoConstraints={{
                                width: 640,
                                height: 480,
                                facingMode: "user",
                            }}
                            className="rounded-md border border-gray-300"
                        />
                         */}
                        <img src="http://127.0.0.1:5000/video_feed" className="w-full h-full object-cover" alt="Webcam Feed" />

                        <div className="mt-4 text-center">
                            <p className="text-lg font-medium mb-2">
                                Please ensure your face is clearly visible in the frame.
                            </p>
                            <ul className="list-disc text-sm text-gray-700 ml-5 text-start">
                                <li>Ensure proper lighting and a plain background.</li>
                                <li>Position your face within the camera frame.</li>
                                <li>Avoid wearing hats or sunglasses.</li>
                                <li>Keep a neutral expression.</li>
                            </ul>
                        </div>
                        <Button onClick={capture} className="mt-4">
                            Capture Photo
                        </Button>
                    </div>
                ) : (
                    <div className="flex flex-col items-center">
                        <img
                            src={capturedImage}
                            alt="Captured Face"
                            className="rounded-md border border-gray-300"
                        />
                        <div className="mt-4 flex gap-4">
                            <Button onClick={retake}>Retake</Button>
                            <Button onClick={() => window.location.href = `/interview/${jobId}--${candidateId}/start`}>
                                Proceed
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        </main>
    );
}
