import React, { useState } from 'react';
import { Upload } from 'lucide-react';

export default function FileUpload({ onUploadComplete }) {
    const [isDragging, setIsDragging] = useState(false);
    const [isUploading, setIsUploading] = useState(false);

    const handleFile = async (file) => {
        if (!file) return;
        setIsUploading(true);

        const formData = new FormData();
        formData.append('file', file);

        try {
            const res = await fetch('/upload', {
                method: 'POST',
                body: formData
            });
            const data = await res.json();
            if (data.success) {
                onUploadComplete(data.filename, file.name);
            } else {
                alert('Upload failed: ' + data.error);
            }
        } catch (e) {
            alert('Upload error: ' + e.message);
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <div
            className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-all ${isDragging ? 'border-cyan-400 bg-slate-800' : 'border-slate-600 bg-slate-900 hover:border-cyan-500 hover:bg-slate-800'
                }`}
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={(e) => {
                e.preventDefault();
                setIsDragging(false);
                handleFile(e.dataTransfer.files[0]);
            }}
            onClick={() => document.getElementById('fileInput').click()}
        >
            <input
                type="file"
                id="fileInput"
                className="hidden"
                accept=".csv,.xlsx,.xls"
                onChange={(e) => handleFile(e.target.files[0])}
            />

            <Upload size={48} className="mx-auto mb-4 text-cyan-400" />
            <h3 className="text-xl font-semibold mb-2 text-slate-200">
                {isUploading ? 'Uploading...' : 'Click to Upload or Drag & Drop'}
            </h3>
            <p className="text-slate-500">CSV or Excel files (Max 16MB)</p>
        </div>
    );
}
