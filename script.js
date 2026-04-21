/* ==================================================
   ENERGISCAN PREMIUM - FINAL SCRIPT
   - Fix path maskot: "maskot/" bukan "assets/"
   - Fix nama file: remap mode ke file yang ada
   - Fix canvas vektor: responsive + normalisasi
   - Fix hapusAlat: pakai closest()
   - Fix hari: dinamis bukan hardcode 30
   - Restore: slider simulasi, tips kontekstual,
              peringatan kombinasi berbahaya
================================================== */

let currentTarif = 0;
let currentVA    = 0;
let myChart      = null;
let lastResults  = [];

/* ==================================================
   PRESET ALAT
================================================== */
const PRESETS = [
  { nama: "Lampu LED",    watt: 10  },
  { nama: "Kipas Angin",  watt: 50  },
  { nama: "TV LED",       watt: 80  },
  { nama: "Laptop",       watt: 65  },
  { nama: "Kulkas",       watt: 120 },
  { nama: "Pompa Air",    watt: 250 },
  { nama: "Rice Cooker",  watt: 300 },
  { nama: "Setrika",      watt: 350 },
  { nama: "Mesin Cuci",   watt: 400 },
  { nama: "AC 1 PK",      watt: 800 },
];

/* ==================================================
   TIPS KONTEKSTUAL (hanya tampil jika alat ada di list)
================================================== */
const TIPS_KONTEKSTUAL = [
  { keywords: ['ac', 'air conditioner', 'pendingin'],
    tips: [
      "Atur suhu AC di 24–26°C. Setiap 1°C lebih dingin menambah konsumsi sekitar 6%.",
      "Bersihkan filter AC setiap 2 minggu — filter kotor bisa menambah konsumsi daya hingga 15%.",
      "Gunakan timer AC agar tidak menyala sepanjang malam tanpa perlu.",
    ]},
  { keywords: ['kulkas', 'lemari es'],
    tips: [
      "Jaga kulkas terisi 70–80% — terlalu kosong atau penuh membuatnya bekerja ekstra.",
      "Jangan taruh makanan panas langsung ke kulkas — tunggu dingin dulu.",
    ]},
  { keywords: ['setrika'],
    tips: [
      "Setrika baju sekaligus dalam satu sesi — memanaskan setrika berkali-kali justru boros.",
    ]},
  { keywords: ['mesin cuci', 'laundry', 'cuci'],
    tips: [
      "Gunakan mesin cuci saat kapasitas penuh — satu cucian penuh lebih hemat dari dua setengah.",
    ]},
  { keywords: ['tv', 'televisi', 'monitor'],
    tips: [
      "Matikan TV saat tidak ditonton — mode standby tetap memakai daya.",
    ]},
  { keywords: ['lampu', 'led'],
    tips: [
      "Manfaatkan cahaya alami di siang hari dan matikan lampu yang tidak digunakan.",
    ]},
  { keywords: ['laptop', 'pc', 'komputer', 'desktop'],
    tips: [
      "Aktifkan mode sleep saat tidak digunakan lebih dari 10 menit.",
    ]},
  { keywords: ['pompa', 'air'],
    tips: [
      "Gunakan tandon air agar pompa tidak harus menyala setiap kali ada yang pakai air.",
    ]},
  { keywords: ['rice cooker', 'magic com', 'penanak'],
    tips: [
      "Pindahkan nasi ke wadah termos setelah matang — mode warm terus menarik daya.",
    ]},
  { keywords: ['kipas', 'fan'],
    tips: [
      "Kombinasikan kipas + AC suhu lebih tinggi — jauh lebih hemat dari AC dingin sendirian.",
    ]},
];

const TIPS_UMUM = [
  "Cabut charger dan adaptor saat tidak digunakan — standby power bisa menyedot hingga 10% tagihan.",
  "Gunakan stopkontak bersaklar agar mudah memutus daya beberapa perangkat sekaligus.",
  "Cek label hemat energi saat beli alat baru — pilih rating bintang lebih tinggi.",
];

/* ==================================================
   DATABASE KOMBINASI BERBAHAYA
================================================== */
const ALAT_BERAT = [
  { id: 'ac',       keywords: ['ac ',  'air conditioner', 'pendingin'],        label: 'AC'            },
  { id: 'setrika',  keywords: ['setrika'],                                      label: 'Setrika'       },
  { id: 'cuci',     keywords: ['mesin cuci', 'laundry'],                        label: 'Mesin Cuci'    },
  { id: 'pompa',    keywords: ['pompa'],                                         label: 'Pompa Air'     },
  { id: 'ricecook', keywords: ['rice cooker', 'magic com', 'penanak'],           label: 'Rice Cooker'   },
  { id: 'water',    keywords: ['water heater', 'pemanas air'],                   label: 'Water Heater'  },
  { id: 'kompor',   keywords: ['kompor listrik', 'induction', 'induksi'],        label: 'Kompor Listrik'},
];

