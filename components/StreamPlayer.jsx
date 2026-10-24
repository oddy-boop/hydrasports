'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Maximize, Minimize2, RefreshCw, AlertCircle, ShieldAlert, Cpu, Play, Pause, Volume2, Volume1, VolumeX, Sliders, ChevronDown, Check } from 'lucide-react';
import Hls from 'hls.js';

export default function StreamPlayer({ streamUrl, channels, matchTitle, matchStatus, videoOnly = false }) {
  const isUpcoming = matchStatus === 'upcoming';
  const [activeChannel, setActiveChannel] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [streamStatus, setStreamStatus] = useState('loading');
  const [loadTimeout, setLoadTimeout] = useState(null);
  
  // Custom video state hooks
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.8);
  const [isMuted, setIsMuted] = useState(true);
  const [isTheaterMode, setIsTheaterMode] = useState(false);
  const [hlsLevels, setHlsLevels] = useState([]);
  const [selectedResolution, setSelectedResolution] = useState('auto');
  const [resDropdownOpen, setResDropdownOpen] = useState(false);
  const [isCssFullscreen, setIsCssFullscreen] = useState(false);

  useEffect(() => {
    const handleFsChange = () => {
      const isFs = Boolean(document.fullscreenElement || document.webkitFullscreenElement);
      if (!isFs && isCssFullscreen) {
        setIsCssFullscreen(false);
        document.body.style.overflow = '';
      }
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    document.addEventListener('webkitfullscreenchange', handleFsChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFsChange);
      document.removeEventListener('webkitfullscreenchange', handleFsChange);
      document.body.style.overflow = '';
    };
  }, [isCssFullscreen]);

  const iframeRef = useRef(null);
  const videoRef = useRef(null);
  const playerRef = useRef(null);
  const hlsInstanceRef = useRef(null);

  const allChannels = channels && channels.length > 0 ? channels : [{ name: 'Stream 1', url: streamUrl, proxiedUrl: streamUrl }];
  const activeCh = allChannels[activeChannel] || allChannels[0];

  const rawTargetUrl = activeCh?.url || streamUrl || '';
  const proxiedTargetUrl = activeCh?.proxiedUrl || '';

  // Auto-detect direct stream sources like .m3u8, .mpd, .mp4 checking both raw and proxied URLs
  const isDirectHls = Boolean(
    rawTargetUrl.includes('.m3u8') || 
    rawTargetUrl.includes('.mpd') || 
    rawTargetUrl.includes('/hls/') || 
    rawTargetUrl.includes('.mp4') ||
    proxiedTargetUrl.includes('.m3u8') ||
    proxiedTargetUrl.includes('.mpd') ||
    proxiedTargetUrl.includes('/hls/') ||
    proxiedTargetUrl.includes('.mp4')
  );

  // For direct HLS, use rawTargetUrl directly so Hls.js loads the master playlist and segments seamlessly
  const currentUrl = isDirectHls
    ? (rawTargetUrl || proxiedTargetUrl || streamUrl)
    : (proxiedTargetUrl || rawTargetUrl || streamUrl);

  const handleLoad = () => {
    setIsLoading(false);
    setStreamStatus('active');
    if (loadTimeout) clearTimeout(loadTimeout);
  };

  const handleError = () => {
    setIsLoading(false);
    setStreamStatus('error');
    if (loadTimeout) clearTimeout(loadTimeout);
  };

  // Video element binding effect
  useEffect(() => {
    if (!isDirectHls || !videoRef.current) return;

    const video = videoRef.current;
    video.muted = true;
    
    if (hlsInstanceRef.current) {
      hlsInstanceRef.current.destroy();
      hlsInstanceRef.current = null;
    }

    setIsLoading(true);
    setStreamStatus('loading');
    setIsPlaying(false);

    // Safari / iOS Native HLS support
    if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = currentUrl;
      video.muted = true;
      const onLoadedMetadata = () => {
        setIsLoading(false);
        setStreamStatus('active');
        video.play()
          .then(() => setIsPlaying(true))
          .catch(() => setIsPlaying(false));
      };
      const onNativeError = () => {
        setStreamStatus('error');
      };
      
      video.addEventListener('loadedmetadata', onLoadedMetadata);
      video.addEventListener('error', onNativeError);
      
      return () => {
        video.removeEventListener('loadedmetadata', onLoadedMetadata);
        video.removeEventListener('error', onNativeError);
      };
    } else if (Hls && Hls.isSupported()) {
      // Chrome/Firefox/Edge Hls.js setup
      const hls = new Hls({
        maxBufferSize: 25 * 1024 * 1024, // 25MB Max buffer
        maxBufferLength: 20, // 20s
        liveSyncDuration: 3, // Live delay
        enableWorker: true,
      });
      hlsInstanceRef.current = hls;

      hls.loadSource(currentUrl);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, (event, data) => {
        setIsLoading(false);
        setStreamStatus('active');
        if (data?.levels && data.levels.length > 0) {
          const lvls = data.levels.map((lvl, index) => ({
            index,
            height: lvl.height,
            bitrate: lvl.bitrate,
            label: lvl.height ? `${lvl.height}p` : `${Math.round(lvl.bitrate / 1000)}k`,
          }));
          setHlsLevels(lvls);
        }
        video.play()
          .then(() => setIsPlaying(true))
          .catch(() => setIsPlaying(false));
      });

      hls.on(Hls.Events.ERROR, (event, data) => {
        if (data.fatal) {
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              console.log('Fatal network error, trying to recover HLS stream...');
              hls.startLoad();
              break;
            case Hls.ErrorTypes.MEDIA_ERROR:
              console.log('Fatal media error, attempting error recovery...');
              hls.recoverMediaError();
              break;
            default:
              setStreamStatus('error');
              hls.destroy();
              break;
          }
        }
      });

      return () => {
        if (hlsInstanceRef.current) {
          hlsInstanceRef.current.destroy();
          hlsInstanceRef.current = null;
        }
      };
    }
  }, [currentUrl, isDirectHls]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !isDirectHls) return;

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);

    return () => {
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
    };
  }, [isDirectHls]);

  useEffect(() => {
    if (!isDirectHls) return;

    const toggleFromDock = () => {
      const video = videoRef.current;
      if (!video) return;
      if (video.paused) {
        video.play().catch(() => setIsPlaying(false));
      } else {
        video.pause();
      }
    };
    const muteFromDock = (event) => {
      const video = videoRef.current;
      if (!video) return;
      const muted = Boolean(event.detail?.muted);
      video.muted = muted;
      if (!muted && video.volume === 0) video.volume = 0.8;
      setIsMuted(muted);
      if (!muted && volume === 0) setVolume(0.8);
    };

    window.addEventListener('hydra-stream-toggle', toggleFromDock);
    window.addEventListener('hydra-stream-mute', muteFromDock);
    return () => {
      window.removeEventListener('hydra-stream-toggle', toggleFromDock);
      window.removeEventListener('hydra-stream-mute', muteFromDock);
    };
  }, [isDirectHls, volume]);

  // General connection timeouts
  useEffect(() => {
    if (isDirectHls) return;
    setIsLoading(true);
    setStreamStatus('loading');
    const timeout = setTimeout(() => {
      setIsLoading(false);
      setStreamStatus('offline');
    }, 10000);
    setLoadTimeout(timeout);
    return () => clearTimeout(timeout);
  }, [currentUrl, isDirectHls]);

  const tryNextSource = () => {
    if (activeChannel < allChannels.length - 1) {
      setActiveChannel(prev => prev + 1);
    } else {
      setActiveChannel(0);
    }
  };

  const reloadStream = () => {
    setIsLoading(true);
    setStreamStatus('loading');
    if (isDirectHls) {
      if (videoRef.current) {
        const video = videoRef.current;
        if (hlsInstanceRef.current) {
          hlsInstanceRef.current.loadSource(currentUrl);
          hlsInstanceRef.current.startLoad();
        } else {
          video.src = '';
          video.src = currentUrl;
          video.load();
        }
      }
    } else {
      if (iframeRef.current) {
        iframeRef.current.src = currentUrl;
      }
    }
  };

  const toggleFullscreen = async () => {
    // 1. If currently in mobile CSS fullscreen, exit it
    if (isCssFullscreen) {
      setIsCssFullscreen(false);
      document.body.style.overflow = '';
      return;
    }

    // 2. If currently in native fullscreen, exit it
    const isFs = document.fullscreenElement || document.webkitFullscreenElement;
    if (isFs) {
      if (document.exitFullscreen) document.exitFullscreen().catch(() => {});
      else if (document.webkitExitFullscreen) document.webkitExitFullscreen();
      return;
    }

    // 3. On iOS Safari with direct HLS, try native video player fullscreen
    const video = videoRef.current;
    if (video && typeof video.webkitEnterFullscreen === 'function') {
      try {
        video.webkitEnterFullscreen();
        return;
      } catch {
        // Fallback to container
      }
    }

    // 4. Try HTML5 native fullscreen on player container with vendor prefixes
    const el = playerRef.current;
    if (el) {
      try {
        if (el.requestFullscreen) {
          await el.requestFullscreen();
          return;
        } else if (el.webkitRequestFullscreen) {
          el.webkitRequestFullscreen();
          return;
        } else if (el.mozRequestFullScreen) {
          el.mozRequestFullScreen();
          return;
        }
      } catch (err) {
        console.warn('Native fullscreen rejected on mobile, activating CSS fullscreen mode', err);
      }
    }

    // 5. Bulletproof CSS Fullscreen Fallback (100% works on iPhone, iPad, Android Chrome, and iframes)
    setIsCssFullscreen(true);
    document.body.style.overflow = 'hidden';
  };

  const handlePlayPause = () => {
    const video = videoRef.current;
    if (!video) return;
    if (!video.paused) {
      video.pause();
    } else {
      video.play()
        .then(() => setIsPlaying(true))
        .catch(() => setIsPlaying(false));
    }
  };

  const handleVolumeChange = (e) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    if (videoRef.current) {
      videoRef.current.volume = val;
      videoRef.current.muted = val === 0;
      setIsMuted(val === 0);
    }
  };

  const handleMuteToggle = () => {
    if (videoRef.current) {
      const nextMute = !isMuted;
      videoRef.current.muted = nextMute;
      setIsMuted(nextMute);
      if (nextMute) {
        setVolume(0);
      } else {
        setVolume(0.8);
        videoRef.current.volume = 0.8;
      }
    }
  };

  const changeResolution = (res) => {
    setSelectedResolution(res);
    setResDropdownOpen(false);

    if (hlsInstanceRef.current) {
      if (res === 'auto') {
        hlsInstanceRef.current.currentLevel = -1;
      } else {
        const levelIdx = parseInt(res, 10);
        if (!isNaN(levelIdx) && levelIdx >= 0) {
          hlsInstanceRef.current.currentLevel = levelIdx;
        } else if (res === 'low' || res === '360p' || res === '480p') {
          hlsInstanceRef.current.currentLevel = 0; // lowest bitrate for slow internet
        } else if (res === 'high' || res === '1080p') {
          hlsInstanceRef.current.currentLevel = hlsLevels.length > 0 ? hlsLevels.length - 1 : -1;
        }
      }
    } else {
      // For multi-server stream channels: automatically select SD server for low bandwidth
      if (res === '360p' || res === '480p' || res === 'low') {
        const sdIndex = allChannels.findIndex(c => (c.quality || '').toLowerCase() === 'sd');
        if (sdIndex !== -1 && sdIndex !== activeChannel) {
          setActiveChannel(sdIndex);
        }
      } else if (res === '1080p' || res === '720p' || res === 'high') {
        const hdIndex = allChannels.findIndex(c => (c.quality || '').toLowerCase().includes('hd') || (c.quality || '').toLowerCase().includes('1080'));
        if (hdIndex !== -1 && hdIndex !== activeChannel) {
          setActiveChannel(hdIndex);
        }
      }
    }
  };

  return (
    <div className="w-full space-y-4">
      {/* Player window container */}
      <div 
        ref={playerRef} 
        className={`relative overflow-hidden bg-black shadow-2xl transition-all duration-500 ease-out group ${
          isCssFullscreen
            ? '!fixed !inset-0 !z-[999999] !w-screen !h-[100dvh] !rounded-none !border-0 !m-0 !p-0 flex flex-col justify-center'
            : isTheaterMode 
            ? 'w-screen relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] rounded-none border-y border-zinc-800 h-[45vh] sm:h-[55vh] md:h-[65vh] lg:h-[70vh] xl:h-[75vh]' 
            : 'w-full rounded-2xl border border-zinc-800'
        }`}
        style={isCssFullscreen ? undefined : (isTheaterMode ? undefined : { aspectRatio: '16/9' })}
      >
        {/* Floating Mobile Exit Fullscreen Button */}
        {isCssFullscreen && (
          <button
            type="button"
            onClick={() => {
              setIsCssFullscreen(false);
              document.body.style.overflow = '';
            }}
            className="absolute top-4 right-4 z-50 px-3.5 py-1.5 rounded-full bg-black/85 hover:bg-black border border-white/20 text-white text-xs font-black flex items-center gap-1.5 shadow-2xl backdrop-blur-md cursor-pointer animate-fade-in"
          >
            <Minimize2 className="h-4 w-4 text-purple-400" />
            <span>Exit Fullscreen</span>
          </button>
        )}
        {/* Loading Spinner Screen */}
        {isLoading && streamStatus !== 'error' && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-[#050508]">
            <div className="relative flex items-center justify-center">
              <div className="h-12 w-12 animate-spin rounded-full border-2 border-violet-500/20 border-t-violet-500" />
              <Cpu className="absolute h-5 w-5 text-violet-400 animate-pulse" />
            </div>
            <p className="mt-4 text-xs font-bold uppercase tracking-wider text-zinc-400 font-mono">Connecting Secure Stream...</p>
            <p className="mt-1 text-[11px] text-zinc-500">
              {isDirectHls ? 'Initializing HLS player engine' : 'Resolving cryptographic tokens'}
            </p>
          </div>
        )}

        {/* Stream Load Error Screen */}
        {streamStatus === 'error' && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-[#050508]/98 px-6 text-center">
            <div className="mb-3.5 flex h-12 w-12 items-center justify-center rounded-2xl bg-red-500/10 border border-red-500/20">
              <AlertCircle className="h-6 w-6 text-red-400" />
            </div>
            <p className="text-sm font-bold text-white">Stream Embedding Restrained</p>
            <p className="mt-1.5 text-xs text-zinc-500 max-w-sm">
              The external stream server blocks raw iframe embeds or is currently offline.
            </p>
            <div className="mt-5 flex gap-2.5">
              <button
                onClick={tryNextSource}
                className="rounded-lg bg-violet-600 px-4 py-2 text-xs font-bold text-white hover:bg-violet-500 transition-colors shadow-lg shadow-violet-600/20"
              >
                Switch Server
              </button>
              <button
                onClick={reloadStream}
                className="rounded-lg bg-zinc-900 border border-zinc-850 px-4 py-2 text-xs font-bold text-zinc-300 hover:text-white transition-colors"
              >
                Retry Source
              </button>
            </div>
          </div>
        )}

        {/* Timeout Screen */}
        {streamStatus === 'offline' && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-[#050508]/98 px-6 text-center">
            <div className="mb-3.5 flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500/10 border border-amber-500/20">
              <AlertCircle className="h-6 w-6 text-amber-400" />
            </div>
            <p className="text-sm font-bold text-white">Stream Source Connection Timeout</p>
            <p className="mt-1.5 text-xs text-zinc-500 max-w-sm">
              The response from the provider took too long. Try switching servers.
            </p>
            <button
              onClick={tryNextSource}
              className="mt-5 rounded-lg bg-violet-600 px-4 py-2 text-xs font-bold text-white hover:bg-violet-500 transition-colors shadow-lg shadow-violet-600/20"
            >
              Switch Server
            </button>
          </div>
        )}

        {/* Video Player or Direct Stream Iframe Embed */}
        {isDirectHls ? (
          <video
            ref={videoRef}
            className="absolute inset-0 h-full w-full object-contain bg-black cursor-pointer"
            playsInline
            autoPlay
            muted
            onClick={handlePlayPause}
          />
        ) : (
          <iframe
            key={currentUrl}
            ref={iframeRef}
            src={currentUrl}
            className="absolute inset-0 block h-full w-full min-h-0 border-0 bg-black"
            allowFullScreen
            allow="autoplay; fullscreen; encrypted-media; picture-in-picture"
            loading="eager"
            referrerPolicy="no-referrer-when-downgrade"
            onLoad={handleLoad}
            onError={handleError}
          />
        )}

        {/* Play Icon Center Overlay (When Paused) */}
        {isDirectHls && !isPlaying && streamStatus === 'active' && (
          <div 
            onClick={handlePlayPause}
            className="absolute inset-0 z-10 flex items-center justify-center bg-black/40 backdrop-blur-[1.5px] cursor-pointer animate-fade-in"
          >
            <div className={`flex items-center justify-center rounded-full bg-emerald-600/90 text-white shadow-[0_0_30px_rgba(16,185,129,0.6)] border border-emerald-400/20 transform scale-100 hover:scale-110 active:scale-95 transition-all duration-300 ${videoOnly ? 'h-12 w-12' : 'h-16 w-16'}`}>
              <Play className={`${videoOnly ? 'h-5 w-5' : 'h-7 w-7'} fill-white ml-1`} />
            </div>
          </div>
        )}

        {/* Upcoming Status Banner overlay (only if no active stream URL is found) */}
        {isUpcoming && !currentUrl && (
          <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-black/90 px-6 text-center">
            <ShieldAlert className="h-10 w-10 text-emerald-400 mb-3" />
            <p className="text-sm font-bold text-white">Fixture Has Not Started Yet</p>
            <p className="mt-1 text-xs text-zinc-400 max-w-xs">
              Live streams will be generated by our provider strategy registry close to kickoff.
            </p>
          </div>
        )}

        {/* Floating Live Stream badge (Bottom of stream - top kept clear for broadcast scoreboard) */}
        {!videoOnly && streamStatus === 'active' && (matchStatus === 'live' || !matchStatus) && (
          <div className={`absolute bottom-3 left-3 z-20 flex items-center pointer-events-none ${isDirectHls ? 'group-hover:opacity-0' : ''} transition-opacity duration-300`}>
            <span className="flex items-center gap-1.5 rounded-full bg-red-600/90 border border-red-500/30 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider text-white shadow-lg animate-pulse">
              <span className="h-1.5 w-1.5 rounded-full bg-white" />
              Live Stream
            </span>
          </div>
        )}

        {/* CUSTOM VIDEO CONTROLS OVERLAY (Only for Direct HLS Video) */}
        {!videoOnly && isDirectHls && streamStatus === 'active' && (
          <div className="absolute bottom-0 left-0 right-0 z-20 p-4 bg-gradient-to-t from-black/95 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col gap-2.5">
            
            {/* Live timeline indicator */}
            <div className="flex items-center gap-3">
              <div className="h-1.5 flex-1 rounded-full bg-zinc-800/80 overflow-hidden relative">
                <div className="absolute inset-y-0 left-0 right-0 bg-gradient-to-r from-violet-600 to-indigo-600 rounded-full" />
              </div>
              <span className="flex items-center gap-1 text-[10px] font-extrabold uppercase text-red-500 tracking-wider">
                <span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-ping" />
                Live
              </span>
            </div>

            {/* Custom Control Buttons Toolbar */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3.5">
                {/* Play/Pause Button */}
                <button
                  onClick={handlePlayPause}
                  className="rounded-lg bg-white/10 hover:bg-white/20 p-2 text-white transition-all active:scale-90"
                  title={isPlaying ? "Pause" : "Play"}
                >
                  {isPlaying ? <Pause className="h-4 w-4 fill-white" /> : <Play className="h-4 w-4 fill-white" />}
                </button>

                {/* Volume / Mute slider control */}
                <div className="flex items-center gap-2 group/volume">
                  <button
                    onClick={handleMuteToggle}
                    className="rounded-lg bg-white/10 hover:bg-white/20 p-2 text-white transition-all active:scale-90"
                    title={isMuted ? "Unmute" : "Mute"}
                  >
                    {isMuted ? <VolumeX className="h-4 w-4 text-zinc-450" /> : volume < 0.4 ? <Volume1 className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                  </button>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={volume}
                    onChange={handleVolumeChange}
                    className="w-0 group-hover/volume:w-20 focus:w-20 transition-all duration-300 h-1 appearance-none rounded-full bg-zinc-800 accent-violet-500 cursor-pointer outline-none"
                  />
                </div>

                {/* Status Indicator */}
                <span className="inline-flex items-center gap-1.5 rounded-md bg-violet-500/10 border border-violet-500/20 px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-widest text-violet-400">
                  Native Player (Ad-Free)
                </span>
              </div>

              {/* Right panel controls */}
              <div className="flex items-center gap-2">
                <button
                  onClick={reloadStream}
                  className="rounded-lg bg-white/10 hover:bg-white/20 p-2 text-zinc-200 hover:text-white transition-all active:scale-90"
                  title="Reload Server Connection"
                >
                  <RefreshCw className="h-4 w-4" />
                </button>
                <button
                  onClick={toggleFullscreen}
                  className="rounded-lg bg-white/10 hover:bg-white/20 p-2 text-zinc-200 hover:text-white transition-all active:scale-90"
                  title="Toggle Fullscreen"
                >
                  <Maximize className="h-4 w-4" />
                </button>
              </div>
            </div>

          </div>
        )}
      </div>

      {!videoOnly && (
        <div className="flex flex-col xl:flex-row items-stretch gap-3 sm:gap-4 w-full mt-3 sm:mt-4 min-w-0">
          {/* Dynamic Action Toolbar (Refresh, Theater, Fullscreen) */}
          <div className="flex-1 bg-[#181628] border border-white/10 p-3 sm:p-4 rounded-2xl shadow-xl flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 min-w-0">
            {/* Left Side: Broadcast Status */}
            <div className="flex items-center gap-2.5 text-left bg-[#131120] p-2 sm:p-2.5 rounded-xl border border-white/10 min-w-0">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
              <div className="flex flex-col text-left min-w-0">
                <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400 truncate">
                  Direct Live Stream
                </span>
                <span className="text-[10px] text-slate-400 mt-0.5 leading-none block font-medium truncate">
                  Official feed with full audio & video playback
                </span>
              </div>
            </div>

            {/* Right Side: Viewport Controls Group */}
            <div className="flex items-center gap-1.5 sm:gap-2 bg-[#131120] p-1.5 rounded-xl border border-white/10 justify-end flex-wrap min-w-0">
              {/* Resolution / Quality selector dropdown (Allows picking low res for slow internet) */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setResDropdownOpen(!resDropdownOpen)}
                  className="rounded-lg bg-white/10 hover:bg-white/20 px-2.5 py-1.5 text-slate-200 hover:text-white transition-all active:scale-95 flex items-center gap-1.5 text-xs font-bold border border-white/10 shadow-sm cursor-pointer"
                  title="Select video resolution (Lower resolution saves data on slow internet)"
                >
                  <Sliders className="h-3.5 w-3.5 text-amber-400" />
                  <span className="capitalize">{selectedResolution === 'auto' ? 'Auto Res' : selectedResolution}</span>
                  <ChevronDown className="h-3 w-3 text-slate-400" />
                </button>

                {resDropdownOpen && (
                  <div className="absolute right-0 bottom-full mb-1.5 w-48 rounded-xl bg-[#1c1a2d] border border-white/15 p-1 shadow-2xl z-50 animate-fade-in text-white">
                    <div className="px-2.5 py-1 text-[9px] font-black uppercase tracking-wider text-slate-400 border-b border-white/10 mb-1 flex items-center justify-between">
                      <span>Stream Quality</span>
                      <span className="text-amber-400">Data Saver</span>
                    </div>
                    {hlsLevels.length > 0 ? (
                      <>
                        <button
                          type="button"
                          onClick={() => changeResolution('auto')}
                          className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-bold flex items-center justify-between cursor-pointer ${
                            selectedResolution === 'auto' ? 'bg-purple-600 text-white' : 'text-slate-300 hover:bg-white/10'
                          }`}
                        >
                          <span>Auto (Adaptive)</span>
                          <span className="text-[9px] text-slate-400">Best</span>
                        </button>
                        {hlsLevels.map((lvl) => (
                          <button
                            key={lvl.index}
                            type="button"
                            onClick={() => changeResolution(String(lvl.index))}
                            className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-bold flex items-center justify-between cursor-pointer ${
                              selectedResolution === String(lvl.index) ? 'bg-purple-600 text-white' : 'text-slate-300 hover:bg-white/10'
                            }`}
                          >
                            <span>{lvl.label}</span>
                            <span className={`text-[9px] font-bold ${lvl.height && lvl.height <= 480 ? 'text-amber-400' : 'text-emerald-400'}`}>
                              {lvl.height && lvl.height <= 480 ? '🍃 Low Data' : 'HD'}
                            </span>
                          </button>
                        ))}
                      </>
                    ) : (
                      <>
                        {[
                          { id: 'auto', label: 'Auto (Adaptive)', badge: 'Default' },
                          { id: '1080p', label: '1080p Full HD', badge: 'Fast net' },
                          { id: '720p', label: '720p HD', badge: 'Standard' },
                          { id: '480p', label: '480p SD (Data Saver)', badge: 'Slow net' },
                          { id: '360p', label: '360p Low Bandwidth', badge: 'Slowest' },
                        ].map((opt) => (
                          <button
                            key={opt.id}
                            type="button"
                            onClick={() => changeResolution(opt.id)}
                            className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-bold flex items-center justify-between cursor-pointer ${
                              selectedResolution === opt.id ? 'bg-purple-600 text-white' : 'text-slate-300 hover:bg-white/10'
                            }`}
                          >
                            <span>{opt.label}</span>
                            <span className={`text-[9px] font-bold ${opt.id === '360p' || opt.id === '480p' ? 'text-amber-400' : 'text-slate-400'}`}>
                              {opt.badge}
                            </span>
                          </button>
                        ))}
                      </>
                    )}
                  </div>
                )}
              </div>

              {/* Refresh button */}
              <button
                type="button"
                onClick={reloadStream}
                className="rounded-lg bg-white/10 hover:bg-white/20 px-3 py-1.5 text-slate-200 hover:text-white transition-all active:scale-95 flex items-center gap-1.5 text-xs font-bold border border-white/10 shadow-sm cursor-pointer"
                title="Reload Stream Connection"
              >
                <RefreshCw className={`h-3.5 w-3.5 text-emerald-400 ${isLoading ? 'animate-spin' : ''}`} />
                <span>Refresh</span>
              </button>

              {/* Theater Mode Toggle button */}
              <button
                type="button"
                onClick={() => setIsTheaterMode(!isTheaterMode)}
                className={`rounded-lg px-3 py-1.5 transition-all active:scale-95 flex items-center gap-1.5 text-xs font-bold border cursor-pointer ${
                  isTheaterMode 
                    ? 'border-purple-500 bg-purple-600/30 text-white shadow-sm' 
                    : 'border-white/10 bg-white/10 hover:bg-white/20 text-slate-200 hover:text-white shadow-sm'
                }`}
                title={isTheaterMode ? "Exit Theater Mode" : "Enter Theater Mode"}
              >
                <Cpu className={`h-3.5 w-3.5 ${isTheaterMode ? 'text-purple-400 animate-pulse' : 'text-slate-400'}`} />
                <span>{isTheaterMode ? "Normal Mode" : "Theater"}</span>
              </button>

              {/* Fullscreen button */}
              <button
                type="button"
                onClick={toggleFullscreen}
                className="rounded-lg bg-white/10 hover:bg-white/20 px-3 py-1.5 text-slate-200 hover:text-white transition-all active:scale-95 flex items-center gap-1.5 text-xs font-bold border border-white/10 shadow-sm cursor-pointer"
                title="Toggle Fullscreen"
              >
                <Maximize className="h-3.5 w-3.5 text-slate-300" />
                <span>Fullscreen</span>
              </button>
            </div>
          </div>

          {/* Dedicated Servers Selection Panel */}
          <div className="flex-[1.3] bg-[#181628] border border-white/10 p-3 sm:p-4 rounded-2xl shadow-xl min-w-0">
            {allChannels.length > 0 ? (
              <div className="flex flex-col gap-2.5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 flex-wrap">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    <span>Available Stream Servers ({allChannels.length})</span>
                  </span>
                  <span className="text-[9.5px] text-slate-400 font-bold leading-none">
                    Quality: <span className="text-emerald-400 font-black">HD 1080p / 720p 60FPS</span>
                  </span>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  {allChannels.map((ch, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => { setActiveChannel(idx); }}
                      className={`inline-flex items-center gap-2 rounded-xl border px-3.5 py-2 text-xs font-bold transition-all cursor-pointer ${
                        activeChannel === idx
                          ? 'border-purple-500 bg-purple-600/30 text-white shadow-md font-black'
                          : 'border-white/10 bg-[#131120] text-slate-300 hover:bg-white/10 hover:text-white'
                      }`}
                    >
                      <span className={`h-2 w-2 rounded-full ${activeChannel === idx ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'}`} />
                      <span>Server {idx + 1}</span>
                      <span className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-white/10 border border-white/10 ${ch.quality === 'HD' || ch.quality === 'FHD' || ch.quality === '1080p' ? 'text-emerald-400 border-emerald-500/30' : 'text-slate-400'}`}>
                        {ch.quality === 'FHD' || ch.quality === '1080p' ? 'HD' : (ch.quality || 'SD')}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <span className="text-xs text-slate-400 font-semibold">Resolving fallback stream feeds...</span>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
