/**
 * App Logic - Hepsiburada Lottie Generator
 */

// DOM Elements
const uploadArea = document.getElementById('uploadArea');
const fileInput = document.getElementById('fileInput');
const layersList = document.getElementById('layersList');
const lottiePreview = document.getElementById('lottie-preview');
const emptyPreview = document.getElementById('emptyPreview');
const generateBtn = document.getElementById('generateBtn');
const downloadBtn = document.getElementById('downloadBtn');
const downloadMp4Btn = document.getElementById('downloadMp4Btn');
const playPauseBtn = document.getElementById('playPauseBtn');
const timeline = document.getElementById('timeline');
const timelineProgress = document.getElementById('timelineProgress');
const timelineThumb = document.getElementById('timelineThumb');
const timeDisplay = document.getElementById('timeDisplay');
const layerSettingsState = document.getElementById('layerSettingsState');
const layerSettingsForm = document.getElementById('layer-settings-form');

// State
let parsedLayers = [];
let selectedLayerIndex = -1;
let currentLottieData = null;
let animInstance = null;
let isPlaying = true;

// App Config
const appConfig = {
    bouncePopStartOffset: 50, // default frame to start pop-in
    rotationDurationFrames: 119 // default duration for 720 rotation
};

// Initialize
function init() {
    setupEventListeners();
}

function setupEventListeners() {
    // Drag & Drop
    uploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadArea.classList.add('dragover');
    });

    uploadArea.addEventListener('dragleave', () => {
        uploadArea.classList.remove('dragover');
    });

    uploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadArea.classList.remove('dragover');
        if (e.dataTransfer.files.length) {
            handleFileUpload(e.dataTransfer.files[0]);
        }
    });

    // File Input
    fileInput.addEventListener('change', (e) => {
        if (e.target.files.length) {
            handleFileUpload(e.target.files[0]);
        }
    });

    // Core Buttons
    generateBtn.addEventListener('click', generateLottie);
    downloadBtn.addEventListener('click', downloadLottie);
    downloadMp4Btn.addEventListener('click', downloadMp4);

    // Timeline Controls
    playPauseBtn.addEventListener('click', togglePlayPause);
    timeline.addEventListener('mousedown', seekTimeline);

    // Gelişmiş Drag & Drop: Sürükleyip sıralama için (List container event)
    layersList.addEventListener('dragover', handleDragOver);

    // Layer Settings Form changes
    const inputs = ['layerType', 'animationPreset', 'entryTiming', 'exitTiming'];
    inputs.forEach(id => {
        document.getElementById(id).addEventListener('change', saveLayerSettings);
    });
    document.getElementById('layerGlow').addEventListener('change', saveLayerSettings);
    document.getElementById('layerType').addEventListener('change', updateGlowRowVisibility);
}

// File Parsing
async function handleFileUpload(file) {
    if (!file) return;

    try {
        showToast('Dosya okunuyor...', false);
        
        parsedLayers = []; // reset state
        selectedLayerIndex = -1; // seçimi sıfırla

        // Layer settings formunu gizle
        layerSettingsState.classList.remove('hidden');
        layerSettingsForm.classList.remove('active');

        if (file.name.toLowerCase().endsWith('.psd')) {
            await parsePSD(file);
        } else if (file.name.match(/\.(png|jpg|jpeg)$/i)) {
            await parseImage(file);
        } else {
            showToast('Sadece PSD veya resim dosyaları desteklenir.', false);
            return;
        }

        renderLayersList();
        generateBtn.disabled = false;
        showToast('Dosya başarıyla yüklendi!', true);

    } catch (err) {
        console.error('File parsing error:', err);
        showToast('Dosya okuma hatası: ' + err.message, false);
    }
}

// ag-psd ile PSD parse etme
async function parsePSD(file) {
    if (!window.agPsd || typeof window.agPsd.readPsd !== 'function') {
        throw new Error('ag-psd kütüphanesi yüklenemedi. İnternet bağlantınızı kontrol edin.');
    }
    const arrayBuffer = await file.arrayBuffer();
    let psd;
    try {
        psd = window.agPsd.readPsd(arrayBuffer);
    } catch (e) {
        throw new Error('PSD dosyası okunamadı. Dosyanın geçerli bir PSD olduğundan emin olun.');
    }

    // Input boyutlarını genel ayarlara aktar
    document.getElementById('compWidth').value = psd.width;
    document.getElementById('compHeight').value = psd.height;

    // Arkaplan katmanındaki beyaz vs olan varsayılan canvası yakalamak
    psd.children.forEach((layer, index) => {
        if (!layer.hidden && layer.canvas) {
            processPSDLayer(layer, psd.width, psd.height, index);
        }
    });
}

