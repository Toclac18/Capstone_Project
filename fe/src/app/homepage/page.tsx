// app/homepage/page.tsx
import { Suspense } from "react";
import Homepage from "./HomePage";

export default function Page() {
  return (
    <Suspense fallback={<div />}>
      <Homepage />
    </Suspense>
  );
}
