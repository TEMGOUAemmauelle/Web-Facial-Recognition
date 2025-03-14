import React, { useEffect, useRef, useState } from 'react';
import * as faceapi from 'face-api.js';
import { Camera, Loader2 } from 'lucide-react';

function App() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isModelLoading, setIsModelLoading] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState<string[]>([]);
  const [isStreamActive, setIsStreamActive] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    console.log('Composant App rendu');
    const loadModels = async () => {
      const MODEL_URL = '/models';
      
      try {
        setError(null);
        setLoadingProgress([]);

        // Chargement séquentiel pour montrer la progression
        setLoadingProgress(prev => [...prev, "Détecteur de visage"]);
        await faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL);
        
        setLoadingProgress(prev => [...prev, "Points de repère"]);
        await faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL);
        
        setLoadingProgress(prev => [...prev, "Reconnaissance faciale"]);
        await faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL);
        
        setLoadingProgress(prev => [...prev, "Détection d'expressions"]);
        await faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL);
        
        setIsModelLoading(false);
      } catch (error) {
        console.error('Erreur lors du chargement des modèles:', error);
        setError('Impossible de charger les modèles de reconnaissance faciale. Veuillez vérifier votre connexion internet.');
      }
    };

    loadModels();
  }, []);

  const startVideo = async () => {
    try {
      setError(null);
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setIsStreamActive(true);
      }
    } catch (error) {
      console.error('Erreur d\'accès à la caméra:', error);
      setError('Impossible d\'accéder à la caméra. Veuillez vérifier les permissions.');
    }
  };

  const handlePlay = () => {
    if (!canvasRef.current || !videoRef.current) return;

    const canvas = canvasRef.current;
    const video = videoRef.current;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const detectFaces = async () => {
      if (!video || !canvas) return;

      const detections = await faceapi
        .detectAllFaces(video, new faceapi.TinyFaceDetectorOptions())
        .withFaceLandmarks()
        .withFaceExpressions();

      const context = canvas.getContext('2d');
      if (context) {
        context.clearRect(0, 0, canvas.width, canvas.height);
        faceapi.draw.drawDetections(canvas, detections);
        faceapi.draw.drawFaceLandmarks(canvas, detections);
        faceapi.draw.drawFaceExpressions(canvas, detections);
      }

      requestAnimationFrame(detectFaces);
    };

    detectFaces();
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-4">Reconnaissance Faciale</h1>
          <p className="text-gray-400">Détection en temps réel avec analyse des expressions</p>
        </div>

        <div className="relative w-full max-w-2xl mx-auto rounded-lg overflow-hidden bg-gray-800 shadow-xl">
          {error && (
            <div className="absolute top-0 left-0 right-0 bg-red-500 text-white p-4 text-center">
              {error}
            </div>
          )}
          
          {isModelLoading ? (
            <div className="flex items-center justify-center h-[480px] flex-col gap-4">
              <Loader2 className="w-12 h-12 animate-spin text-blue-500" />
              <p className="text-lg">Chargement des modèles de reconnaissance faciale...</p>
              <div className="flex flex-col gap-2 text-sm text-gray-400">
                <p>Cette opération peut prendre 10-30 secondes</p>
                {loadingProgress.map((step, index) => (
                  <p key={index} className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                    {step} chargé
                  </p>
                ))}
              </div>
            </div>
          ) : !isStreamActive ? (
            <div className="flex items-center justify-center h-[480px] flex-col gap-4">
              <Camera className="w-16 h-16 text-blue-500" />
              <button
                onClick={startVideo}
                className="px-6 py-3 bg-blue-500 hover:bg-blue-600 rounded-lg transition-colors flex items-center gap-2"
              >
                <Camera className="w-5 h-5" />
                Activer la caméra
              </button>
              <p className="text-sm text-gray-400">Cliquez pour démarrer la reconnaissance faciale</p>
            </div>
          ) : (
            <>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                onPlay={handlePlay}
                className="w-full"
              />
              <canvas
                ref={canvasRef}
                className="absolute top-0 left-0 w-full h-full"
              />
            </>
          )}
        </div>

        <div className="mt-8 text-center text-sm text-gray-400">
          <p>Cette application utilise face-api.js pour la détection faciale en temps réel.</p>
          <p>Les expressions faciales et les points de repère sont analysés automatiquement.</p>
        </div>
      </div>
    </div>
  );
}

export default App;