const KOMBINASI_BAHAYA = [
  { combo: ['ac', 'setrika'], level: 'merah',
    judul: '⚠️ Kombinasi Risiko Tinggi',
    pesan: 'AC dan setrika keduanya berdaya besar. Hindari menyalakan bersamaan — MCB bisa trip.' },
  { combo: ['ac', 'cuci'], level: 'kuning',
    judul: '⚡ Perhatikan Beban Daya',
    pesan: 'AC dan mesin cuci bersamaan cukup membebani MCB. Gunakan bergantian.' },
  { combo: ['setrika', 'cuci'], level: 'kuning',
    judul: '⚡ Perhatikan Beban Daya',
    pesan: 'Setrika dan mesin cuci sama-sama berdaya besar. Gunakan bergantian.' },
  { combo: ['ac', 'water'], level: 'kuning',
    judul: '⚡ Perhatikan Beban Daya',
    pesan: 'AC dan water heater bersamaan cukup berat. Matikan salah satu saat lainnya menyala.' },
  { combo: ['setrika', 'ricecook'], level: 'kuning',
    judul: '⚡ Jadwalkan Penggunaan',
    pesan: 'Setrika dan rice cooker sebaiknya tidak bersamaan. Tunggu nasi matang, baru setrika.' },
  { combo: ['kompor', 'setrika'], level: 'merah',
    judul: '⚠️ Kombinasi Risiko Tinggi',
    pesan: 'Kompor listrik dan setrika adalah dua beban terbesar. Jangan nyalakan bersamaan.' },
];

/* ==================================================
   MASKOT VECTO
   Mode yang tersedia (sesuai file di folder maskot/):
   happy, shock, confused, smart, sleepy, energy
================================================== */
const MASKOT_PATH = "maskot/";

const MASKOT_MAP = {
  happy:    "vecto-happy.png",
  shock:    "vecto-shock.png",
  confused: "vecto-confused.png",
  smart:    "vecto-smart.png",
  sleepy:   "vecto-sleepy.png",
  energy:   "vecto-energy.png",
};

function gantiVecto(mode = "happy") {
  const img = document.getElementById("vecto-img");
  if (!img) return;
  const file = MASKOT_MAP[mode] || MASKOT_MAP["happy"];
  img.src = MASKOT_PATH + file;
}

function tampilkanVecto(judul, pesan, mode = "happy") {
  document.getElementById("v-title").innerText = judul;
  document.getElementById("v-msg").innerText   = pesan;
  gantiVecto(mode);
  document.getElementById("vecto-popup").classList.remove("hidden");
}

function tutupPopup() {
  document.getElementById("vecto-popup").classList.add("hidden");
}

/* ==================================================
   NAVIGASI
================================================== */
function navigasi(id) {
  document.querySelectorAll(".screen").forEach(s => s.classList.remove("active"));
  document.getElementById(id).classList.add("active");
}

/* ==================================================
   INISIALISASI
================================================== */
window.onload = () => {
  renderPresets();
  tambahAlat();
  tampilkanVecto(
    "Halo, Saya Vecto ⚡",
    "Selamat datang di EnergiScan! Yuk cek konsumsi listrik rumahmu.",
    "happy"
  );
};

/* ==================================================
   PILIH DAYA VA
================================================== */
document.getElementById("select-va").addEventListener("change", function () {
  const opt     = this.options[this.selectedIndex];
  currentTarif  = parseInt(this.value);
  currentVA     = parseInt(opt.dataset.va);

  document.getElementById("btn-next").disabled = false;

  document.getElementById("info-tarif").innerHTML = `
    <h3>💡 Informasi Tarif</h3>
    <p>Daya Rumah: <b>${currentVA} VA</b></p>
    <p>Tarif PLN: <b>Rp ${currentTarif.toLocaleString("id-ID")}/kWh</b></p>
    <p style="margin-top:10px; font-size:0.85rem; color:#475569;">
      Tarif ini digunakan untuk menghitung estimasi tagihan bulananmu.
    </p>
  `;

  tampilkanVecto(
    "Daya Berhasil Dipilih ⚡",
    `Rumahmu memakai daya ${currentVA} VA dengan tarif Rp ${currentTarif.toLocaleString("id-ID")}/kWh.`,
    "energy"
  );
});

