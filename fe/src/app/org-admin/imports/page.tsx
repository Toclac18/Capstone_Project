import styles from "./styles.module.css";
import Filters from "./_components/Filters";
import HistoryTable from "./_components/HistoryTable";
import Pagination from "./_components/Pagination";
import PageHeader from "./_components/PageHeader";
import ImportHistoryProvider from "./provider";

export default function Page() {
  return (
    <main className={styles.wrapper}>
      <ImportHistoryProvider>
        <PageHeader />
        <section className={styles.content}>
          <Filters />
          <HistoryTable />
          <Pagination />
        </section>
      </ImportHistoryProvider>
    </main>
  );
}
