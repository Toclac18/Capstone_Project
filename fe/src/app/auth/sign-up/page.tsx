import Signup from "@/app/auth/sign-up/_components";
import styles from "./styles.module.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign up",
};

export default function SignUp() {
  return (
    <>
      <div className={styles["page-container"]}>
        <div className={styles.card}>
          <div className={styles["card-row"]}>
            <div className="w-full">
              <div className={styles["card-body"]}>
                <Signup />
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
