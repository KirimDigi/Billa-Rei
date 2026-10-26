/**
 * GOOGLE APPS SCRIPT - SISTEM UCAPAN & RSVP SPREADSHEET
 * 
 * ID Spreadsheet: 1hKRjbuc6k3F0aZ_WR8sLQYFABOBxIjhCHBvE6GGtqNI
 * Nama Sheet: Sheet1
 * 
 * Kolom Sheet1:
 * [Kolom A] Timestamp
 * [Kolom B] Nama Tamu
 * [Kolom C] Ucapan
 * [Kolom D] Konfirmasi Kehadiran
 * [Kolom E] Jumlah Tamu
 */

const SPREADSHEET_ID = "1hKRjbuc6k3F0aZ_WR8sLQYFABOBxIjhCHBvE6GGtqNI";
const SHEET_NAME = "Sheet1";

/**
 * Endpoint GET: Mengambil daftar ucapan untuk ditampilkan di web
 */
function doGet(e) {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = ss.getSheetByName(SHEET_NAME);
    
    // Pastikan header ada di baris 1
    ensureHeader(sheet);
    
    const lastRow = sheet.getLastRow();
    if (lastRow <= 1) {
      return responseJSON({ status: "success", data: [] });
    }
    
    // Ambil data mulai dari baris 2 hingga baris terakhir
    const values = sheet.getRange(2, 1, lastRow - 1, 5).getValues();
    const data = values.map(function(row) {
      return {
        timestamp: row[0] ? formatTanggal(row[0]) : "",
        nama: row[1] || "",
        ucapan: row[2] || "",
        kehadiran: row[3] || "",
        jumlahTamu: row[4] || 0
      };
    });
    
    // Urutkan dari yang terbaru (reverse)
    data.reverse();
    
    return responseJSON({ status: "success", data: data });
  } catch (error) {
    return responseJSON({ status: "error", message: error.toString() });
  }
}

/**
 * Endpoint POST: Menerima data ucapan & RSVP baru dari web dan menyimpannya ke Spreadsheet
 */
function doPost(e) {
  try {
    let payload = {};
    if (e && e.postData && e.postData.contents) {
      try {
        payload = JSON.parse(e.postData.contents);
      } catch (err) {
        payload = e.parameter || {};
      }
    } else if (e && e.parameter) {
      payload = e.parameter;
    }

    const nama = payload.nama || payload.author || "Tamu Undangan";
    const ucapan = payload.ucapan || payload.comment || "";
    const kehadiran = payload.kehadiran || payload.attendance || "Tidak Konfirmasi";
    const jumlahTamu = kehadiran === "Hadir" ? (payload.jumlah || payload.guest || "1") : "0";
    const timestamp = new Date();

    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = ss.getSheetByName(SHEET_NAME);
    
    // Pastikan header ada di baris 1
    ensureHeader(sheet);

    // Tambahkan data ke baris baru: [Timestamp, Nama Tamu, Ucapan, Konfirmasi Kehadiran, Jumlah Tamu]
    sheet.appendRow([timestamp, nama, ucapan, kehadiran, jumlahTamu]);

    return responseJSON({
      status: "success",
      message: "Ucapan & RSVP berhasil disimpan!",
      data: {
        timestamp: formatTanggal(timestamp),
        nama: nama,
        ucapan: ucapan,
        kehadiran: kehadiran,
        jumlahTamu: jumlahTamu
      }
    });
  } catch (error) {
    return responseJSON({ status: "error", message: error.toString() });
  }
}

/**
 * Helper: Cek & buat header jika sheet masih kosong
 */
function ensureHeader(sheet) {
  if (sheet.getLastRow() === 0) {
    sheet.appendRow([
      "Timestamp",
      "Nama Tamu",
      "Ucapan",
      "Konfirmasi Kehadiran",
      "Jumlah Tamu"
    ]);
    sheet.getRange(1, 1, 1, 5).setFontWeight("bold");
  }
}

/**
 * Helper: Format Tanggal ke format lokal Indonesia
 */
function formatTanggal(dateObj) {
  if (!(dateObj instanceof Date)) {
    dateObj = new Date(dateObj);
  }
  return Utilities.formatDate(dateObj, "Asia/Jakarta", "dd MMM yyyy, HH:mm");
}

/**
 * Helper: Response JSON dengan header CORS yang benar
 */
function responseJSON(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
