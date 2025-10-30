"use client";
import Link from "next/link";
import { EmailIcon, GoogleIcon, PasswordIcon, UserIcon } from "@/assets/icons";
import React, { useState } from "react";
import InputGroup from "@/components/(template)/FormElements/InputGroup";
import Logo from "@/assets/logos/logo-icon.svg";
import LogoDark from "@/assets/logos/logo-icon-dark.svg";
import Image from "next/image";
import { useToast } from "@/components/ui/toast";
import { registerReader } from "@/services/authService";


export default function Signup() {
  const { showToast } = useToast();
  const [data, setData] = useState({
    name: "",
    date_of_birth: "",
    username: "",
    email: "",
    password: "",
    repassword: "",
  });

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ [k: string]: string }>({});
  const refs = React.useRef<{ [k: string]: HTMLDivElement | null }>({});

  const validateField = (name: string, value: string, ctx?: typeof data) => {
    const val = value?.trim?.() ?? value;
    switch (name) {
      case 'name':
        if (!val) return 'Name is required';
        if (val.length < 2) return 'Name must be at least 2 characters';
        return '';
      case 'date_of_birth':
        if (!val) return 'Date of birth is required';
        const dobDate = new Date(val);
        if (isNaN(dobDate.getTime())) return 'Invalid date';
        if (dobDate > new Date()) return 'Date of birth must be in the past';
        const now = new Date();
        const age = now.getFullYear() - dobDate.getFullYear();
        const monthDiff = now.getMonth() - dobDate.getMonth();
        const actualAge = (monthDiff < 0 || (monthDiff === 0 && now.getDate() < dobDate.getDate())) ? age - 1 : age;
        if (actualAge < 13) return 'You must be at least 13 years old';
        return '';
      case 'username':
        if (!val) return 'Username is required';
        if (val.length < 3) return 'Username must be at least 3 characters';
        if (!/^[a-zA-Z0-9_\.\-]+$/.test(val)) return 'Only letters, numbers, underscore, dot and hyphen allowed';
        return '';
      case 'email':
        if (!val) return 'Email is required';
        if (!/^\S+@\S+\.\S+$/.test(val)) return 'Email is invalid';
        return '';
      case 'password':
        if (!val) return 'Password is required';
        if (val.length < 8) return 'Password must be at least 8 characters';
        if (!/[A-Za-z]/.test(val) || !/[0-9]/.test(val)) return 'Password must include letters and numbers';
        return '';
      case 'repassword':
        if (!val) return 'Please confirm your password';
        if (val !== (ctx?.password ?? '')) return 'Passwords do not match';
        return '';
      default:
        return '';
    }
  };

  const validateAll = (form: typeof data) => {
    const nextErrors: { [k: string]: string } = {};
    (Object.keys(form) as Array<keyof typeof form>).forEach((key) => {
      const msg = validateField(String(key), String(form[key] ?? ''), form);
      if (msg) nextErrors[String(key)] = msg;
    });
    setErrors(nextErrors);
    return nextErrors;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setData({
      ...data,
      [e.target.name]: e.target.value,
    });
    const msg = validateField(e.target.name, e.target.value, { ...data, [e.target.name]: e.target.value });
    setErrors((prev) => ({ ...prev, [e.target.name]: msg }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    try {
      const errs = validateAll(data);
      if (Object.keys(errs).length > 0) {
        // focus the first error field (focus input inside group)
        const firstKey = Object.keys(errs)[0];
        const group = refs.current[firstKey];
        const input = group?.querySelector('input') as HTMLInputElement | undefined;
        input?.focus();
        showToast({
          type: 'error',
          title: 'Validation Error',
          message: 'Please correct the highlighted fields',
        });
        return;
      }

      // Use service layer
      await registerReader({
        fullName: data.name,
        dateOfBirth: data.date_of_birth,
        username: data.username,
        email: data.email,
        password: data.password,
      });

      // Success: inform user to check email for verification
      showToast({
        type: 'success',
        title: 'Registration Successful',
        message: 'Please check your email to verify your account.',
      });
      setTimeout(() => {
        window.location.href = '/auth/sign-in';
      }, 3000);
    } catch (err: any) {
      showToast({
        type: 'error',
        title: 'Registration Failed',
        message: err?.message || 'Registration failed',
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
        Sign up with Google
      </button>

      <div className="my-6 flex items-center justify-center">
        <span className="block h-px w-full bg-stroke dark:bg-dark-3"></span>
        <div className="block w-full min-w-fit bg-white px-3 text-center font-medium dark:bg-gray-dark">
          Or sign up with email
        </div>
        <span className="block h-px w-full bg-stroke dark:bg-dark-3"></span>
      </div>

      <div>
        <form onSubmit={handleSubmit}>
            <InputGroup
            type="string"
            label="Name"
            className="mb-5 [&_input]:py-[15px]"
            placeholder="Enter your name"
            name="name"
            handleChange={handleChange}
            value={data.name}
            icon={<UserIcon />}
              error={errors.name}
            />
            {errors.name && <p className="-mt-4 mb-4 text-sm text-red-500">{errors.name}</p>}

            <InputGroup
            type="date"
            label="Date of birth"
            className="mb-5 [&_input]:py-[15px]"
            placeholder="Enter your date of birth"
            name="date_of_birth"
            handleChange={handleChange}
            value={data.date_of_birth}
              error={errors.date_of_birth}
            />
            {errors.date_of_birth && <p className="-mt-4 mb-4 text-sm text-red-500">{errors.date_of_birth}</p>}

            <InputGroup
            type="string"
            label="UserName"
            className="mb-5 [&_input]:py-[15px]"
            placeholder="Enter your username"
            name="username"
            handleChange={handleChange}
            value={data.username}
            icon={<UserIcon />}
              error={errors.username}
            />
            {errors.username && <p className="-mt-4 mb-4 text-sm text-red-500">{errors.username}</p>}

            <InputGroup
            type="email"
            label="Email"
            className="mb-4 [&_input]:py-[15px]"
            placeholder="Enter your email"
            name="email"
            handleChange={handleChange}
            value={data.email}
            icon={<EmailIcon />}
              error={errors.email}
            />
            {errors.email && <p className="-mt-3 mb-4 text-sm text-red-500">{errors.email}</p>}

            <InputGroup
            type="password"
            label="Password"
            className="mb-5 [&_input]:py-[15px]"
            placeholder="Enter your password"
            name="password"
            handleChange={handleChange}
            value={data.password}
            icon={<PasswordIcon />}
              error={errors.password}
            />
            {errors.password && <p className="-mt-4 mb-4 text-sm text-red-500">{errors.password}</p>}

            <InputGroup
            type="password"
            label="Confirm Password"
            className="mb-5 [&_input]:py-[15px]"
            placeholder="Re-enter your password"
            name="repassword"
            handleChange={handleChange}
            value={data.repassword}
            icon={<PasswordIcon />}
              error={errors.repassword}
            />
            {errors.repassword && <p className="-mt-4 mb-4 text-sm text-red-500">{errors.repassword}</p>}

          <div className="mb-4.5">
            <button
              type="submit"
              className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg bg-primary p-4 font-medium text-white transition hover:bg-opacity-90"
              disabled={loading}
            >
              Create Account
              {loading && (
                <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-solid border-white border-t-transparent dark:border-primary dark:border-t-transparent" />
              )}
            </button>
          </div>
        </form>
      </div>

      <div className="mt-6 text-center">
        <p>
          Already have an account?{" "}
          <Link href="/auth/sign-in" className="text-primary">
            Sign In
          </Link>
        </p>
      </div>
    </>
  );
}