function processPSDLayer(layer, canvasW, canvasH, id) {
    // 500x500 export için PSD boyutlarına göre ölçekleme
    const TARGET_SIZE = 500;
    const origScale = Math.min(TARGET_SIZE / canvasW, TARGET_SIZE / canvasH);
    const offsetX = (TARGET_SIZE - (canvasW * origScale)) / 2;
    const offsetY = (TARGET_SIZE - (canvasH * origScale)) / 2;

    const scaledW = Math.max(1, layer.canvas.width * origScale);
    const scaledH = Math.max(1, layer.canvas.height * origScale);
    
    // Resmi yeniden boyutlandırarak belleğe al
    const scaledCanvas = document.createElement('canvas');
    scaledCanvas.width = scaledW;
    scaledCanvas.height = scaledH;
    const ctx = scaledCanvas.getContext('2d');
    ctx.drawImage(layer.canvas, 0, 0, scaledW, scaledH);
    const imgDataUrl = scaledCanvas.toDataURL('image/png');
    
    // Basit otomatik sınıflandırma
    const nameLower = layer.name.toLowerCase();
    let defaultType = 'main-icon';
    let defaultAnim = 'bounce-pop';
    let entry = 'sequence';
    let exit = 'sequential';

    if (nameLower.includes('bg') || nameLower.includes('arkaplan')) {
        defaultType = 'background';
        defaultAnim = 'bounce-rotate'; // Kullanıcı BG'nin hem scale hem rotate yapmasını istedi
        entry = 'immediate';
        exit = 'keep';
    } else if (nameLower.includes('text') || nameLower.includes('yazi')) {
        defaultType = 'text';
    }

    parsedLayers.push({
        id: `layer_${id}`,
        name: layer.name,
        dataUrl: imgDataUrl,
        width: scaledW,
        height: scaledH,
        x: (layer.left * origScale) + offsetX,
        y: (layer.top * origScale) + offsetY,
        visible: true,
        
        // Ayarlar
        type: defaultType,
        preset: defaultAnim,
        entryTiming: entry,
        exitTiming: exit
    });
}

// Tekil resim parse etme
async function parseImage(file) {
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                document.getElementById('compWidth').value = img.width;
                document.getElementById('compHeight').value = img.height;

                const TARGET_SIZE = 500;
                const origScale = Math.min(TARGET_SIZE / img.width, TARGET_SIZE / img.height);
                const offsetX = (TARGET_SIZE - (img.width * origScale)) / 2;
                const offsetY = (TARGET_SIZE - (img.height * origScale)) / 2;

                const scaledW = Math.max(1, img.width * origScale);
                const scaledH = Math.max(1, img.height * origScale);

                const scaledCanvas = document.createElement('canvas');
                scaledCanvas.width = scaledW;
                scaledCanvas.height = scaledH;
                const ctx = scaledCanvas.getContext('2d');
                ctx.drawImage(img, 0, 0, scaledW, scaledH);

                parsedLayers.push({
                    id: 'layer_0',
                    name: file.name,
                    dataUrl: scaledCanvas.toDataURL('image/png'),
                    width: scaledW,
                    height: scaledH,
                    x: offsetX,
                    y: offsetY,
                    visible: true,
                    type: 'main-icon',
                    preset: 'bounce-pop',
                    entryTiming: 'sequence',
                    exitTiming: 'sequential'
                });
                resolve();
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    });
}

