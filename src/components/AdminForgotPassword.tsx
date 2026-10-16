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
      className="min-h-screen w-full flex items-center justify-center relative overflow-hidden px-4 bg-auth-backdrop"
    >

      <svg className="absolute -bottom-24 -left-24 w-[600px] h-[600px] opacity-[0.08] pointer-events-none" viewBox="0 0 600 600" fill="none">
        <circle className="stroke-gold-light" cx="300" cy="300" r="299" strokeWidth="1" />
      </svg>
      <svg className="absolute -top-40 -right-32 w-[500px] h-[500px] opacity-[0.06] pointer-events-none" viewBox="0 0 500 500" fill="none">
        <circle className="stroke-gold-light" cx="250" cy="250" r="249" strokeWidth="1" />
      </svg>

      <div
        className="relative z-10 w-full max-w-[420px] rounded-[28px] px-9 pt-10 pb-9 bg-linear-to-b from-navy-raised/90 to-navy/90 border border-gold-light/16 shadow-auth backdrop-blur-[20px]"
      >
        <div className="flex flex-col items-center gap-4">
          <div
            className="rounded-full p-3.5 bg-linear-to-b from-parchment to-parchment-deep shadow-badge"
          >
            <img src={logoFull} alt="Marco Passport" className="h-14 w-14 object-contain" />
          </div>
          <svg width="120" height="14" viewBox="0 0 120 14" fill="none">
            <path className="stroke-gold-light" d="M2 8C20 -2 40 14 60 6C80 -2 100 14 118 6" strokeOpacity="0.5" strokeWidth="1.2" strokeLinecap="round" />
          </svg>
        </div>

        <div className="flex items-center gap-2 justify-center mt-6 mb-2">
          <span className="h-px w-5 bg-gold-light opacity-50" />
          <span className="text-[10px] tracking-[0.25em] uppercase text-gold-muted">
            {copy.eyebrow}
          </span>
          <span className="h-px w-5 bg-gold-light opacity-50" />
        </div>

        <AnimatePresence mode="wait">
          <motion.div key={`heading-${step}`} {...stepAnim}>
            <h1 className="text-center text-[26px] leading-tight font-medium text-cream">
              {copy.heading}{" "}
              <span className="italic font-display text-gold-light">
                {copy.accent}
              </span>
            </h1>
            <p className="text-center text-sm mt-1.5 mb-8 text-ink-subtle">
              {copy.sub}
            </p>
          </motion.div>
        </AnimatePresence>

        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div key="step1" {...stepAnim} className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-[11px] leading-6 tracking-wider uppercase text-mist">
                  Email
                </label>
                <Input
                  placeholder="you@themarcopassport.com"
                  value={email}
                  type="email"
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-11 rounded-lg text-[15px] bg-navy-inset border-gold-light/15 text-cream"
                />
              </div>

              <button
                disabled={loading}
                onClick={handleSendOtp}
                className="w-full h-11 rounded-lg font-semibold tracking-wide mt-2 flex items-center justify-center gap-1.5 group disabled:opacity-60 bg-gold-light text-navy"
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
                className="flex items-center justify-center gap-1.5 text-sm mt-1 hover:opacity-80 transition-opacity text-ink-subtle"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Back to login
              </a>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div key="step2" {...stepAnim} className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-[11px] leading-6 tracking-wider uppercase text-mist">
                  6-digit code
                </label>
                <Input
                  placeholder="••••••"
                  value={otp}
                  maxLength={6}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                  className="h-11 rounded-lg text-[18px] tracking-[0.4em] text-center bg-navy-inset border-gold-light/15 text-cream"
                />
              </div>

              <p className="text-xs text-right text-dusk">
                Didn't get a code?{" "}
                <button onClick={handleSendOtp} className="font-medium underline underline-offset-2 text-gold-muted">
                  Resend
                </button>
              </p>

              <button
                disabled={loading}
                onClick={handleVerifyOtp}
                className="w-full h-11 rounded-lg font-semibold tracking-wide mt-2 flex items-center justify-center gap-1.5 group disabled:opacity-60 bg-gold-light text-navy"
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
                <label className="block text-[11px] leading-6 tracking-wider uppercase text-mist">
                  New password
                </label>
                <div className="relative">
                  <Input
                    type={showPass ? "text" : "password"}
                    placeholder="Enter new password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="h-11 rounded-lg pr-10 text-[15px] bg-navy-inset border-gold-light/15 text-cream"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(!showPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-dusk hover:text-gold-light"
                  >
                    {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-[11px] leading-6 tracking-wider uppercase text-mist">
                  Confirm password
                </label>
                <div className="relative">
                  <Input
                    type={showConfirmPass ? "text" : "password"}
                    placeholder="Confirm new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="h-11 rounded-lg pr-10 text-[15px] bg-navy-inset border-gold-light/15 text-cream"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPass(!showConfirmPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-dusk hover:text-gold-light"
                  >
                    {showConfirmPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <button
                disabled={loading}
                onClick={handleChangePassword}
                className="w-full h-11 rounded-lg font-semibold tracking-wide mt-2 flex items-center justify-center gap-1.5 group disabled:opacity-60 bg-gold-light text-navy"
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

        <p className="text-center text-[10px] tracking-[0.2em] uppercase mt-8 text-dusk-deep">
          Marco Passport · Restricted Access
        </p>
      </div>
    </div>
  );
}