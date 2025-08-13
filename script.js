 // Ambil elemen canvas dan buat konteks 2D
const canvas = document.getElementById("bubbleCanvas");
const ctx = canvas.getContext("2d");

// Atur ukuran canvas berdasarkan ukuran layar
canvas.width = window.innerWidth * 0.9;
canvas.height = window.innerHeight * 0.7;

// Array untuk menyimpan semua bubble
let bubbles = [];

// Variabel kontrol
let isAnimating = false;
let animationId = null;
let colorMode = 'rainbow'; // 'grayscale', 'rainbow', 'random'
let audioContext = null;
let analyser = null;
let dataArray = null;
let bufferLength = 0;

// Variabel untuk interaksi mouse
let mouseX = 0;
let mouseY = 0;
let isMousePressed = false;
let lastClickTime = 0;
let mouseVelocityX = 0;
let mouseVelocityY = 0;
let lastMouseX = 0;
let lastMouseY = 0;

// Variabel untuk kontrol kecepatan
let speedMultiplier = 1;

// Ambil elemen tombol
const toggleBtn = document.getElementById('toggleBtn');
const grayscaleBtn = document.getElementById('grayscaleBtn');
const rainbowBtn = document.getElementById('rainbowBtn');
const randomBtn = document.getElementById('randomBtn');
const themeToggle = document.getElementById('themeToggle');
const speedSlider = document.getElementById('speedSlider');
const speedValue = document.getElementById('speedValue');

// Event listeners untuk tombol kontrol
toggleBtn.addEventListener('click', toggleAnimation);
grayscaleBtn.addEventListener('click', () => setColorMode('grayscale'));
rainbowBtn.addEventListener('click', () => setColorMode('rainbow'));
randomBtn.addEventListener('click', () => setColorMode('random'));
themeToggle.addEventListener('change', toggleTheme);
speedSlider.addEventListener('input', handleSpeedChange);

// Event listeners untuk interaksi mouse
canvas.addEventListener('click', handleCanvasClick);
canvas.addEventListener('mousedown', handleMouseDown);
canvas.addEventListener('mouseup', handleMouseUp);
canvas.addEventListener('mousemove', handleMouseMove);
canvas.addEventListener('dblclick', handleDoubleClick);

// Event listeners untuk touch (mobile support)
canvas.addEventListener('touchstart', handleTouchStart, { passive: false });
canvas.addEventListener('touchmove', handleTouchMove, { passive: false });
canvas.addEventListener('touchend', handleTouchEnd, { passive: false });

// Fungsi untuk toggle theme
function toggleTheme() {
    if (themeToggle.checked) {
    document.body.setAttribute('data-theme', 'light');
    } else {
    document.body.removeAttribute('data-theme');
    }
}

// Fungsi untuk mengatur kecepatan bubble
function handleSpeedChange() {
    speedMultiplier = parseFloat(speedSlider.value);
    speedValue.textContent = `${speedMultiplier.toFixed(1)}x`;
}

// === MOUSE/TOUCH INTERACTION FUNCTIONS ===

// Dapatkan posisi mouse/touch relatif terhadap canvas
function getCanvasPosition(event) {
    const rect = canvas.getBoundingClientRect();
    return {
    x: (event.clientX || event.touches[0].clientX) - rect.left,
    y: (event.clientY || event.touches[0].clientY) - rect.top
    };
}

// Handle klik pada canvas - buat bubble burst
function handleCanvasClick(event) {
    const pos = getCanvasPosition(event);
    createClickBubble(pos.x, pos.y, 'click');
    
    // Deteksi rapid clicks untuk efek khusus
    const currentTime = Date.now();
    if (currentTime - lastClickTime < 300) {
    createClickBubble(pos.x, pos.y, 'rapid');
    }
    lastClickTime = currentTime;
}

// Handle double click - efek eksplosif
function handleDoubleClick(event) {
    const pos = getCanvasPosition(event);
    createExplosion(pos.x, pos.y);
}

// Handle mouse down - mulai tracking drag
function handleMouseDown(event) {
    isMousePressed = true;
    const pos = getCanvasPosition(event);
    mouseX = pos.x;
    mouseY = pos.y;
    lastMouseX = pos.x;
    lastMouseY = pos.y;
}

// Handle mouse up
function handleMouseUp(event) {
    isMousePressed = false;
    mouseVelocityX = 0;
    mouseVelocityY = 0;
}

// Handle mouse move - buat trail effect saat drag
function handleMouseMove(event) {
    const pos = getCanvasPosition(event);
    
    // Hitung velocity
    mouseVelocityX = pos.x - lastMouseX;
    mouseVelocityY = pos.y - lastMouseY;
    
    mouseX = pos.x;
    mouseY = pos.y;
    
    // Buat trail effect saat mouse bergerak cepat
    const speed = Math.sqrt(mouseVelocityX * mouseVelocityX + mouseVelocityY * mouseVelocityY);
    
    if (isMousePressed && speed > 5) {
    createTrailBubble(pos.x, pos.y, speed);
    }
    
    lastMouseX = pos.x;
    lastMouseY = pos.y;
}

