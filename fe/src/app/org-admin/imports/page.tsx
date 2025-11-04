import styles from "./styles.module.css";
import ImportHistoryProvider from "./provider";
import Filters from "./_components/Filters";
import HistoryTable from "./_components/HistoryTable";
import Pagination from "./_components/Pagination";
import PageHeader from "./_components/PageHeader";

export default function Page() {
  return (
    <main className={styles.wrapper}>
      <ImportHistoryProvider>
        <PageHeader />
        <Filters />
        <HistoryTable />
        <Pagination />
      </ImportHistoryProvider>
    </main>
  );
}
