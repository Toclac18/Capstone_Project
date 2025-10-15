import Signup from "@/app/auth/sign-up/_components";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign up",
};

export default function SignUp() {
  return (
    <>
      <div className="flex min-h-screen items-center justify-center">
        <div className="rounded-[10px] bg-white shadow-1 dark:bg-gray-dark dark:shadow-card xl:w-1/2">
          <div className="flex flex-wrap items-center">
            <div className="w-full">
              <div className="w-full p-4 sm:p-12.5 xl:p-15">
                <Signup />
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
