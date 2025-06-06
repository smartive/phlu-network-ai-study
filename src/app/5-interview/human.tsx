'use client';

import { uploadAudioInterview } from '@/app/5-interview/actions';
import { P } from '@/components/typography';
import { Button } from '@/components/ui/button';
import { AppStep } from '@/lib/utils';
import { AlertCircle, ArrowRight, Mic, RefreshCw, Square } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';
import { updateStep } from '../actions';

const AudioWaveform = ({ mediaRecorder }: { mediaRecorder: MediaRecorder }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | undefined>(undefined);
  const analyserRef = useRef<AnalyserNode | undefined>(undefined);
  const sourceRef = useRef<MediaStreamAudioSourceNode | undefined>(undefined);

  useEffect(() => {
    if (!canvasRef.current || !mediaRecorder) return;

    const audioContext = new AudioContext();
    analyserRef.current = audioContext.createAnalyser();
    analyserRef.current.fftSize = 256;
    sourceRef.current = audioContext.createMediaStreamSource(
      mediaRecorder.stream
    );
    sourceRef.current.connect(analyserRef.current);

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d')!;
    const bufferLength = analyserRef.current.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const draw = () => {
      if (!analyserRef.current) return;

      animationRef.current = requestAnimationFrame(draw);
      analyserRef.current.getByteFrequencyData(dataArray);

      ctx.fillStyle = 'rgb(249, 250, 251)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const barWidth = (canvas.width / bufferLength) * 2.5;
      let barHeight;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        barHeight = (dataArray[i] / 255) * canvas.height;
        ctx.fillStyle = 'rgb(239, 68, 68)';
        ctx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);
        x += barWidth + 1;
      }
    };

    draw();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      if (sourceRef.current) {
        sourceRef.current.disconnect();
      }
      audioContext.close();
    };
  }, [mediaRecorder]);

  return (
    <canvas
      ref={canvasRef}
      width={256}
      height={256}
      className="absolute inset-0 w-full h-full"
    />
  );
};

