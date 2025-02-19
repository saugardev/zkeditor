import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { useTabs } from '@/contexts/TabsContext';
import { useImageEditor } from '@/hooks/useImageEditor';
import { useToast } from '@/contexts/ToastContext';

interface MenuItem {
  label: string;
  items: {
    label: string;
    action: () => void;
  }[];
}

export function Navbar() {
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const { addTab, setIsLoading, tabs, activeTab, undo, redo, canUndo, canRedo } = useTabs();
  const { loadImage } = useImageEditor();
  const { showToast } = useToast();

  const menuItems: MenuItem[] = [
    {
      label: 'File',
      items: [
        { 
          label: 'New Project', 
          action: async () => {
            setIsLoading(true);
            await new Promise(resolve => setTimeout(resolve, 100));
            addTab({ 
              id: `tab-${Date.now()}`,
              name: 'Untitled-1.png', 
              imageUrl: null,
              history: [''],
              historyIndex: 0
            });
            setIsLoading(false);
          }
        },
        { 
          label: 'Open...', 
          action: () => {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = 'image/*';
            input.onchange = async (e) => {
              const file = (e.target as HTMLInputElement).files?.[0];
              if (file) {
                try {
                  setIsLoading(true);
                  const project = await loadImage(file, tabs.length);
                  const initialImage = await project.get_layer(0);
                  const imageUrl = URL.createObjectURL(new Blob([initialImage], { type: 'image/png' }));
                  addTab({ 
                    id: `tab-${Date.now()}`,
                    name: file.name, 
                    imageUrl,
                    history: [imageUrl],
                    historyIndex: 0
                  });
                  showToast('Image opened successfully');
                } catch (error) {
                  console.error('File upload failed:', error);
                  showToast('Failed to open image');
                } finally {
                  setIsLoading(false);
                }
              }
            };
            input.click();
          } 
        },
        { label: 'Save', action: () => console.log('Save') },
        { label: 'Export', action: () => console.log('Export') }
      ]
    },
    {
      label: 'Edit',
      items: [
        { 
          label: 'Undo', 
          action: () => {
            if (canUndo(activeTab)) {
              undo(activeTab);
              showToast('Undo successful');
            }
            else {
              showToast('No image to undo');
            }
          }
        },
        { 
          label: 'Redo', 
          action: () => {
            if (canRedo(activeTab)) {
              redo(activeTab);
              showToast('Redo successful');
            }
            else {
              showToast('No image to redo');
            }
          }
        },
        {
          label: 'Copy',
          action: async () => {
            const img = document.querySelector(`img[data-tab="${activeTab}"]`) as HTMLImageElement;
            if (img?.src) {
              try {
                const response = await fetch(img.src);
                const blob = await response.blob();
                await navigator.clipboard.write([
                  new ClipboardItem({
                    [blob.type]: blob
                  })
                ]);
                showToast('Image copied to clipboard');
              } catch (error) {
                console.error('Failed to copy image:', error);
                showToast('Failed to copy image');
              }
            }
            else {
              showToast('No image to copy');
            }
          }
        }
      ]
    },
    {
      label: 'Filters',
      items: [
        { label: 'Grayscale', action: () => console.log('Grayscale') },
        { label: 'Blur', action: () => console.log('Blur') },
        { label: 'Sharpen', action: () => console.log('Sharpen') },
        { label: 'Invert', action: () => console.log('Invert') }
      ]
    },
    {
      label: 'Help',
      items: [
        { label: 'Documentation', action: () => console.log('Docs') },
        { label: 'About', action: () => console.log('About') }
      ]
    }
  ];

  return (
    <div className="bg-neutral-900 text-white text-sm">
      <div className="flex items-center border-b border-neutral-700">
        <div className="flex">
          {menuItems.map((menu) => (
            <div
              key={menu.label}
              className="relative"
              onMouseEnter={() => setActiveMenu(menu.label)}
              onMouseLeave={() => setActiveMenu(null)}
            >
              <button className="px-4 py-2 hover:bg-neutral-800 flex items-center gap-1">
                {menu.label}
                <ChevronDown size={14} />
              </button>
              
              {activeMenu === menu.label && (
                <div className="absolute top-full left-0 bg-neutral-900 border border-neutral-700 shadow-lg min-w-40 py-1 z-50">
                  {menu.items.map((item) => (
                    <button
                      key={item.label}
                      onClick={item.action}
                      className="w-full px-4 py-2 text-left hover:bg-neutral-800"
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
} 