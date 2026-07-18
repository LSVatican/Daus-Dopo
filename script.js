// Konfigurasi Durasi Sholat (dalam satuan MENIT)
const durasiSholat = {
    Fajr: 5,    // Subuh 5 menit
    Dhuhr: 5,   // Dzuhur 5 menit
    Asr: 5,     // Ashar 5px
    Maghrib: 5, // Maghrib 5 menit
    Isha: 5     // Isya 5 menit
};

let jadwalSholat = {};
let isSholatMode = false;
let sholatEndTime = null;
let sholatNameActive = "";

// 1. Ambil Data Jadwal Sholat dari API (Tulungagung sebagai default)
async function getPrayerTimes() {
    try {
        // Menggunakan koordinat Tulungagung
        const response = await fetch('https://api.aladhan.com/v1/timingsByCity?city=Tulungagung&country=Indonesia&method=2');
        const data = await response.json();
        const timings = data.data.timings;
        
        // Simpan ke object global
        jadwalSholat = {
            Fajr: timings.Fajr,
            Dhuhr: timings.Dhuhr,
            Asr: timings.Asr,
            Maghrib: timings.Maghrib,
            Isha: timings.Isha
        };

        // Tampilkan ke UI
        document.getElementById('shubuh-time').innerText = timings.Fajr;
        document.getElementById('dhuhr-time').innerText = timings.Dhuhr;
        document.getElementById('asr-time').innerText = timings.Asr;
        document.getElementById('maghrib-time').innerText = timings.Maghrib;
        document.getElementById('isha-time').innerText = timings.Isha;

    } catch (error) {
        console.error("Gagal mengambil jadwal sholat:", error);
    }
}

// Helper format angka agar selalu 2 digit (misal 5 menjadi 05)
function padZero(num) {
    return num.toString().padStart(2, '0');
}

// 2. Sistem Validasi dan Loop Jam Utama
function updateClock() {
    const now = new Date();
    
    // Format Jam Real-Time Normal
    const hours = padZero(now.getHours());
    const minutes = padZero(now.getMinutes());
    const seconds = padZero(now.getSeconds());
    const currentTimeString = `${hours}:${minutes}`;

    const clockDisplay = document.getElementById('digital-clock');
    const statusLabel = document.getElementById('status-label');
    const container = document.querySelector('.clock-card');

    // Cek apakah sedang dalam masa durasi sholat
    if (isSholatMode) {
        const timeDiff = sholatEndTime - now;

        if (timeDiff > 0) {
            // Hitung sisa waktu Countdown
            const countdownMin = padZero(Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60)));
            const countdownSec = padZero(Math.floor((timeDiff % (1000 * 60)) / 1000));
            
            statusLabel.innerText = `WAKTU SHOLAT ${sholatNameActive.toUpperCase()}`;
            clockDisplay.innerText = `${countdownMin}:${countdownSec}`;
            container.classList.add('mode-sholat');
            return; // Berhenti di sini agar tidak overwrite dengan jam asli
        } else {
            // Durasi sholat habis, kembalikan ke normal
            isSholatMode = false;
            container.classList.remove('mode-sholat');
            document.querySelectorAll('.prayer-time').forEach(el => el.classList.remove('active'));
        }
    }

    // Jika normal, jalankan jam asli
    statusLabel.innerText = "WAKTU SEKARANG";
    clockDisplay.innerText = `${hours}:${seconds.split('').map(()=>'').join('') === '' ? seconds : seconds}`; 
    clockDisplay.innerHTML = `${hours}:${minutes}<span style="font-size:1.8rem; color:#8a8d9b;">:${seconds}</span>`;

    // Cek kecocokan waktu sekarang dengan jadwal sholat 
    Object.keys(jadwalSholat).forEach(sholat => {
        if (currentTimeString === jadwalSholat[sholat]) {
            // Trigger masuk mode sholat jika belum aktif
            isSholatMode = true;
            sholatNameActive = sholat;
            
            // Tentukan kapan waktu hitung mundur selesai
            sholatEndTime = new Date(now.getTime() + durasiSholat[sholat] * 60000);
            
            // Mainkan efek suara alarm/pemberitahuan
            document.getElementById('notification-sound').play();
            
            // Beri tanda aktif pada list jadwal
            highlightActiveSholat(sholat);
        }
    });

    // Tampilkan Tanggal
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    document.getElementById('date-display').innerText = now.toLocaleDateString('id-ID', options);
}