/* ==================================================
   RENDER PRESET
================================================== */
function renderPresets() {
  const wrap = document.getElementById("preset-grid");
  wrap.innerHTML = "";
  PRESETS.forEach(item => {
    const btn = document.createElement("button");
    btn.className = "preset-btn";
    btn.innerHTML = `${item.nama}<br><small>${item.watt} W</small>`;
    btn.onclick   = () => tambahAlat(item.nama, item.watt);
    wrap.appendChild(btn);
  });
}

/* ==================================================
   TAMBAH / HAPUS ALAT
================================================== */
function tambahAlat(nama = "", watt = "") {
  const wrap = document.getElementById("list-alat");
  const row  = document.createElement("div");
  row.className = "glass-card alat-row no-hover";
  row.innerHTML = `
    <div class="alat-top">
      <input type="text"   class="modern-input n" placeholder="Nama alat" value="${nama}" oninput="updateKontekstualWarning()">
      <button class="btn-hapus" onclick="hapusAlat(this)">✕</button>
    </div>
    <div class="alat-bottom">
      <input type="number" class="modern-input w" placeholder="Watt" min="0" value="${watt}" oninput="updateKontekstualWarning()">
      <input type="number" class="modern-input j" placeholder="Jam / hari" min="0" max="24">
    </div>
  `;
  wrap.appendChild(row);
  updateKontekstualWarning();
}

function hapusAlat(btn) {
  btn.closest(".alat-row").remove();
  updateKontekstualWarning();
}

document.getElementById("add-item").onclick = () => tambahAlat();

/* ==================================================
   PERINGATAN KONTEKSTUAL
================================================== */
function updateKontekstualWarning() {
  const card = document.getElementById("warning-beban");

  // Kumpulkan nama alat yang sudah diisi watt-nya
  const namaAlat = [];
  document.querySelectorAll("#list-alat .alat-row").forEach(item => {
    const n = (item.querySelector(".n").value || "").toLowerCase().trim();
    const w = parseFloat(item.querySelector(".w").value) || 0;
    if (n && w > 0) namaAlat.push(n);
  });

  if (namaAlat.length === 0) { card.style.display = "none"; return; }

  // Identifikasi alat berat yang ada
  const alatBeratDitemukan = ALAT_BERAT.filter(ab =>
    namaAlat.some(n => ab.keywords.some(k => n.includes(k)))
  );

  // Cari kombinasi berbahaya
  const peringatan = [];
  KOMBINASI_BAHAYA.forEach(kb => {
    if (kb.combo.every(id => alatBeratDitemukan.some(ab => ab.id === id))) {
      peringatan.push(kb);
    }
  });

  // Jika ada 3+ alat berat tanpa kombinasi merah
  if (alatBeratDitemukan.length >= 3 && !peringatan.some(p => p.level === "merah")) {
    peringatan.push({
      level: "kuning",
      judul: "⚡ Banyak Alat Berdaya Besar",
      pesan: `Kamu punya ${alatBeratDitemukan.length} alat berdaya besar (${alatBeratDitemukan.map(a => a.label).join(", ")}). Buat jadwal penggunaan bergantian agar tidak overload.`
    });
  }

  if (peringatan.length === 0) { card.style.display = "none"; return; }

  // Tampilkan level tertinggi (merah > kuning)
  peringatan.sort((a, b) => (a.level === "merah" ? -1 : 1));
  const dominan = peringatan[0];

  card.className    = `warning-beban-card level-${dominan.level}`;
  card.style.display = "block";
  card.innerHTML = `
    <h4>${dominan.judul}</h4>
    ${peringatan.map(p => `
      <div class="warning-item">
        ${p.judul !== dominan.judul ? `<strong>${p.judul}</strong>` : ""}
        ${p.pesan}
      </div>`).join("")}
  `;
}

