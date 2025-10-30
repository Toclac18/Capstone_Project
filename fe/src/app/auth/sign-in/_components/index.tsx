"use client";
import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { EmailIcon, GoogleIcon, PasswordIcon } from "@/assets/icons";
import InputGroup from "@/components/(template)/FormElements/InputGroup";
import { Checkbox } from "@/components/(template)/FormElements/checkbox";
import { useToast } from "@/components/ui/toast";
import { login } from "@/services/authService";
import Logo from "@/assets/logos/logo-icon.svg";
import LogoDark from "@/assets/logos/logo-icon-dark.svg";

type UserRole = "READER" | "REVIEWER" | "ORGANIZATION" | "SYSTEM_ADMIN" | "BUSINESS_ADMIN";

export default function Signin() {
  const { showToast } = useToast();
  const router = useRouter();
  
  const [data, setData] = useState({
    email: "",
    password: "",
    role: "READER" as UserRole,
    remember: false,
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setData({ ...data, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!data.email || !data.password) {
      showToast({
        type: 'error',
        title: 'Error',
        message: 'Please fill in all fields'
      });
      return;
    }
    
    setLoading(true);
    try {
      const result = await login(data);

      localStorage.setItem('accessToken', result.accessToken);
      localStorage.setItem('userRole', result.role);
      localStorage.setItem('userId', result.subjectId);

      showToast({ type: 'success', title: 'Login Successful' });

      // Redirect based on role
      const roleRoutes: Record<UserRole, string> = {
        READER: '/',
        REVIEWER: '/reviewer/dashboard',
        ORGANIZATION: '/organization/dashboard',
        SYSTEM_ADMIN: '/admin/system/dashboard',
        BUSINESS_ADMIN: '/admin/business/dashboard',
      };

      setTimeout(() => {
        router.push(roleRoutes[result.role as UserRole] || '/');
      }, 1500);
    } catch (err: any) {
      showToast({
        type: 'error',
        title: 'Login Failed',
        message: err?.message || 'Invalid email or password',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="flex justify-center items-center">
        <Image src={Logo} alt="Logo" width={100} height={100} className="dark:hidden"/>
        <Image src={LogoDark} alt="Logo" width={100} height={100} className="hidden dark:block"/>
      </div>

      <button className="flex w-full items-center justify-center gap-3.5 rounded-lg border border-stroke bg-gray-2 p-[15px] font-medium hover:bg-opacity-50 dark:border-dark-3 dark:bg-dark-2 dark:hover:bg-opacity-50 mt-6">
        <GoogleIcon />
        Sign in with Google
      </button>

      <div className="my-6 flex items-center justify-center">
        <span className="block h-px w-full bg-stroke dark:bg-dark-3"></span>
        <div className="block w-full min-w-fit bg-white px-3 text-center font-medium dark:bg-gray-dark">
          Or sign in with email
        </div>
        <span className="block h-px w-full bg-stroke dark:bg-dark-3"></span>
      </div>

      <div>
        <form onSubmit={handleSubmit}>
          {/* Role Selector */}
          <div className="mb-4">
            <label className="mb-3 block text-body-sm font-medium text-dark dark:text-white">
              Login as
            </label>
            <div className="relative w-full">
              <select
                name="role"
                value={data.role}
                onChange={(e) => setData({ ...data, role: e.target.value as typeof data.role })}
                className="peer w-full appearance-none rounded-lg border border-stroke bg-white px-5 py-3 pr-12 text-dark shadow-sm outline-none ring-1 ring-transparent transition duration-150 focus:border-primary focus:ring-2 focus:ring-primary active:border-primary dark:border-dark-3 dark:bg-dark-2 dark:text-white dark:focus:border-primary dark:focus:ring-primary"
              >
                <option value="" disabled>-- Select your role --</option>
                <option value="READER">Reader</option>
                <option value="REVIEWER">Reviewer</option>
                <option value="ORGANIZATION">Organization</option>
                <option value="SYSTEM_ADMIN">System Admin</option>
                <option value="BUSINESS_ADMIN">Business Admin</option>
              </select>
              <span className="pointer-events-none absolute right-5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500">
                <svg width={20} height={20} fill="none" viewBox="0 0 20 20">
                  <path d="M6 8l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </span>
            </div>
          </div>

          <InputGroup
            type="email"
            label="Email"
            className="mb-4 [&_input]:py-[15px]"
            placeholder="Enter your email"
            name="email"
            handleChange={handleChange}
            value={data.email}
            icon={<EmailIcon />}
          />

          <InputGroup
            type="password"
            label="Password"
            className="mb-5 [&_input]:py-[15px]"
            placeholder="Enter your password"
            name="password"
            handleChange={handleChange}
            value={data.password}
            icon={<PasswordIcon />}
          />

          <div className="mb-6 flex items-center justify-between gap-2 py-2 font-medium">
            <Checkbox
              label="Remember me"
              name="remember"
              withIcon="check"
              minimal
              radius="md"
              onChange={(e) =>
                setData({
                  ...data,
                  remember: e.target.checked,
                })
              }
            />

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
              className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg bg-primary p-4 font-medium text-white transition hover:bg-opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Sign In
              {loading && (
                <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-solid border-white border-t-transparent dark:border-primary dark:border-t-transparent" />
              )}
            </button>
          </div>
        </form>
      </div>

      <div className="mt-6 text-center">
        <p>
          Don't have any account?{" "}
          <Link href="/auth/sign-up" className="text-primary">
            Sign Up
          </Link>
        </p>
      </div>
    </>
  );
}