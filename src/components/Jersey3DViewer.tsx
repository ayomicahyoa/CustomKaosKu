import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import type { JerseyCustomization } from '../types';
import {
  RotateCw,
  Eye,
  EyeOff,
  Layers,
  Download,
  Sparkles,
  RefreshCw,
} from 'lucide-react';
import { ensureJerseyFontLoaded } from '../data/jerseyFonts';

interface Jersey3DViewerProps {
  jerseyConfig: JerseyCustomization;
  onChangeJerseyConfig?: (cfg: JerseyCustomization) => void;
  onSnapshotReady?: (snapshotDataUrl: string) => void;
}

export const Jersey3DViewer: React.FC<Jersey3DViewerProps> = ({
  jerseyConfig,
  onChangeJerseyConfig,
  onSnapshotReady,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const textureCanvasRef = useRef<HTMLCanvasElement>(null);
  const patternCanvasRef = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const meshRef = useRef<THREE.Mesh | null>(null);
  const textureRef = useRef<THREE.CanvasTexture | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [loadProgress, setLoadProgress] = useState(0);
  const [isAutoRotate, setIsAutoRotate] = useState(false);
  const [viewMode, setViewMode] = useState<'2d-pattern' | '3d'>('2d-pattern');
  const [activeDragId, setActiveDragId] = useState<string | null>(null);
  const [imageVersion, setImageVersion] = useState(0);
  const [showOutline, setShowOutline] = useState(true);
  const [outlineColor, setOutlineColor] = useState('#ffffff');
  const [outlineThickness, setOutlineThickness] = useState<number>(2);
  const [activeCameraView, setActiveCameraView] = useState<'front' | 'back' | 'left' | 'right' | 'custom'>('front');

  const onSnapshotReadyRef = useRef(onSnapshotReady);
  useEffect(() => {
    onSnapshotReadyRef.current = onSnapshotReady;
  }, [onSnapshotReady]);

  // Cache loaded custom image elements
  const customImgCacheRef = useRef<Map<string, HTMLImageElement>>(new Map());

  // Pre-load mask images & clean outline
  const masksRef = useRef<{
    front: HTMLImageElement | null;
    back: HTMLImageElement | null;
    left_sleeve: HTMLImageElement | null;
    right_sleeve: HTMLImageElement | null;
    collar: HTMLImageElement | null;
    outline: HTMLImageElement | null;
  }>({
    front: null,
    back: null,
    left_sleeve: null,
    right_sleeve: null,
    collar: null,
    outline: null,
  });
  const [masksReady, setMasksReady] = useState(false);

  useEffect(() => {
    const baseUrl = import.meta.env.BASE_URL;
    const cacheKey = '?v=cdr_sewing_l_v1';
    const names = [
      { key: 'front', url: `${baseUrl}mockups/mask_front.png${cacheKey}` },
      { key: 'back', url: `${baseUrl}mockups/mask_back.png${cacheKey}` },
      { key: 'left_sleeve', url: `${baseUrl}mockups/mask_left_sleeve.png${cacheKey}` },
      { key: 'right_sleeve', url: `${baseUrl}mockups/mask_right_sleeve.png${cacheKey}` },
      { key: 'collar', url: `${baseUrl}mockups/mask_collar.png${cacheKey}` },
      { key: 'outline', url: `${baseUrl}mockups/jersey_clean_pattern_outline.png${cacheKey}` },
    ] as const;

    let loadedCount = 0;
    names.forEach(({ key, url }) => {
      const img = new Image();
      img.src = url;
      img.onload = () => {
        masksRef.current[key] = img;
        loadedCount++;
        if (loadedCount === names.length) {
          setMasksReady(true);
        }
      };
    });
  }, []);

  const showPlayerName = Boolean(jerseyConfig.showPlayerName);
  const showPlayerNumber = Boolean(jerseyConfig.showPlayerNumber);

  // Draw the dynamic 2048x2048 UV texture
  const renderTextureToCanvas = useCallback(() => {
    const canvas = textureCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const W = canvas.width;
    const H = canvas.height;

    // Dark cutting workbench background
    ctx.fillStyle = '#0b1120';
    ctx.fillRect(0, 0, W, H);

    const partColors = jerseyConfig.partColors || {
      frontBody: jerseyConfig.primaryColor,
      backBody: jerseyConfig.primaryColor,
      leftSleeve: jerseyConfig.primaryColor,
      rightSleeve: jerseyConfig.primaryColor,
      collar: jerseyConfig.collarColor || jerseyConfig.accentColor,
    };

    // Helper: draw within a rectangular bleed box (lebihan cetak & potong)
    const drawBleedBox = (
      bx: number,
      by: number,
      bw: number,
      bh: number,
      drawContent: (pCtx: CanvasRenderingContext2D) => void
    ) => {
      ctx.save();
      ctx.beginPath();
      ctx.rect(bx, by, bw, bh);
      ctx.clip();
      drawContent(ctx);
      ctx.restore();
    };

    const drawPattern = (pCtx: CanvasRenderingContext2D, secColor: string) => {
      if (jerseyConfig.pattern === 'stripes') {
        pCtx.fillStyle = secColor;
        const stripeW = 42;
        for (let x = 0; x < W; x += stripeW * 2) {
          pCtx.fillRect(x, 0, stripeW, H);
        }
      } else if (jerseyConfig.pattern === 'geometric') {
        pCtx.fillStyle = secColor;
        pCtx.strokeStyle = jerseyConfig.accentColor;
        pCtx.lineWidth = 3;
        const hexR = 40;
        const hh = hexR * Math.sqrt(3);
        for (let y = 0; y < H + hh; y += hh) {
          for (let x = 0; x < W + hexR * 3; x += hexR * 3) {
            pCtx.beginPath();
            for (let i = 0; i < 6; i++) {
              const angle = (Math.PI / 3) * i;
              const hx = x + hexR * Math.cos(angle);
              const hy = y + hexR * Math.sin(angle);
              if (i === 0) pCtx.moveTo(hx, hy);
              else pCtx.lineTo(hx, hy);
            }
            pCtx.closePath();
            pCtx.globalAlpha = 0.25;
            pCtx.fill();
            pCtx.globalAlpha = 0.5;
            pCtx.stroke();
            pCtx.globalAlpha = 1.0;
          }
        }
      } else if (jerseyConfig.pattern === 'diagonal') {
        pCtx.fillStyle = secColor;
        pCtx.save();
        pCtx.translate(W / 2, H / 2);
        pCtx.rotate((-25 * Math.PI) / 180);
        const bandW = 60;
        for (let x = -W; x < W; x += bandW * 2) {
          pCtx.fillRect(x, -H, bandW, H * 2);
        }
        pCtx.restore();
      } else if (jerseyConfig.pattern === 'camo') {
        pCtx.fillStyle = secColor;
        for (let i = 0; i < 35; i++) {
          const cx = (i * 77) % W;
          const cy = (i * 93) % H;
          pCtx.beginPath();
          pCtx.ellipse(cx, cy, 60, 35, i * 0.4, 0, Math.PI * 2);
          pCtx.fill();
        }
      }
    };

    // 1. Badan Depan (Front Body Box: 0, 0, 1024, 1375 - melebihi garis pola)
    drawBleedBox(0, 0, 1024, 1375, (pCtx) => {
      pCtx.fillStyle = partColors.frontBody;
      pCtx.fillRect(0, 0, 1024, 1375);
      drawPattern(pCtx, jerseyConfig.secondaryColor);
    });

    // 2. Badan Belakang (Back Body Box: 1024, 0, 1024, 1375 - melebihi garis pola)
    drawBleedBox(1024, 0, 1024, 1375, (pCtx) => {
      pCtx.fillStyle = partColors.backBody;
      pCtx.fillRect(1024, 0, 1024, 1375);
      drawPattern(pCtx, jerseyConfig.secondaryColor);

      // Nama Punggung (Hanya jika diaktifkan dan ada isinya)
      if (showPlayerName && jerseyConfig.playerName) {
        const npPos = jerseyConfig.playerNamePos || { x: 75.0, y: 16.5, scale: 1 };
        const nx = (npPos.x / 100) * W;
        const ny = (npPos.y / 100) * H;
        const nFont = Math.round(90 * (npPos.scale || 1));

        pCtx.save();
        pCtx.textAlign = 'center';
        pCtx.textBaseline = 'middle';
        pCtx.font = `bold ${nFont}px ${jerseyConfig.fontFamily || 'Impact, sans-serif'}`;
        pCtx.fillStyle = jerseyConfig.numberColor || '#ffffff';
        if (jerseyConfig.numberStrokeColor) {
          pCtx.strokeStyle = jerseyConfig.numberStrokeColor;
          pCtx.lineWidth = Math.max(3, Math.round(8 * (npPos.scale || 1)));
          pCtx.strokeText(jerseyConfig.playerName.toUpperCase(), nx, ny);
        }
        pCtx.fillText(jerseyConfig.playerName.toUpperCase(), nx, ny);
        pCtx.restore();
      }

      // Nomor Punggung (Hanya jika diaktifkan dan ada isinya)
      if (showPlayerNumber && jerseyConfig.playerNumber) {
        const numPos = jerseyConfig.playerNumberPos || { x: 75.0, y: 29.5, scale: 1 };
        const numX = (numPos.x / 100) * W;
        const numY = (numPos.y / 100) * H;
        const numFont = Math.round(310 * (numPos.scale || 1));

        pCtx.save();
        pCtx.textAlign = 'center';
        pCtx.textBaseline = 'middle';
        pCtx.font = `900 ${numFont}px ${jerseyConfig.fontFamily || 'Impact, sans-serif'}`;
        pCtx.fillStyle = jerseyConfig.numberColor || '#ffffff';
        if (jerseyConfig.numberStrokeColor) {
          pCtx.strokeStyle = jerseyConfig.numberStrokeColor;
          pCtx.lineWidth = Math.max(6, Math.round(20 * (numPos.scale || 1)));
          pCtx.strokeText(jerseyConfig.playerNumber, numX, numY);
        }
        pCtx.fillText(jerseyConfig.playerNumber, numX, numY);
        pCtx.restore();
      }
    });

    // 3. Lengan Kiri (Left Sleeve Box: 0, 1375, 795, 545 - melebihi garis pola)
    drawBleedBox(0, 1375, 795, 545, (pCtx) => {
      pCtx.fillStyle = partColors.leftSleeve;
      pCtx.fillRect(0, 1375, 795, 545);
      drawPattern(pCtx, jerseyConfig.secondaryColor);
    });

    // 4. Lengan Kanan (Right Sleeve Box: 795, 1375, 1253, 545 - melebihi garis pola)
    drawBleedBox(795, 1375, 1253, 545, (pCtx) => {
      pCtx.fillStyle = partColors.rightSleeve;
      pCtx.fillRect(795, 1375, 1253, 545);
      drawPattern(pCtx, jerseyConfig.secondaryColor);
    });

    // 5. Kerah / Rib (Collar Band Box: 0, 1920, 2048, 128 - melebihi garis pola)
    drawBleedBox(0, 1920, 2048, 128, (pCtx) => {
      pCtx.fillStyle = partColors.collar || jerseyConfig.accentColor;
      pCtx.fillRect(0, 1920, 2048, 128);
    });

    // 6. Elemen Kustom Tambahan (Gambar/Logo & Teks Bebas yang Ditambahkan User)
    if (jerseyConfig.customElements && jerseyConfig.customElements.length > 0) {
      jerseyConfig.customElements.forEach((el) => {
        const ex = (el.x / 100) * W;
        const ey = (el.y / 100) * H;
        const scale = el.scale || 1;

        if (el.type === 'image' && el.imageUrl) {
          let img = customImgCacheRef.current.get(el.imageUrl);
          if (!img) {
            img = new Image();
            img.src = el.imageUrl;
            img.onload = () => {
              customImgCacheRef.current.set(el.imageUrl!, img!);
              setImageVersion((v) => v + 1);
            };
            customImgCacheRef.current.set(el.imageUrl, img);
          }

          if (img && img.complete && img.naturalWidth > 0) {
            ctx.save();
            ctx.translate(ex, ey);
            if (el.rotation) ctx.rotate((el.rotation * Math.PI) / 180);

            const baseW = 280 * scale;
            const aspect = img.naturalHeight / img.naturalWidth;
            const baseH = baseW * aspect;

            ctx.drawImage(img, -baseW / 2, -baseH / 2, baseW, baseH);
            ctx.restore();
          }
        } else if (el.type === 'text' && el.text) {
          ctx.save();
          ctx.translate(ex, ey);
          if (el.rotation) ctx.rotate((el.rotation * Math.PI) / 180);

          const fontSize = Math.round(64 * scale);
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.font = `bold ${fontSize}px ${el.fontFamily || jerseyConfig.fontFamily || 'Impact, sans-serif'}`;

          if (el.strokeColor) {
            ctx.strokeStyle = el.strokeColor;
            ctx.lineWidth = Math.max(3, Math.round(8 * scale));
            ctx.strokeText(el.text, 0, 0);
          }
          ctx.fillStyle = el.color || '#ffffff';
          ctx.fillText(el.text, 0, 0);
          ctx.restore();
        }
      });
    }

    // Refresh Three.js material texture
    if (textureRef.current) {
      textureRef.current.needsUpdate = true;
    }
  }, [jerseyConfig, showPlayerName, showPlayerNumber]);

  // Synchronize 2D pattern display canvas
  const drawPatternPreview = useCallback(() => {
    const pCanvas = patternCanvasRef.current;
    const tCanvas = textureCanvasRef.current;
    if (!pCanvas || !tCanvas) return;
    const pCtx = pCanvas.getContext('2d');
    if (!pCtx) return;

    pCtx.clearRect(0, 0, pCanvas.width, pCanvas.height);
    // Layer 1: Base fabric & graphics
    pCtx.drawImage(tCanvas, 0, 0, pCanvas.width, pCanvas.height);

    // Layer 2: Cutting pattern outline tinted with user-chosen color & thickness
    if (showOutline && masksRef.current.outline) {
      const outlineImg = masksRef.current.outline;
      const offCanvas = document.createElement('canvas');
      offCanvas.width = pCanvas.width;
      offCanvas.height = pCanvas.height;
      const oCtx = offCanvas.getContext('2d');
      if (oCtx) {
        oCtx.drawImage(outlineImg, 0, 0, pCanvas.width, pCanvas.height);
        oCtx.globalCompositeOperation = 'source-in';
        oCtx.fillStyle = outlineColor;
        oCtx.fillRect(0, 0, offCanvas.width, offCanvas.height);

        // Draw onto master preview canvas with thickness multiplier
        if (outlineThickness > 1) {
          const offsets: [number, number][] = [
            [0, 0],
            [-1, 0], [1, 0], [0, -1], [0, 1],
          ];
          if (outlineThickness >= 2) {
            offsets.push([-1, -1], [1, 1], [-1, 1], [1, -1]);
          }
          if (outlineThickness >= 3) {
            offsets.push([-2, 0], [2, 0], [0, -2], [0, 2]);
          }
          offsets.forEach(([dx, dy]) => {
            pCtx.drawImage(offCanvas, dx, dy);
          });
        } else {
          pCtx.drawImage(offCanvas, 0, 0);
        }
      }
    }

    const W = pCanvas.width;
    const H = pCanvas.height;

    // Collect all active interactive elements
    const interactiveElements: { id: string; x: number; y: number; scale: number; label: string }[] = [];

    if (showPlayerName && jerseyConfig.playerName) {
      const pos = jerseyConfig.playerNamePos || { x: 75.0, y: 16.5, scale: 1 };
      interactiveElements.push({
        id: 'name',
        x: pos.x,
        y: pos.y,
        scale: pos.scale || 1,
        label: 'Nama',
      });
    }

    if (showPlayerNumber && jerseyConfig.playerNumber) {
      const pos = jerseyConfig.playerNumberPos || { x: 75.0, y: 29.5, scale: 1 };
      interactiveElements.push({
        id: 'number',
        x: pos.x,
        y: pos.y,
        scale: pos.scale || 1,
        label: 'Nomor',
      });
    }

    if (jerseyConfig.customElements) {
      jerseyConfig.customElements.forEach((el) => {
        interactiveElements.push({
          id: el.id,
          x: el.x,
          y: el.y,
          scale: el.scale || 1,
          label: el.name || 'Elemen',
        });
      });
    }

    // Layer 3: Draw interactive dashed rings
    interactiveElements.forEach((el) => {
      const ex = (el.x / 100) * W;
      const ey = (el.y / 100) * H;
      const isActive = activeDragId === el.id;

      pCtx.save();
      pCtx.strokeStyle = isActive ? '#0284c7' : 'rgba(14, 165, 233, 0.7)';
      pCtx.lineWidth = isActive ? 3 : 1.5;
      pCtx.setLineDash([4, 4]);
      pCtx.beginPath();
      pCtx.arc(ex, ey, Math.max(20, 24 * el.scale), 0, Math.PI * 2);
      pCtx.stroke();

      if (isActive) {
        pCtx.fillStyle = '#0284c7';
        pCtx.beginPath();
        pCtx.arc(ex, ey, 4, 0, Math.PI * 2);
        pCtx.fill();
      }
      pCtx.restore();
    });
  }, [jerseyConfig, activeDragId, showPlayerName, showPlayerNumber, showOutline, outlineColor, outlineThickness]);

  // Three.js Scene Setup (using shirt_baked.glb natively)
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.background = new THREE.Color('#f8fafc');

    const width = container.clientWidth || 500;
    const height = container.clientHeight || 550;
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 0, 0.85);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;
    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = '100%';
    renderer.domElement.style.display = 'block';
    container.innerHTML = '';
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.minDistance = 0.45;
    controls.maxDistance = 1.6;
    controls.autoRotate = false;
    controls.autoRotateSpeed = 2.0;
    controls.addEventListener('start', () => setActiveCameraView('custom'));
    controlsRef.current = controls;

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.2);
    scene.add(ambientLight);

    const dirFront = new THREE.DirectionalLight(0xffffff, 1.4);
    dirFront.position.set(0, 1, 2);
    scene.add(dirFront);

    const dirBack = new THREE.DirectionalLight(0xffffff, 1.1);
    dirBack.position.set(0, 1, -2);
    scene.add(dirBack);

    const dirLeft = new THREE.DirectionalLight(0xffffff, 0.6);
    dirLeft.position.set(-2, 0.5, 0);
    scene.add(dirLeft);

    const dirRight = new THREE.DirectionalLight(0xffffff, 0.6);
    dirRight.position.set(2, 0.5, 0);
    scene.add(dirRight);

    // Initial texture render
    renderTextureToCanvas();

    const canvas = textureCanvasRef.current;
    if (canvas) {
      const texture = new THREE.CanvasTexture(canvas);
      texture.flipY = false;
      texture.colorSpace = THREE.SRGBColorSpace;
      textureRef.current = texture;
    }

    // Load native GLB model
    const loader = new GLTFLoader();
    const baseUrl = import.meta.env.BASE_URL;
    const modelUrl = `${baseUrl}mockups/shirt_baked.glb`;

    loader.load(
      modelUrl,
      (gltf) => {
        const root = gltf.scene;

        root.traverse((child) => {
          if ((child as THREE.Mesh).isMesh) {
            const mesh = child as THREE.Mesh;
            meshRef.current = mesh;

            if (textureRef.current) {
              const mat = new THREE.MeshStandardMaterial({
                map: textureRef.current,
                roughness: 0.55,
                metalness: 0.05,
                side: THREE.DoubleSide,
              });
              mesh.material = mat;
            }
          }
        });

        const box = new THREE.Box3().setFromObject(root);
        const center = box.getCenter(new THREE.Vector3());
        root.position.sub(center);

        scene.add(root);
        setIsLoading(false);

        setTimeout(() => {
          if (rendererRef.current && onSnapshotReadyRef.current) {
            rendererRef.current.render(scene, camera);
            onSnapshotReadyRef.current(rendererRef.current.domElement.toDataURL('image/jpeg', 0.85));
          }
        }, 500);
      },
      (xhr) => {
        if (xhr.total > 0) {
          setLoadProgress(Math.round((xhr.loaded / xhr.total) * 100));
        }
      },
      (err) => {
        console.error('Failed to load shirt_baked.glb:', err);
        setIsLoading(false);
      }
    );

    let animId: number;
    const animate = () => {
      animId = requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    const handleResize = () => {
      if (!container || !renderer || !camera) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      if (w > 0 && h > 0) {
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        renderer.setSize(w, h);
      }
    };
    window.addEventListener('resize', handleResize);

    const resizeObserver = new ResizeObserver(() => {
      handleResize();
    });
    resizeObserver.observe(container);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
      resizeObserver.disconnect();
      renderer.dispose();
      controls.dispose();
    };
  }, []);

  // When switching to 3D mode, trigger immediate resize calculation
  useEffect(() => {
    if (viewMode === '3d') {
      const resize = () => {
        const container = containerRef.current;
        const renderer = rendererRef.current;
        const camera = cameraRef.current;
        if (container && renderer && camera) {
          const w = container.clientWidth;
          const h = container.clientHeight;
          if (w > 0 && h > 0) {
            camera.aspect = w / h;
            camera.updateProjectionMatrix();
            renderer.setSize(w, h);
          }
        }
      };
      const raf = requestAnimationFrame(resize);
      const timer = setTimeout(resize, 60);
      return () => {
        cancelAnimationFrame(raf);
        clearTimeout(timer);
      };
    }
  }, [viewMode]);

  // Update canvas on config change or when masks load or image version updates
  useEffect(() => {
    renderTextureToCanvas();
    drawPatternPreview();
  }, [renderTextureToCanvas, drawPatternPreview, masksReady, imageVersion]);

  // Preload custom jersey fonts whenever fontFamily or custom element fonts change
  useEffect(() => {
    const fontsToLoad = new Set<string>();
    if (jerseyConfig.fontFamily) fontsToLoad.add(jerseyConfig.fontFamily);
    if (jerseyConfig.customElements) {
      jerseyConfig.customElements.forEach((el) => {
        if (el.fontFamily) fontsToLoad.add(el.fontFamily);
      });
    }

    if (fontsToLoad.size > 0) {
      const sample = `${jerseyConfig.playerNumber || '10'} ${jerseyConfig.playerName || 'PERALTA'}`;
      const promises = Array.from(fontsToLoad).map((font) =>
        ensureJerseyFontLoaded(font, sample)
      );
      Promise.all(promises).then(() => {
        renderTextureToCanvas();
        drawPatternPreview();
      });
    }
  }, [
    jerseyConfig.fontFamily,
    jerseyConfig.playerName,
    jerseyConfig.playerNumber,
    jerseyConfig.customElements,
    renderTextureToCanvas,
    drawPatternPreview,
  ]);

  useEffect(() => {
    if (controlsRef.current) {
      controlsRef.current.autoRotate = isAutoRotate;
    }
  }, [isAutoRotate]);

  // Camera presets
  const setCameraView = (view: 'front' | 'back' | 'left' | 'right') => {
    if (!controlsRef.current || !cameraRef.current) return;
    setIsAutoRotate(false);
    setActiveCameraView(view);
    const cam = cameraRef.current;
    if (view === 'front') cam.position.set(0, 0, 0.85);
    else if (view === 'back') cam.position.set(0, 0, -0.85);
    else if (view === 'left') cam.position.set(-0.85, 0, 0);
    else if (view === 'right') cam.position.set(0.85, 0, 0);
    controlsRef.current.target.set(0, 0, 0);
    controlsRef.current.update();
  };

  // Direct Interactive Dragging on 2D Pattern Canvas
  const handlePatternMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = patternCanvasRef.current;
    if (!canvas || !onChangeJerseyConfig) return;

    const rect = canvas.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    const dist = (p: { x: number; y: number }) => Math.hypot(p.x - x, p.y - y);

    // 1. Check custom elements first (top-most in reverse order)
    if (jerseyConfig.customElements) {
      for (let i = jerseyConfig.customElements.length - 1; i >= 0; i--) {
        const el = jerseyConfig.customElements[i];
        const hitRadius = Math.max(8, 12 * (el.scale || 1));
        if (dist(el) < hitRadius) {
          setActiveDragId(el.id);
          return;
        }
      }
    }

    // 2. Check Name
    if (showPlayerName) {
      const np = jerseyConfig.playerNamePos || { x: 75.0, y: 16.5, scale: 1 };
      if (dist(np) < 8 * (np.scale || 1)) {
        setActiveDragId('name');
        return;
      }
    }

    // 3. Check Number
    if (showPlayerNumber) {
      const nump = jerseyConfig.playerNumberPos || { x: 75.0, y: 29.5, scale: 1 };
      if (dist(nump) < 14 * (nump.scale || 1)) {
        setActiveDragId('number');
        return;
      }
    }

    setActiveDragId(null);
  };

  const handlePatternMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!activeDragId || !onChangeJerseyConfig) return;
    const canvas = patternCanvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = Math.max(2, Math.min(98, ((e.clientX - rect.left) / rect.width) * 100));
    const y = Math.max(2, Math.min(98, ((e.clientY - rect.top) / rect.height) * 100));

    if (activeDragId === 'name') {
      onChangeJerseyConfig({
        ...jerseyConfig,
        playerNamePos: { ...(jerseyConfig.playerNamePos || { scale: 1 }), x, y },
      });
    } else if (activeDragId === 'number') {
      onChangeJerseyConfig({
        ...jerseyConfig,
        playerNumberPos: { ...(jerseyConfig.playerNumberPos || { scale: 1 }), x, y },
      });
    } else {
      // It's a custom element
      const updatedElements = (jerseyConfig.customElements || []).map((el) => {
        if (el.id === activeDragId) {
          return { ...el, x, y };
        }
        return el;
      });
      onChangeJerseyConfig({
        ...jerseyConfig,
        customElements: updatedElements,
      });
    }
  };

  const handlePatternMouseUp = () => {
    setActiveDragId(null);
  };

  const handleDownloadPattern = async () => {
    const tCanvas = textureCanvasRef.current;
    if (!tCanvas) return;

    if (jerseyConfig.fontFamily) {
      await ensureJerseyFontLoaded(
        jerseyConfig.fontFamily,
        `${jerseyConfig.playerNumber || '10'} ${jerseyConfig.playerName || 'PERALTA'}`
      );
      renderTextureToCanvas();
    }

    // Create 2048x2048 export canvas
    const exportCanvas = document.createElement('canvas');
    exportCanvas.width = tCanvas.width;
    exportCanvas.height = tCanvas.height;
    const eCtx = exportCanvas.getContext('2d');
    if (!eCtx) return;

    // Layer 1: Garment fabric with bleed boxes
    eCtx.drawImage(tCanvas, 0, 0);

    // Layer 2: The pattern cutting outline with the selected color & thickness!
    if (showOutline && masksRef.current.outline) {
      const off = document.createElement('canvas');
      off.width = tCanvas.width;
      off.height = tCanvas.height;
      const offCtx = off.getContext('2d');
      if (offCtx) {
        offCtx.drawImage(masksRef.current.outline, 0, 0, tCanvas.width, tCanvas.height);
        offCtx.globalCompositeOperation = 'source-in';
        offCtx.fillStyle = outlineColor;
        offCtx.fillRect(0, 0, off.width, off.height);

        if (outlineThickness > 1) {
          const offsets: [number, number][] = [
            [0, 0],
            [-2, 0], [2, 0], [0, -2], [0, 2],
            [-2, -2], [2, 2], [-2, 2], [2, -2],
          ];
          offsets.forEach(([dx, dy]) => {
            eCtx.drawImage(off, dx, dy);
          });
        } else {
          eCtx.drawImage(off, 0, 0);
        }
      }
    }

    const link = document.createElement('a');
    link.download = `Pola-Jersey-Siap-Cetak-${jerseyConfig.playerName || 'Custom'}-${Date.now()}.png`;
    link.href = exportCanvas.toDataURL('image/png');
    link.click();
  };

  return (
    <div className="w-full flex flex-col bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
      {/* Hidden 2048x2048 Master Texture Canvas */}
      <canvas ref={textureCanvasRef} width={2048} height={2048} className="hidden" />

      {/* DEDICATED TOP HEADER BAR (Outside and Above Canvas - ZERO Overlap on Pattern!) */}
      <div className="p-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between gap-2 flex-wrap">
        {/* Mode Toggle: 2D Pattern vs 3D Model */}
        <div className="flex items-center gap-1 bg-white p-1 rounded-2xl shadow-2xs border border-slate-200 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setViewMode('2d-pattern')}
            className={`px-3 py-1.5 rounded-xl flex items-center gap-1.5 transition cursor-pointer ${
              viewMode === '2d-pattern'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Layers className="w-3.5 h-3.5 text-sky-400" />
            <span>Pola Jahit Sublimasi 2D</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode('3d')}
            className={`px-3 py-1.5 rounded-xl flex items-center gap-1.5 transition cursor-pointer ${
              viewMode === '3d'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Eye className="w-3.5 h-3.5 text-sky-500" />
            <span>3D Model 360°</span>
          </button>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          {viewMode === '3d' && (
            <button
              type="button"
              onClick={() => setIsAutoRotate(!isAutoRotate)}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-xl border text-xs font-semibold transition shadow-xs cursor-pointer ${
                isAutoRotate
                  ? 'bg-sky-500 text-white border-sky-600'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
              }`}
            >
              <RotateCw className={`w-3.5 h-3.5 ${isAutoRotate ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">360° Auto-Rotate</span>
            </button>
          )}

          {viewMode === '2d-pattern' && (
            <div className="flex items-center gap-2 flex-wrap">
              {/* Toggle Garis Pola */}
              <button
                type="button"
                onClick={() => setShowOutline(!showOutline)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition cursor-pointer ${
                  showOutline
                    ? 'bg-sky-50 text-sky-800 border-sky-300'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                }`}
                title="Sembunyikan / Tampilkan Garis Batas Pola Jahit"
              >
                {showOutline ? <Eye className="w-3.5 h-3.5 text-sky-600" /> : <EyeOff className="w-3.5 h-3.5 text-slate-400" />}
                <span className="hidden sm:inline">Garis Pola</span>
              </button>

              {/* Warna Garis Pola */}
              {showOutline && (
                <div className="flex items-center gap-1 bg-white px-2 py-1 rounded-xl border border-slate-200 shadow-2xs">
                  <span className="text-[10px] font-bold text-slate-400 px-1 hidden md:inline">
                    Warna:
                  </span>
                  {[
                    { hex: '#ffffff', label: 'Putih' },
                    { hex: '#000000', label: 'Hitam' },
                    { hex: '#22c55e', label: 'Neon' },
                    { hex: '#38bdf8', label: 'Cyan' },
                    { hex: '#facc15', label: 'Kuning' },
                    { hex: '#ef4444', label: 'Merah' },
                  ].map((c) => (
                    <button
                      key={c.hex}
                      type="button"
                      onClick={() => setOutlineColor(c.hex)}
                      className={`w-5 h-5 rounded-full border transition cursor-pointer ${
                        outlineColor === c.hex ? 'ring-2 ring-sky-500 scale-110 shadow-xs' : 'border-slate-300 hover:scale-105'
                      }`}
                      style={{ backgroundColor: c.hex }}
                      title={`Warna Garis: ${c.label}`}
                    />
                  ))}
                  <input
                    type="color"
                    value={outlineColor}
                    onChange={(e) => setOutlineColor(e.target.value)}
                    className="w-5 h-5 rounded-full cursor-pointer border border-slate-300 ml-1"
                    title="Pilih Warna Custom Garis"
                  />
                </div>
              )}

              {/* Ketebalan Garis */}
              {showOutline && (
                <div className="flex items-center bg-white p-0.5 rounded-xl border border-slate-200 text-[11px] font-bold shadow-2xs">
                  <span className="text-[10px] text-slate-400 px-1.5 hidden lg:inline">Tebal:</span>
                  {[
                    { val: 1, label: '1x' },
                    { val: 2, label: '2x' },
                    { val: 3, label: '3x' },
                  ].map((t) => (
                    <button
                      key={t.val}
                      type="button"
                      onClick={() => setOutlineThickness(t.val)}
                      className={`px-2 py-1 rounded-lg transition cursor-pointer ${
                        outlineThickness === t.val
                          ? 'bg-slate-900 text-white shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                      title={`Ketebalan: ${t.label}`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              )}

              {/* Download Clean High-Res 2K Pattern */}
              <button
                type="button"
                onClick={handleDownloadPattern}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition shadow-xs cursor-pointer ml-auto"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download Pola Siap Cetak (2K)</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* CANVAS VIEWPORT CONTAINER - Clean, 100% Unobstructed! */}
      <div className="relative w-full aspect-square max-h-[640px] bg-slate-950 flex items-center justify-center overflow-hidden">
        {/* 2D Pattern Canvas */}
        <div
          className={`w-full h-full p-2 flex items-center justify-center ${
            viewMode === '2d-pattern' ? 'flex' : 'hidden'
          }`}
        >
          <canvas
            ref={patternCanvasRef}
            width={1024}
            height={1024}
            onMouseDown={handlePatternMouseDown}
            onMouseMove={handlePatternMouseMove}
            onMouseUp={handlePatternMouseUp}
            onMouseLeave={handlePatternMouseUp}
            className={`w-full h-full max-w-full max-h-full object-contain ${
              activeDragId ? 'cursor-grabbing' : 'cursor-grab'
            }`}
          />
        </div>

        {/* 3D WebGL Canvas */}
        <div
          ref={containerRef}
          className={`w-full h-full min-h-[480px] sm:min-h-[580px] flex-1 cursor-grab active:cursor-grabbing ${
            viewMode === '3d' ? 'w-full h-full block' : 'hidden'
          }`}
        />

        {/* Loading Overlay */}
        {isLoading && viewMode === '3d' && (
          <div className="absolute inset-0 bg-white/95 backdrop-blur-sm z-30 flex flex-col items-center justify-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-sky-500/10 border border-sky-400 flex items-center justify-center text-sky-600 animate-bounce">
              <Sparkles className="w-6 h-6" />
            </div>
            <div className="text-center">
              <p className="text-sm font-bold text-slate-800">Menyiapkan Model 3D Jersey...</p>
              <p className="text-xs text-slate-500 mt-0.5">Sinkronisasi pola jahitan ke bentuk 3D 360°</p>
            </div>
            {loadProgress > 0 && (
              <div className="w-48 bg-slate-200 h-1.5 rounded-full overflow-hidden mt-1">
                <div
                  className="bg-sky-500 h-full transition-all duration-200"
                  style={{ width: `${loadProgress}%` }}
                />
              </div>
            )}
          </div>
        )}

        {/* Camera angle bar (3D Mode) */}
        {viewMode === '3d' && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-10 flex items-center gap-1.5 bg-white/95 backdrop-blur-md px-2 py-1.5 rounded-2xl shadow-lg border border-slate-200 text-xs">
            <span className="text-[10px] font-bold text-slate-400 px-1 uppercase tracking-wider hidden sm:inline">
              Sudut Kamera:
            </span>
            <button
              type="button"
              onClick={() => setCameraView('front')}
              className={`px-2.5 py-1 rounded-xl font-semibold transition cursor-pointer ${
                activeCameraView === 'front'
                  ? 'bg-sky-600 text-white shadow-xs'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              Depan
            </button>
            <button
              type="button"
              onClick={() => setCameraView('back')}
              className={`px-2.5 py-1 rounded-xl font-semibold transition cursor-pointer ${
                activeCameraView === 'back'
                  ? 'bg-sky-600 text-white shadow-xs'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              Belakang
            </button>
            <button
              type="button"
              onClick={() => setCameraView('left')}
              className={`px-2.5 py-1 rounded-xl font-semibold transition cursor-pointer ${
                activeCameraView === 'left'
                  ? 'bg-sky-600 text-white shadow-xs'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              Kiri
            </button>
            <button
              type="button"
              onClick={() => setCameraView('right')}
              className={`px-2.5 py-1 rounded-xl font-semibold transition cursor-pointer ${
                activeCameraView === 'right'
                  ? 'bg-sky-600 text-white shadow-xs'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              Kanan
            </button>
            <div className="h-4 w-px bg-slate-200 mx-0.5" />
            <button
              type="button"
              onClick={() => {
                if (controlsRef.current && cameraRef.current) {
                  cameraRef.current.position.set(0, 0, 0.85);
                  controlsRef.current.reset();
                  setActiveCameraView('front');
                }
              }}
              className="p-1 rounded-lg text-slate-500 hover:text-slate-800 transition cursor-pointer"
              title="Reset Posisi Kamera"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
