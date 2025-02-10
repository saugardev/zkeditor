import ImageEditor from '@/components/ImageEditor';

export default function Home() {
  return (
    <div className="min-h-screen p-8">
      <main className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-8">Image Editor</h1>
        <ImageEditor />
      </main>
    </div>
  );
}