/* ==================================================
   PROSES DATA
================================================== */
function prosesData() {
  const rows = document.querySelectorAll(".alat-row");

  let totalKwh = 0;
  const labels = [], values = [];
  lastResults  = [];

  // Hitung hari bulan ini secara dinamis
  const hariSebulan = new Date(
    new Date().getFullYear(),
    new Date().getMonth() + 1,
    0
  ).getDate();

  rows.forEach(row => {
    const nama = row.querySelector(".n").value.trim() || "Alat";
    const watt = Math.abs(parseFloat(row.querySelector(".w").value)) || 0;
    const jam  = Math.abs(parseFloat(row.querySelector(".j").value)) || 0;

    if (watt > 0 && jam > 0) {
      const kwh = (watt * jam * hariSebulan) / 1000;
      totalKwh += kwh;
      labels.push(nama);
      values.push(parseFloat(kwh.toFixed(2)));
      lastResults.push({ nama, watt, jam, kwh });
    }
  });

  if (totalKwh <= 0) {
    tampilkanVecto(
      "Data Belum Lengkap 😅",
      "Isi nama alat, watt, dan jam pemakaian dulu ya.",
      "confused"
    );
    return;
  }

  const totalRp = totalKwh * currentTarif;

  document.getElementById("out-kwh").innerText = totalKwh.toFixed(1) + " kWh";
  document.getElementById("out-rp").innerText  = "Rp " + totalRp.toLocaleString("id-ID");

  navigasi("p-result");

  updateChart(labels, values);
  updateTips(totalKwh);
  updateSimulasi();
  updateInfoTambahan(totalKwh);
  gambarVektor();

  // Smart Diagnosis
  const biang = lastResults.find(r => (r.kwh / totalKwh) > 0.4);
  if (biang) {
    tampilkanVecto(
      "🔍 Ketemu Biang Borosnya!",
      `"${biang.nama}" memakan lebih dari 40% total listrikmu. Kurangi jam pakainya!`,
      "shock"
    );
  } else if (totalKwh > 200) {
    tampilkanVecto(
      "⚠️ Konsumsi Cukup Tinggi!",
      "Lihat grafik dan simulasi hemat di bawah untuk menemukan cara berhemat.",
      "confused"
    );
  } else {
    tampilkanVecto(
      "Analisis Selesai 🚀",
      "Konsumsimu masih wajar. Scroll ke bawah untuk lihat detail lengkap!",
      "happy"
    );
  }
}

/* ==================================================
   CHART
================================================== */
function updateChart(labels, values) {
  const ctx = document.getElementById("myChart");
  if (myChart) myChart.destroy();
  myChart = new Chart(ctx, {
    type: "doughnut",
    data: {
      labels,
      datasets: [{
        data: values,
        backgroundColor: [
          "#3d5afe","#00c6ff","#f59e0b","#22c55e",
          "#ef4444","#8b5cf6","#14b8a6","#f97316",
          "#f472b6","#4ade80","#facc15","#38bdf8"
        ]
      }]
    },
    options: {
      responsive: true,
      plugins: { legend: { position: "bottom" } }
    }
  });
}

/* ==================================================
   TIPS KONTEKSTUAL
================================================== */
function updateTips(totalKwh) {
  const namaUser = lastResults.map(r => r.nama.toLowerCase());

  let tipsRelevan = [];
  TIPS_KONTEKSTUAL.forEach(entry => {
    const cocok = namaUser.some(n => entry.keywords.some(k => n.includes(k)));
    if (cocok) tipsRelevan.push(...entry.tips);
  });
  if (tipsRelevan.length === 0) tipsRelevan = [...TIPS_UMUM];

  const tipTerpilih = tipsRelevan[Math.floor(Math.random() * tipsRelevan.length)];

  const biang = lastResults.find(r => (r.kwh / totalKwh) > 0.4);
  const saranBiang = biang
    ? `<p style="margin-top:12px; padding-top:12px; border-top:1px solid #bfdbfe;">
         <strong style="color:#1d4ed8;">⚠️ Perhatian Khusus:</strong><br>
         Kurangi jam pemakaian <strong>${biang.nama}</strong> — alat ini menyumbang
         <strong>${((biang.kwh / totalKwh) * 100).toFixed(0)}%</strong> dari total konsumsimu.
       </p>`
    : "";

  document.getElementById("v-tips").innerHTML = `
    <h3>💡 Tips Hemat dari Vecto</h3>
    <p>${tipTerpilih}</p>
    ${saranBiang}
  `;
}

