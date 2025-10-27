"use client";
import Link from "next/link";
import { EmailIcon, GoogleIcon, PasswordIcon } from "@/assets/icons";
import React, { useState } from "react";
import InputGroup from "@/components/(template)/FormElements/InputGroup";
import { Checkbox } from "@/components/(template)/FormElements/checkbox";
import { Select } from "@/components/(template)/FormElements/select";
import { LogoPlaceholder } from "@/components/logo";

// Admin role options
const adminRoles = [
  { value: "BUSINESS_ADMIN", label: "Business Admin" },
  { value: "SYSTEM_ADMIN", label: "System Admin" },
  { value: "ORGANIZATION_ADMIN", label: "Organization Admin" },
];

export default function AdminSignin() {
  const [data, setData] = useState({
    email: process.env.NEXT_PUBLIC_DEMO_ADMIN_MAIL || "",
    password: process.env.NEXT_PUBLIC_DEMO_ADMIN_PASS || "",
    role: "BUSINESS_ADMIN",
    remember: false,
  });

  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setData({
      ...data,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // You can remove this code block
    setLoading(true);

    setTimeout(() => {
      setLoading(false);
      // Redirect to business admin dashboard after successful login
      window.location.href = '/business-admin';
    }, 1000);
  };

  return (
    <>
      {/* Logo placeholder */}
      <div className="mb-8 text-center">
        <LogoPlaceholder size="md" className="mb-4" useImage={true} />
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Readee Admin Portal
        </h1>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
          Sign in to access admin dashboard
        </p>
      </div>

      <button className="flex w-full items-center justify-center gap-3.5 rounded-lg border border-stroke bg-gray-2 p-[15px] font-medium hover:bg-opacity-50 dark:border-dark-3 dark:bg-dark-2 dark:hover:bg-opacity-50">
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
          <div className="mb-4">
            <Select
              label="Admin Role"
              items={adminRoles}
              defaultValue={data.role}
              className="w-full"
            />
          </div>

          <InputGroup
            type="email"
            label="Email"
            className="mb-4 [&_input]:py-[15px]"
            placeholder="Enter your admin email"
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
              className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg bg-primary p-4 font-medium text-white transition hover:bg-opacity-90"
            >
              Sign In as Admin
              {loading && (
                <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-solid border-white border-t-transparent dark:border-primary dark:border-t-transparent" />
              )}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}
