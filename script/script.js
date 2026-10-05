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

  var terakhir = 0;       
  var acak = false;
  var ulangi = 'off';      
  var menggeser = false;   
  var volume = 0.7;
  var bisu = false;

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
  
    if (a.currentTime > 3 || jumlah < 2) {
      a.currentTime = 0;
      tampilWaktu();
      return;
    }
    pindah(nomorAktif() - 1, true);
  }

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

 btnMute.addEventListener('click', function () {
    if (bisu || volume === 0) {
      bisu = false;
      if (volume === 0) volume = 0.4;
    } else {
      bisu = true;
    }
    tampilVolume();
  });

  volumeEl.addEventListener('input', function () {
    volume = volumeEl.value / 100;
    if (volume > 0) bisu = false;
    tampilVolume();
  });

  progres.addEventListener('input', function () {
    menggeser = true;
    audioAktif().currentTime = parseFloat(progres.value);
    tampilWaktu();
  });
  progres.addEventListener('change', function () {
    menggeser = false;
    tampilWaktu();
  });

  if (document.documentElement.requestFullscreen) {
    btnLayar.addEventListener('click', function () {
      if (document.fullscreenElement) {
        document.exitFullscreen();
      } else {
        document.documentElement.requestFullscreen().catch(function () {
          pesan('Layar penuh tidak tersedia di sini.');
        });
      }
    });
  } else {
    btnLayar.hidden = true;
  }

  radios.forEach(function (radio, k) {
    radio.addEventListener('change', function () {
      var sedangMain = !audios[terakhir].paused;
      pindah(k, sedangMain);
    });
  });

  document.addEventListener('keydown', function (e) {
    if (e.code === 'Space' && e.target === document.body) {
      e.preventDefault();
      btnPlay.click();
    }
  });

  audios.forEach(function (a, k) {
    a.controls = false;
    function aktif() { return k === nomorAktif(); }

    a.addEventListener('timeupdate', function () { if (aktif()) tampilWaktu(); });
    a.addEventListener('loadedmetadata', function () { if (aktif()) tampilWaktu(); });
    a.addEventListener('durationchange', function () { if (aktif()) tampilWaktu(); });
    a.addEventListener('play', function () { if (aktif()) tampilPlay(); });
    a.addEventListener('pause', function () { if (aktif()) tampilPlay(); });
    a.addEventListener('waiting', function () { if (aktif()) pemutar.classList.add('muat'); });
    a.addEventListener('playing', function () { if (aktif()) pemutar.classList.remove('muat'); });
    a.addEventListener('canplay', function () { if (aktif()) pemutar.classList.remove('muat'); });

    a.addEventListener('error', function () {
      if (!aktif()) return;
      pemutar.classList.remove('muat');
      pesan('Lagu gagal dimuat. Periksa nama file di folder music.');
    });

    a.addEventListener('ended', function () {
      if (!aktif()) return;
      if (ulangi === 'one') {
        a.currentTime = 0;
        putar();
      } else if (acak || ulangi === 'all' || k < jumlah - 1) {
        berikutnya();
      } else {
        pindah(0, false);   
      }
    });
  });

  terakhir = nomorAktif();
  audios[terakhir].preload = 'metadata';
  tampilVolume();
  tampilWaktu();
  tampilPlay();
})();