/* UI Rendering */
function renderLayersList() {
    uploadArea.classList.add('hidden');
    layersList.classList.add('active');
    layersList.innerHTML = '';

    // Layers (reverse render for UI, top layer is first)
    [...parsedLayers].reverse().forEach((layer, i) => {
        const originalIndex = parsedLayers.length - 1 - i;
        
        const el = document.createElement('div');
        const isHidden = layer.visible === false;
        el.className = `layer-item ${selectedLayerIndex === originalIndex ? 'selected' : ''} ${isHidden ? 'hidden-layer' : ''}`;
        el.draggable = true;
        el.dataset.id = layer.id;

        let icon = 'fa-image';
        if (layer.type === 'text') icon = 'fa-font';
        if (layer.type === 'background') icon = 'fa-square';

        el.innerHTML = `
            <div class="drag-handle"><i class="fas fa-grip-vertical"></i></div>
            <div class="layer-item-content" onclick="selectLayer(${originalIndex})">
                <i class="fa-solid ${icon} layer-icon"></i>
                <div class="layer-info">
                    <div class="layer-name" title="${layer.name}">${layer.name}</div>
                    <span class="layer-type-badge">${layer.type.toUpperCase()} - ${layer.preset}</span>
                </div>
            </div>
            <div class="visibility-toggle" onclick="window.toggleVisibility('${layer.id}', event)">
                <i class="fas ${isHidden ? 'fa-eye-slash' : 'fa-eye'}"></i>
            </div>
        `;
        
        el.addEventListener('dragstart', () => el.classList.add('dragging'));
        el.addEventListener('dragend', () => {
            el.classList.remove('dragging');
            updateLayerOrderFromDOM();
        });

        layersList.appendChild(el);
    });
}

function selectLayer(index) {
    const layer = parsedLayers[index];
    if (!layer) return;

    // Default değerleri layer objesine kalıcı olarak yaz (ilk seçimde kaybolmasın)
    if (!layer.entryTiming) layer.entryTiming = 'sequence';
    if (!layer.exitTiming) layer.exitTiming = 'sequential';
    if (layer.glow === undefined) layer.glow = false;

    const prevIndex = selectedLayerIndex;
    selectedLayerIndex = index;

    // Sadece seçim değiştiyse listeyi yeniden çiz
    if (prevIndex !== index) {
        renderLayersList();
    }

    // Ayarları UI'a yansıt
    layerSettingsState.classList.add('hidden');
    layerSettingsForm.classList.add('active');

    document.getElementById('selectedLayerName').innerText = `Katman: ${layer.name}`;
    document.getElementById('layerType').value = layer.type;
    document.getElementById('animationPreset').value = layer.preset;
    document.getElementById('entryTiming').value = layer.entryTiming;
    document.getElementById('exitTiming').value = layer.exitTiming;
    document.getElementById('layerGlow').checked = layer.glow;
    updateGlowRowVisibility();
}

function updateGlowRowVisibility() {
    const type = document.getElementById('layerType').value;
    document.getElementById('glowRow').style.display = (type === 'background') ? '' : 'none';
}

function saveLayerSettings() {
    if (selectedLayerIndex === -1) return;

    const layer = parsedLayers[selectedLayerIndex];
    layer.type = document.getElementById('layerType').value;
    layer.preset = document.getElementById('animationPreset').value;
    layer.entryTiming = document.getElementById('entryTiming').value;
    layer.exitTiming = document.getElementById('exitTiming').value;
    layer.glow = document.getElementById('layerGlow').checked;

    updateGlowRowVisibility();
    renderLayersList();
}

