"use client";
import Link from "next/link";
import { EmailIcon, GoogleIcon, PasswordIcon, UserIcon } from "@/assets/icons";
import React, { useState } from "react";
import InputGroup from "@/components/(template)/FormElements/InputGroup";
import Logo from "@/assets/logos/logo-icon.svg";
import LogoDark from "@/assets/logos/logo-icon-dark.svg";
import Image from "next/image";
import { useToast } from "@/components/ui/toast";
import { 
  register, 
  type RegisterPayload
} from "../api";
import styles from "../styles.module.css";


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
      case 'date_of_birth': {
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
      }
      case 'username':
        if (!val) return 'Username is required';
        if (val.length < 3) return 'Username must be at least 3 characters';
        if (!/^[a-zA-Z0-9_.-]+$/.test(val)) return 'Only letters, numbers, underscore, dot and hyphen allowed';
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
      const payload: RegisterPayload = {
        fullName: data.name,
        dateOfBirth: data.date_of_birth,
        username: data.username,
        email: data.email,
        password: data.password,
      };
      await register(payload);

      // Success: inform user to check email for verification
      showToast({
        type: 'success',
        title: 'Registration Successful',
        message: 'Please check your email to verify your account.',
      });
      setTimeout(() => {
        window.location.href = '/auth/sign-in';
      }, 3000);
    } catch {
      showToast({
        type: 'error',
        title: 'Registration Failed',
        message: 'Registration failed',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className={styles["logo-row"]}>
        <Image src={Logo} alt="Logo" width={100} height={100} className="dark:hidden"/>
        <Image src={LogoDark} alt="Logo" width={100} height={100} className="hidden dark:block"/>
      </div>

      <button className={styles["oauth-btn"]}>
        <GoogleIcon />
        Sign up with Google
      </button>

      <div className={styles.divider}>
        <span className={styles["divider-line"]}></span>
        <div className={styles["divider-text"]}>
          Or sign up with email
        </div>
        <span className={styles["divider-line"]}></span>
      </div>

      <div>
        <form onSubmit={handleSubmit}>
            <InputGroup
            type="string"
            label="Name"
            className={styles["input-group"]}
            placeholder="Enter your name"
            name="name"
            handleChange={handleChange}
            value={data.name}
            icon={<UserIcon />}
              error={errors.name}
            />
            {errors.name && <p className={styles["error-text"]}>{errors.name}</p>}

            <InputGroup
            type="date"
            label="Date of birth"
            className={styles["input-group"]}
            placeholder="Enter your date of birth"
            name="date_of_birth"
            handleChange={handleChange}
            value={data.date_of_birth}
              error={errors.date_of_birth}
            />
            {errors.date_of_birth && <p className={styles["error-text"]}>{errors.date_of_birth}</p>}

            <InputGroup
            type="string"
            label="UserName"
            className={styles["input-group"]}
            placeholder="Enter your username"
            name="username"
            handleChange={handleChange}
            value={data.username}
            icon={<UserIcon />}
              error={errors.username}
            />
            {errors.username && <p className={styles["error-text"]}>{errors.username}</p>}

            <InputGroup
            type="email"
            label="Email"
            className={styles["input-group-tight"]}
            placeholder="Enter your email"
            name="email"
            handleChange={handleChange}
            value={data.email}
            icon={<EmailIcon />}
              error={errors.email}
            />
            {errors.email && <p className={styles["error-text-slight"]}>{errors.email}</p>}

            <InputGroup
            type="password"
            label="Password"
            className={styles["input-group"]}
            placeholder="Enter your password"
            name="password"
            handleChange={handleChange}
            value={data.password}
            icon={<PasswordIcon />}
              error={errors.password}
            />
            {errors.password && <p className={styles["error-text"]}>{errors.password}</p>}

            <InputGroup
            type="password"
            label="Confirm Password"
            className={styles["input-group"]}
            placeholder="Re-enter your password"
            name="repassword"
            handleChange={handleChange}
            value={data.repassword}
            icon={<PasswordIcon />}
              error={errors.repassword}
            />
            {errors.repassword && <p className={styles["error-text"]}>{errors.repassword}</p>}

          <div className="mb-4.5">
            <button
              type="submit"
              className={styles["submit-btn"]}
              disabled={loading}
            >
              Create Account
              {loading && (
                <span className={styles.spinner} />
              )}
            </button>
          </div>
        </form>
      </div>

      <div className={styles.footer}>
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
