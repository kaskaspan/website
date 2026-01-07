"use client";

import React, { useState, useEffect, useRef } from "react";
import { Play, Pause, Square, RotateCcw, ExternalLink, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default function WeChatTTSPage() {
  const [text, setText] = useState("");
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<string>("");
  const [rate, setRate] = useState(1);
  const [currentChunkIndex, setCurrentChunkIndex] = useState(0);
  const [utterance, setUtterance] = useState<SpeechSynthesisUtterance | null>(null);

  const [weChatUrl, setWeChatUrl] = useState("");

  const chunksRef = useRef<string[]>([]);

  useEffect(() => {
    const loadVoices = () => {
      const availableVoices = window.speechSynthesis.getVoices();
      setVoices(availableVoices);
      // Prefer zh-CN or similar
      const zhVoice = availableVoices.find((v) => v.lang.includes("zh") || v.lang.includes("CN"));
      if (zhVoice) {
        setSelectedVoice(zhVoice.name);
      } else if (availableVoices.length > 0) {
        setSelectedVoice(availableVoices[0].name);
      }
    };

    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;

    return () => {
      window.speechSynthesis.cancel();
    };
  }, []);

  const chunkText = (text: string) => {
    // Split by common Chinese and English punctuation
    return text.split(/([。！？；.?!;])/).reduce((acc, curr, i, arr) => {
      if (i % 2 === 0) {
        const next = arr[i + 1] || "";
        if (curr.trim() || next.trim()) {
           acc.push(curr + next);
        }
      }
      return acc;
    }, [] as string[]).filter(c => c.trim().length > 0);
  };

  const speakChunk = (index: number) => {
    if (index >= chunksRef.current.length) {
      setIsPlaying(false);
      setIsPaused(false);
      setCurrentChunkIndex(0);
      return;
    }

    const chunk = chunksRef.current[index];
    const u = new SpeechSynthesisUtterance(chunk);
    const voice = voices.find((v) => v.name === selectedVoice);
    if (voice) u.voice = voice;
    u.rate = rate;

    u.onend = () => {
      setCurrentChunkIndex(index + 1);
      if (isPlaying && !isPaused) { // Check state carefully
        speakChunk(index + 1);
      }
    };

    u.onerror = (e) => {
      console.error("TTS Error:", e);
      // Try next chunk on error
      setCurrentChunkIndex(index + 1);
      speakChunk(index + 1);
    };

    setUtterance(u);
    window.speechSynthesis.speak(u);
  };

  const handlePlay = () => {
    if (!text.trim()) return;

    if (isPaused) {
      window.speechSynthesis.resume();
      setIsPaused(false);
      setIsPlaying(true);
      return;
    }

    window.speechSynthesis.cancel();
    chunksRef.current = chunkText(text);
    if (chunksRef.current.length === 0) return;

    setIsPlaying(true);
    setIsPaused(false);
    setCurrentChunkIndex(0);
    speakChunk(0);
  };

  const handlePause = () => {
    window.speechSynthesis.pause();
    setIsPaused(true);
    setIsPlaying(false); // Visually paused
  };

  const handleResume = () => {
    if (isPaused) {
      window.speechSynthesis.resume();
      setIsPaused(false);
      setIsPlaying(true);
    } else {
        // treating resume as play if not paused
        handlePlay();
    }
  };

  const handleStop = () => {
    window.speechSynthesis.cancel();
    setIsPlaying(false);
    setIsPaused(false);
    setCurrentChunkIndex(0);
  };

  const handleOpenWeChatLink = () => {
    try {
      const url = new URL(weChatUrl);
      if (url.hostname === "mp.weixin.qq.com") {
        window.open(weChatUrl, "_blank", "noopener,noreferrer");
      } else {
        alert("Please enter a valid mp.weixin.qq.com URL");
      }
    } catch (e) {
      alert("Invalid URL format");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8 flex flex-col items-center">
      <div className="max-w-3xl w-full flex flex-col gap-6">
        
        <header className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-gray-900">WeChat Article Reader</h1>
          <p className="text-gray-500">Paste text to listen, or open WeChat articles directly.</p>
        </header>

        {/* Link Section */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Globe className="h-5 w-5 text-green-600" />
              WeChat Article Access
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-3">
               <Button 
                variant="outline" 
                className="w-full sm:w-auto text-green-700 border-green-200 hover:bg-green-50"
                asChild
              >
                <a href="https://mp.weixin.qq.com/" target="_blank" rel="noopener noreferrer">
                  Open WeChat Official Platform
                  <ExternalLink className="ml-2 h-4 w-4" />
                </a>
              </Button>
            </div>
            
            <div className="flex gap-2">
              <Input 
                placeholder="Paste mp.weixin.qq.com article link here..." 
                value={weChatUrl}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setWeChatUrl(e.target.value)}
                className="flex-1"
              />
              <Button onClick={handleOpenWeChatLink}>Open</Button>
            </div>
          </CardContent>
        </Card>

        {/* TTS Section */}
        <Card className="flex-1">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Text to Speech
              <span className="text-xs font-normal text-muted-foreground bg-gray-100 px-2 py-1 rounded-full">
                {voices.length} voices available
              </span>
            </CardTitle>
            <CardDescription>
              Paste your article content below.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <Textarea 
              placeholder="Paste article text here..." 
              className="min-h-[300px] text-lg leading-relaxed resize-y p-4"
              value={text}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setText(e.target.value)}
            />

            {/* Controls */}
            <div className="flex flex-col gap-4 bg-gray-50 p-4 rounded-lg border border-gray-100">
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                   <label className="text-sm font-medium text-gray-700">Voice</label>
                   <Select value={selectedVoice} onValueChange={setSelectedVoice}>
                    <SelectTrigger className="w-full bg-white">
                      <SelectValue placeholder="Select a voice" />
                    </SelectTrigger>
                    <SelectContent>
                      {voices.map((voice) => (
                        <SelectItem key={voice.name} value={voice.name}>
                          {voice.name} ({voice.lang})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    Speed: {rate}x
                  </label>
                  <Slider 
                    value={[rate]} 
                    min={0.5} 
                    max={2} 
                    step={0.1} 
                    onValueChange={(val: number[]) => setRate(val[0])}
                    className="py-4"
                  />
                </div>
              </div>

              <div className="flex flex-wrap gap-3 justify-center pt-2">
                {!isPlaying && !isPaused ? (
                  <Button size="lg" onClick={handlePlay} className="w-full sm:w-auto px-8 gap-2 bg-blue-600 hover:bg-blue-700">
                    <Play className="h-5 w-5" fill="currentColor" /> Play
                  </Button>
                ) : (
                  <>
                     {isPaused ? (
                        <Button size="lg" onClick={handleResume} className="w-full sm:w-auto px-8 gap-2 bg-blue-600 hover:bg-blue-700">
                           <Play className="h-5 w-5" fill="currentColor" /> Resume
                        </Button>
                     ) : (
                        <Button size="lg" onClick={handlePause} className="w-full sm:w-auto px-8 gap-2 bg-amber-500 hover:bg-amber-600">
                           <Pause className="h-5 w-5" fill="currentColor" /> Pause
                        </Button>
                     )}
                     <Button size="lg" variant="destructive" onClick={handleStop} className="w-full sm:w-auto px-8 gap-2">
                        <Square className="h-4 w-4" fill="currentColor" /> Stop
                     </Button>
                  </>
                )}
              </div>

            </div>
          </CardContent>
        </Card>

      </div>
    </div>
  );
}