/* ==================================================
   INFO TAMBAHAN
================================================== */
function updateInfoTambahan(totalKwh) {
  let totalWatt = lastResults.reduce((sum, r) => sum + r.watt, 0);

  let status  = "✅ Aman";
  let ekspresi = "happy";
  if (totalWatt > currentVA) {
    status   = "🔴 Overload";
    ekspresi = "shock";
  } else if (totalWatt > currentVA * 0.8) {
    status   = "🟡 Mendekati Batas";
    ekspresi = "confused";
  }

  gantiVecto(ekspresi);

  document.getElementById("profil-rumah").innerHTML = `
    <div class="info-line">Daya Rumah: <b>${currentVA} VA</b></div>
    <div class="info-line">Total Beban: <b>${totalWatt} W</b></div>
    <div class="info-line">Status: <b>${status}</b></div>
    <div class="info-line">Tarif: <b>Rp ${currentTarif.toLocaleString("id-ID")}/kWh</b></div>
  `;

  // Fakta energi disesuaikan dengan alat yang diinput
  const namaUser = lastResults.map(r => r.nama.toLowerCase());
  const adaAC    = namaUser.some(n => n.includes("ac") || n.includes("pendingin"));
  const adaLED   = namaUser.some(n => n.includes("lampu") || n.includes("led"));
  const faktaList = [
    "1 kWh = menggunakan 1000 watt selama 1 jam penuh.",
    adaAC  ? "AC adalah salah satu alat paling boros — pertimbangkan timer." : "Gunakan alat berdaya rendah untuk aktivitas ringan.",
    adaLED ? "Lampu LED yang kamu pakai sudah hemat ~80% vs lampu pijar." : "Beralih ke lampu LED bisa hemat hingga 80% biaya penerangan.",
  ];
  document.getElementById("fakta-energi").innerHTML =
    faktaList.map(f => `<div class="info-line">${f}</div>`).join("");

  // Rekomendasi berdasarkan data nyata
  const paling_boros = [...lastResults].sort((a, b) => b.kwh - a.kwh)[0];
  document.getElementById("ai-analisa").innerHTML = `
    <div class="info-line">
      Alat paling boros: <b>${paling_boros.nama}</b> (${paling_boros.kwh.toFixed(1)} kWh)
    </div>
    <div class="info-line">Gunakan simulasi hemat di bawah untuk kurangi durasi alat boros.</div>
    <div class="info-line">Hindari menyalakan alat berdaya besar secara bersamaan.</div>
  `;
}

/* ==================================================
   VISUALISASI VEKTOR (responsive + normalisasi)
================================================== */
function gambarVektor() {
  const canvas = document.getElementById("vectorCanvas");
  const ctx    = canvas.getContext("2d");

  // Set resolusi canvas sesuai lebar aktual (fix mobile distorsi)
  const W = canvas.offsetWidth || 600;
  const H = Math.round(W * 0.52);
  canvas.width  = W;
  canvas.height = H;

  ctx.clearRect(0, 0, W, H);

  const ox = Math.round(W * 0.12);
  const oy = Math.round(H * 0.82);

  // Gambar sumbu
  ctx.strokeStyle = "#334155";
  ctx.lineWidth   = 2;
  ctx.beginPath();
  ctx.moveTo(ox, H * 0.08);
  ctx.lineTo(ox, oy);
  ctx.lineTo(W * 0.94, oy);
  ctx.stroke();

  // Label sumbu
  ctx.fillStyle  = "#64748b";
  ctx.font       = `${Math.max(11, W * 0.018)}px Segoe UI`;
  ctx.fillText("Daya Ringan (W)", W * 0.5, oy + 28);
  ctx.save();
  ctx.translate(ox - 24, H * 0.4);
  ctx.rotate(-Math.PI / 2);
  ctx.fillText("Daya Sedang/Berat (W)", 0, 0);
  ctx.restore();

  // Pisahkan alat ringan (≤100W) vs sedang-berat (>100W)
  let ringan = 0, sedang = 0;
  lastResults.forEach(r => {
    if (r.watt <= 100) ringan += r.watt;
    else               sedang += r.watt;
  });

  // Normalisasi agar panah selalu muat di canvas
  const maxX    = W * 0.78 - ox;
  const maxY    = oy - H * 0.1;
  const rawX    = ringan;
  const rawY    = sedang;
  const scale   = Math.min(maxX / (rawX || 1), maxY / (rawY || 1), 0.45);

  const px = ox + rawX * scale;
  const py = oy - rawY * scale;

  // Gambar tiga panah
  if (rawX > 0) drawArrow(ctx, ox, oy, px, oy,  "#22c55e", W);
  if (rawY > 0) drawArrow(ctx, ox, oy, ox, py,  "#f59e0b", W);
  if (rawX > 0 || rawY > 0) drawArrow(ctx, ox, oy, px, py, "#3d5afe", W);

  // Label panah
  const fs = Math.max(11, W * 0.018);
  ctx.font = `600 ${fs}px Segoe UI`;
  if (rawX > 0) { ctx.fillStyle = "#22c55e"; ctx.fillText(`X: ${ringan} W`, (ox + px) / 2, oy - 10); }
  if (rawY > 0) { ctx.fillStyle = "#f59e0b"; ctx.fillText(`Y: ${sedang} W`, ox + 8, (oy + py) / 2); }
  if (rawX > 0 || rawY > 0) { ctx.fillStyle = "#3d5afe"; ctx.fillText("Resultan", px + 8, py - 6); }

  const R = Math.sqrt(ringan ** 2 + sedang ** 2);
  document.getElementById("vektor-output").innerHTML = `
    🟢 Komponen X (Alat Ringan ≤100W): <b>${ringan} W</b><br>
    🟡 Komponen Y (Alat Sedang/Berat >100W): <b>${sedang} W</b><br>
    🔵 Vektor Resultan Total: <b>${R.toFixed(1)} W</b>
  `;
}

