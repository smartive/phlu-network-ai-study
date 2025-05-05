'use client';

import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { useState } from 'react';

export function DownloadNetworkMapButton() {
  const [isLoading, setIsLoading] = useState(false);

  const handleDownload = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/network', {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Failed to generate PDF');
      }

      // Create a blob from the PDF stream
      const blob = await response.blob();

      // Create a link element and trigger download
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'network-map.pdf';
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading network map:', error);
      // You might want to show an error toast here
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button onClick={handleDownload} disabled={isLoading} className="gap-2">
      <Download className="w-4 h-4" />
      {isLoading ? 'Wird generiert...' : 'Netzwerkkarte herunterladen'}
    </Button>
  );
}
