// Konfigurasi Durasi Sholat (dalam menit)
const durasiSholat = {
    Fajr: 5, Dhuhr: 5, Asr: 5, Maghrib: 5, Isha: 5
};

let jadwalSholat = {};
let isSholatMode = false;
let sholatEndTime = null;
let sholatNameActive = "";

async function getPrayerTimes() {
    try {
        const response = await fetch('https://api.aladhan.com/v1/timingsByCity?city=Tulungagung&country=Indonesia&method=2');
        const data = await response.json();
        const t = data.data.timings;
        
        jadwalSholat = { Fajr: t.Fajr, Dhuhr: t.Dhuhr, Asr: t.Asr, Maghrib: t.Maghrib, Isha: t.Isha };

        // Update UI
        document.getElementById('imsak-time').innerText = t.Imsak;
        document.getElementById('shubuh-time').innerText = t.Fajr;
        document.getElementById('dhuha-time').innerText = t.Sunrise; // Menggunakan data Sunrise API
        document.getElementById('dhuhr-time').innerText = t.Dhuhr;
        document.getElementById('asr-time').innerText = t.Asr;
        document.getElementById('maghrib-time').innerText = t.Maghrib;
        document.getElementById('isha-time').innerText = t.Isha;

        // Cek apakah ada sisa durasi dari sesi sebelumnya (setelah refresh)
        checkPersistedState();

    } catch (e) { console.error(e); }
}

function checkPersistedState() {
    const savedEnd = localStorage.getItem('sholatEndTime');
    const savedName = localStorage.getItem('sholatNameActive');
    
    if (savedEnd && savedName) {
        const endTime = new Date(parseInt(savedEnd));
        if (endTime > new Date()) {
            isSholatMode = true;
            sholatEndTime = endTime;
            sholatNameActive = savedName;
            highlightActiveSholat(savedName);
        } else {
            localStorage.removeItem('sholatEndTime');
            localStorage.removeItem('sholatNameActive');
        }
    }
}

function updateClock() {
    const now = new Date();
    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');
    const seconds = now.getSeconds().toString().padStart(2, '0');
    const currentTimeString = `${hours}:${minutes}`;

    const clockDisplay = document.getElementById('digital-clock');
    const container = document.querySelector('.clock-card');

    if (isSholatMode) {
        const timeDiff = sholatEndTime - now;
        if (timeDiff > 0) {
            const min = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60)).toString().padStart(2, '0');
            const sec = Math.floor((timeDiff % (1000 * 60)) / 1000).toString().padStart(2, '0');
            document.getElementById('status-label').innerText = `SHOLAT ${sholatNameActive.toUpperCase()}`;
            clockDisplay.innerText = `${min}:${sec}`;
            container.classList.add('mode-sholat');
            return;
        } else {
            isSholatMode = false;
            container.classList.remove('mode-sholat');
            localStorage.removeItem('sholatEndTime');
            localStorage.removeItem('sholatNameActive');
            document.querySelectorAll('.prayer-time').forEach(el => el.classList.remove('active'));
        }
    }

    // Jam Normal
    document.getElementById('status-label').innerText = "WAKTU SEKARANG";
    clockDisplay.innerHTML = `${hours}:${minutes}<span style="font-size:1.8rem; color:#8a8d9b;">:${seconds}</span>`;

    // Trigger Mode Sholat (hanya untuk waktu wajib)
    Object.keys(jadwalSholat).forEach(sholat => {
        if (currentTimeString === jadwalSholat[sholat]) {
            isSholatMode = true;
            sholatNameActive = sholat;
            sholatEndTime = new Date(now.getTime() + (durasiSholat[sholat] * 60000));
            
            // Simpan ke storage agar tidak reset saat refresh
            localStorage.setItem('sholatEndTime', sholatEndTime.getTime());
            localStorage.setItem('sholatNameActive', sholat);
            
            document.getElementById('notification-sound').play();
            highlightActiveSholat(sholat);
        }
    });

    document.getElementById('date-display').innerText = now.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
}

function highlightActiveSholat(sholat) {
    document.querySelectorAll('.prayer-time').forEach(el => el.classList.remove('active'));
    const map = { 'Fajr': 'shubuh-card', 'Dhuhr': 'dhuhr-card', 'Asr': 'asr-card', 'Maghrib': 'maghrib-card', 'Isha': 'isha-card' };
    if(map[sholat]) document.getElementById(map[sholat]).classList.add('active');
}

// Logika Tema (tetap)
const themeSelector = document.getElementById('bg-theme');
const savedTheme = localStorage.getItem('selectedTheme');
if (savedTheme) { document.body.setAttribute('data-theme', savedTheme); themeSelector.value = savedTheme; }
themeSelector.addEventListener('change', function() { document.body.setAttribute('data-theme', this.value); localStorage.setItem('selectedTheme', this.value); });

getPrayerTimes();
setInterval(updateClock, 1000);
