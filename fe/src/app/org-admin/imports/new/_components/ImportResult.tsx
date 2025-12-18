"use client";
import { CheckCircle, XCircle, AlertCircle, ArrowLeft, Plus } from "lucide-react";
import { useUpload } from "../provider";
import Link from "next/link";
import s from "../styles.module.css";

export default function ImportResult() {
  const { result, reset } = useUpload();

  if (!result) return null;

  const { totalEmails, successCount, failedCount, skippedCount, successEmails, failedInvitations, skippedEmails, importBatchId } = result;

  return (
    <div className={s.resultCard}>
      <div className={s.resultHeader}>
        <CheckCircle size={24} className={s.resultHeaderIcon} />
        <div>
          <h2 className={s.resultTitle}>Import Completed</h2>
          <p className={s.resultSubtitle}>Processed {totalEmails} email(s)</p>
        </div>
      </div>
      
      {/* Summary Stats */}
      <div className={s.resultStats}>
        <div className={`${s.statBox} ${s.statBoxSuccess}`}>
          <CheckCircle size={18} />
          <div className={s.statBoxContent}>
            <span className={s.statBoxValue}>{successCount}</span>
            <span className={s.statBoxLabel}>Success</span>
          </div>
        </div>
        <div className={`${s.statBox} ${s.statBoxFailed}`}>
          <XCircle size={18} />
          <div className={s.statBoxContent}>
            <span className={s.statBoxValue}>{failedCount}</span>
            <span className={s.statBoxLabel}>Failed</span>
          </div>
        </div>
        <div className={`${s.statBox} ${s.statBoxSkipped}`}>
          <AlertCircle size={18} />
          <div className={s.statBoxContent}>
            <span className={s.statBoxValue}>{skippedCount}</span>
            <span className={s.statBoxLabel}>Skipped</span>
          </div>
        </div>
      </div>

      {/* Failed Invitations - Show first */}
      {failedInvitations.length > 0 && (
        <div className={s.resultSection}>
          <h3 className={s.sectionTitle}>
            <XCircle size={16} className={s.iconFailed} />
            Failed ({failedInvitations.length})
          </h3>
          <div className={s.emailListWrap}>
            <table className={s.emailTable}>
              <thead>
                <tr>
                  <th>Email</th>
                  <th>Reason</th>
                </tr>
              </thead>
              <tbody>
                {failedInvitations.map((item) => (
                  <tr key={item.email}>
                    <td>{item.email}</td>
                    <td className={s.reasonCell}>{item.reason}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Skipped Emails */}
      {skippedEmails.length > 0 && (
        <div className={s.resultSection}>
          <h3 className={s.sectionTitle}>
            <AlertCircle size={16} className={s.iconSkipped} />
            Skipped - Already Invited/Joined ({skippedEmails.length})
          </h3>
          <div className={s.emailListWrap}>
            <ul className={s.emailList}>
              {skippedEmails.map((email) => (
                <li key={email} className={s.emailItem}>{email}</li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Success Emails */}
      {successEmails.length > 0 && (
        <div className={s.resultSection}>
          <h3 className={s.sectionTitle}>
            <CheckCircle size={16} className={s.iconSuccess} />
            Successfully Invited ({successEmails.length})
          </h3>
          <div className={s.emailListWrap}>
            <ul className={s.emailList}>
              {successEmails.map((email) => (
                <li key={email} className={s.emailItem}>{email}</li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className={s.resultActions}>
        <Link href="/org-admin/imports" className={s.btnSecondary}>
          <ArrowLeft size={16} />
          View History
        </Link>
        <Link href={`/org-admin/imports/${importBatchId}`} className={s.btnSecondary}>
          View Details
        </Link>
        <button onClick={reset} className={s.btnPrimary}>
          <Plus size={16} />
          Import More
        </button>
      </div>
    </div>
  );
}