/* Lottie Generation Logic */
function generateLottie() {
    if (parsedLayers.length === 0) return;

    try {
        const fps = Math.max(1, parseInt(document.getElementById('compFps').value) || 25);
        const durationSec = Math.max(0.1, parseFloat(document.getElementById('compDuration').value) || 6.8);
        const totalFrames = Math.floor(durationSec * fps);

        const config = {
            width: 500,
            height: 500,
            fps: fps,
            duration: durationSec,
            name: "floating-button-gen"
        };
        const gen = new LottieGenerator(config);

        // Controller analizi
        let controllerInd = null;
        let requiresController = parsedLayers.some(l => l.preset !== 'none');
        
        if (requiresController) {
            controllerInd = gen.addControllerLayer({
                preset: 'bounce-pop', // Controller her zaman temelde heartbeat/bounce yapar
                startFrame: 0 
            });
        }

        // Görünür olan katmanları (visible) filtrele
        const activeLayers = parsedLayers.filter(l => l.visible !== false);
        
        // Katmanları giriş türlerine göre (sequence vs immediate) grupla
        const sequenceLayers = activeLayers.filter(l => l.entryTiming === 'sequence');
        const immediateLayers = activeLayers.filter(l => l.entryTiming === 'immediate');
        
        let seqStartFrame = 2; // Always reserve earliest start for the loop padding
        let timeSlot = 0;
        
        // "Sonuna kadar kal" olan katmanlar (keep) bir Carousel "sahnesi" (zaman dilimi) tüketmez.
        // Yalnızca "Sırası bitince çık" olanlar sahneyi ilerletir.
        const slotConsumersCount = sequenceLayers.filter(l => l.exitTiming === 'sequential').length;
        const effectiveSlots = Math.max(1, slotConsumersCount);

        if (sequenceLayers.length > 0) {
            const availableFrames = Math.max(1, totalFrames - 12);
            timeSlot = Math.floor(availableFrames / effectiveSlots);
        }

        // Hemen Çık (0. Frame) katmanlarını yerleştir
        immediateLayers.forEach(layer => {
            let exitFrame = null;
            if (layer.exitTiming === 'sequential') {
                if (sequenceLayers.length > 0) {
                    const firstSeqStart = seqStartFrame + (0 * timeSlot);
                    exitFrame = firstSeqStart - 8;
                    if (exitFrame < 0) exitFrame = Math.max(0, firstSeqStart - 2); 
                } else {
                    exitFrame = totalFrames - 10;
                }
            } else { // 'keep'
                exitFrame = totalFrames - 8;
            }

            let addedLayerData = { ...layer, startFrame: 0, exitFrame: exitFrame };
            const assetId = gen.addAsset(layer.id, layer.dataUrl, layer.width, layer.height);
            gen.addImageLayer(addedLayerData, assetId, controllerInd);
            if (layer.glow) gen.addGlowLayer(addedLayerData, assetId, controllerInd);
        });

        // Carousel katmanları sırayla yerleştir
        if (sequenceLayers.length > 0) {
            let currentSlotIndex = 0;

            sequenceLayers.forEach((layer) => {
                const startFrame = seqStartFrame + (currentSlotIndex * timeSlot);
                
                let exitFrame = null;
                if (layer.exitTiming === 'sequential') {
                    if (currentSlotIndex < effectiveSlots - 1) {
                        const nextStartFrame = seqStartFrame + ((currentSlotIndex + 1) * timeSlot);
                        // 8 frame önce çıkış (Üst üste binmeyi engeller)
                        exitFrame = nextStartFrame - 8;
                    } else {
                        // En son sahne totalFrames'a 10 kala çıkar
                        exitFrame = totalFrames - 10;
                    }
                    
                    // Bu katman bir sahne (slide) işgal ettiği için bandı(slotu) bir sonrakine ilerlet
                    currentSlotIndex++;
                } else { // 'keep'
                    // Keep (sabit) olanlar kendi başlarına boş sahne işgal etmezler. 
                    // Bandı (currentSlotIndex) ilerletmediğimiz için, bir sonraki elementle AYNI ANDA çıkarlar!
                    exitFrame = totalFrames - 8; // Lottie biterken scale-out ile çıkar
                }

                let addedLayerData = {
                    ...layer,
                    startFrame: startFrame,
                    exitFrame: exitFrame
                };

                const assetId = gen.addAsset(layer.id, layer.dataUrl, layer.width, layer.height);
                gen.addImageLayer(addedLayerData, assetId, controllerInd);
                if (layer.glow) gen.addGlowLayer(addedLayerData, assetId, controllerInd);
            });
        }

        // Çıktı üretme
        currentLottieData = gen.generate();
        downloadBtn.disabled = false;
        downloadMp4Btn.disabled = false;
        playPauseBtn.disabled = false;
        
        loadPreview(currentLottieData);
        showToast('Lottie animasyonu oluşturuldu!', true);

    } catch (err) {
        console.error('Generation err:', err);
        showToast('Oluşturma hatası: ' + err.message, false);
    }
}

// Preview Logic
function loadPreview(animationData) {
    emptyPreview.classList.add('hidden');
    lottiePreview.classList.remove('hidden');
    
    // Eski animasyonu temizle (tüm listener'larıyla birlikte)
    if (animInstance) {
        animInstance.removeEventListener('enterFrame', updateTimeline);
        animInstance.destroy();
        animInstance = null;
    }
    lottiePreview.innerHTML = '';

    // lottie-web'i çalıştır
    animInstance = window.bodymovin.loadAnimation({
        container: lottiePreview,
        renderer: 'svg',
        loop: true,
        autoplay: true,
        animationData: animationData
    });

    animInstance.addEventListener('enterFrame', updateTimeline);
    isPlaying = true;
    playPauseBtn.innerHTML = '<i class="fa-solid fa-pause"></i>';
}