function highlightActiveSholat(sholat) {
    document.querySelectorAll('.prayer-time').forEach(el => el.classList.remove('active'));
    if(sholat === 'Fajr') document.getElementById('shubuh-card').classList.add('active');
    if(sholat === 'Dhuhr') document.getElementById('dhuhr-card').classList.add('active');
    if(sholat === 'Asr') document.getElementById('asr-card').classList.add('active');
    if(sholat === 'Maghrib') document.getElementById('maghrib-card').classList.add('active');
    if(sholat === 'Isha') document.getElementById('isha-card').classList.add('active');
}

// Jalankan fungsi
getPrayerTimes();
setInterval(updateClock, 1000);

// Meminta izin notifikasi saat aplikasi dibuka
if (Notification.permission !== "granted") Notification.requestPermission();

function openModal(type) { document.getElementById(type + '-modal').style.display = 'flex'; if(type==='list') renderReminders(); }
function closeModal(type) { document.getElementById(type + '-modal').style.display = 'none'; }

function saveReminder() {
    let title = document.getElementById('rem-title').value;
    let time = document.getElementById('rem-time').value;
    let repeat = document.getElementById('rem-repeat').value;
    let desc = document.getElementById('rem-desc').value;

    if(!title || !time) return alert("Mohon isi judul dan waktu!");

    let reminders = JSON.parse(localStorage.getItem('myReminders') || '[]');
    reminders.push({ id: Date.now(), title, time, repeat, desc, triggered: false });
    localStorage.setItem('myReminders', JSON.stringify(reminders));
    
    closeModal('create');
    alert("Pengingat disimpan!");
}

function renderReminders() {
    let list = JSON.parse(localStorage.getItem('myReminders') || '[]');
    let container = document.getElementById('reminder-list');
    container.innerHTML = list.map(item => `
        <div class="list-item">
            <span><b>${item.title}</b> (${item.time})</span>
            <button onclick="deleteReminder(${item.id})" style="background:red; color:white; border:none; padding:5px; border-radius:5px;">Hapus</button>
        </div>
    `).join('');
}

function deleteReminder(id) {
    if(confirm("Yakin ingin menghapus acara ini?")) {
        let reminders = JSON.parse(localStorage.getItem('myReminders') || '[]');
        reminders = reminders.filter(r => r.id !== id);
        localStorage.setItem('myReminders', JSON.stringify(reminders));
        renderReminders();
    }
}

// Cek waktu pengingat setiap detik (di dalam fungsi setInterval utama)
function checkReminders() {
    let reminders = JSON.parse(localStorage.getItem('myReminders') || '[]');
    let now = new Date();
    let currTime = `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;

    reminders.forEach(item => {
        if (item.time === currTime && !item.triggered) {
            new Notification("Pengingat: " + item.title, { body: item.desc || "Waktunya acara!" });
            item.triggered = true;
            
            // Hapus jika tidak harian
            if (item.repeat === 'once') {
                reminders = reminders.filter(r => r.id !== item.id);
            }
        } else if (item.time !== currTime) {
            item.triggered = false; // Reset trigger saat waktu sudah lewat
        }
    });
    localStorage.setItem('myReminders', JSON.stringify(reminders));
}

// Tambahkan panggil fungsi checkReminders ke dalam setInterval yang sudah ada
// setInterval(() => { updateClock(); checkReminders(); }, 1000);
