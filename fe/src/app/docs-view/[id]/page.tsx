// src/app/docs-view/[id]/page.tsx
import { DocsViewProvider } from "./DocsViewProvider";
import LeftSidebar from "./_components/LeftSidebar";
import RightSidebar from "./_components/RightSidebar";
import ClientPdf from "./_components/ClientPdf";
import styles from "./styles.module.css";
import HeaderBar from "./_components/Headerbar";
import CommentsSection from "./_components/CommentsSection";

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
            <CommentsSection />
          </section>
          <RightSidebar />
        </div>
      </main>
    </DocsViewProvider>
  );
}