function togglePlayPause() {
    if (!animInstance) return;
    
    if (isPlaying) {
        animInstance.pause();
        playPauseBtn.innerHTML = '<i class="fa-solid fa-play"></i>';
    } else {
        animInstance.play();
        playPauseBtn.innerHTML = '<i class="fa-solid fa-pause"></i>';
    }
    isPlaying = !isPlaying;
}

function updateTimeline(e) {
    if (!animInstance) return;
    
    const progress = (e.currentTime / animInstance.totalFrames) * 100;
    timelineProgress.style.width = `${progress}%`;
    timelineThumb.style.left = `${progress}%`;
    
    // Zamanı saniye cinsinde göster (frame / fps)
    const fps = parseInt(document.getElementById('compFps').value);
    timeDisplay.innerText = (e.currentTime / fps).toFixed(1) + 's';
}

function seekTimeline(e) {
    if (!animInstance) return;
    
    const rect = timeline.getBoundingClientRect();
    let x = e.clientX - rect.left;
    x = Math.max(0, Math.min(x, rect.width)); // kelepçe
    
    const percent = x / rect.width;
    const frame = percent * animInstance.totalFrames;
    
    animInstance.goToAndStop(frame, true);
    
    if (isPlaying) {
        animInstance.play();
    } else {
        updateTimeline({ currentTime: frame });
    }
}

