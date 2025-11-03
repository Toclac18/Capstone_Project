import Signin from "@/app/auth/sign-in/_components";
import styles from "./styles.module.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign in",
};

export default function SignIn() {
  return (
    <>
      <div className={styles["page-container"]}>
        <div className={styles.card}>
          <div className="w-full">
            <div className={styles["card-body"]}>
              <Signin />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
