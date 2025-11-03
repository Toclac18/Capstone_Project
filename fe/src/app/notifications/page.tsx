import NotificationView from "./NotificationView";
import Breadcrumb from "@/components/(template)/Breadcrumbs/Breadcrumb";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Notifications",
};

export default function NotificationsPage() {
  return (
    <>
      <Breadcrumb pageName="Notifications" />
      <div className="mt-4">
        <NotificationView />
      </div>
    </>
  );
}



