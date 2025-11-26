"use client";

import styles from "../styles.module.css";

export default function HomepageFooter() {
  const year = new Date().getFullYear();
  return (
    <footer className={styles.footer}>
      <div className={styles.footerInner}>
        <div className={styles.footerBrand}>
          <div className={styles.footerLogo}>READEE</div>
          <p className={styles.footerTagline}>
            A smart library for academic &amp; professional documents.
          </p>
        </div>
        <div className={styles.footerColumns}>
          <div className={styles.footerColumn}>
            <div className={styles.footerColTitle}>Product</div>
            <button type="button" className={styles.footerLink}>
              Browse library
            </button>
            <button type="button" className={styles.footerLink}>
              Pricing &amp; credits
            </button>
            <button type="button" className={styles.footerLink}>
              Upload a document
            </button>
          </div>
          <div className={styles.footerColumn}>
            <div className={styles.footerColTitle}>Support</div>
            <button type="button" className={styles.footerLink}>
              Help center
            </button>
            <button type="button" className={styles.footerLink}>
              Contact admin
            </button>
            <button type="button" className={styles.footerLink}>
              Policies
            </button>
          </div>
          <div className={styles.footerColumn}>
            <div className={styles.footerColTitle}>Organization</div>
            <button type="button" className={styles.footerLink}>
              About READEE
            </button>
            <button type="button" className={styles.footerLink}>
              For universities
            </button>
            <button type="button" className={styles.footerLink}>
              For businesses
            </button>
          </div>
        </div>
      </div>
      <div className={styles.footerBottom}>
        <span className={styles.footerCopy}>
          © {year} READEE. All rights reserved.
        </span>
        <div className={styles.footerBottomLinks}>
          <button type="button" className={styles.footerLink}>
            Terms
          </button>
          <button type="button" className={styles.footerLink}>
            Privacy
          </button>
        </div>
      </div>
    </footer>
  );
}