// === TOUCH SUPPORT ===
function handleTouchStart(event) {
    event.preventDefault();
    const pos = getCanvasPosition(event);
    isMousePressed = true;
    mouseX = pos.x;
    mouseY = pos.y;
    lastMouseX = pos.x;
    lastMouseY = pos.y;
}

function handleTouchMove(event) {
    event.preventDefault();
    handleMouseMove(event);
}

function handleTouchEnd(event) {
    event.preventDefault();
    if (event.touches.length === 0) {
    handleMouseUp(event);
    }
}

// === BUBBLE CREATION FUNCTIONS ===

// Buat bubble dari klik
function createClickBubble(x, y, type) {
    const size = type === 'rapid' ? 25 + Math.random() * 20 : 15 + Math.random() * 15;
    const speed = type === 'rapid' ? 2 + Math.random() * 4 : 1 + Math.random() * 3;
    
    // Buat beberapa bubble sekaligus untuk efek burst
    const count = type === 'rapid' ? 5 : 3;
    
    for (let i = 0; i < count; i++) {
    const bubble = new Bubble(size / (i + 1));
    bubble.x = x + (Math.random() - 0.5) * 40;
    bubble.y = y + (Math.random() - 0.5) * 40;
    bubble.speed = speed + Math.random() * 2;
    bubble.isUserCreated = true;
    bubbles.push(bubble);
    }
}

// Buat trail bubble saat drag
function createTrailBubble(x, y, speed) {
    if (Math.random() < 0.3) { // 30% chance untuk mencegah terlalu banyak bubble
    const bubble = new Bubble(5 + speed / 2);
    bubble.x = x + (Math.random() - 0.5) * 20;
    bubble.y = y + (Math.random() - 0.5) * 20;
    bubble.speed = 0.5 + Math.random();
    bubble.isUserCreated = true;
    bubble.alpha = 0.7; // Sedikit transparan
    bubbles.push(bubble);
    }
}

// Buat efek eksplosif untuk double click
function createExplosion(x, y) {
    for (let i = 0; i < 12; i++) {
    const bubble = new Bubble(20 + Math.random() * 15);
    const angle = (i / 12) * Math.PI * 2;
    const distance = 50 + Math.random() * 50;
    
    bubble.x = x + Math.cos(angle) * distance;
    bubble.y = y + Math.sin(angle) * distance;
    bubble.speed = 3 + Math.random() * 3;
    bubble.isUserCreated = true;
    bubble.explosionBubble = true;
    bubbles.push(bubble);
    }
}

// Fungsi untuk toggle animasi
function toggleAnimation() {
    if (!isAnimating) {
    startAnimation();
    } else {
    stopAnimation();
    }
}

// Fungsi untuk memulai animasi
function startAnimation() {
    if (!audioContext) {
    // Minta akses mikrofon dari user
    navigator.mediaDevices.getUserMedia({ audio: true, video: false })
        .then(stream => {
        // Buat audio context untuk mengakses suara
        audioContext = new AudioContext();
        const source = audioContext.createMediaStreamSource(stream);

        // Buat analyzer untuk memproses frekuensi suara
        analyser = audioContext.createAnalyser();
        source.connect(analyser);

        analyser.fftSize = 256; // Ukuran FFT (resolusi data suara)
        bufferLength = analyser.frequencyBinCount;
        dataArray = new Uint8Array(bufferLength);

        // Mulai animasi
        isAnimating = true;
        toggleBtn.textContent = 'Stop';
        animate();
        })
        .catch(err => {
        alert("Microphone access is required to run this app.");
        console.error(err);
        });
    } else {
    // Resume animasi jika audio context sudah ada
    isAnimating = true;
    toggleBtn.textContent = 'Stop';
    animate();
    }
}

// Fungsi untuk menghentikan animasi
function stopAnimation() {
    isAnimating = false;
    toggleBtn.textContent = 'Start';
    if (animationId) {
    cancelAnimationFrame(animationId);
    animationId = null;
    }
}

// Fungsi untuk mengatur mode warna
function setColorMode(mode) {
    colorMode = mode;
    
    // Update tampilan tombol aktif
    document.querySelectorAll('.control-btn').forEach(btn => {
    if (btn.id !== 'toggleBtn') {
        btn.classList.remove('active');
    }
    });
    
    if (mode === 'grayscale') {
    grayscaleBtn.classList.add('active');
    } else if (mode === 'rainbow') {
    rainbowBtn.classList.add('active');
    } else if (mode === 'random') {
    randomBtn.classList.add('active');
    }
}

