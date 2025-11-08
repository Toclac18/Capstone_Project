import styles from "./styles.module.css";
import TemplateBox from "./_components/TemplateBox";
import UploadForm from "./_components/UploadForm";
import UploadProvider from "./provider";

export default function Page() {
  return (
    <main className={styles.wrapper}>
      <h1 className="text-xl font-semibold">Import users (Excel)</h1>
      <UploadProvider>
        <TemplateBox />
        <UploadForm />
      </UploadProvider>
    </main>
  );
}