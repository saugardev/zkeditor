import { useState } from "react";
import { Upload, X } from "lucide-react";

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImageSelect: (file: File, ipfsCid?: string) => void;
}

export function UploadModal({
  isOpen,
  onClose,
  onImageSelect,
}: UploadModalProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [ipfsCid, setIpfsCid] = useState<string | null>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setIpfsCid(null);
    }
  };

  const uploadToIPFS = async () => {
    if (!selectedFile) return;

    try {
      setIsUploading(true);
      const formData = new FormData();
      formData.append("file", selectedFile);

      const response = await fetch(
        "https://api.pinata.cloud/pinning/pinFileToIPFS",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${process.env.NEXT_PUBLIC_PINATA_JWT}`,
          },
          body: formData,
        }
      );

      const data = await response.json();
      if (data.IpfsHash) {
        setIpfsCid(data.IpfsHash);
      }
    } catch (error) {
      console.error("Failed to upload to IPFS:", error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleContinue = () => {
    if (selectedFile) {
      onImageSelect(selectedFile, ipfsCid || undefined);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-neutral-900 rounded-lg p-6 w-[480px] relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-neutral-400 hover:text-white"
        >
          <X size={20} />
        </button>

        <h2 className="text-xl font-semibold mb-6 text-white">New Project</h2>

        <div className="space-y-6">
          {!selectedFile ? (
            <div
              className="border-2 border-dashed border-neutral-700 rounded-lg p-8 text-center cursor-pointer hover:border-neutral-500 transition-colors"
              onClick={() => document.getElementById("file-upload")?.click()}
            >
              <Upload className="mx-auto mb-3 text-white" size={24} />
              <p className="text-white">
                Click to select or drag and drop an image
              </p>
              <input
                id="file-upload"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileSelect}
              />
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between bg-neutral-800 rounded p-3">
                <span className="text-sm truncate text-white flex-1 mr-2">
                  {selectedFile.name}
                </span>
                <button
                  onClick={() => setSelectedFile(null)}
                  className="text-neutral-400 hover:text-white"
                >
                  <X size={16} />
                </button>
              </div>

              {!ipfsCid ? (
                <button
                  onClick={uploadToIPFS}
                  disabled={isUploading}
                  className="w-full py-2.5 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isUploading
                    ? "Uploading to IPFS..."
                    : "Upload to IPFS (Optional)"}
                </button>
              ) : (
                <div className="bg-neutral-800 rounded p-3">
                  <p className="text-sm text-white mb-1">IPFS CID:</p>
                  <p className="text-sm font-mono break-all text-white">
                    {ipfsCid}
                  </p>
                </div>
              )}

              <button
                onClick={handleContinue}
                className="w-full py-2.5 px-4 bg-neutral-700 text-white rounded-lg hover:bg-neutral-600 transition-colors"
              >
                Continue to Editor
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
