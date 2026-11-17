/*
 * Bảng số liệu pháp lý cho công cụ tính lương thử việc.
 * Mọi mức đều tra theo THÁNG của khoản lương (năm, tháng).
 * UMD: chạy được trong Node (module.exports) và trình duyệt (window.ThongSoThuViec).
 */
(function (goc, tao) {
  'use strict';
  if (typeof module === 'object' && module.exports) {
    module.exports = tao();
  } else {
    goc.ThongSoThuViec = tao();
  }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  /* Khóa tháng: số nguyên tăng dần, so sánh được. */
  function khoa(nam, thang) { return nam * 12 + (thang - 1); }

  /* Ngày sớm nhất công cụ nhận (không giới hạn phía sau). */
  var PHAM_VI = {
    tu: { nam: 2026, thang: 7, ngay: 1 }
  };

  /* Lương tối thiểu vùng (đồng/tháng). */
  var LUONG_TOI_THIEU_VUNG = [
    {
      tu: khoa(2026, 7), den: khoa(2026, 12),
      nhan: 'năm 2026', vanBan: 'Nghị định 293/2025/NĐ-CP',
      muc: { 1: 5310000, 2: 4730000, 3: 4140000, 4: 3700000 }
    },
    {
      tu: khoa(2027, 1), den: khoa(2027, 12),
      nhan: 'từ 01/01/2027', vanBan: 'Nghị định 399/2026/NĐ-CP',
      muc: { 1: 5700000, 2: 5080000, 3: 4450000, 4: 4040000 }
    }
  ];

  /* Mức tham chiếu (trước đây gọi là lương cơ sở): sàn căn cứ đóng BHXH, BHYT và là gốc của trần 20 lần. */
  var MUC_THAM_CHIEU = [
    { tu: khoa(2026, 7), den: khoa(2027, 12), muc: 2530000, vanBan: 'Nghị định 161/2026/NĐ-CP' }
  ];

  /* Ngưỡng khấu trừ 10% cho mỗi lần chi trả (Nghị định 253/2026/NĐ-CP, khoản 2 Điều 50). */
  var NGUONG_KHAU_TRU = [
    { tu: khoa(2026, 7), den: khoa(2027, 12), muc: 5000000 }
  ];

  /* Tiền ăn giữa ca không tính thuế (đồng/tháng). */
  var TRAN_TIEN_AN = [
    { tu: khoa(2026, 7), den: khoa(2027, 12), muc: 1200000 }
  ];

  /* Tháng sau dòng cuối của bảng: dùng tiếp mức của dòng cuối cho đến khi có văn bản mới.
   * Khi có văn bản mới chỉ cần thêm một dòng vào bảng tương ứng. */
  function tra(bang, nam, thang) {
    var k = khoa(nam, thang);
    for (var i = 0; i < bang.length; i++) {
      if (k >= bang[i].tu && k <= bang[i].den) { return bang[i]; }
    }
    var cuoi = bang[bang.length - 1];
    if (k > cuoi.den) { return cuoi; }
    return null;
  }

  /* Tỷ lệ trích phần người lao động, tính theo phần nghìn để tránh sai số số thực. */
  var TY_LE_BH = { bhxh: 80, bhyt: 15, bhtn: 10 };

  /* Giảm trừ gia cảnh (kỳ tính thuế 2026 trở đi). */
  var GIAM_TRU = { banThan: 15500000, phuThuoc: 6200000 };

  /* Biểu thuế lũy tiến từng phần theo tháng: [phần thu nhập tính thuế tối đa của bậc, thuế suất theo phần nghìn]. */
  var BIEU_THUE = [
    { toiDa: 10000000, phanNghin: 50 },
    { toiDa: 30000000, phanNghin: 100 },
    { toiDa: 60000000, phanNghin: 200 },
    { toiDa: 100000000, phanNghin: 300 },
    { toiDa: Infinity, phanNghin: 350 }
  ];

  /* Thời gian thử việc tối đa theo nhóm công việc. */
  var THOI_GIAN_TOI_DA = {
    quanly: { so: 180, donVi: 'ngày', lamViec: false, ten: 'Người quản lý doanh nghiệp' },
    caodang: { so: 60, donVi: 'ngày', lamViec: false, ten: 'Chuyên môn, kỹ thuật từ cao đẳng trở lên' },
    trungcap: { so: 30, donVi: 'ngày', lamViec: false, ten: 'Trung cấp, công nhân kỹ thuật, nhân viên nghiệp vụ' },
    khac: { so: 6, donVi: 'ngày làm việc', lamViec: true, ten: 'Công việc khác' }
  };

  var TY_LE_TOI_THIEU = 85;
  var NGUONG_NGAY_KHONG_DONG_BH = 14;

  return {
    PHAM_VI: PHAM_VI,
    TY_LE_BH: TY_LE_BH,
    GIAM_TRU: GIAM_TRU,
    BIEU_THUE: BIEU_THUE,
    THOI_GIAN_TOI_DA: THOI_GIAN_TOI_DA,
    TY_LE_TOI_THIEU: TY_LE_TOI_THIEU,
    NGUONG_NGAY_KHONG_DONG_BH: NGUONG_NGAY_KHONG_DONG_BH,
    LUONG_TOI_THIEU_VUNG: LUONG_TOI_THIEU_VUNG,
    khoa: khoa,
    luongToiThieuVung: function (vung, nam, thang) {
      var d = tra(LUONG_TOI_THIEU_VUNG, nam, thang);
      return d ? d.muc[vung] : null;
    },
    nhanLuongToiThieu: function (nam, thang) {
      var d = tra(LUONG_TOI_THIEU_VUNG, nam, thang);
      return d ? d.nhan : '';
    },
    mucThamChieu: function (nam, thang) {
      var d = tra(MUC_THAM_CHIEU, nam, thang);
      return d ? d.muc : null;
    },
    nguongKhauTru: function (nam, thang) {
      var d = tra(NGUONG_KHAU_TRU, nam, thang);
      return d ? d.muc : null;
    },
    tranTienAn: function (nam, thang) {
      var d = tra(TRAN_TIEN_AN, nam, thang);
      return d ? d.muc : null;
    }
  };
});
