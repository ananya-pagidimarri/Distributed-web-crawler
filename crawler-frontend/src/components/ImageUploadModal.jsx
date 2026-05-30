import React, { useState } from 'react';
import { X, Image as ImageIcon, Loader2 } from 'lucide-react';
import { toast } from 'react-hot-toast';
import Tesseract from 'tesseract.js';

export default function ImageUploadModal({ isOpen, onClose, onSearch }) {
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');

  if (!isOpen) return null;

  const processImage = async (file) => {
    if (!file || !file.type.startsWith('image/')) {
      toast.error('Please upload a valid image file.');
      return;
    }
    
    setIsProcessing(true);
    toast('Analyzing image with OCR...', { icon: '🔍', id: 'ocr-toast', duration: 10000 });

    try {
      const result = await Tesseract.recognize(file, 'eng', {
        logger: m => {} // suppress logs to keep console clean
      });
      
      const text = result.data.text.trim();
      toast.dismiss('ocr-toast');
      
      if (text) {
        toast.success('Text extracted successfully!');
        // Take just the first 150 characters to avoid overly massive queries
        const queryText = text.replace(/\n/g, ' ').substring(0, 150);
        setIsProcessing(false);
        onClose();
        onSearch(queryText);
      } else {
        toast.error('No readable text found in the image.');
        setIsProcessing(false);
      }
    } catch (err) {
      toast.dismiss('ocr-toast');
      toast.error('Failed to process image: ' + err.message);
      setIsProcessing(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processImage(e.dataTransfer.files[0]);
    }
  };

  const handleFileInput = (e) => {
    if (e.target.files && e.target.files[0]) {
      processImage(e.target.files[0]);
    }
  };

  const handleLinkSearch = () => {
    if (linkUrl.trim()) {
      onClose();
      onSearch(linkUrl.trim());
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div 
        className="bg-[#303134] rounded-2xl w-full max-w-[700px] mx-4 shadow-[0_24px_48px_rgba(0,0,0,0.5)] border border-[#3c4043] flex flex-col relative overflow-hidden animate-[fadeInUp_0.2s_ease-out]"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[#3c4043]">
          <h2 className="text-[#e8eaed] text-[15px] font-medium w-full text-center ml-8">Search any image with OCR</h2>
          <button onClick={onClose} className="text-[#9aa0a6] hover:text-[#e8eaed] transition-colors p-2 rounded-full hover:bg-[#3c4043]">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Processing Overlay */}
        {isProcessing && (
          <div className="absolute inset-0 z-10 bg-[#303134]/90 backdrop-blur-sm flex flex-col items-center justify-center">
            <Loader2 className="w-10 h-10 text-[#8ab4f8] animate-spin mb-4" />
            <p className="text-[#e8eaed] text-lg font-medium">Extracting text via AI...</p>
            <p className="text-[#9aa0a6] text-sm mt-2">This happens securely in your browser.</p>
          </div>
        )}

        {/* Body */}
        <div className="p-8 pb-10 flex flex-col items-center">
          
          {/* Drag & Drop Zone */}
          <label 
            className={`w-full max-w-[540px] h-[220px] flex flex-col items-center justify-center rounded-2xl transition-all cursor-pointer relative overflow-hidden ${
              isDragging ? 'bg-[#3c4043] border-2 border-[#8ab4f8]' : 'bg-[#202124] border-2 border-dashed border-[#5f6368] hover:border-[#8ab4f8]'
            }`}
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
          >
            <input type="file" className="hidden" accept="image/*" onChange={handleFileInput} />
            <div className="flex items-center gap-4">
              <div className="w-[50px] h-[50px] bg-white rounded-md flex items-center justify-center shadow-sm">
                <ImageIcon className="w-7 h-7 text-[#4285f4]" />
              </div>
              <span className="text-[#e8eaed] text-[16px]">
                Drag an image here or <span className="text-[#8ab4f8] hover:underline font-medium">upload a file</span>
              </span>
            </div>
          </label>

          {/* Divider */}
          <div className="w-full max-w-[540px] flex items-center gap-4 my-6">
            <div className="flex-1 h-[1px] bg-[#3c4043]"></div>
            <span className="text-[#9aa0a6] text-[13px] font-medium tracking-wide">OR</span>
            <div className="flex-1 h-[1px] bg-[#3c4043]"></div>
          </div>

          {/* Link Input */}
          <div className="w-full max-w-[540px] flex items-center bg-[#202124] rounded-full border border-[#3c4043] focus-within:border-[#8ab4f8] transition-colors p-1">
            <input 
              type="text" 
              placeholder="Paste image link" 
              className="flex-1 bg-transparent outline-none text-[#e8eaed] px-5 py-2.5 text-[15px]"
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleLinkSearch()}
            />
            <button 
              onClick={handleLinkSearch}
              className="bg-[#303134] hover:bg-[#3c4043] text-[#8ab4f8] border border-[#3c4043] rounded-full px-6 py-2.5 text-[14px] font-medium transition-colors"
            >
              Search
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
