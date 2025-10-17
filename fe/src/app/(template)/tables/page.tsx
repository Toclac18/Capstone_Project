import Breadcrumb from "@/components/(template)/Breadcrumbs/Breadcrumb";
import { InvoiceTable } from "@/components/(template)/Tables/invoice-table";
import { TopChannels } from "@/components/(template)/Tables/top-channels";
import { TopChannelsSkeleton } from "@/components/(template)/Tables/top-channels/skeleton";
import { TopProducts } from "@/components/(template)/Tables/top-products";
import { TopProductsSkeleton } from "@/components/(template)/Tables/top-products/skeleton";

import { Metadata } from "next";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "Tables",
};

const TablesPage = () => {
  return (
    <>
      <Breadcrumb pageName="Tables" />

      <div className="space-y-10">
        <Suspense fallback={<TopChannelsSkeleton />}>
          <TopChannels />
        </Suspense>
        
        <Suspense fallback={<TopProductsSkeleton />}>
          <TopProducts />
        </Suspense>

        <InvoiceTable />
      </div>
    </>
  );
};

export default TablesPage;
