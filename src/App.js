import React, { useState, useRef } from 'react';

// === COLOQUE SUA CHAVE DA API AQUI ENTRE AS ASPAS ===
const apiKey = "AIzaSyC1dw2F08jNEfr6xWzQ-MICKIIu01ENgnA"; 
const MODEL_NAME = "gemini-1.5-flash"; // Versão estável para a Vercel

export default function App() {
  const [handle, setHandle] = useState('thebeststern');
  const [progress, setProgress] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [captions, setCaptions] = useState(null);
  const [history, setHistory] = useState([]);
  const [status, setStatus] = useState('');
  
  const fileInputRef = useRef(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  const captureFrame = () => {
    return new Promise((resolve) => {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (!video || !canvas) return resolve(null);
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
      resolve(dataUrl.split(',')[1]);
    });
  };

  const generateCaptions = async (base64Image) => {
    setIsProcessing(true);
    setProgress(10);
    setStatus('analisando visualmente...');
    const prompt = `Analise a imagem deste vídeo e gere uma legenda para redes sociais (Reels/TikTok). Use APENAS Português Brasileiro (pt-BR). Use palavras simples e diretas. ESTRUTURA OBRIGATÓRIA: 1. Primeira linha: Título curto minúsculo. 2. Pule uma linha. 3. 8 parágrafos curtos com linha em branco entre eles. 4. CTA: "Siga @${handle} pra acompanhar a jornada". 5. 5 hashtags.`;

    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${MODEL_NAME}:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }, { inlineData: { mimeType: "image/jpeg", data: base64Image } }] }]
        })
      });
      const result = await response.json();
      const text = result.candidates?.[0]?.content?.parts?.[0]?.text;
      setProgress(100);
      setCaptions(text);
      setHistory(prev => [{ id: Date.now(), text, date: new Date().toLocaleTimeString() }, ...prev]);
      setIsProcessing(false);
      setStatus('');
    } catch (error) {
      setIsProcessing(false);
      setStatus('Erro ao processar');
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const videoUrl = URL.createObjectURL(file);
    const video = videoRef.current;
    setIsProcessing(true);
    setStatus('carregando vídeo...');
    video.src = videoUrl;
    video.onloadedmetadata = () => video.currentTime = 1;
    video.onseeked = async () => {
      const frameBase64 = await captureFrame();
      if (frameBase64) generateCaptions(frameBase64);
    };
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#000', color: '#fff', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '40px 20px', fontFamily: 'sans-serif' }}>
      <video ref={videoRef} style={{ display: 'none' }} muted />
      <canvas ref={canvasRef} style={{ display: 'none' }} />
      
      <div style={{ width: '100%', maxWidth: '400px' }}>
        <div 
          onClick={() => !isProcessing && fileInputRef.current.click()}
          style={{ width: '100%', aspectRatio: '1/1', border: '1px solid #222', borderRadius: '40px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', backgroundColor: '#050505', cursor: 'pointer' }}
        >
          <input type="file" ref={fileInputRef} onChange={handleFileUpload} style={{ display: 'none' }} accept="video/*" />
          {!isProcessing ? (
            <div style={{ textAlign: 'center' }}>
              <div style={{ width: '60px', height: '60px', backgroundColor: '#2563eb', borderRadius: '50%', margin: '0 auto 15px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>+</div>
              <span style={{ fontSize: '10px', letterSpacing: '3px', color: '#666' }}>ANALISAR VÍDEO</span>
            </div>
          ) : <div style={{ color: '#2563eb' }}>Processando...</div>}
        </div>

        <input 
          type="text" 
          value={handle}
          onChange={(e) => setHandle(e.target.value)}
          style={{ width: '100%', marginTop: '20px', padding: '15px', backgroundColor: '#050505', border: '1px solid #222', color: '#fff', borderRadius: '15px', textAlign: 'center' }}
        />

        {captions && (
          <div style={{ marginTop: '30px', padding: '20px', backgroundColor: '#050505', border: '1px solid #222', borderRadius: '20px' }}>
            <pre style={{ whiteSpace: 'pre-wrap', fontSize: '14px', color: '#ccc' }}>{captions}</pre>
          </div>
        )}
      </div>
    </div>
  );
}
