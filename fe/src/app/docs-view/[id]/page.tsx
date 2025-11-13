// src/app/docs-view/[id]/page.tsx
import { DocsViewProvider } from "./DocsViewProvider";
import HeaderBar from "./_components/Headerbar";
import LeftSidebar from "./_components/LeftSidebar";
import RightSidebar from "./_components/RightSidebar";
import ClientPdf from "./_components/ClientPdf";
import styles from "./styles.module.css";

export default async function DocDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <DocsViewProvider id={id}>
      <main className={styles.page}>
        <HeaderBar />
        <div className={styles.content}>
          <LeftSidebar />
          <section className={styles.centerPane}>
            <ClientPdf />
          </section>
          <RightSidebar />
        </div>
      </main>
    </DocsViewProvider>
  );
}
