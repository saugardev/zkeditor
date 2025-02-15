'use client'

import ImageEditor from '@/components/ImageEditor';
import { TabsProvider } from '@/contexts/TabsContext';

export default function Home() {
  return (
    <div className="min-h-screen">
      <TabsProvider>
        <ImageEditor />
      </TabsProvider>
    </div>
  );
}
