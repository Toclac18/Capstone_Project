"use client";
import Link from "next/link";
import GoogleSigninButton from "../../_components/GoogleSigninButton";
import { EmailIcon, GoogleIcon, PasswordIcon } from "@/assets/icons";
import React, { useState } from "react";
import InputGroup from "@/components/FormElements/InputGroup";
import { Checkbox } from "@/components/FormElements/checkbox";

export default function Signin() {
  const [data, setData] = useState({
    email: process.env.NEXT_PUBLIC_DEMO_USER_MAIL || "",
    password: process.env.NEXT_PUBLIC_DEMO_USER_PASS || "",
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
    }, 1000);
  };


  return (
    <>
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
              className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg bg-primary p-4 font-medium text-white transition hover:bg-opacity-90"
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
          Don’t have any account?{" "}
          <Link href="/auth/sign-up" className="text-primary">
            Sign Up
          </Link>
        </p>
      </div>
    </>
  );
}
