/** @format */

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Eye, EyeOff, ArrowRight, ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { SendOtpApi, VerifyOtpApi, ForgotPasswordApi } from "@/services/Api/AuthApi";
import logoFull from "@/assets/logo.webp";

const stepAnim = {
  initial: { opacity: 0, x: 40 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -40 },
  transition: { duration: 0.35, ease: "easeOut" as const },
};

const inputStyle = {
  background: "#0c1626",
  border: "1px solid rgba(228,206,143,0.15)",
  color: "#F3EEE3",
};

const stepCopy: Record<number, { eyebrow: string; heading: string; accent: string; sub: string }> = {
  1: { eyebrow: "Password Reset", heading: "Reset your", accent: "password", sub: "Enter your email and we'll send you a code." },
  2: { eyebrow: "Verify Identity", heading: "Check your", accent: "inbox", sub: "Enter the 6-digit code we just sent you." },
  3: { eyebrow: "New Password", heading: "Choose a new", accent: "password", sub: "Make it something you haven't used before." },
};

export default function AdminForgotPassword() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [token, setToken] = useState("");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showPass, setShowPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);

  const { toast } = useToast();

  const handleSendOtp = async () => {
    if (!email) {
      toast({ title: "Email required", variant: "destructive" });
      return;
    }
    try {
      setLoading(true);
      const res = await SendOtpApi({ email, otp_type: "forgot_password" } as any);
      if (res.data?.success) {
        toast({ title: "OTP sent!" });
        setStep(2);
      }
    } catch (err: any) {
      toast({ title: "Failed to send OTP", description: err.response?.data?.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otp) {
      toast({ title: "Enter OTP", variant: "destructive" });
      return;
    }
    try {
      setLoading(true);
      const res = await VerifyOtpApi({ email, otp, otp_type: "forgot_password" });
      if (res.data?.success) {
        setToken(res.data.data.token);
        toast({ title: "OTP verified!" });
        setStep(3);
      }
    } catch (err: any) {
      toast({ title: "Invalid OTP", description: err.response?.data?.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async () => {
    if (!password || !confirmPassword) {
      toast({ title: "All fields required", variant: "destructive" });
      return;
    }
    if (password !== confirmPassword) {
      toast({ title: "Passwords do not match", variant: "destructive" });
      return;
    }
    try {
      setLoading(true);
      const res = await ForgotPasswordApi({ email, password, confirm_password: confirmPassword, token });
      if (res.data?.success) {
        toast({ title: "Password changed successfully!" });
        window.location.href = "/";
      }
    } catch (err: any) {
      toast({ title: "Failed to change password", description: err.response?.data?.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const copy = stepCopy[step];

  return (
    <div
      className="min-h-screen w-full flex items-center justify-center relative overflow-hidden px-4"
      style={{ background: "radial-gradient(ellipse 900px 600px at 80% -10%, #1c2e47 0%, #0e1a2b 55%, #0a1420 100%)" }}
    >
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Fraunces:ital@1&display=swap');`}</style>

      <svg className="absolute -bottom-24 -left-24 w-[600px] h-[600px] opacity-[0.08] pointer-events-none" viewBox="0 0 600 600" fill="none">
        <circle cx="300" cy="300" r="299" stroke="#E4CE8F" strokeWidth="1" />
      </svg>
      <svg className="absolute -top-40 -right-32 w-[500px] h-[500px] opacity-[0.06] pointer-events-none" viewBox="0 0 500 500" fill="none">
        <circle cx="250" cy="250" r="249" stroke="#E4CE8F" strokeWidth="1" />
      </svg>

      <div
        className="relative z-10 w-full max-w-[420px] rounded-[28px] px-9 pt-10 pb-9"
        style={{
          background: "linear-gradient(180deg, rgba(22,35,58,0.9) 0%, rgba(16,29,48,0.9) 100%)",
          border: "1px solid rgba(228,206,143,0.16)",
          boxShadow: "0 30px 80px -20px rgba(0,0,0,0.65)",
          backdropFilter: "blur(20px)",
        }}
      >
        <div className="flex flex-col items-center gap-4">
          <div
            className="rounded-full p-3.5"
            style={{
              background: "linear-gradient(180deg, #FAF6EC 0%, #EFE4C8 100%)",
              boxShadow: "0 10px 28px -10px rgba(0,0,0,0.55), 0 0 0 1px rgba(228,206,143,0.45)",
            }}
          >
            <img src={logoFull} alt="Marco Passport" className="h-14 w-14 object-contain" />
          </div>
          <svg width="120" height="14" viewBox="0 0 120 14" fill="none">
            <path d="M2 8C20 -2 40 14 60 6C80 -2 100 14 118 6" stroke="#E4CE8F" strokeOpacity="0.5" strokeWidth="1.2" strokeLinecap="round" />
          </svg>
        </div>

        <div className="flex items-center gap-2 justify-center mt-6 mb-2">
          <span className="h-px w-5" style={{ background: "#E4CE8F", opacity: 0.5 }} />
          <span className="text-[10px] tracking-[0.25em] uppercase" style={{ color: "#C9A96A" }}>
            {copy.eyebrow}
          </span>
          <span className="h-px w-5" style={{ background: "#E4CE8F", opacity: 0.5 }} />
        </div>

        <AnimatePresence mode="wait">
          <motion.div key={`heading-${step}`} {...stepAnim}>
            <h1 className="text-center text-[26px] leading-tight font-medium" style={{ color: "#F3EEE3" }}>
              {copy.heading}{" "}
              <span className="italic" style={{ fontFamily: "'Fraunces', serif", color: "#E4CE8F" }}>
                {copy.accent}
              </span>
            </h1>
            <p className="text-center text-sm mt-1.5 mb-8" style={{ color: "#8B96A8" }}>
              {copy.sub}
            </p>
          </motion.div>
        </AnimatePresence>

        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div key="step1" {...stepAnim} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[11px] tracking-wider uppercase" style={{ color: "#93A1B5" }}>
                  Email
                </label>
                <Input
                  placeholder="you@themarcopassport.com"
                  value={email}
                  type="email"
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-11 rounded-lg text-[15px]"
                  style={inputStyle}
                />
              </div>

              <button
                disabled={loading}
                onClick={handleSendOtp}
                className="w-full h-11 rounded-lg font-semibold tracking-wide mt-2 flex items-center justify-center gap-1.5 group disabled:opacity-60"
                style={{ background: "#E4CE8F", color: "#101d30" }}
              >
                {loading ? "Sending..." : (
                  <>
                    Send OTP
                    <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
                  </>
                )}
              </button>

              <a
                href="/"
                className="flex items-center justify-center gap-1.5 text-sm mt-1 hover:opacity-80 transition-opacity"
                style={{ color: "#8B96A8" }}
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Back to login
              </a>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div key="step2" {...stepAnim} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[11px] tracking-wider uppercase" style={{ color: "#93A1B5" }}>
                  6-digit code
                </label>
                <Input
                  placeholder="••••••"
                  value={otp}
                  maxLength={6}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                  className="h-11 rounded-lg text-[18px] tracking-[0.4em] text-center"
                  style={inputStyle}
                />
              </div>

              <p className="text-xs text-right" style={{ color: "#5c6b81" }}>
                Didn't get a code?{" "}
                <button onClick={handleSendOtp} className="font-medium underline underline-offset-2" style={{ color: "#C9A96A" }}>
                  Resend
                </button>
              </p>

              <button
                disabled={loading}
                onClick={handleVerifyOtp}
                className="w-full h-11 rounded-lg font-semibold tracking-wide mt-2 flex items-center justify-center gap-1.5 group disabled:opacity-60"
                style={{ background: "#E4CE8F", color: "#101d30" }}
              >
                {loading ? "Verifying..." : (
                  <>
                    Verify code
                    <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
                  </>
                )}
              </button>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div key="step3" {...stepAnim} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[11px] tracking-wider uppercase" style={{ color: "#93A1B5" }}>
                  New password
                </label>
                <div className="relative">
                  <Input
                    type={showPass ? "text" : "password"}
                    placeholder="Enter new password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="h-11 rounded-lg pr-10 text-[15px]"
                    style={inputStyle}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(!showPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2"
                    style={{ color: "#5c6b81" }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = "#E4CE8F")}
                    onMouseLeave={(e) => (e.currentTarget.style.color = "#5c6b81")}
                  >
                    {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] tracking-wider uppercase" style={{ color: "#93A1B5" }}>
                  Confirm password
                </label>
                <div className="relative">
                  <Input
                    type={showConfirmPass ? "text" : "password"}
                    placeholder="Confirm new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="h-11 rounded-lg pr-10 text-[15px]"
                    style={inputStyle}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPass(!showConfirmPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2"
                    style={{ color: "#5c6b81" }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = "#E4CE8F")}
                    onMouseLeave={(e) => (e.currentTarget.style.color = "#5c6b81")}
                  >
                    {showConfirmPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <button
                disabled={loading}
                onClick={handleChangePassword}
                className="w-full h-11 rounded-lg font-semibold tracking-wide mt-2 flex items-center justify-center gap-1.5 group disabled:opacity-60"
                style={{ background: "#E4CE8F", color: "#101d30" }}
              >
                {loading ? "Updating..." : (
                  <>
                    Change password
                    <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
                  </>
                )}
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        <p className="text-center text-[10px] tracking-[0.2em] uppercase mt-8" style={{ color: "#3f4b60" }}>
          Marco Passport · Restricted Access
        </p>
      </div>
    </div>
  );
}