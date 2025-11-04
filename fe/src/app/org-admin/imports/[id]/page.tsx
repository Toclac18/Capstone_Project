import styles from "./styles.module.css";
import ImportDetailProvider from "./provider";
import PageHeader from "./_components/PageHeader";
import MetaGrid from "./_components/MetaGrid";
import ResultTable from "./_components/ResultTable";

export default function Page({ params }: { params: { id: string } }) {
  return (
    <main className={styles.wrapper}>
      <ImportDetailProvider id={params.id}>
        <PageHeader />
        <MetaGrid />
        <ResultTable />
      </ImportDetailProvider>
    </main>
  );
}
