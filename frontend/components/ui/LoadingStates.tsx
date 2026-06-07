"use client";

import React, { useState, useEffect } from "react";
import { useTranslation } from "@/lib/i18n/LanguageContext";

// 1. Spinner SVG Component
export function Spinner({ size = 54 }: { size?: number }) {
  const r = 20;
  const circ = 2 * Math.PI * r;
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" className="spin-sketch">
      <circle cx="24" cy="24" r={r} fill="none" stroke="#e5dfd2" strokeWidth="4.5" />
      <circle cx="24" cy="24" r={r} fill="none" stroke="#211f1b" strokeWidth="4.5"
        strokeDasharray={`${circ * .72} ${circ * .28}`}
        strokeLinecap="round" transform="rotate(-90 24 24)" />
    </svg>
  );
}

// Check icon for list steps
const Chk = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 12.5 10 17.5 19.5 7" />
  </svg>
);

export function SkeletonOverlay() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#faf8f5]">
      <div className="flex flex-col items-center gap-3">
        <Spinner size={64} />
      </div>
    </div>
  );
}

// 3. SPINNER OVERLAY (dimmed overlay card, e.g. saving / submitting)
interface SpinnerOverlayProps {
  msg?: string;
  sub?: string;
}
export function SpinnerOverlay({ msg, sub }: SpinnerOverlayProps) {
  const { locale } = useTranslation();
  const defaultMsg = locale === "th" ? "กำลังบันทึก…" : "Saving...";
  const defaultSub = locale === "th" ? "กรุณารอสักครู่" : "Please wait a moment";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#f4f1e8]/88 backdrop-blur-[5px]">
      <div className="border-2 border-black rounded-[14px_9px_15px_8px_/_9px_15px_8px_14px] bg-[#fffdf7] shadow-[4px_5px_0px_0px_rgba(0,0,0,1)] px-12 py-8 flex flex-col items-center gap-3.5 text-center max-w-[320px] w-[92%]">
        <Spinner />
        <p className="text-xl font-bold text-[#211f1b]">{msg || defaultMsg}</p>
        <p className="text-sm font-bold text-[#938d81]">{sub || defaultSub}</p>
      </div>
    </div>
  );
}

// 4. OCR OVERLAY (OCR scan visualization with scanning line)
const OCR_STEPS_TH = [
  "บีบอัดภาพ → WebP",
  "ส่งให้ Gemini Vision API",
  "วิเคราะห์ข้อความในใบเสร็จ",
];

const OCR_STEPS_EN = [
  "Compressing image → WebP",
  "Sending to Gemini Vision API",
  "Analyzing receipt text",
];

interface OCROverlayProps {
  uploadState: "compressing" | "uploading";
}

