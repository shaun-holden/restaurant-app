import { useState, useRef } from 'react';
import api from '../../utils/api';
import toast from 'react-hot-toast';

// Handles the two-step Cloudinary signed upload:
// 1. GET a signed URL from our server (so API secret stays server-side)
// 2. POST the file directly to Cloudinary using that signed URL
//
// onUpload(url) is called when the upload succeeds with the image URL.

export default function ImageUpload({ currentImageUrl, onUpload }) {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState(currentImageUrl || null);
  const inputRef = useRef();

  async function handleFileChange(e) {
    const file = e.target.files[0];
    if (!file) return;

    // Show a local preview immediately while uploading
    setPreview(URL.createObjectURL(file));
    setUploading(true);

    try {
      // Step 1: Get signed upload params from our server
      const { data: signData } = await api.post('/api/upload/sign');

      // Step 2: Upload directly to Cloudinary (browser → Cloudinary, no server in between)
      const formData = new FormData();
      formData.append('file', file);
      formData.append('api_key', signData.apiKey);
      formData.append('timestamp', signData.timestamp);
      formData.append('signature', signData.signature);
      formData.append('folder', signData.folder);

      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${signData.cloudName}/image/upload`,
        { method: 'POST', body: formData }
      );
      const result = await response.json();

      if (result.secure_url) {
        onUpload(result.secure_url);
        toast.success('Image uploaded');
      } else {
        throw new Error('Upload failed');
      }
    } catch {
      toast.error('Image upload failed');
      setPreview(currentImageUrl || null);
    } finally {
      setUploading(false);
    }
  }

  return (
    <div>
      <div
        onClick={() => inputRef.current?.click()}
        className="border-2 border-dashed border-gray-200 rounded-xl p-4 cursor-pointer hover:border-orange-300 transition text-center min-h-[120px] flex flex-col items-center justify-center"
      >
        {preview ? (
          <img src={preview} alt="Preview" className="max-h-32 rounded-lg object-cover" />
        ) : (
          <div className="text-gray-400">
            <p className="text-2xl mb-1">📷</p>
            <p className="text-sm">Click to upload image</p>
          </div>
        )}
        {uploading && <p className="text-xs text-orange-500 mt-2 animate-pulse">Uploading...</p>}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />
    </div>
  );
}
