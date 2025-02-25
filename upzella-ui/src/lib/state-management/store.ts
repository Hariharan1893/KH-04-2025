import { create } from "zustand";

interface CaptureState {
    capturedImage: string | null;
    setCapturedImage: (image: string | null) => void;
}

export const useCaptureStore = create<CaptureState>((set : any) => ({
    capturedImage: null,
    setCapturedImage: (image : any) => set({ capturedImage: image }),
}));