export function OCROverlay({ uploadState }: OCROverlayProps) {
  const { locale } = useTranslation();
  const [step3Active, setStep3Active] = useState(false);

  useEffect(() => {
    if (uploadState === "uploading") {
      const t = setTimeout(() => {
        setStep3Active(true);
      }, 1500);
      return () => clearTimeout(t);
    } else {
      setStep3Active(false);
    }
  }, [uploadState]);

  const steps = locale === "th" ? OCR_STEPS_TH : OCR_STEPS_EN;
  const titleText = locale === "th" ? "📷 กำลังสแกนและวิเคราะห์ใบเสร็จ" : "📷 Scanning & Analyzing Receipt";

  // Determine status of each step:
  const isStep1Done = uploadState === "uploading";
  const isStep1Active = uploadState === "compressing";

  const isStep2Done = step3Active;
  const isStep2Active = uploadState === "uploading" && !step3Active;

  const isStep3Active = step3Active;

  return (
    <div className="fixed inset-0 md:absolute md:inset-0 z-50 flex items-center justify-center bg-[#f4f1e8]/88 backdrop-blur-[5px] md:rounded-doodle">
      <div className="border-2 border-black rounded-[14px_9px_15px_8px_/_9px_15px_8px_14px] bg-[#fffdf7] shadow-[4px_5px_0px_0px_rgba(0,0,0,1)] px-9 py-7 flex flex-col items-center gap-[18px] max-w-[320px] w-[92%] text-center">
        <p className="text-sm font-bold text-[#938d81]">{titleText}</p>
        
        {/* Mock receipt container */}
        <div className="relative w-[110px] h-[155px] overflow-hidden border-[2.5px] border-black rounded-[8px_11px_9px_10px_/_10px_9px_11px_8px] bg-white shadow-[3px_4px_0px_0px_rgba(0,0,0,1)]">
          <div className="p-3 flex flex-col gap-1.5">
            {["100%", "75%", "55%", "100%", "65%", "80%", "50%", "100%", "40%"].map((w, i) => (
              <div key={i} className="h-[5px] rounded-[3px] bg-[#e5dfd2]" style={{ width: w }} />
            ))}
          </div>
          {/* Animated green scanning line */}
          <div className="scanline-sketch" />
        </div>

        {/* Steps List */}
        <ul className="w-full flex flex-col gap-2.5">
          {steps.map((s, i) => {
            let isDone = false;
            let isActive = false;

            if (i === 0) {
              isDone = isStep1Done;
              isActive = isStep1Active;
            } else if (i === 1) {
              isDone = isStep2Done;
              isActive = isStep2Active;
            } else if (i === 2) {
              isDone = false;
              isActive = isStep3Active;
            }

            return (
              <li
                key={i}
                className={`flex items-center gap-2.5 text-sm text-left transition-colors duration-200 ${
                  isDone ? "text-[#211f1b] font-bold" : isActive ? "text-[#54504a]" : "text-[#938d81]"
                }`}
              >
                <span
                  className={`w-[22px] h-[22px] flex-shrink-0 border-2 rounded-full grid place-items-center text-[10px] transition-all ${
                    isDone
                      ? "bg-[#bfe39a] border-[#3f6b22] text-[#3f6b22]"
                      : isActive
                      ? "border-black animate-pulse pulse-sketch"
                      : "border-current"
                  }`}
                >
                  {isDone ? <Chk /> : i + 1}
                </span>
                {s}
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}

// 5. UPLOAD OVERLAY (Upload file progress indicator)
interface UploadOverlayProps {
  fileName?: string;
  fileSize?: string;
  onComplete?: () => void;
}

const UPLOAD_STAGES_TH = [
  { pct: 0,  msg: "เตรียมไฟล์…" },
  { pct: 18, msg: "กำลังอัปโหลด…" },
  { pct: 45, msg: "กำลังอัปโหลด…" },
  { pct: 72, msg: "ประมวลผลภาพ…" },
  { pct: 91, msg: "เกือบเสร็จแล้ว…" },
  { pct: 100, msg: "เสร็จสิ้น" }
];

const UPLOAD_STAGES_EN = [
  { pct: 0,  msg: "Preparing file..." },
  { pct: 18, msg: "Uploading..." },
  { pct: 45, msg: "Uploading..." },
  { pct: 72, msg: "Processing image..." },
  { pct: 91, msg: "Almost done..." },
  { pct: 100, msg: "Finished" }
];

export function UploadOverlay({ fileName = "receipt.jpg", fileSize = "2.3 MB", onComplete }: UploadOverlayProps) {
  const { locale } = useTranslation();
  const [stage, setStage] = useState(0);
  const stages = locale === "th" ? UPLOAD_STAGES_TH : UPLOAD_STAGES_EN;

  useEffect(() => {
    if (stage >= stages.length - 1) {
      if (onComplete) {
        const t = setTimeout(onComplete, 500);
        return () => clearTimeout(t);
      }
      return;
    }
    const t = setTimeout(() => setStage(s => s + 1), 600 + stage * 300);
    return () => clearTimeout(t);
  }, [stage, stages.length, onComplete]);

  const { pct, msg } = stages[stage];
  const compressionMsg = locale === "th" ? "กำลังบีบอัด → WebP" : "Compressing → WebP";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#f4f1e8]/88 backdrop-blur-[5px]">
      <div className="border-2 border-black rounded-[14px_9px_15px_8px_/_9px_15px_8px_14px] bg-[#fffdf7] shadow-[4px_5px_0px_0px_rgba(0,0,0,1)] px-[40px] py-[30px] flex flex-col items-center gap-3.5 max-w-[320px] w-[92%] text-center">
        <span className="text-4xl">📄</span>
        <p className="text-base font-bold text-[#211f1b] truncate max-w-full">{fileName}</p>
        <p className="text-sm font-bold text-[#938d81]">{msg}</p>
        
        {/* Hand-drawn progress bar track */}
        <div className="w-full h-5 border-[2.5px] border-black rounded-[20px_13px_21px_13px_/_13px_21px_13px_20px] bg-[#f4f1e8] shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-[#3f6b22] to-[#5faa35] transition-all duration-300"
            style={{ width: `${pct}%` }}
          />
        </div>
        
        <p className="text-base font-bold text-[#54504a]">{pct}%</p>
        <p className="text-xs font-bold text-[#938d81]">{fileSize} · {compressionMsg}</p>
      </div>
    </div>
  );
}
