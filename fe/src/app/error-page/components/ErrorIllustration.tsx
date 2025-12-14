// src/app/error-page/components/ErrorIllustration.tsx
import styles from "../styles.module.css";

export const ErrorIllustration = () => {
  return (
    <svg
      viewBox="0 0 200 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={styles.svgIcon}
    >
      <circle cx="100" cy="100" r="90" className={styles.svgBg} />

      <path
        d="M139.5 76.5C139.5 76.5 135 83 125.5 83C116 83 111.5 76.5 111.5 76.5"
        strokeWidth="6"
        strokeLinecap="round"
        className={styles.svgAccent}
      />
      <path
        d="M88.5 76.5C88.5 76.5 84 83 74.5 83C65 83 60.5 76.5 60.5 76.5"
        strokeWidth="6"
        strokeLinecap="round"
        className={styles.svgAccent}
      />
      <path
        d="M68 128C68 128 85 145 100 145C115 145 132 128 132 128"
        strokeWidth="6"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={styles.svgMain}
      />

      <path
        d="M155 155L175 135M175 155L155 135"
        strokeWidth="4"
        strokeLinecap="round"
        className={styles.svgMuted}
      />
      <path
        d="M25 45L45 25M45 45L25 25"
        strokeWidth="4"
        strokeLinecap="round"
        className={styles.svgMuted}
      />
    </svg>
  );
};
