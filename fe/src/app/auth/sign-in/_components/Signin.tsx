"use client";
import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, type SubmitHandler } from "react-hook-form";
import { Eye, EyeOff, Mail } from "lucide-react";
import { login, type LoginPayload } from "../api";
import { resendVerificationEmail } from "@/services/auth.service";
import { EmailIcon } from "@/assets/icons";
import { useToast } from "@/components/ui/toast";
import Logo from "@/assets/logos/logo-icon.svg";
import LogoDark from "@/assets/logos/logo-icon-dark.svg";
import styles from "../styles.module.css";

type FormValues = {
  email: string;
  password: string;
  role:
    | "READER"
    | "REVIEWER"
    | "ORGANIZATION_ADMIN";
  remember: boolean;
};

export default function Signin() {
  const { showToast } = useToast();
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    defaultValues: {
      email: "",
      password: "",
      role: "READER",
      remember: false,
    },
  });

  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showResendEmail, setShowResendEmail] = useState(false);
  const [resendEmail, setResendEmail] = useState("");
  const [resendLoading, setResendLoading] = useState(false);

  const onSubmit: SubmitHandler<FormValues> = async (data) => {
    setLoading(true);

    const payload: LoginPayload = {
      email: data.email,
      password: data.password,
      role: data.role,
      remember: data.remember,
    };

    try {
      const response = await login(payload);

      // Save fullName to localStorage
      if (response.fullName) {
        localStorage.setItem("userName", response.fullName);
      }

      showToast({ type: "success", title: "Login Successful" });

      // Redirect based on role
      const roleRoutes: Record<typeof data.role, string> = {
        READER: "/homepage",
        REVIEWER: "/homepage",
        ORGANIZATION_ADMIN: "/homepage",
      };

      const targetRoute = roleRoutes[data.role] || "/";

      // Refresh router to update server-side auth state
      router.refresh();
      
      // Navigate to target route - this will trigger server-side re-render
      // and AuthProvider will receive updated initialAuth
      setTimeout(() => {
        router.push(targetRoute);
      }, 100);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Invalid email or password";
      
      // Check if error is about email not verified or account disabled
      // Note: Backend returns "Your account has been disabled" or "User is disabled" 
      // when user status is PENDING_EMAIL_VERIFY (because isEnabled() returns false)
      const lowerMsg = msg.toLowerCase();
      const isEmailNotVerified = 
        lowerMsg.includes("verify your email") ||
        lowerMsg.includes("email not verified") ||
        lowerMsg.includes("email address first") ||
        (lowerMsg.includes("email") && (lowerMsg.includes("not verified") || lowerMsg.includes("unverified") || lowerMsg.includes("verify")));
      
      const isAccountDisabled = 
        lowerMsg.includes("user is disabled") ||
        lowerMsg.includes("account has been disabled") ||
        lowerMsg.includes("account is disabled");
      
      // Show resend email UI for both email not verified and account disabled errors
      // (account disabled might be due to unverified email)
      if (isEmailNotVerified || isAccountDisabled) {
        setShowResendEmail(true);
        setResendEmail(data.email); // Pre-fill with the email from form
      }
      
      showToast({
        type: "error",
        title: "Login Failed",
        message: msg,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className={styles["logo-row"]}>
        <Image
          src={Logo}
          alt="Logo"
          width={150}
          height={150}
          className="dark:hidden"
        />
        <Image
          src={LogoDark}
          alt="Logo"
          width={150}
          height={150}
          className="hidden dark:block"
        />
      </div>


      <div>
        <form onSubmit={handleSubmit(onSubmit)}>
          {/* Role Selector */}
          <div className="mb-4">
            <label
              htmlFor="role"
              className="mb-3 block text-body-sm font-medium text-dark dark:text-white"
            >
              Login as
            </label>
            <div className="relative w-full">
              <select
                id="role"
                {...register("role", { required: "Please select your role" })}
                className="peer w-full appearance-none rounded-lg border border-stroke bg-white px-5 py-3 pr-12 text-dark shadow-sm outline-none ring-1 ring-transparent transition duration-150 focus:border-primary focus:ring-2 focus:ring-primary active:border-primary dark:border-dark-3 dark:bg-dark-2 dark:text-white dark:focus:border-primary dark:focus:ring-primary"
                aria-invalid={!!errors.role}
              >
                <option value="READER">Reader</option>
                <option value="REVIEWER">Reviewer</option>
                <option value="ORGANIZATION_ADMIN">Organization Admin</option>
              </select>
              <span className="pointer-events-none absolute right-5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500">
                <svg width={20} height={20} fill="none" viewBox="0 0 20 20">
                  <path
                    d="M6 8l4 4 4-4"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>
            </div>
            <p className="mt-1 h-5 overflow-hidden text-ellipsis whitespace-nowrap text-sm leading-5 text-red">
              {errors.role?.message || "\u00A0"}
            </p>
          </div>

          <div className="mb-4">
            <label
              htmlFor="email"
              className="mb-3 block text-body-sm font-medium text-dark dark:text-white"
            >
              Email *
            </label>
            <div className="relative">
              <input
                id="email"
                type="email"
                placeholder="Enter your email"
                className={`w-full rounded-lg border-[1.5px] bg-transparent px-5.5 py-[15px] pr-12.5 outline-none transition placeholder:text-dark-6 dark:bg-dark-2 dark:text-white ${
                  errors.email
                    ? "border-red focus:border-red dark:border-red"
                    : "border-stroke focus:border-primary dark:border-dark-3"
                }`}
                {...register("email", {
                  required: "Email is required",
                  pattern: {
                    value: /^\S+@\S+$/i,
                    message: "Please enter a valid email address",
                  },
                })}
                aria-invalid={!!errors.email}
              />
              <EmailIcon className="absolute right-4.5 top-1/2 -translate-y-1/2" />
            </div>
            <p className="mt-1 h-5 overflow-hidden text-ellipsis whitespace-nowrap text-sm leading-5 text-red">
              {errors.email?.message || "\u00A0"}
            </p>
          </div>

          <div className="mb-5">
            <label
              htmlFor="password"
              className="mb-3 block text-body-sm font-medium text-dark dark:text-white"
            >
              Password *
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                className={`w-full rounded-lg border-[1.5px] bg-transparent px-5.5 py-[15px] pr-12.5 outline-none transition placeholder:text-dark-6 dark:bg-dark-2 dark:text-white ${
                  errors.password
                    ? "border-red focus:border-red dark:border-red"
                    : "border-stroke focus:border-primary dark:border-dark-3"
                }`}
                {...register("password", {
                  required: "Password is required",
                  minLength: {
                    value: 6,
                    message: "Password must be at least 6 characters",
                  },
                })}
                aria-invalid={!!errors.password}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4.5 top-1/2 -translate-y-1/2 text-dark-6 hover:text-dark focus:outline-none dark:text-dark-6 dark:hover:text-white"
                tabIndex={-1}
              >
                {showPassword ? (
                  <EyeOff className="h-5 w-5" />
                ) : (
                  <Eye className="h-5 w-5" />
                )}
              </button>
            </div>
            <p className="mt-1 h-5 overflow-hidden text-ellipsis whitespace-nowrap text-sm leading-5 text-red">
              {errors.password?.message || "\u00A0"}
            </p>
          </div>

          <div className="mb-6 flex items-center justify-between gap-2 py-2 font-medium">
            <label className="flex cursor-pointer select-none items-center text-body-sm font-medium">
              <input
                type="checkbox"
                {...register("remember")}
                className="peer sr-only"
              />
              <div className="mr-3 flex size-5 items-center justify-center rounded-md border border-stroke peer-checked:border-primary peer-checked:bg-gray-2 dark:border-dark-3 dark:peer-checked:bg-transparent peer-checked:[&>*]:block">
                <svg
                  className="hidden text-primary"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
              </div>
              <span>Remember me</span>
            </label>

            <Link
              href="/auth/forgot-password"
              className="hover:text-primary dark:text-white dark:hover:text-primary"
            >
              Forgot Password?
            </Link>
          </div>

          <div className="mb-4.5">
            <button
              type="submit"
              disabled={loading}
              className={styles["submit-btn"]}
            >
              {loading ? "Signing in..." : "Sign In"}
              {loading && <span className={styles.spinner} />}
            </button>
          </div>
        </form>

        {/* Resend Verification Email Section */}
        {showResendEmail && (
          <div className="mt-6 rounded-lg border border-orange-500 bg-orange-50 p-4 dark:border-orange-600 dark:bg-orange-900/20">
            <div className="mb-3 flex items-start gap-3">
              <Mail className="mt-0.5 h-5 w-5 text-orange-600 dark:text-orange-400" />
              <div className="flex-1">
                <h3 className="mb-1 text-sm font-semibold text-orange-800 dark:text-orange-200">
                  Account Not Activated
                </h3>
                <p className="mb-3 text-sm text-orange-700 dark:text-orange-300">
                  Your account may not be activated yet. This could be because your email address has not been verified. Please check your inbox for the verification link or request a new one below.
                </p>
                <div className="space-y-3">
                  <div>
                    <label
                      htmlFor="resend-email"
                      className="mb-2 block text-xs font-medium text-orange-800 dark:text-orange-200"
                    >
                      Email Address
                    </label>
                    <input
                      id="resend-email"
                      type="email"
                      value={resendEmail}
                      onChange={(e) => setResendEmail(e.target.value)}
                      placeholder="Enter your email"
                      className="w-full rounded-lg border border-orange-300 bg-white px-4 py-2.5 text-sm text-dark outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-200 dark:border-orange-600 dark:bg-dark-2 dark:text-white dark:focus:border-orange-500 dark:focus:ring-orange-800"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={async () => {
                        if (!resendEmail.trim()) {
                          showToast({
                            type: "error",
                            title: "Email Required",
                            message: "Please enter your email address",
                          });
                          return;
                        }

                        setResendLoading(true);
                        try {
                          await resendVerificationEmail({ email: resendEmail.trim() });
                          showToast({
                            type: "success",
                            title: "Email Sent",
                            message: "A verification link has been sent to your email. Please check your inbox.",
                          });
                          setShowResendEmail(false);
                          setResendEmail("");
                        } catch (error) {
                          const msg =
                            error instanceof Error
                              ? error.message
                              : "Failed to resend verification email";
                          showToast({
                            type: "error",
                            title: "Error",
                            message: msg,
                          });
                        } finally {
                          setResendLoading(false);
                        }
                      }}
                      disabled={resendLoading}
                      className="flex-1 rounded-lg bg-orange-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-orange-700 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-orange-500 dark:hover:bg-orange-600"
                    >
                      {resendLoading ? "Sending..." : "Resend Verification Email"}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowResendEmail(false);
                        setResendEmail("");
                      }}
                      className="rounded-lg border border-orange-300 bg-white px-4 py-2.5 text-sm font-medium text-orange-700 transition hover:bg-orange-50 dark:border-orange-600 dark:bg-dark-2 dark:text-orange-300 dark:hover:bg-orange-900/30"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className={styles.footer}>
        <p>
          Don&apos;t have any account?{" "}
          <Link href="/auth/sign-up" className="text-primary">
            Sign Up
          </Link>
        </p>
      </div>
    </>
  );
}
