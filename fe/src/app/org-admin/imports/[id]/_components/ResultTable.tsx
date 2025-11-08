"use client";
import { useImportDetail } from "../provider";
import s from "../styles.module.css";

interface RowResult {
  row: number;
  fullName: string;
  username: string;
  email: string;
  imported: boolean;
  emailSent: boolean;
  error: string | null;
}

export default function ResultTable() {
  const { data, loading } = useImportDetail();
  const rows: RowResult[] = data?.results ?? []; 
  const NUM_COLUMNS = 7; 

  return (
    <section className="space-y-2">
      <h2 className="font-semibold">Row results</h2>
      <div className={s.tableWrap}>
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              {['Row','Full name','Username','Email','Imported','Email sent','Error'].map(h => 
                <th key={h} className="text-left px-3 py-2">{h}</th>
              )}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td className="px-3 py-6 text-center text-gray-500" colSpan={NUM_COLUMNS}>Loading…</td></tr>
            ) : rows.length === 0 ? (
              <tr><td className="px-3 py-6 text-center text-gray-500" colSpan={NUM_COLUMNS}>No data loaded!!!</td></tr>
            ) : rows.map((r: RowResult, i) => (
              <tr key={i} className="border-t">
                <td className="px-3 py-2">{r.row}</td>
                <td className="px-3 py-2">{r.fullName}</td>
                <td className="px-3 py-2">{r.username}</td>
                <td className="px-3 py-2">{r.email}</td>
                <td className="px-3 py-2">{r.imported ? '✅ Yes' : '❌ No'}</td> 
                <td className="px-3 py-2">{r.emailSent ? '✅ Yes' : '❌ No'}</td>
                <td className="px-3 py-2 text-red-600">{r.error ?? ''}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}