// Export / Download
function downloadLottie() {
    if (!currentLottieData) return;

    const blob = new Blob([JSON.stringify(currentLottieData)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const dlAnchorElem = document.createElement('a');
    dlAnchorElem.setAttribute('href', url);
    dlAnchorElem.setAttribute('download', 'floating_button_generated.json');
    dlAnchorElem.click();
    // Belleği serbest bırak
    setTimeout(() => URL.revokeObjectURL(url), 1000);

    showToast('Lottie dosyası indirildi.', true);
}

// Video Export (WebM — gerçek zamanlı lottie canvas stream)
function downloadMp4() {
    if (!currentLottieData) return;

    const fps = parseInt(document.getElementById('compFps').value) || 25;
    const durationSec = parseFloat(document.getElementById('compDuration').value) || 6.8;
    const size = 500;

    // Lottie canvas renderer wrapper
    const wrapper = document.createElement('div');
    wrapper.style.cssText = `position:fixed;left:-9999px;top:0;width:${size}px;height:${size}px;`;
    document.body.appendChild(wrapper);

    const offAnim = window.bodymovin.loadAnimation({
        container: wrapper,
        renderer: 'canvas',
        loop: false,
        autoplay: false,
        animationData: JSON.parse(JSON.stringify(currentLottieData)),
        rendererSettings: { clearCanvas: true }
    });

    showToast('Video hazırlanıyor...', false);
    downloadMp4Btn.disabled = true;
    downloadMp4Btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Kaydediliyor...';

    offAnim.addEventListener('DOMLoaded', () => {
        const lottieCanvas = wrapper.querySelector('canvas');
        if (!lottieCanvas) {
            showToast('Canvas oluşturulamadı.', false);
            cleanup(); return;
        }

        // Lottie canvas'ından doğrudan stream al
        const stream = lottieCanvas.captureStream(fps);

        const mimeType = ['video/webm;codecs=vp9', 'video/webm;codecs=vp8', 'video/webm']
            .find(m => MediaRecorder.isTypeSupported(m)) || 'video/webm';

        const recorder = new MediaRecorder(stream, { mimeType });
        const chunks = [];

        recorder.ondataavailable = e => { if (e.data.size > 0) chunks.push(e.data); };

        recorder.onstop = () => {
            cleanup();
            const blob = new Blob(chunks, { type: 'video/webm' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'floating_button_generated.webm';
            a.click();
            setTimeout(() => URL.revokeObjectURL(url), 1000);
            downloadMp4Btn.disabled = false;
            downloadMp4Btn.innerHTML = '<i class="fa-solid fa-film"></i> Video İndir';
            showToast('Video indirildi (.webm)', true);
        };

        function cleanup() {
            offAnim.destroy();
            if (wrapper.parentNode) document.body.removeChild(wrapper);
        }

        // Kaydı başlat, animasyonu oynat, süre bitince durdur
        recorder.start(100); // her 100ms'de chunk al
        offAnim.goToAndPlay(0, true);

        setTimeout(() => {
            recorder.stop();
        }, (durationSec + 0.5) * 1000);
    });
}

// Utils
function showToast(message, isSuccess) {
    const toast = document.getElementById('toast');
    const msg = document.getElementById('toastMessage');
    
    msg.innerText = message;
    
    if (isSuccess) {
        toast.classList.add('success');
    } else {
        toast.classList.remove('success');
    }
    
    toast.classList.add('show');
    
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

// DRAG AND DROP & VISIBILITY
function handleDragOver(e) {
    e.preventDefault();
    const dragging = document.querySelector('.dragging');
    if (!dragging) return;
    
    const draggableElements = [...layersList.querySelectorAll('.layer-item:not(.dragging)')];
    const afterElement = draggableElements.reduce((closest, child) => {
        const box = child.getBoundingClientRect();
        const offset = e.clientY - box.top - box.height / 2;
        if (offset < 0 && offset > closest.offset) {
            return { offset: offset, element: child };
        } else {
            return closest;
        }
    }, { offset: Number.NEGATIVE_INFINITY }).element;

    if (afterElement == null) {
        layersList.appendChild(dragging);
    } else {
        layersList.insertBefore(dragging, afterElement);
    }
}

function updateLayerOrderFromDOM() {
    const items = [...layersList.querySelectorAll('.layer-item')];
    const uiOrderIds = items.map(item => item.dataset.id);
    
    // UI displays reverse chronological order (top layer = higher index). Array needs reverse of DOM.
    const newArrayOrderIds = uiOrderIds.reverse();
    
    let selectedId = null;
    if (selectedLayerIndex !== -1 && parsedLayers[selectedLayerIndex]) {
        selectedId = parsedLayers[selectedLayerIndex].id;
    }

    let sortedLayers = [];
    newArrayOrderIds.forEach(id => {
        const l = parsedLayers.find(p => p.id === id);
        if (l) sortedLayers.push(l);
    });
    parsedLayers.splice(0, parsedLayers.length, ...sortedLayers);
    
    // Update selection index mapping
    if (selectedId) selectedLayerIndex = parsedLayers.findIndex(l => l.id === selectedId);
    
    renderLayersList();
    generateLottie();
}

window.toggleVisibility = function(id, e) {
    if (e) e.stopPropagation();
    const layer = parsedLayers.find(l => l.id === id);
    if (layer) {
        layer.visible = layer.visible === false ? true : false;
        renderLayersList();
        generateLottie();
    }
};

// Guide Modal
(function () {
    const overlay = document.getElementById('guideOverlay');
    const closeBtn = document.getElementById('guideCloseBtn');
    const dontShow = document.getElementById('dontShowAgain');
    const guideBtn = document.getElementById('guideBtn');

    if (!localStorage.getItem('guideShown')) {
        overlay.classList.remove('hidden');
    }

    guideBtn.addEventListener('click', () => {
        overlay.classList.remove('hidden');
    });

    closeBtn.addEventListener('click', () => {
        overlay.classList.add('hidden');
        if (dontShow.checked) {
            localStorage.setItem('guideShown', '1');
        }
    });
})();

// ── Tab Switching ──────────────────────────────────────────
(function () {
    const tabs = document.querySelectorAll('.header-tab');
    const generatorView = document.querySelector('main');
    const playerView = document.getElementById('playerView');

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');

            if (tab.dataset.tab === 'player') {
                generatorView.style.display = 'none';
                playerView.classList.remove('hidden');
            } else {
                generatorView.style.display = '';
                playerView.classList.add('hidden');
            }
        });
    });
})();

// ── Lottie Player ──────────────────────────────────────────
(function () {
    const dropZone   = document.getElementById('playerDropZone');
    const fileInput  = document.getElementById('playerFileInput');
    const canvas     = document.getElementById('playerCanvas');
    const emptyState = document.getElementById('playerEmptyState');
    const infoPanel  = document.getElementById('playerInfo');
    const playPause  = document.getElementById('playerPlayPause');
    const timeline   = document.getElementById('playerTimeline');
    const progress   = document.getElementById('playerProgress');
    const thumb      = document.getElementById('playerThumb');
    const timeDisp   = document.getElementById('playerTimeDisplay');
    const loopCb     = document.getElementById('playerLoop');
    const speedSel   = document.getElementById('playerSpeed');

    let anim = null;
    let isDraggingTimeline = false;
    let wasPlayingBeforeScrub = false;
    let playerIsPlaying = false;

    function loadJson(json) {
        if (anim) { anim.destroy(); anim = null; }

        canvas.innerHTML = '';
        canvas.classList.remove('hidden');
        emptyState.classList.add('hidden');

        anim = bodymovin.loadAnimation({
            container: canvas,
            renderer: 'svg',
            loop: loopCb.checked,
            autoplay: true,
            animationData: json
        });

        // Info panel
        const ip = json.ip ?? 0;
        const op = json.op ?? 0;
        const fr = json.fr || 25;
        const dur = (op - ip) / fr;
        document.getElementById('playerFileName').textContent = json._fileName || '—';
        document.getElementById('playerDuration').textContent = isFinite(dur) ? dur.toFixed(2) + ' sn' : '—';
        document.getElementById('playerFps').textContent = fr + ' fps';
        document.getElementById('playerSize').textContent = (json.w || '?') + ' × ' + (json.h || '?');
        document.getElementById('playerFrames').textContent = (op - ip) + ' kare';
        infoPanel.classList.remove('hidden');

        playPause.disabled = false;
        playPause.querySelector('i').className = 'fa-solid fa-pause';
        playerIsPlaying = true;

        anim.setSpeed(parseFloat(speedSel.value));

        anim.addEventListener('enterFrame', () => {
            if (isDraggingTimeline) return;
            const pct = (anim.currentFrame / anim.totalFrames) * 100;
            progress.style.width = pct + '%';
            thumb.style.left = pct + '%';
            timeDisp.textContent = (anim.currentFrame / anim.frameRate).toFixed(1) + 's';
        });

        anim.addEventListener('complete', () => {
            if (!loopCb.checked) {
                playerIsPlaying = false;
                playPause.querySelector('i').className = 'fa-solid fa-play';
            }
        });
    }

    function readFile(file) {
        if (!file || !file.name.endsWith('.json')) return;
        const reader = new FileReader();
        reader.onload = e => {
            try {
                const json = JSON.parse(e.target.result);
                json._fileName = file.name;
                loadJson(json);
            } catch (err) { console.error('JSON parse hatası:', err); alert('Geçersiz JSON dosyası.'); }
        };
        reader.readAsText(file);
    }

    // Drop zone events
    dropZone.addEventListener('dragover', e => { e.preventDefault(); dropZone.classList.add('dragover'); });
    dropZone.addEventListener('dragleave', () => dropZone.classList.remove('dragover'));
    dropZone.addEventListener('drop', e => {
        e.preventDefault();
        dropZone.classList.remove('dragover');
        readFile(e.dataTransfer.files[0]);
    });
    fileInput.addEventListener('change', () => readFile(fileInput.files[0]));

    // Play / Pause
    playPause.addEventListener('click', () => {
        if (!anim) return;
        if (playerIsPlaying) {
            anim.pause();
            playPause.querySelector('i').className = 'fa-solid fa-play';
            playerIsPlaying = false;
        } else {
            anim.play();
            playPause.querySelector('i').className = 'fa-solid fa-pause';
            playerIsPlaying = true;
        }
    });

    // Loop toggle
    loopCb.addEventListener('change', () => { if (anim) anim.loop = loopCb.checked; });

    // Speed
    speedSel.addEventListener('change', () => { if (anim) anim.setSpeed(parseFloat(speedSel.value)); });

    // Timeline scrub
    function scrubTo(e) {
        if (!anim) return;
        const rect = timeline.getBoundingClientRect();
        const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
        const frame = Math.round(pct * anim.totalFrames);
        anim.goToAndStop(frame, true);
        progress.style.width = (pct * 100) + '%';
        thumb.style.left = (pct * 100) + '%';
        timeDisp.textContent = (frame / anim.frameRate).toFixed(1) + 's';
    }

    timeline.addEventListener('mousedown', e => {
        isDraggingTimeline = true;
        wasPlayingBeforeScrub = playerIsPlaying;
        if (anim) anim.pause();
        scrubTo(e);
    });

    document.addEventListener('mousemove', e => { if (isDraggingTimeline) scrubTo(e); });

    document.addEventListener('mouseup', () => {
        if (isDraggingTimeline) {
            isDraggingTimeline = false;
            if (anim && wasPlayingBeforeScrub) {
                anim.play();
                playPause.querySelector('i').className = 'fa-solid fa-pause';
                playerIsPlaying = true;
            }
        }
    });
})();

// Start
document.addEventListener('DOMContentLoaded', init);
