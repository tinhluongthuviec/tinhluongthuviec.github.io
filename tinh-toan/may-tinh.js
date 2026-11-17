/*
 * Bộ tính lương thử việc: hàm thuần, không đụng tới giao diện.
 * UMD: Node (module.exports) và trình duyệt (window.TinhThuViec).
 * Ngày xử lý bằng số nguyên năm/tháng/ngày và Date.UTC để không lệch múi giờ.
 */
(function (goc, tao) {
  'use strict';
  if (typeof module === 'object' && module.exports) {
    module.exports = tao(require('./thong-so.js'));
  } else {
    goc.TinhThuViec = tao(goc.ThongSoThuViec);
  }
})(typeof self !== 'undefined' ? self : this, function (TS) {
  'use strict';

  var NGAY_MS = 86400000;
  var DS_VI_TRI = ['quanly', 'caodang', 'trungcap', 'khac'];
  var DS_LICH = ['cn', 't7cn', 'chieut7'];
  var DS_HINH_THUC = ['hdld3', 'hdld1', 'rieng'];
  var SO_LA_MA = { 1: 'I', 2: 'II', 3: 'III', 4: 'IV' };

  /* ---------- số học ---------- */

  /* Làm tròn nửa lên, loại bỏ nhiễu số thực. */
  function lamTron(v) { return Math.round(Number(v.toFixed(6))); }

  /* Nhân số nguyên x với tỷ lệ theo phần nghìn, làm tròn nửa lên bằng số nguyên. */
  function nhanPhanNghin(x, phanNghin) {
    if (x <= 0) { return 0; }
    return Math.floor((2 * x * phanNghin + 1000) / 2000);
  }

  function dinhDangTien(n) {
    var dau = n < 0 ? '-' : '';
    var s = String(Math.abs(Math.round(n)));
    return dau + s.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  }

  function dinhDangSo(n, soLe) {
    var s = String(Number(n.toFixed(soLe === undefined ? 1 : soLe)));
    return s.replace('.', ',');
  }

  /* ---------- ngày ---------- */

  function docNgay(v) {
    var n, t, d, kq;
    if (v && typeof v === 'object' && v.nam !== undefined) {
      n = Number(v.nam); t = Number(v.thang); d = Number(v.ngay);
    } else if (typeof v === 'string') {
      kq = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(v.trim());
      if (!kq) { return null; }
      n = Number(kq[1]); t = Number(kq[2]); d = Number(kq[3]);
    } else {
      return null;
    }
    if (!isFinite(n) || !isFinite(t) || !isFinite(d)) { return null; }
    var moc = new Date(Date.UTC(n, t - 1, d));
    if (moc.getUTCFullYear() !== n || moc.getUTCMonth() !== t - 1 || moc.getUTCDate() !== d) { return null; }
    return { nam: n, thang: t, ngay: d };
  }

  function soNgay(n) { return Math.round(Date.UTC(n.nam, n.thang - 1, n.ngay) / NGAY_MS); }

  function thuTrongTuan(nam, thang, ngay) { return new Date(Date.UTC(nam, thang - 1, ngay)).getUTCDay(); }

  function soNgayTrongThang(nam, thang) { return new Date(Date.UTC(nam, thang, 0)).getUTCDate(); }

  function dinhDangNgay(n) {
    function hai(x) { return (x < 10 ? '0' : '') + x; }
    return hai(n.ngay) + '/' + hai(n.thang) + '/' + n.nam;
  }

  /* Trọng số một ngày làm việc theo lịch nghỉ. thu: 0 = Chủ nhật. */
  function trongSo(thu, lich) {
    if (lich === 't7cn') { return (thu === 0 || thu === 6) ? 0 : 1; }
    if (lich === 'chieut7') { return thu === 0 ? 0 : (thu === 6 ? 0.5 : 1); }
    return thu === 0 ? 0 : 1;
  }

  /* Ngày kỳ thử việc đủ 3 tháng lịch hay chưa: kết thúc >= (bắt đầu + 3 tháng) - 1 ngày. */
  function duBaThang(bd, kt) {
    var thang = bd.thang - 1 + 3;
    var nam = bd.nam + Math.floor(thang / 12);
    thang = thang % 12 + 1;
    var ngay = Math.min(bd.ngay, soNgayTrongThang(nam, thang));
    var moc = soNgay({ nam: nam, thang: thang, ngay: ngay }) - 1;
    return soNgay(kt) >= moc;
  }

  /* ---------- thuế ---------- */

  /* Thuế lũy tiến từng phần theo tháng, làm tròn đến đồng ở bước cuối. */
  function thueLuyTien(tnTinhThue) {
    if (!(tnTinhThue > 0)) { return 0; }
    var bieu = TS.BIEU_THUE;
    var truoc = 0;
    var tu = 0;
    for (var i = 0; i < bieu.length; i++) {
      var phan = Math.min(tnTinhThue, bieu[i].toiDa) - truoc;
      if (phan <= 0) { break; }
      tu += phan * bieu[i].phanNghin;
      truoc = bieu[i].toiDa;
      if (tnTinhThue <= bieu[i].toiDa) { break; }
    }
    return Math.floor((2 * tu + 1000) / 2000);
  }

  /* ---------- kiểm tra đầu vào ---------- */

  function laSo(v) { return typeof v === 'number' && isFinite(v); }

  function chuanHoa(dv) {
    var loi = [];
    var o = {};
    o.luongChinh = Number(dv.luongChinh);
    o.tyLe = Number(dv.tyLe);
    o.phuCapLuong = dv.phuCapLuong === undefined || dv.phuCapLuong === '' ? 0 : Number(dv.phuCapLuong);
    o.tienAn = dv.tienAn === undefined || dv.tienAn === '' ? 0 : Number(dv.tienAn);
    o.viTri = dv.viTri;
    o.lichNghi = dv.lichNghi || 'cn';
    o.congChuan = dv.congChuan === undefined ? 'thucte' : dv.congChuan;
    o.hinhThuc = dv.hinhThuc || 'hdld3';
    o.vung = Number(dv.vung === undefined ? 1 : dv.vung);
    o.nguoiPhuThuoc = dv.nguoiPhuThuoc === undefined ? 0 : Number(dv.nguoiPhuThuoc);
    o.camKet = !!dv.camKet;

    if (!laSo(o.luongChinh) || o.luongChinh <= 0) { loi.push('Mức lương chính thức phải lớn hơn 0.'); }
    if (!laSo(o.tyLe) || o.tyLe <= 0 || o.tyLe > 100) { loi.push('Tỷ lệ lương thử việc phải nằm trong khoảng từ 1% đến 100%.'); }
    if (!laSo(o.phuCapLuong) || o.phuCapLuong < 0) { loi.push('Phụ cấp lương không được âm.'); }
    if (!laSo(o.tienAn) || o.tienAn < 0) { loi.push('Tiền ăn giữa ca không được âm.'); }
    if (DS_VI_TRI.indexOf(o.viTri) < 0) { loi.push('Chưa chọn nhóm công việc hợp lệ.'); }
    if (DS_LICH.indexOf(o.lichNghi) < 0) { loi.push('Lịch nghỉ hằng tuần không hợp lệ.'); }
    if (DS_HINH_THUC.indexOf(o.hinhThuc) < 0) { loi.push('Hình thức thử việc không hợp lệ.'); }
    if ([1, 2, 3, 4].indexOf(o.vung) < 0) { loi.push('Vùng lương tối thiểu phải từ I đến IV.'); }
    if (!laSo(o.nguoiPhuThuoc) || o.nguoiPhuThuoc < 0 || Math.floor(o.nguoiPhuThuoc) !== o.nguoiPhuThuoc) {
      loi.push('Số người phụ thuộc phải là số nguyên không âm.');
    }
    if (o.congChuan !== 'thucte') {
      o.congChuan = Number(o.congChuan);
      if (!laSo(o.congChuan) || o.congChuan <= 0) { loi.push('Ngày công chuẩn không hợp lệ.'); }
    }

    o.batDau = docNgay(dv.batDau);
    o.ketThuc = docNgay(dv.ketThuc);
    if (!o.batDau) { loi.push('Ngày bắt đầu không hợp lệ.'); }
    if (!o.ketThuc) { loi.push('Ngày kết thúc không hợp lệ.'); }
    if (o.batDau && o.ketThuc) {
      var tu = soNgay(TS.PHAM_VI.tu);
      if (soNgay(o.batDau) < tu || soNgay(o.ketThuc) < tu) {
        loi.push('Công cụ áp dụng cho thời gian thử việc từ ngày 01/7/2026 trở đi.');
      }
      if (soNgay(o.ketThuc) < soNgay(o.batDau)) { loi.push('Ngày kết thúc phải sau hoặc trùng ngày bắt đầu.'); }
    }
    return { loi: loi, o: o };
  }

  /* ---------- tính chính ---------- */

  function tinh(dauVao) {
    var kiemDinh = chuanHoa(dauVao || {});
    var kq = {
      hopLe: kiemDinh.loi.length === 0,
      loi: kiemDinh.loi,
      luongTVThang: 0,
      cacThang: [],
      tong: null,
      kiemTra: [],
      ghiChu: [],
      soNgayLich: 0,
      soNgayLamViec: 0
    };
    if (!kq.hopLe) { return kq; }

    var o = kiemDinh.o;
    var sBD = soNgay(o.batDau);
    var sKT = soNgay(o.ketThuc);
    var coBH = o.hinhThuc !== 'rieng';
    var luongTVThang = lamTron(o.luongChinh * o.tyLe / 100);
    kq.luongTVThang = luongTVThang;
    kq.soNgayLich = sKT - sBD + 1;

    var nam = o.batDau.nam;
    var thang = o.batDau.thang;
    var thangCuoi = TS.khoa(o.ketThuc.nam, o.ketThuc.thang);
    var cacThangNgoaiKy = [];

    while (TS.khoa(nam, thang) <= thangCuoi) {
      var soNgayThang = soNgayTrongThang(nam, thang);
      var congThang = 0;
      var congThucTe = 0;
      var ngayLamThang = 0;
      var ngayLamTrongKy = 0;
      var ngayTruocKy = 0;
      var ngaySauKy = 0;
      for (var d = 1; d <= soNgayThang; d++) {
        var w = trongSo(thuTrongTuan(nam, thang, d), o.lichNghi);
        var sn = soNgay({ nam: nam, thang: thang, ngay: d });
        var trongKy = sn >= sBD && sn <= sKT;
        congThang += w;
        if (w > 0) {
          ngayLamThang++;
          if (sn < sBD) { ngayTruocKy++; }
          if (sn > sKT) { ngaySauKy++; }
        }
        if (trongKy) {
          congThucTe += w;
          if (w > 0) { ngayLamTrongKy++; }
        }
      }
      kq.soNgayLamViec += ngayLamTrongKy;

      var duCong = congThucTe === congThang;
      var congChuanM = o.congChuan === 'thucte' ? congThang : o.congChuan;
      var heSo = duCong ? 1 : Math.min(1, congChuanM > 0 ? congThucTe / congChuanM : 0);
      var daDay = duCong || congThucTe >= congChuanM;
      function theoHeSo(x) { return daDay ? x : lamTron(x * congThucTe / congChuanM); }
      var luong = theoHeSo(luongTVThang);
      var phuCap = theoHeSo(o.phuCapLuong);
      var an = theoHeSo(o.tienAn);
      var tong = luong + phuCap + an;
      var ghiChu = [];

      /* bảo hiểm */
      var ngayNgoai = ngayLamThang - ngayLamTrongKy;
      var lttv = TS.luongToiThieuVung(o.vung, nam, thang);
      var mucTC = TS.mucThamChieu(nam, thang);
      var bhxh = 0, bhyt = 0, bhtn = 0, canCu = 0, canCuBHTN = 0;
      var thangCoBH = false;
      if (coBH) {
        if (ngayNgoai >= TS.NGUONG_NGAY_KHONG_DONG_BH) {
          var phan = [];
          if (ngayTruocKy > 0) { phan.push('phần trước kỳ thử việc là thời gian chưa vào làm, chưa hưởng lương'); }
          if (ngaySauKy > 0) { phan.push('phần sau kỳ thử việc thuộc thời gian làm việc chính thức, bảo hiểm của tháng này tính vào lương chính thức'); }
          ghiChu.push('Tháng này có ' + ngayNgoai + ' ngày làm việc nằm ngoài kỳ thử việc (từ ' + TS.NGUONG_NGAY_KHONG_DONG_BH +
            ' ngày trở lên) nên không trừ bảo hiểm vào lương thử việc: ' + phan.join('; ') + '.');
          cacThangNgoaiKy.push(('0' + thang).slice(-2) + '/' + nam);
        } else {
          thangCoBH = true;
          var chuaNang = luongTVThang + o.phuCapLuong;
          /* Sàn căn cứ đóng BHXH, BHYT là mức tham chiếu; BHTN không có sàn số. */
          canCu = Math.max(chuaNang, mucTC);
          if (canCu > chuaNang) {
            ghiChu.push('Căn cứ đóng BHXH, BHYT được nâng lên bằng mức tham chiếu ' + dinhDangTien(mucTC) + ' đ (Luật BHXH 2024, điểm đ khoản 1 Điều 31).');
          }
          var tranBHXH = 20 * mucTC;
          var tranBHTN = 20 * lttv;
          if (canCu > tranBHXH) {
            ghiChu.push('Căn cứ đóng BHXH, BHYT bị khống chế ở mức trần ' + dinhDangTien(tranBHXH) + ' đ (20 lần mức tham chiếu).');
          }
          canCuBHTN = Math.min(chuaNang, tranBHTN);
          bhxh = nhanPhanNghin(Math.min(canCu, tranBHXH), TS.TY_LE_BH.bhxh);
          bhyt = nhanPhanNghin(Math.min(canCu, tranBHXH), TS.TY_LE_BH.bhyt);
          bhtn = nhanPhanNghin(canCuBHTN, TS.TY_LE_BH.bhtn);
        }
      }
      var tongBH = bhxh + bhyt + bhtn;

      /* thuế */
      var tranAn = TS.tranTienAn(nam, thang);
      var anChiuThue = Math.max(0, an - tranAn);
      var tnct = luong + phuCap + anChiuThue;
      var nguong10 = TS.nguongKhauTru(nam, thang);
      var tntt = 0;
      var thue = 0;
      var cachThue;
      if (o.hinhThuc === 'hdld3') {
        cachThue = 'luytien';
        tntt = Math.max(0, tnct - tongBH - TS.GIAM_TRU.banThan - TS.GIAM_TRU.phuThuoc * o.nguoiPhuThuoc);
        thue = thueLuyTien(tntt);
      } else if (o.camKet) {
        cachThue = 'camket';
        thue = 0;
        ghiChu.push('Đã nộp bản cam kết nên không bị khấu trừ 10%. Cuối năm thu nhập vẫn được tổng hợp, và người lao động phải quyết toán nếu thu nhập vượt mức phải nộp thuế.');
      } else {
        cachThue = 'khautru';
        thue = tnct >= nguong10 ? nhanPhanNghin(tnct, 100) : 0;
      }

      kq.cacThang.push({
        nam: nam, thang: thang,
        congThucTe: congThucTe, congThang: congThang, congChuan: congChuanM,
        heSo: heSo, duCong: duCong, ngayNgoai: ngayNgoai,
        luong: luong, phuCap: phuCap, an: an, tong: tong,
        canCu: canCu, canCuBHTN: canCuBHTN, mucTC: mucTC, bhxh: bhxh, bhyt: bhyt, bhtn: bhtn, tongBH: tongBH,
        anChiuThue: anChiuThue, tnct: tnct, tntt: tntt,
        cachThue: cachThue, nguong10: nguong10, tranAn: tranAn,
        lttv: lttv,
        thue: thue,
        thucNhan: tong - tongBH - thue,
        coBH: thangCoBH,
        ghiChu: ghiChu
      });

      thang++;
      if (thang > 12) { thang = 1; nam++; }
    }

    /* cộng tổng */
    var khoaTien = ['luong', 'phuCap', 'an', 'tong', 'bhxh', 'bhyt', 'bhtn', 'tongBH', 'anChiuThue', 'tnct', 'thue', 'thucNhan'];
    var tongCong = { congThucTe: 0, congChuan: 0 };
    khoaTien.forEach(function (k) { tongCong[k] = 0; });
    kq.cacThang.forEach(function (m) {
      tongCong.congThucTe += m.congThucTe;
      tongCong.congChuan += m.congChuan;
      khoaTien.forEach(function (k) { tongCong[k] += m[k]; });
    });
    kq.tong = tongCong;

    /* ---- kiểm tra pháp lý ---- */
    var tyLeChu = dinhDangSo(o.tyLe, 2) + '%';
    if (o.tyLe < TS.TY_LE_TOI_THIEU) {
      kq.kiemTra.push({ loai: 'loi', noiDung: 'Tỷ lệ ' + tyLeChu + ' thấp hơn mức tối thiểu 85% (Điều 26 BLLĐ 2019).' });
    } else {
      kq.kiemTra.push({ loai: 'dat', noiDung: 'Tỷ lệ ' + tyLeChu + ' đạt mức tối thiểu 85%.' });
    }

    var gh = TS.THOI_GIAN_TOI_DA[o.viTri];
    var soDem = gh.lamViec ? kq.soNgayLamViec : kq.soNgayLich;
    var chuDon = gh.lamViec ? 'ngày làm việc' : 'ngày';
    if (soDem > gh.so) {
      kq.kiemTra.push({ loai: 'canh-bao', noiDung: 'Thời gian thử việc ' + soDem + ' ' + chuDon + ', vượt mức tối đa ' + gh.so + ' ' + chuDon + ' (Điều 25 BLLĐ 2019).' });
    } else {
      kq.kiemTra.push({ loai: 'dat', noiDung: soDem + ' ' + chuDon + ', trong giới hạn ' + gh.so + ' ' + chuDon + '.' });
    }
    if (kq.soNgayLamViec === 0) {
      kq.kiemTra.push({ loai: 'canh-bao', noiDung: 'Khoảng ngày đã chọn không có ngày làm việc nào theo lịch nghỉ hiện tại.' });
    }

    var thieu = [];
    var cacMuc = [];
    kq.cacThang.forEach(function (m) {
      var nhan = TS.nhanLuongToiThieu(m.nam, m.thang);
      if (luongTVThang < m.lttv) {
        if (!thieu.some(function (x) { return x.muc === m.lttv; })) { thieu.push({ muc: m.lttv, nhan: nhan }); }
      }
      if (!cacMuc.some(function (x) { return x.muc === m.lttv; })) { cacMuc.push({ muc: m.lttv, nhan: nhan }); }
    });
    var tenVung = 'vùng ' + SO_LA_MA[o.vung];
    function moTa(ds) {
      if (ds.length === 1) { return dinhDangTien(ds[0].muc) + ' đ/tháng'; }
      return ds.map(function (x) { return dinhDangTien(x.muc) + ' đ/tháng (' + x.nhan + ')'; }).join(' và ');
    }
    if (thieu.length) {
      kq.kiemTra.push({
        loai: 'canh-bao',
        noiDung: 'Lương thử việc ' + dinhDangTien(luongTVThang) + ' đ/tháng thấp hơn lương tối thiểu ' + tenVung + ' (' + moTa(thieu) +
          '). Nhiều ý kiến cho rằng lương thử việc cũng không nên thấp hơn lương tối thiểu vùng.'
      });
    } else {
      kq.kiemTra.push({ loai: 'dat', noiDung: 'Cao hơn lương tối thiểu ' + tenVung + ' (' + moTa(cacMuc) + ').' });
    }

    /* ---- ghi chú chung ---- */
    kq.ghiChu.push('Ngày nghỉ lễ được tính như ngày công vì người thử việc vẫn hưởng nguyên lương.');
    if (!coBH) {
      kq.ghiChu.push('Hợp đồng thử việc riêng không thuộc diện đóng bảo hiểm bắt buộc nên không trừ BHXH, BHYT, BHTN.');
    }
    if (cacThangNgoaiKy.length) {
      kq.ghiChu.push('Không trừ bảo hiểm ở tháng ' + cacThangNgoaiKy.join(', ') + ' do có từ ' + TS.NGUONG_NGAY_KHONG_DONG_BH +
        ' ngày làm việc trở lên nằm ngoài kỳ thử việc (không hưởng tiền lương từ 14 ngày làm việc trở lên trong tháng thì không phải đóng BHXH tháng đó, khoản 5 Điều 33 Luật BHXH 2024).');
    }
    if (o.hinhThuc === 'rieng' && duBaThang(o.batDau, o.ketThuc)) {
      kq.ghiChu.push('Văn bản chưa hướng dẫn rõ trường hợp hợp đồng thử việc riêng kéo dài từ 3 tháng trở lên; công cụ tạm tính theo khấu trừ 10%.');
    }
    if (o.hinhThuc !== 'hdld3' && o.camKet) {
      kq.ghiChu.push('Đã nộp cam kết thu nhập chưa đến mức chịu thuế: không khấu trừ 10%, nhưng cuối năm vẫn tổng hợp và quyết toán nếu thu nhập vượt mức.');
    }
    return kq;
  }

  return {
    tinh: tinh,
    thueLuyTien: thueLuyTien,
    dinhDangTien: dinhDangTien,
    dinhDangSo: dinhDangSo,
    dinhDangNgay: dinhDangNgay,
    docNgay: docNgay,
    thuTrongTuan: thuTrongTuan,
    soNgayTrongThang: soNgayTrongThang,
    soNgay: soNgay
  };
});
