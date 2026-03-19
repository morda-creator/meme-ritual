import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, X } from 'lucide-react';

interface SubmitSectionProps {
  onSubmit: (file: File) => void;
}

const SubmitSection = ({ onSubmit }: SubmitSectionProps) => {
  const [preview, setPreview] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = (f: File) => {
    if (!f.type.startsWith('image/')) return;
    setFile(f);
    const reader = new FileReader();
    reader.onload = (e) => setPreview(e.target?.result as string);
    reader.readAsDataURL(f);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  };

  const handleSubmit = () => {
    if (file) {
      onSubmit(file);
      setFile(null);
      setPreview(null);
    }
  };

  const clear = () => {
    setFile(null);
    setPreview(null);
  };

  return (
    <motion.section
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-3xl mx-auto px-6 sm:px-10 py-8"
    >
      <p className="font-mono text-xs text-muted-foreground uppercase tracking-widest mb-4">
        &gt; Submit your offering
      </p>

      <AnimatePresence mode="wait">
        {!preview ? (
          <motion.div
            key="dropzone"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            onClick={() => inputRef.current?.click()}
            className={`border-2 border-dashed rounded-lg p-10 text-center cursor-pointer transition-all ${
              isDragging
                ? 'border-primary bg-primary/5'
                : 'border-border hover:border-primary/40'
            }`}
          >
            <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
            <p className="font-mono text-sm text-muted-foreground">
              Drop image here or click to browse
            </p>
            <p className="font-mono text-xs text-muted-foreground/60 mt-1">
              Your identity remains hidden. For now.
            </p>
            <input
              ref={inputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
            />
          </motion.div>
        ) : (
          <motion.div
            key="preview"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="relative border border-border rounded-lg overflow-hidden"
          >
            <img src={preview} alt="Preview" className="w-full max-h-80 object-contain bg-secondary" />
            <div className="flex gap-3 p-4">
              <button
                onClick={clear}
                className="flex items-center gap-2 px-4 py-2 rounded-md font-mono text-xs bg-secondary text-muted-foreground border border-border hover:border-destructive/40 hover:text-destructive transition-all"
              >
                <X className="w-3.5 h-3.5" />
                Discard
              </button>
              <button
                onClick={handleSubmit}
                className="flex items-center gap-2 px-4 py-2 rounded-md font-mono text-xs bg-primary text-primary-foreground hover:opacity-90 transition-all box-glow"
              >
                <Upload className="w-3.5 h-3.5" />
                Submit offering
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.section>
  );
};

export default SubmitSection;
