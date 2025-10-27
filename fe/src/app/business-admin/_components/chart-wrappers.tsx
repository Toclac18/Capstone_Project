"use client";
import { useEffect, useState } from "react";
import { PaymentsOverview } from "@/components/(template)/Charts/payments-overview";
import { UsedDevices } from "@/components/(template)/Charts/used-devices";
import { WeeksProfit } from "@/components/(template)/Charts/weeks-profit";
import { TopChannels } from "@/components/(template)/Tables/top-channels";
import { TopChannelsSkeleton } from "@/components/(template)/Tables/top-channels/skeleton";

// Wrapper components to handle async data in client components
function PaymentsOverviewWrapper({ className }: { className?: string }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate async data loading
    setTimeout(() => {
      setData({});
      setLoading(false);
    }, 1000);
  }, []);

  if (loading) {
    return <div className={`${className} animate-pulse bg-gray-200 dark:bg-gray-700 rounded-lg h-64`} />;
  }

  return <PaymentsOverview className={className} />;
}

function WeeksProfitWrapper({ className }: { className?: string }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setTimeout(() => {
      setData({});
      setLoading(false);
    }, 1200);
  }, []);

  if (loading) {
    return <div className={`${className} animate-pulse bg-gray-200 dark:bg-gray-700 rounded-lg h-64`} />;
  }

  return <WeeksProfit className={className} />;
}

function UsedDevicesWrapper({ className }: { className?: string }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setTimeout(() => {
      setData({});
      setLoading(false);
    }, 800);
  }, []);

  if (loading) {
    return <div className={`${className} animate-pulse bg-gray-200 dark:bg-gray-700 rounded-lg h-64`} />;
  }

  return <UsedDevices className={className} />;
}

function TopChannelsWrapper({ className }: { className?: string }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setTimeout(() => {
      setData({});
      setLoading(false);
    }, 1500);
  }, []);

  if (loading) {
    return <TopChannelsSkeleton />;
  }

  return <TopChannels className={className} />;
}

export { PaymentsOverviewWrapper, WeeksProfitWrapper, UsedDevicesWrapper, TopChannelsWrapper };