export const HumanInterview = () => {
  const router = useRouter();
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioURL, setAudioURL] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(
    null
  );
  const [isUploading, setIsUploading] = useState(false);
  const [isUploaded, setIsUploaded] = useState(false);
  const chunks = useRef<Blob[]>([]);

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      setMediaRecorder(recorder);
      chunks.current = [];

      recorder.ondataavailable = (e) => {
        chunks.current.push(e.data);
      };

      recorder.onstop = () => {
        const blob = new Blob(chunks.current, { type: 'audio/webm' });
        const url = URL.createObjectURL(blob);
        setAudioBlob(blob);
        setAudioURL(url);
        chunks.current = [];
      };

      recorder.start();
      setIsRecording(true);
      setError(null);
      // Reset states when starting a new recording
      setIsUploaded(false);
      setIsUploading(false);
    } catch (err) {
      setError(
        'Mikrofon konnte nicht aktiviert werden. Bitte überprüfen Sie die Berechtigungen.'
      );
      console.error(err);
    }
  }, []);

  const stopRecording = useCallback(() => {
    if (mediaRecorder && isRecording) {
      mediaRecorder.stop();
      mediaRecorder.stream.getTracks().forEach((track) => track.stop());
      setIsRecording(false);
      setMediaRecorder(null);
    }
  }, [isRecording, mediaRecorder]);

  const handleUpload = async () => {
    if (!audioBlob) return;

    setIsUploading(true);
    setError(null);

    const formData = new FormData();
    formData.append('audio', audioBlob);

    try {
      const uploadPromise = uploadAudioInterview(formData);
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Upload timeout')), 180000); // 3 minutes timeout for the upload
      });

      await Promise.race([uploadPromise, timeoutPromise]);
      setIsUploaded(true);
      setIsUploading(false);
    } catch (err) {
      setError(
        'Fehler beim Hochladen der Aufnahme. Bitte versuchen Sie es erneut.'
      );
      setIsUploading(false);
      console.error(err);
    }
  };

  const handleNewRecording = () => {
    if (audioURL) {
      URL.revokeObjectURL(audioURL);
    }
    setAudioBlob(null);
    setAudioURL(null);
    setError(null);
    setIsUploaded(false);
  };

  const handleProceedToNextStep = async () => {
    try {
      await updateStep(AppStep.QUESTIONNAIRE_2);
      router.push(AppStep.QUESTIONNAIRE_2);
    } catch (err) {
      setError('Fehler beim Weiterleiten zur nächsten Seite.');
      console.error(err);
    }
  };

  // Auto-upload when recording is stopped
  useEffect(() => {
    if (audioBlob && !isUploaded && !isUploading) {
      handleUpload();
    }
  }, [audioBlob, isUploaded, isUploading]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (mediaRecorder && isRecording) {
        mediaRecorder.stop();
        mediaRecorder.stream.getTracks().forEach((track) => track.stop());
      }
      if (audioURL) {
        URL.revokeObjectURL(audioURL);
      }
    };
  }, [isRecording, mediaRecorder, audioURL]);

  return (
    <div className="flex flex-col items-center gap-6 p-8 w-full mx-auto">
      <div className="flex flex-col gap-2">
        <P>
          Stellen Sie Ihre Netzwerkkarte einer Mitstudentin oder einem
          Mitstudenten vor und beschreiben Sie Ihre Lerngelegenheiten zu
          lernzentrierter Kooperation. Gehen Sie dabei auf folgende Aspekte ein:
          Was haben Sie bei wem und wo gelernt und wie bedeutsam war dies für
          Ihre Kompetenzentwicklung?
        </P>
        <P>
          Ihre Mitstudentin oder Ihr Mitstudent kann Nachfragen stellen, falls
          etwas unklar oder zu allgemein ist. Sie oder er kann Formulierungen
          wie etwa «Kannst du mir das genauer erläutern.», «Dieser Punkt ist
          interessant, was ist da genau passiert?» nutzen.
        </P>
        <P>
          Bitte zeichnen Sie Ihr Gespräch auf. Nutzen Sie hierfür bitte den
          Aufnahmeknopf (unten).
        </P>
        <P>
          Nachdem Sie Ihre Netzwerkkarte vorgestellt haben und Nachfragen
          gestellt wurden, besprechen Sie die Netzwerkkarte und die
          Lerngelegenheiten Ihre Mitstudentin oder Ihres Mitstudenten. Sie haben
          insgesamt 12 Minuten Zeit. Sie können Dialekt sprechen.
        </P>
      </div>
      <div className="flex flex-col items-center gap-6 w-full max-w-md mx-auto">
        <div className="flex flex-col items-center gap-4 mt-12">
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-md text-red-600 mb-4 w-full">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <p className="text-sm">{error}</p>
            </div>
          )}

          {!audioBlob ? (
            <div className="flex flex-col items-center gap-4">
              <div className="w-64 h-64 rounded-lg flex items-center justify-center relative bg-gray-100 overflow-hidden">
                {isRecording && mediaRecorder && (
                  <AudioWaveform mediaRecorder={mediaRecorder} />
                )}
                <button
                  className="flex items-center justify-center w-24 h-24 z-10 bg-white rounded-full shadow-sm hover:bg-gray-50 transition-colors"
                  onClick={isRecording ? stopRecording : startRecording}
                >
                  {isRecording ? (
                    <Square className="w-12 h-12 text-red-500" />
                  ) : (
                    <Mic className="w-12 h-12" />
                  )}
                </button>
              </div>
              <p className="text-sm text-gray-500">
                {isRecording
                  ? 'Aufnahme läuft... Klicken Sie zum Beenden.'
                  : 'Klicken Sie zum Starten der Aufnahme'}
              </p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-4 w-full">
              {audioURL && (
                <div className="w-full">
                  <audio src={audioURL} controls className="w-full mb-4" />
                </div>
              )}

              <div className="flex flex-col gap-3 w-full">
                {isUploading ? (
                  <div className="flex items-center justify-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-md text-blue-600 w-full">
                    <RefreshCw className="w-5 h-5 animate-spin" />
                    <p className="text-sm">Aufnahme wird hochgeladen...</p>
                  </div>
                ) : isUploaded ? (
                  <div className="flex flex-col gap-3 w-full">
                    <div className="flex items-center justify-between w-full">
                      <Button
                        variant="outline"
                        onClick={handleNewRecording}
                        className="gap-2"
                      >
                        <Mic className="w-4 h-4" />
                        Neue Aufnahme erstellen
                      </Button>

                      <Button
                        onClick={handleProceedToNextStep}
                        className="gap-2"
                      >
                        Weiter
                        <ArrowRight className="w-4 h-4" />
                      </Button>
                    </div>
                    <p className="text-sm text-center text-green-600">
                      Aufnahme erfolgreich hochgeladen. Sie können fortfahren
                      oder eine neue Aufnahme erstellen.
                    </p>
                  </div>
                ) : (
                  <div className="flex items-center justify-between w-full">
                    <Button onClick={handleUpload} className="gap-2">
                      <RefreshCw className="w-4 h-4" />
                      Upload erneut versuchen
                    </Button>
                    <Button onClick={handleProceedToNextStep} className="gap-2">
                      Weiter ohne Upload
                      <ArrowRight className="w-4 h-4" />
                    </Button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