function drawArrow(ctx, x1, y1, x2, y2, color, W) {
  const headSize = Math.max(8, W * 0.016);
  ctx.strokeStyle = color;
  ctx.fillStyle   = color;
  ctx.lineWidth   = Math.max(2, W * 0.005);

  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();

  const angle = Math.atan2(y2 - y1, x2 - x1);
  ctx.beginPath();
  ctx.moveTo(x2, y2);
  ctx.lineTo(x2 - headSize * Math.cos(angle - 0.4), y2 - headSize * Math.sin(angle - 0.4));
  ctx.lineTo(x2 - headSize * Math.cos(angle + 0.4), y2 - headSize * Math.sin(angle + 0.4));
  ctx.closePath();
  ctx.fill();
}

/* ==================================================
   SIMULASI HEMAT (dengan slider interaktif)
================================================== */
function updateSimulasi() {
  const wrap = document.getElementById("simulasi-list");
  wrap.innerHTML = "";

  const hariSebulan = new Date(
    new Date().getFullYear(),
    new Date().getMonth() + 1,
    0
  ).getDate();

  lastResults.forEach((alat, i) => {
    const div = document.createElement("div");
    div.className = "sim-row";
    div.innerHTML = `
      <div class="sim-top">
        <span class="sim-nama">${alat.nama}</span>
        <span class="sim-saving" id="saving-${i}"></span>
      </div>
      <div class="sim-bottom">
        <span>${alat.jam} jam asli</span>
        <input
          type="range"
          class="sim-slider"
          min="0" max="${alat.jam}" step="0.5" value="${alat.jam}"
          data-index="${i}"
          data-watt="${alat.watt}"
          data-jam-asli="${alat.jam}"
          oninput="hitungHemat(this, ${hariSebulan})"
        >
        <span class="sim-jam-baru" id="jam-baru-${i}">${alat.jam} jam</span>
      </div>
    `;
    wrap.appendChild(div);
  });

  const totalEl = document.getElementById("total-hemat");
  totalEl.style.display = "none";
}

function hitungHemat(slider, hariSebulan) {
  const i       = parseInt(slider.dataset.index);
  const watt    = parseFloat(slider.dataset.watt);
  const jamAsli = parseFloat(slider.dataset.jamAsli);
  const jamBaru = parseFloat(slider.value);

  document.getElementById(`jam-baru-${i}`).innerText = jamBaru.toFixed(1) + " jam";

  const kwhHemat = (watt * (jamAsli - jamBaru) * hariSebulan) / 1000;
  const rpHemat  = kwhHemat * currentTarif;

  document.getElementById(`saving-${i}`).innerText =
    rpHemat > 0 ? `Hemat Rp ${Math.round(rpHemat).toLocaleString("id-ID")}` : "";

  // Total semua slider
  let totalHemat = 0;
  document.querySelectorAll(".sim-slider").forEach(s => {
    const kwhS = (parseFloat(s.dataset.watt) * (parseFloat(s.dataset.jamAsli) - parseFloat(s.value)) * hariSebulan) / 1000;
    totalHemat += kwhS * currentTarif;
  });

  const totalEl = document.getElementById("total-hemat");
  if (totalHemat > 0) {
    totalEl.style.display = "block";
    totalEl.innerHTML = `💰 Total potensi hemat: <strong>Rp ${Math.round(totalHemat).toLocaleString("id-ID")}/bulan</strong>`;
  } else {
    totalEl.style.display = "none";
  }
}