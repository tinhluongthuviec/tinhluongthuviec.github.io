/* Giao diện công cụ tính lương thử việc: đọc ô nhập, gọi bộ tính, vẽ kết quả, thu gọn bài, hỏi đáp, mục lục, sao chép, in. */
(function () {
  'use strict';

  var TV = window.TinhThuViec;
  var TS = window.ThongSoThuViec;
  var goc = document.documentElement;
  goc.classList.add('tv-co-js');
  var giamChuyen = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);

  function $(id) { return document.getElementById(id); }
  function tien(n) { return TV.dinhDangTien(n); }
  function so1(n) { return TV.dinhDangSo(n, 1); }
  function thoat(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  var TEN_VI_TRI = {
    quanly: 'Người quản lý doanh nghiệp',
    caodang: 'Chuyên môn, kỹ thuật từ cao đẳng trở lên',
    trungcap: 'Trung cấp, công nhân kỹ thuật, nhân viên nghiệp vụ',
    khac: 'Công việc khác'
  };
  var TEN_LICH = { cn: 'Nghỉ Chủ nhật', t7cn: 'Nghỉ Thứ Bảy, Chủ nhật', chieut7: 'Nghỉ chiều Thứ Bảy, Chủ nhật' };
  var TEN_HINH_THUC = {
    hdld3: 'Ghi trong hợp đồng lao động từ 3 tháng trở lên',
    hdld1: 'Ghi trong hợp đồng lao động từ 1 tháng đến dưới 3 tháng',
    rieng: 'Hợp đồng thử việc riêng'
  };
  var LA_MA = { 1: 'I', 2: 'II', 3: 'III', 4: 'IV' };

  /* ---------- nhóm nút chọn nhanh ---------- */
  var cacNhom = document.querySelectorAll('[data-nhom]');
  var trangThaiGoc = [];

  function datActive(nhom, nutChon) {
    var cacNut = nhom.querySelectorAll('.tv-nut-chon');
    for (var i = 0; i < cacNut.length; i++) {
      cacNut[i].setAttribute('aria-pressed', cacNut[i] === nutChon ? 'true' : 'false');
    }
  }
  function giaTriNhom(ten) {
    var nhom = document.querySelector('[data-nhom="' + ten + '"]');
    var nut = nhom && nhom.querySelector('[aria-pressed="true"]');
    return nut ? nut.getAttribute('data-gia-tri') : null;
  }

  Array.prototype.forEach.call(cacNhom, function (nhom) {
    var cacNut = nhom.querySelectorAll('.tv-nut-chon');
    var idDich = nhom.getAttribute('data-dich');
    var oDich = idDich ? $(idDich) : null;
    trangThaiGoc.push({ nhom: nhom, nut: nhom.querySelector('[aria-pressed="true"]') });
    Array.prototype.forEach.call(cacNut, function (nut) {
      nut.addEventListener('click', function () {
        datActive(nhom, nut);
        if (oDich && nut.getAttribute('data-gia-tri')) { oDich.value = nut.getAttribute('data-gia-tri'); }
        tinhLai(true);
      });
    });
    if (oDich) {
      oDich.addEventListener('input', function () {
        var chuan = oDich.value.trim().replace(',', '.');
        var khop = null;
        Array.prototype.forEach.call(cacNut, function (nut) {
          if (nut.getAttribute('data-gia-tri') === chuan) { khop = nut; }
        });
        datActive(nhom, khop);
      });
    }
  });

  /* ---------- ô tiền: chấm nghìn, giữ nguyên vị trí con trỏ ---------- */
  function dinhDangO(o) {
    var vt = o.selectionStart;
    var dangFocus = document.activeElement === o;
    var truoc = o.value.slice(0, vt === null ? o.value.length : vt).replace(/\D/g, '').length;
    var s = o.value.replace(/\D/g, '').replace(/^0+(?=\d)/, '').slice(0, 12);
    var moi = s ? s.replace(/\B(?=(\d{3})+(?!\d))/g, '.') : '';
    if (moi === o.value) { return; }
    o.value = moi;
    if (!dangFocus || !o.setSelectionRange) { return; }
    var dem = 0;
    var p = 0;
    if (truoc > 0) {
      for (p = 0; p < moi.length; p++) {
        if (/\d/.test(moi.charAt(p))) { dem++; }
        if (dem === truoc) { p++; break; }
      }
      if (dem < truoc) { p = moi.length; }
    }
    o.setSelectionRange(p, p);
  }
  Array.prototype.forEach.call(document.querySelectorAll('[data-tien]'), function (o) {
    o.addEventListener('input', function () { dinhDangO(o); tinhLai(false); });
  });

  var oTyLe = $('tv-ty-le');
  oTyLe.addEventListener('input', function () {
    var s = oTyLe.value.replace(/[^\d.,]/g, '');
    if (s !== oTyLe.value) { oTyLe.value = s; }
    tinhLai(false);
  });

  /* ---------- số người phụ thuộc ---------- */
  var oSoPhuThuoc = $('tv-so-phu-thuoc');
  var soPhuThuoc = 0;
  function veSoPhuThuoc() { oSoPhuThuoc.textContent = String(soPhuThuoc); }
  $('tv-giam').addEventListener('click', function () { if (soPhuThuoc > 0) { soPhuThuoc--; veSoPhuThuoc(); tinhLai(true); } });
  $('tv-tang').addEventListener('click', function () { if (soPhuThuoc < 20) { soPhuThuoc++; veSoPhuThuoc(); tinhLai(true); } });

  /* ---------- hình thức thử việc và ô cam kết ---------- */
  var cacRadio = document.querySelectorAll('input[name="tv-hinh-thuc"]');
  var hopCamKet = $('tv-hop-cam-ket');
  var oCamKet = $('tv-cam-ket');
  function hinhThucHienTai() {
    for (var i = 0; i < cacRadio.length; i++) { if (cacRadio[i].checked) { return cacRadio[i].value; } }
    return '';
  }
  function capNhatHinhThuc() {
    var ht = hinhThucHienTai();
    var hien = ht === 'hdld1' || ht === 'rieng';
    hopCamKet.classList.toggle('tv-an', !hien);
    if (!hien) { oCamKet.checked = false; }
  }
  Array.prototype.forEach.call(cacRadio, function (r) {
    r.addEventListener('change', function () { capNhatHinhThuc(); tinhLai(true); });
  });
  oCamKet.addEventListener('change', function () { tinhLai(true); });

  /* ---------- đọc ô nhập ---------- */
  function soTuO(id) {
    var s = $(id).value.replace(/\D/g, '');
    return s ? Number(s) : 0;
  }
  function docDauVao() {
    var tyChuoi = oTyLe.value.trim().replace(',', '.');
    return {
      luongChinh: soTuO('tv-luong-chinh'),
      tyLe: tyChuoi === '' || isNaN(Number(tyChuoi)) ? NaN : Number(tyChuoi),
      phuCapLuong: soTuO('tv-phu-cap'),
      tienAn: soTuO('tv-tien-an'),
      viTri: $('tv-vi-tri').value,
      batDau: $('tv-ngay-bat-dau').value,
      ketThuc: $('tv-ngay-ket-thuc').value,
      lichNghi: giaTriNhom('lich-nghi') || '',
      congChuan: $('tv-ngay-cong-chuan').value,
      hinhThuc: hinhThucHienTai(),
      vung: Number(giaTriNhom('vung') || 0),
      nguoiPhuThuoc: soPhuThuoc,
      camKet: oCamKet.checked
    };
  }

  /* ---------- vẽ kết quả ---------- */
  var SVG_DAT = '<svg viewBox="0 0 22 22" aria-hidden="true" fill="none" stroke="#66FCF1" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="9.5"/><path d="M6.8 11.4l3 3 5.4-6"/></svg>';
  var SVG_CANH_BAO = '<svg viewBox="0 0 22 22" aria-hidden="true" fill="none" stroke="#F5C451" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="9.5"/><path d="M11 6.2v6M11 15.4v.4"/></svg>';
  var SVG_LOI = '<svg viewBox="0 0 22 22" aria-hidden="true" fill="none" stroke="#FF6B6B" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="9.5"/><path d="M7.8 7.8l6.4 6.4M14.2 7.8l-6.4 6.4"/></svg>';

  var ketQuaCuoi = null;
  var dauVaoCuoi = null;

  function nhanThang(m) { return (m.thang < 10 ? '0' : '') + m.thang + '/' + m.nam; }
  function heSoChu(h) { return String(Number(h.toFixed(4))).replace('.', ','); }

  function veDongKetQua(kq, dv) {
    var t = kq.tong;
    var h = [];
    function dong(nhan, gtri, tong) {
      h.push('<li' + (tong ? ' class="tv-dong-tong"' : '') + '><span>' + nhan + '</span><span>' + gtri + '</span></li>');
    }
    dong('Tổng thu nhập cả kỳ', tien(t.tong) + ' đ', true);
    dong('Lương thử việc theo ngày công', tien(t.luong) + ' đ');
    if (dv.phuCapLuong > 0) { dong('Phụ cấp lương', tien(t.phuCap) + ' đ'); }
    if (dv.tienAn > 0) { dong('Tiền ăn giữa ca', tien(t.an) + ' đ'); }
    dong('BHXH 8%', '&minus;' + tien(t.bhxh) + ' đ');
    dong('BHYT 1,5%', '&minus;' + tien(t.bhyt) + ' đ');
    dong('BHTN 1%', '&minus;' + tien(t.bhtn) + ' đ');
    dong('Thuế TNCN', '&minus;' + tien(t.thue) + ' đ');
    $('tv-dong-kq').innerHTML = h.join('');
  }

  function veKiemTra(kq) {
    var h = kq.kiemTra.map(function (k) {
      if (k.loai === 'dat') { return '<li>' + SVG_DAT + '<span>' + thoat(k.noiDung) + '</span></li>'; }
      if (k.loai === 'canh-bao') { return '<li class="tv-canh-bao">' + SVG_CANH_BAO + '<span>' + thoat(k.noiDung) + '</span></li>'; }
      return '<li class="tv-loi-do">' + SVG_LOI + '<span>' + thoat(k.noiDung) + '</span></li>';
    });
    $('tv-kiem-tra').innerHTML = h.join('');
    $('tv-luu-y').innerHTML = kq.ghiChu.map(function (g) { return '<li>' + thoat(g) + '</li>'; }).join('');
  }

  function veBang(kq) {
    $('tv-bang-thang').innerHTML = kq.cacThang.map(function (m) {
      return '<tr><td>' + nhanThang(m) + '</td><td>' + so1(m.congThucTe) + '/' + so1(m.congChuan) + '</td><td>' + tien(m.tong) +
        '</td><td>' + tien(m.tongBH) + '</td><td>' + tien(m.thue) + '</td><td>' + tien(m.thucNhan) + '</td></tr>';
    }).join('');
    var t = kq.tong;
    $('tv-bang-tong').innerHTML = '<tr><td>Tổng</td><td>' + so1(t.congThucTe) + '</td><td>' + tien(t.tong) + '</td><td>' + tien(t.tongBH) +
      '</td><td>' + tien(t.thue) + '</td><td>' + tien(t.thucNhan) + '</td></tr>';
  }

  function veDienGiai(kq, dv) {
    var ra = [];
    var tyChu = TV.dinhDangSo(dv.tyLe, 2) + '%';
    kq.cacThang.forEach(function (m) {
      var b = [];
      var chuan = so1(m.congChuan);
      var heChu = m.duCong ? 'kỳ thử việc phủ trọn tháng, hệ số 1'
        : (m.congThucTe >= m.congChuan ? 'công thực tế không thấp hơn công chuẩn, hệ số tối đa 1' : 'hệ số = ' + so1(m.congThucTe) + ' ÷ ' + chuan + ' = ' + heSoChu(m.heSo));
      b.push('Ngày công: <b>' + so1(m.congThucTe) + '</b> trên ngày công chuẩn <b>' + chuan + '</b> (' + heChu + ').');
      b.push('Lương thử việc: ' + tien(dv.luongChinh) + ' × ' + tyChu + ' = ' + tien(kq.luongTVThang) + ' đ' +
        (m.heSo < 1 && !m.duCong && m.congThucTe < m.congChuan ? ', nhân hệ số = <b>' + tien(m.luong) + ' đ</b>.' : ', nhận <b>' + tien(m.luong) + ' đ</b>.'));
      if (dv.phuCapLuong > 0) { b.push('Phụ cấp lương: ' + tien(dv.phuCapLuong) + ' đ theo hệ số công = <b>' + tien(m.phuCap) + ' đ</b>.'); }
      if (dv.tienAn > 0) {
        b.push('Tiền ăn giữa ca: ' + tien(dv.tienAn) + ' đ theo hệ số công = ' + tien(m.an) + ' đ; trần miễn thuế của tháng ' +
          tien(m.tranAn) + ' đ, phần chịu thuế <b>' + tien(m.anChiuThue) + ' đ</b>.');
      }
      b.push('Tổng thu nhập: ' + tien(m.luong) + (dv.phuCapLuong > 0 ? ' + ' + tien(m.phuCap) : '') + (dv.tienAn > 0 ? ' + ' + tien(m.an) : '') +
        ' = <b>' + tien(m.tong) + ' đ</b>.');

      if (dv.hinhThuc === 'rieng') {
        b.push('Bảo hiểm: hợp đồng thử việc riêng, không trừ BHXH, BHYT, BHTN.');
      } else if (!m.coBH) {
        b.push('Bảo hiểm: tháng có ' + m.ngayNgoai + ' ngày làm việc ngoài kỳ thử việc nên không trừ.');
      } else {
        var tranX = 20 * m.mucTC;
        var tranN = 20 * m.lttv;
        var truocNang = kq.luongTVThang + dv.phuCapLuong;
        b.push('Căn cứ đóng BHXH, BHYT: lớn hơn giữa lương thử việc cộng phụ cấp (' + tien(truocNang) + ' đ) và mức tham chiếu (' + tien(m.mucTC) +
          ' đ) = <b>' + tien(m.canCu) + ' đ</b>. BHTN tính trên ' + tien(m.canCuBHTN) + ' đ, không có mức sàn.');
        b.push('BHXH 8% × ' + tien(Math.min(m.canCu, tranX)) + ' = ' + tien(m.bhxh) + ' đ; BHYT 1,5% × ' + tien(Math.min(m.canCu, tranX)) + ' = ' + tien(m.bhyt) +
          ' đ (trần ' + tien(tranX) + ' đ); BHTN 1% × ' + tien(m.canCuBHTN) + ' = ' + tien(m.bhtn) + ' đ (trần ' + tien(tranN) + ' đ).');
      }

      if (m.cachThue === 'luytien') {
        b.push('Thu nhập chịu thuế: ' + tien(m.luong + m.phuCap) + ' + phần tiền ăn chịu thuế ' + tien(m.anChiuThue) + ' = ' + tien(m.tnct) + ' đ.');
        b.push('Thu nhập tính thuế: ' + tien(m.tnct) + ' − bảo hiểm ' + tien(m.tongBH) + ' − giảm trừ bản thân ' + tien(TS.GIAM_TRU.banThan) +
          (dv.nguoiPhuThuoc > 0 ? ' − ' + dv.nguoiPhuThuoc + ' người phụ thuộc × ' + tien(TS.GIAM_TRU.phuThuoc) : '') + ' = <b>' + tien(m.tntt) + ' đ</b>' +
          (m.tntt === 0 ? ' (không âm, nên không phải nộp thuế)' : '') + '.');
        b.push('Thuế theo biểu lũy tiến từng phần: <b>' + tien(m.thue) + ' đ</b>.');
      } else if (m.cachThue === 'camket') {
        b.push('Thuế: đã nộp bản cam kết nên không khấu trừ 10% (<b>0 đ</b>).');
      } else if (m.thue > 0) {
        b.push('Thuế: thu nhập chịu thuế ' + tien(m.tnct) + ' đ từ ' + tien(m.nguong10) + ' đ trở lên nên khấu trừ 10% = <b>' + tien(m.thue) + ' đ</b>.');
      } else {
        b.push('Thuế: thu nhập chịu thuế ' + tien(m.tnct) + ' đ dưới ngưỡng ' + tien(m.nguong10) + ' đ nên chưa khấu trừ (<b>0 đ</b>).');
      }
      b.push('Thực nhận: ' + tien(m.tong) + ' − bảo hiểm ' + tien(m.tongBH) + ' − thuế ' + tien(m.thue) + ' = <b>' + tien(m.thucNhan) + ' đ</b>.');

      var luuY = m.ghiChu.map(function (g) { return '<li class="tv-buoc-luu-y">' + thoat(g) + '</li>'; }).join('');
      ra.push('<div class="tv-buoc-thang"><h4>Tháng ' + nhanThang(m) + '</h4><ul>' +
        b.map(function (x) { return '<li>' + x + '</li>'; }).join('') + luuY + '</ul></div>');
    });
    $('tv-dien-giai-than').innerHTML = ra.join('');
  }

  function vePhieuVao(kq, dv) {
    var d = [];
    d.push('Mức lương chính thức: ' + tien(dv.luongChinh) + ' đ/tháng');
    d.push('Tỷ lệ lương thử việc: ' + TV.dinhDangSo(dv.tyLe, 2) + '%');
    if (dv.phuCapLuong > 0) { d.push('Phụ cấp lương: ' + tien(dv.phuCapLuong) + ' đ/tháng'); }
    if (dv.tienAn > 0) { d.push('Tiền ăn giữa ca: ' + tien(dv.tienAn) + ' đ/tháng'); }
    d.push('Nhóm công việc: ' + TEN_VI_TRI[dv.viTri]);
    d.push('Thời gian: ' + TV.dinhDangNgay(TV.docNgay(dv.batDau)) + ' đến ' + TV.dinhDangNgay(TV.docNgay(dv.ketThuc)) + ' (' + kq.soNgayLich + ' ngày)');
    d.push('Lịch nghỉ: ' + TEN_LICH[dv.lichNghi]);
    d.push('Ngày công chuẩn: ' + (dv.congChuan === 'thucte' ? 'theo ngày làm việc thực tế của tháng' : 'cố định ' + dv.congChuan + ' ngày'));
    d.push('Hình thức: ' + TEN_HINH_THUC[dv.hinhThuc] + (dv.camKet ? ' (đã nộp cam kết)' : ''));
    d.push('Vùng lương tối thiểu: ' + LA_MA[dv.vung]);
    if (dv.hinhThuc === 'hdld3') { d.push('Người phụ thuộc: ' + dv.nguoiPhuThuoc); }
    $('tv-phieu-vao').innerHTML = '<h2>Phiếu ước tính lương thử việc</h2><ul>' + d.map(function (x) { return '<li>' + thoat(x) + '</li>'; }).join('') + '</ul>';
  }

  function veLoi(kq) {
    $('tv-ds-loi').innerHTML = kq.loi.map(function (l) { return '<li>' + thoat(l) + '</li>'; }).join('');
    $('tv-hop-loi').classList.remove('tv-an');
    $('tv-vung-kq').classList.add('tv-an');
    $('tv-phieu-vao').innerHTML = '';
  }

  function ve(kq, dv) {
    if (!kq.hopLe) { veLoi(kq); return; }
    $('tv-hop-loi').classList.add('tv-an');
    $('tv-vung-kq').classList.remove('tv-an');
    $('tv-so-lon').innerHTML = tien(kq.tong.thucNhan) + '<small>đ</small>';
    $('tv-dong-phu').textContent = 'Lương thử việc tháng đủ công: ' + tien(kq.luongTVThang) + ' đ (' + TV.dinhDangSo(dv.tyLe, 2) + '% mức lương chính thức)';
    veDongKetQua(kq, dv);
    veKiemTra(kq);
    veBang(kq);
    veDienGiai(kq, dv);
    vePhieuVao(kq, dv);
  }

  /* chưa nhập đủ các mục bắt buộc thì chưa tính và chưa báo lỗi */
  function chuaNhapDu(dv) {
    return !(dv.luongChinh > 0) || isNaN(dv.tyLe) || !dv.viTri || !dv.batDau || !dv.ketThuc ||
      !dv.lichNghi || !dv.hinhThuc || !(dv.vung > 0);
  }
  function veTrong() {
    $('tv-hop-loi').classList.add('tv-an');
    $('tv-vung-kq').classList.add('tv-an');
    $('tv-trong-kq').classList.remove('tv-an');
    $('tv-ket-qua').classList.add('tv-chua-co');
    $('tv-phieu-vao').innerHTML = '';
    ['tv-ngay-bat-dau', 'tv-ngay-ket-thuc', 'tv-luong-chinh'].forEach(function (id) {
      $(id).setAttribute('aria-invalid', 'false');
    });
  }

  var hen = null;
  function chay() {
    var dv = docDauVao();
    if (chuaNhapDu(dv)) {
      ketQuaCuoi = null;
      dauVaoCuoi = dv;
      veTrong();
      return;
    }
    var kq = TV.tinh(dv);
    ketQuaCuoi = kq;
    dauVaoCuoi = dv;
    $('tv-trong-kq').classList.add('tv-an');
    $('tv-ket-qua').classList.remove('tv-chua-co');
    ve(kq, dv);
    ['tv-ngay-bat-dau', 'tv-ngay-ket-thuc'].forEach(function (id) {
      var sai = !TV.docNgay($(id).value);
      $(id).setAttribute('aria-invalid', sai ? 'true' : 'false');
    });
    $('tv-luong-chinh').setAttribute('aria-invalid', dv.luongChinh > 0 ? 'false' : 'true');
  }
  function tinhLai(ngay) {
    if (hen) { window.clearTimeout(hen); hen = null; }
    if (ngay) { chay(); } else { hen = window.setTimeout(chay, 150); }
  }

  ['tv-vi-tri', 'tv-ngay-cong-chuan'].forEach(function (id) {
    $(id).addEventListener('change', function () { tinhLai(true); });
  });
  ['tv-ngay-bat-dau', 'tv-ngay-ket-thuc'].forEach(function (id) {
    $(id).addEventListener('change', function () { tinhLai(true); });
    $(id).addEventListener('input', function () { tinhLai(false); });
  });

  /* ---------- nhập lại / gửi biểu mẫu ---------- */
  var bieuMau = $('tv-bieu-mau');
  bieuMau.addEventListener('reset', function () {
    window.setTimeout(function () {
      trangThaiGoc.forEach(function (muc) { datActive(muc.nhom, muc.nut); });
      soPhuThuoc = 0; veSoPhuThuoc();
      capNhatHinhThuc();
      tinhLai(true);
    }, 0);
  });
  bieuMau.addEventListener('submit', function (suKien) {
    suKien.preventDefault();
    tinhLai(true);
    var ketQua = $('tv-ket-qua');
    if (window.innerWidth < 1100 && ketQua) {
      ketQua.scrollIntoView({ behavior: giamChuyen ? 'auto' : 'smooth', block: 'start' });
    }
  });

  /* ---------- sao chép / in ---------- */
  function vanBanKetQua() {
    var kq = ketQuaCuoi;
    var dv = dauVaoCuoi;
    if (!kq || !kq.hopLe) { return 'Chưa có kết quả hợp lệ: ' + (kq ? kq.loi.join(' ') : ''); }
    var d = [];
    d.push('Ước tính lương thử việc');
    d.push('Mức lương chính thức: ' + tien(dv.luongChinh) + ' đ/tháng, tỷ lệ ' + TV.dinhDangSo(dv.tyLe, 2) + '%');
    d.push('Thời gian: ' + TV.dinhDangNgay(TV.docNgay(dv.batDau)) + ' đến ' + TV.dinhDangNgay(TV.docNgay(dv.ketThuc)) + ' (' + kq.soNgayLich + ' ngày)');
    d.push('Hình thức: ' + TEN_HINH_THUC[dv.hinhThuc]);
    d.push('Thực nhận cả kỳ thử việc (ước tính): ' + tien(kq.tong.thucNhan) + ' đ');
    d.push('Tổng thu nhập: ' + tien(kq.tong.tong) + ' đ');
    d.push('BHXH: ' + tien(kq.tong.bhxh) + ' đ; BHYT: ' + tien(kq.tong.bhyt) + ' đ; BHTN: ' + tien(kq.tong.bhtn) + ' đ');
    d.push('Thuế TNCN: ' + tien(kq.tong.thue) + ' đ');
    d.push('Theo từng tháng:');
    kq.cacThang.forEach(function (m) {
      d.push(nhanThang(m) + ': công ' + so1(m.congThucTe) + '/' + so1(m.congChuan) + ', thu nhập ' + tien(m.tong) + ' đ, bảo hiểm ' + tien(m.tongBH) +
        ' đ, thuế ' + tien(m.thue) + ' đ, thực nhận ' + tien(m.thucNhan) + ' đ');
    });
    kq.kiemTra.forEach(function (k) { d.push((k.loai === 'dat' ? 'Đạt: ' : 'Lưu ý: ') + k.noiDung); });
    d.push('Kết quả mang tính tham khảo.');
    return d.join('\n');
  }
  var nutSaoChep = $('tv-sao-chep');
  function baoDaChep() {
    nutSaoChep.textContent = 'Đã sao chép';
    window.setTimeout(function () { nutSaoChep.textContent = 'Sao chép kết quả'; }, 1800);
  }
  function chepDuPhong(vb) {
    try {
      var o = document.createElement('textarea');
      o.value = vb; o.setAttribute('readonly', '');
      o.style.position = 'fixed'; o.style.opacity = '0'; o.style.top = '0';
      document.body.appendChild(o);
      o.select();
      document.execCommand('copy');
      document.body.removeChild(o);
    } catch (e) { /* bỏ qua */ }
    baoDaChep();
  }
  nutSaoChep.addEventListener('click', function () {
    var vb = vanBanKetQua();
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(vb).then(baoDaChep, function () { chepDuPhong(vb); });
      } else { chepDuPhong(vb); }
    } catch (e) { chepDuPhong(vb); }
  });
  $('tv-in-phieu').addEventListener('click', function () { window.print(); });

  /* ---------- thu gọn / mở bài viết ---------- */
  var baiViet = $('tv-bai-viet');
  var nutBai = $('tv-nut-bai');
  function moBai(mo) {
    baiViet.classList.toggle('tv-mo', mo);
    nutBai.setAttribute('aria-expanded', mo ? 'true' : 'false');
    nutBai.textContent = mo ? 'Thu gọn bài viết' : 'Xem toàn bộ bài viết';
  }
  nutBai.addEventListener('click', function () {
    var dangMo = baiViet.classList.contains('tv-mo');
    moBai(!dangMo);
    if (dangMo) {
      $('cach-tinh').scrollIntoView({ behavior: giamChuyen ? 'auto' : 'smooth', block: 'start' });
    }
  });

  /* ---------- mục lục ---------- */
  var cacLienKetMucLuc = document.querySelectorAll('#tv-muc-luc a');
  function danhDauMuc(id) {
    Array.prototype.forEach.call(cacLienKetMucLuc, function (a) {
      a.classList.toggle('tv-dang-doc', a.getAttribute('href') === '#' + id);
    });
  }
  Array.prototype.forEach.call(cacLienKetMucLuc, function (a) {
    a.addEventListener('click', function (suKien) {
      var id = a.getAttribute('href').slice(1);
      var dich = $(id);
      if (!dich) { return; }
      suKien.preventDefault();
      moBai(true);
      danhDauMuc(id);
      window.requestAnimationFrame(function () {
        dich.scrollIntoView({ behavior: giamChuyen ? 'auto' : 'smooth', block: 'start' });
      });
    });
  });
  var cacTieuDeMuc = document.querySelectorAll('.tv-noi-dung-bai h3[id]');
  if ('IntersectionObserver' in window) {
    var theoDoi = new IntersectionObserver(function (cacMuc) {
      cacMuc.forEach(function (muc) { if (muc.isIntersecting) { danhDauMuc(muc.target.id); } });
    }, { rootMargin: '-15% 0px -70% 0px', threshold: 0 });
    Array.prototype.forEach.call(cacTieuDeMuc, function (h) { theoDoi.observe(h); });
  }
  danhDauMuc('muc-01');

  /* ---------- xem thêm câu hỏi ---------- */
  var nutThemHoi = $('tv-nut-them-hoi');
  var cacCauThem = document.querySelectorAll('.tv-hoi-dap-them');
  nutThemHoi.addEventListener('click', function () {
    var dangMo = nutThemHoi.getAttribute('aria-expanded') === 'true';
    Array.prototype.forEach.call(cacCauThem, function (c) {
      c.classList.toggle('tv-an', dangMo);
      if (dangMo) { c.removeAttribute('open'); }
    });
    nutThemHoi.setAttribute('aria-expanded', dangMo ? 'false' : 'true');
    nutThemHoi.textContent = dangMo ? 'Xem thêm ' + cacCauThem.length + ' câu hỏi' : 'Thu gọn câu hỏi';
  });

  /* ---------- hiện dần khi cuộn ---------- */
  var cacHien = document.querySelectorAll('.tv-hien');
  if ('IntersectionObserver' in window && !giamChuyen) {
    var quanSat = new IntersectionObserver(function (cacPhanTu) {
      cacPhanTu.forEach(function (pt) {
        if (pt.isIntersecting) { pt.target.classList.add('tv-da-hien'); quanSat.unobserve(pt.target); }
      });
    }, { threshold: 0.08, rootMargin: '0px 0px -40px 0px' });
    Array.prototype.forEach.call(cacHien, function (pt) { quanSat.observe(pt); });
  } else {
    Array.prototype.forEach.call(cacHien, function (pt) { pt.classList.add('tv-da-hien'); });
  }

  /* ---------- mục lục trên điện thoại: đóng lại sau khi chọn mục ---------- */
  var mucLuc = document.querySelector('.tv-muc-luc');
  if (mucLuc) {
    mucLuc.addEventListener('click', function (e) {
      if (e.target.closest && e.target.closest('a')) { mucLuc.removeAttribute('open'); }
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') { mucLuc.removeAttribute('open'); }
    });
  }

  /* ---------- khởi tạo ---------- */
  capNhatHinhThuc();
  chay();
})();