// Fungsi utama animasi, dipanggil terus-menerus
function animate() {
    if (!isAnimating) return;

    // Ambil data frekuensi audio saat ini
    if (analyser && dataArray) {
    analyser.getByteFrequencyData(dataArray);

    // Hitung volume rata-rata dari semua frekuensi
    const volume = dataArray.reduce((a, b) => a + b) / bufferLength;

    // Bersihkan canvas sebelum menggambar ulang
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Tambahkan gelembung baru berdasarkan volume
    addBubble(volume);

    // Update dan gambar semua gelembung
    bubbles.forEach((bubble, index) => {
        bubble.update();
        bubble.draw();

        // Hapus gelembung kecil yang sudah hampir hilang
        if (bubble.size <= 0.5 || (bubble.alpha && bubble.alpha < 0.1)) {
        bubbles.splice(index, 1);
        }
    });
    }

    // Jalankan fungsi ini lagi di frame berikutnya
    animationId = requestAnimationFrame(animate);
}

// Fungsi untuk menambahkan satu gelembung berdasarkan volume
function addBubble(volume) {
    // Ukuran gelembung berdasarkan volume (maks 30)
    const size = Math.min(30, volume / 2);
    bubbles.push(new Bubble(size));
}

// Fungsi untuk menghasilkan warna berdasarkan mode
function generateColor() {
    switch (colorMode) {
    case 'grayscale':
        const gray = Math.floor(Math.random() * 256);
        return `rgb(${gray}, ${gray}, ${gray})`;
    
    case 'rainbow':
        return `hsl(${Math.random() * 360}, 100%, 50%)`;
    
    case 'random':
    default:
        const r = Math.floor(Math.random() * 256);
        const g = Math.floor(Math.random() * 256);
        const b = Math.floor(Math.random() * 256);
        return `rgb(${r}, ${g}, ${b})`;
    }
}

// Class Bubble untuk mendefinisikan objek gelembung
class Bubble {
    constructor(size) {
    this.x = Math.random() * canvas.width; // Posisi horizontal acak
    this.y = canvas.height + 10; // Mulai dari bawah layar
    this.size = size; // Ukuran awal
    this.speed = 1 + Math.random() * 3; // Kecepatan naik
    this.color = generateColor(); // Warna berdasarkan mode
    this.isUserCreated = false; // Flag untuk bubble buatan user
    this.alpha = 1; // Transparansi
    this.explosionBubble = false; // Flag untuk bubble eksplosion
    this.rotation = 0; // Rotasi untuk efek khusus
    this.pulsePhase = Math.random() * Math.PI * 2; // Phase untuk pulsing effect
    }

    // Fungsi update posisi dan ukuran
    update() {
    if (this.explosionBubble) {
        // Bubble eksplosion bergerak ke segala arah
        this.y -= this.speed * speedMultiplier * 0.7;
        this.size *= 0.97; // Mengecil lebih cepat
        this.rotation += 0.1;
    } else if (this.isUserCreated) {
        // Bubble buatan user bergerak lebih lambat dan memiliki efek pulse
        this.y -= this.speed * speedMultiplier * 0.8;
        this.size *= 0.985; // Mengecil lebih lambat
        
        // Pulsing effect
        this.pulsePhase += 0.15;
        const pulseMultiplier = 1 + Math.sin(this.pulsePhase) * 0.1;
        this.currentSize = this.size * pulseMultiplier;
    } else {
        // Bubble audio normal
        this.y -= this.speed * speedMultiplier;
        this.size *= 0.99;
        this.currentSize = this.size;
    }
    
    // Fade out effect untuk bubble dengan alpha
    if (this.alpha < 1) {
        this.alpha *= 0.98;
    }
    }

    // Fungsi menggambar bubble ke canvas
    draw() {
    ctx.save();
    
    // Set alpha jika ada
    if (this.alpha < 1) {
        ctx.globalAlpha = this.alpha;
    }
    
    // Rotasi jika diperlukan
    if (this.rotation > 0) {
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);
        ctx.translate(-this.x, -this.y);
    }
    
    // Gambar bubble
    ctx.beginPath();
    const drawSize = this.currentSize || this.size;
    ctx.arc(this.x, this.y, drawSize, 0, Math.PI * 2);
    ctx.fillStyle = this.color;
    ctx.fill();
    
    // Tambahkan outline untuk bubble buatan user
    if (this.isUserCreated) {
        ctx.strokeStyle = this.color;
        ctx.lineWidth = 2;
        ctx.stroke();
    }
    
    ctx.closePath();
    ctx.restore();
    }
}

// Inisialisasi theme berdasarkan preferensi sistem
function initializeTheme() {
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) {
    themeToggle.checked = true;
    document.body.setAttribute('data-theme', 'light');
    }
}

// Resize canvas ketika ukuran window berubah
window.addEventListener('resize', () => {
    canvas.width = window.innerWidth * 0.9;
    canvas.height = window.innerHeight * 0.7;
});

// Inisialisasi theme saat halaman dimuat
initializeTheme();
