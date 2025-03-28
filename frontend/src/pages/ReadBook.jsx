// src/pages/ReadBook.jsx
import React, { useEffect, useState } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { supabase } from '../api'; // Ensure this points to your Supabase client
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';

pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.js`;

const ReadBook = ({ filePath }) => {
  const [pdfData, setPdfData] = useState(null);
  const [numPages, setNumPages] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchSignedUrlAndPdf = async () => {
      try {
        // Generate a signed URL for the private file
        const { data, error } = await supabase.storage
          .from('Bookhub_pdf') // Replace with your Supabase bucket name
          .createSignedUrl(filePath, 60 * 60); // Signed URL valid for 1 hour

        if (error) {
          setError('Failed to generate signed URL.');
          console.error('Error generating signed URL:', error.message);
          return;
        }

        if (data?.signedUrl) {
          // Fetch the PDF file as an ArrayBuffer
          const response = await fetch(data.signedUrl);
          const arrayBuffer = await response.arrayBuffer();
          setPdfData(new Uint8Array(arrayBuffer)); // Convert to Uint8Array for react-pdf
        }
      } catch (err) {
        setError('Unable to load PDF. Please try again later.');
        console.error('Error fetching PDF:', err.message);
      }
    };

    fetchSignedUrlAndPdf();
  }, [filePath]);

  const onDocumentLoadSuccess = ({ numPages }) => {
    setNumPages(numPages);
  };

  if (error) return <div>{error}</div>;
  if (!pdfData) return <div>Loading PDF...</div>;

  return (
    <div
      onContextMenu={(e) => e.preventDefault()}
      style={{ userSelect: 'none', WebkitUserSelect: 'none', MozUserSelect: 'none' }}
    >
      <Document file={pdfData} onLoadSuccess={onDocumentLoadSuccess}>
        {Array.from(new Array(numPages), (el, index) => (
          <Page key={`page_${index + 1}`} pageNumber={index + 1} />
        ))}
      </Document>
      <p style={{ fontStyle: 'italic', fontSize: '0.9rem' }}>
        PDF is protected. Right-click and text selection are disabled.
      </p>
    </div>
  );
};

export default ReadBook;
