/** @format */

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, ArrowRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { AdminLoginAPI } from "@/services/Api/AuthApi";
import logoFull from "@/assets/logo.webp";

const AdminLogin = () => {
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [showPassword, setShowPassword] = useState(false);
	const [loading, setLoading] = useState(false);
	const { toast } = useToast();

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setLoading(true);
		try {
			const res = await AdminLoginAPI(email, password);
			if (res.data?.success) {
				// Login returns only { name, email, token }; the role comes from
				// /admin/auth/profile (see useAdminProfile).
				localStorage.setItem("token", res.data?.data?.token || "");
				toast({ title: "Welcome back!", description: "You've successfully logged in." });
				setTimeout(() => {
					window.location.href = "/dashboard";
				}, 500);
			} else {
				toast({ title: "Login Failed", description: res.data?.message || "Invalid credentials.", variant: "destructive" });
			}
		} catch (err: any) {
			toast({ title: "Login Failed", description: err.response?.data?.message || "Something went wrong.", variant: "destructive" });
		} finally {
			setLoading(false);
		}
	};

	return (
		<div
			className="min-h-screen w-full flex items-center justify-center relative overflow-hidden px-4"
			style={{
				background: "radial-gradient(ellipse 900px 600px at 80% -10%, #1c2e47 0%, #0e1a2b 55%, #0a1420 100%)",
			}}
		>
			<style>{`
				@import url('https://fonts.googleapis.com/css2?family=Fraunces:ital@1&display=swap');
			`}</style>

			{/* ambient shoreline arcs */}
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

					{/* shoreline motif */}
					<svg width="120" height="14" viewBox="0 0 120 14" fill="none">
						<path d="M2 8C20 -2 40 14 60 6C80 -2 100 14 118 6" stroke="#E4CE8F" strokeOpacity="0.5" strokeWidth="1.2" strokeLinecap="round" />
					</svg>
				</div>

				<div className="flex items-center gap-2 justify-center mt-6 mb-2">
					<span className="h-px w-5" style={{ background: "#E4CE8F", opacity: 0.5 }} />
					<span className="text-[10px] tracking-[0.25em] uppercase" style={{ color: "#C9A96A" }}>
						Admin Access
					</span>
					<span className="h-px w-5" style={{ background: "#E4CE8F", opacity: 0.5 }} />
				</div>

				<h1 className="text-center text-[26px] leading-tight font-medium" style={{ color: "#F3EEE3" }}>
					Welcome{" "}
					<span className="italic" style={{ fontFamily: "'Fraunces', serif", color: "#E4CE8F" }}>
						back
					</span>
				</h1>
				<p className="text-center text-sm mt-1.5 mb-8" style={{ color: "#8B96A8" }}>
					Sign in to manage the Marco Passport.
				</p>

				<form onSubmit={handleSubmit} className="space-y-4">
					<div className="space-y-1.5">
						<Label htmlFor="email" className="text-[11px] tracking-wider uppercase" style={{ color: "#93A1B5" }}>
							Email
						</Label>
						<Input
							id="email"
							type="email"
							placeholder="you@themarcopassport.com"
							value={email}
							onChange={(e) => setEmail(e.target.value)}
							required
							className="h-11 rounded-lg text-[15px]"
							style={{
								background: "#0c1626",
								border: "1px solid rgba(228,206,143,0.15)",
								color: "#F3EEE3",
							}}
						/>
					</div>

					<div className="space-y-1.5">
						<div className="flex items-center justify-between">
							<Label htmlFor="password" className="text-[11px] tracking-wider uppercase" style={{ color: "#93A1B5" }}>
								Password
							</Label>
							<a href="/forgot-password" className="text-xs hover:opacity-80 transition-opacity" style={{ color: "#C9A96A" }}>
								Forgot password?
							</a>
						</div>
						<div className="relative">
							<Input
								id="password"
								type={showPassword ? "text" : "password"}
								placeholder="Enter your password"
								value={password}
								onChange={(e) => setPassword(e.target.value)}
								required
								className="h-11 rounded-lg pr-10 text-[15px]"
								style={{
									background: "#0c1626",
									border: "1px solid rgba(228,206,143,0.15)",
									color: "#F3EEE3",
								}}
							/>
							<button
								type="button"
								onClick={() => setShowPassword(!showPassword)}
								className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors"
								style={{ color: "#5c6b81" }}
								onMouseEnter={(e) => (e.currentTarget.style.color = "#E4CE8F")}
								onMouseLeave={(e) => (e.currentTarget.style.color = "#5c6b81")}
							>
								{showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
							</button>
						</div>
					</div>

					<Button
						type="submit"
						disabled={loading}
						className="w-full h-11 rounded-lg font-semibold tracking-wide mt-2 group"
						style={{ background: "#E4CE8F", color: "#101d30" }}
					>
						{loading ? (
							"Signing in..."
						) : (
							<span className="flex items-center justify-center gap-1.5">
								Sign in
								<ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
							</span>
						)}
					</Button>
				</form>

				<p className="text-center text-[10px] tracking-[0.2em] uppercase mt-8" style={{ color: "#3f4b60" }}>
					Marco Passport · Restricted Access
				</p>
			</div>
		</div>
	);
};

export default AdminLogin;