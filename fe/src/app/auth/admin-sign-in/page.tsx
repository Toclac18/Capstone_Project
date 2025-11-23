import AdminSignin from "@/app/auth/admin-sign-in/_components/AdminSignin";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Admin Sign in",
};

export default function AdminSignIn() {
  return (
    <>
      <div className="flex min-h-screen items-center justify-center">
        <div className="flex flex-col items-center rounded-[10px] bg-white shadow-1 dark:bg-gray-dark dark:shadow-card xl:w-1/2">
          <div className="w-full">
            <div className="w-full p-4 sm:p-12.5 xl:p-15">
              <AdminSignin />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
