(function () {
  'use strict';

  function $(selector) { return document.querySelector(selector); }

  var radios = Array.prototype.slice.call(document.querySelectorAll('input[name="lagu"]'));
  var audios = Array.prototype.slice.call(document.querySelectorAll('.pemutar audio'));
  var jumlah = audios.length;

  var pemutar = $('.pemutar');
  var btnPlay = $('#btn-play');
  var btnPrev = $('#btn-prev');
  var btnNext = $('#btn-next');
  var btnShuffle = $('#btn-shuffle');
  var btnRepeat = $('#btn-repeat');
  var btnMute = $('#btn-mute');
  var btnLayar = $('#btn-layar');
  var progres = $('#progres');
  var volumeEl = $('#volume');
  var waktuNow = $('#waktu-now');
  var waktuTotal = $('#waktu-total');
  var pesanEl = $('#pesan');

  var terakhir = 0;        // nomor lagu yang terakhir dipilih
  var acak = false;
  var ulangi = 'off';      // 'off' | 'all' | 'one'
  var menggeser = false;   // true saat progress bar sedang digeser
  var volume = 0.7;
  var bisu = false;

  /* ---------- fungsi bantu ---------- */

  function nomorAktif() {
    for (var i = 0; i < radios.length; i++) {
      if (radios[i].checked) return i;
    }
    return 0;
  }

  function audioAktif() { return audios[nomorAktif()]; }

  function format(detik) {
    if (!isFinite(detik) || detik < 0) detik = 0;
    var m = Math.floor(detik / 60);
    var s = Math.floor(detik % 60);
    return m + ':' + (s < 10 ? '0' : '') + s;
  }

  function isiPersen(el, persen) {
    el.style.setProperty('--p', persen + '%');
  }

  function pesan(teks) { pesanEl.textContent = teks; }

  /* ---------- tampilan ---------- */

  function tampilWaktu() {
    var a = audioAktif();
    var total = isFinite(a.duration) ? a.duration : 0;
    progres.max = total || 100;
    if (!menggeser) progres.value = a.currentTime;
    var sekarang = menggeser ? parseFloat(progres.value) : a.currentTime;
    waktuNow.textContent = format(sekarang);
    waktuTotal.textContent = format(total);
    isiPersen(progres, total ? (sekarang / total) * 100 : 0);
    progres.setAttribute('aria-valuetext', format(sekarang) + ' dari ' + format(total));
  }

  function tampilPlay() {
    var main = !audioAktif().paused;
    pemutar.setAttribute('data-main', main ? 'ya' : 'tidak');
    btnPlay.setAttribute('aria-label', main ? 'Jeda' : 'Putar');
  }

  function tampilVolume() {
    var efektif = bisu ? 0 : volume;
    volumeEl.value = Math.round(efektif * 100);
    isiPersen(volumeEl, efektif * 100);
    btnMute.setAttribute('data-suara', efektif === 0 ? 'mati' : 'hidup');
    btnMute.setAttribute('aria-label', efektif === 0 ? 'Aktifkan suara' : 'Bisukan');
    audios.forEach(function (a) {
      a.volume = volume;
      a.muted = bisu;
    });
  }

  /* ---------- memutar ---------- */

  function putar() {
    var janji = audioAktif().play();
    if (janji && janji.catch) {
      janji.catch(function (err) {
        if (err && err.name !== 'AbortError') {
          pesan('Lagu tidak bisa diputar. Periksa nama file di folder music.');
        }
      });
    }
  }

 function pindah(nomor, langsungPutar) {
    nomor = (nomor + jumlah) % jumlah;
    audios.forEach(function (a, k) {
      a.pause();
      if (k !== nomor) a.currentTime = 0;
    });
    radios[nomor].checked = true;
    terakhir = nomor;
    audios[nomor].preload = 'metadata';
    pesan('');
    pemutar.classList.remove('muat');
    tampilWaktu();
    tampilPlay();
    if (langsungPutar) putar();
  }

  function berikutnya() {
    var sekarang = nomorAktif();
    if (jumlah < 2) {
      audios[0].currentTime = 0;
      putar();
      return;
    }
    var tujuan;
    if (acak) {
      do { tujuan = Math.floor(Math.random() * jumlah); } while (tujuan === sekarang);
    } else {
      tujuan = (sekarang + 1) % jumlah;
    }
    pindah(tujuan, true);
  }

  function sebelumnya() {
    var a = audioAktif();
    // lebih dari 3 detik: ulang dari awal. Kurang dari itu: lagu sebelumnya.
    if (a.currentTime > 3 || jumlah < 2) {
      a.currentTime = 0;
      tampilWaktu();
      return;
    }
    pindah(nomorAktif() - 1, true);
  }

  /* ---------- tombol ---------- */

  btnPlay.addEventListener('click', function () {
    var a = audioAktif();
    if (a.paused) putar(); else a.pause();
  });
  btnNext.addEventListener('click', berikutnya);
  btnPrev.addEventListener('click', sebelumnya);

  btnShuffle.addEventListener('click', function () {
    acak = !acak;
    btnShuffle.setAttribute('aria-pressed', String(acak));
    btnShuffle.setAttribute('aria-label', acak ? 'Acak: hidup' : 'Acak');
  });

  btnRepeat.addEventListener('click', function () {
    ulangi = ulangi === 'off' ? 'all' : ulangi === 'all' ? 'one' : 'off';
    btnRepeat.setAttribute('data-mode', ulangi);
    btnRepeat.setAttribute('aria-pressed', String(ulangi !== 'off'));
    btnRepeat.setAttribute('aria-label',
      'Ulangi: ' + (ulangi === 'off' ? 'mati' : ulangi === 'all' ? 'semua lagu' : 'satu lagu'));
  });
