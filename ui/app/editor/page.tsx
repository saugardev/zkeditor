"use client";

import ImageEditor from "@/components/ImageEditor";
import { TabsProvider } from "@/contexts/TabsContext";
import { ToastProvider } from "@/contexts/ToastContext";

export default function Home() {
  return (
    <div className="min-h-screen">
      <ToastProvider>
        <TabsProvider>
          <ImageEditor />
        </TabsProvider>
      </ToastProvider>
    </div>
  );
}
