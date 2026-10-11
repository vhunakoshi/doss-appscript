// ==========================================
// 1. FUNGSI UNTUK MEMBUAT MENU DI SPREADSHEET
// ==========================================
function onOpen() {
  const ui = SpreadsheetApp.getUi();
  ui.createMenu('Algolia Data')
    .addItem('Tarik Data (Filter Tanggal) 📅', 'showFilterModal')
    .addSeparator()
    .addItem('Tarik Semua Data DOSS Main', 'syncDossMainData')
    .addItem('Tarik Semua Data DOSS Indo (Sony)', 'syncDossSonyData')
    .addItem('Tarik Semua Data (Keduanya)', 'syncAllAlgoliaData')
    .addSeparator()
    .addItem('Push Keyword ke Algolia (Main)', 'pushMainKeywords')
    .addItem('Push Keyword ke Algolia (Sony)', 'pushSonyKeywords')
    .addSeparator()
    .addItem('Generate Keyword (Bulk by Vendor) 🤖', 'showBulkKeywordModal')
    .addToUi();
  
  ui.createMenu('Shopify Data')
    .addItem('Tarik Data (Filter Tanggal) 📅', 'showShopifyFilterModal')
    .addSeparator()
    .addItem('Tarik Semua Produk (DOSS Main)', 'syncShopifyMainData')
    .addItem('Tarik Semua Produk (DOSS Indo / Sony)', 'syncShopifySonyData')
    .addToUi();

  ui.createMenu('PIM Data 📦')
    .addItem('Tarik Semua Produk (PIM DOSS Main)', 'syncPimMainData')
    .addItem('Tarik Semua Produk (PIM DOSS Sony)', 'syncPimSonyData')
    .addToUi();

  ui.createMenu('Komparasi Data 📊')
    .addItem('Bandingkan Data DOSS Main', 'compareMainSheets')
    .addItem('Bandingkan Data DOSS Indo (Sony)', 'compareSonySheets')
    .addToUi();
}

function syncDossMainData() { runSync('MAIN', null); }
function syncDossSonyData() { runSync('SONY', null); }
function syncAllAlgoliaData() { runSync('ALL', null); }

function pushMainKeywords() { pushKeywordsToAlgolia('Index DOSS Main', 'ALGOLIA_INDEX_MAIN'); }
function pushSonyKeywords() { pushKeywordsToAlgolia('Index DOSS Indo (Sony)', 'ALGOLIA_INDEX_SONY'); }


// ==========================================
// 2. FUNGSI UI FILTER TANGGAL (MODAL)
// ==========================================
function showFilterModal() {
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <base target="_top">
      <style>
        body { font-family: 'Segoe UI', Tahoma, sans-serif; padding: 15px; color: #333; }
        .form-group { margin-bottom: 15px; }
        label { display: block; font-weight: 500; margin-bottom: 5px; font-size: 14px; }
        select, input[type="date"] { width: 100%; padding: 8px; border: 1px solid #ccc; border-radius: 4px; box-sizing: border-box; }
        button { background-color: #2563eb; color: white; border: none; padding: 10px 15px; border-radius: 4px; cursor: pointer; width: 100%; font-weight: bold; margin-top: 10px; }
        button:hover { background-color: #1d4ed8; }
        button:disabled { background-color: #93c5fd; cursor: not-allowed; }
        #status { margin-top: 15px; font-size: 13px; color: #d97706; font-weight: bold; text-align: center; }
      </style>
    </head>
    <body>
      <div class="form-group">
        <label>Pilih Target Index</label>
        <select id="targetIndex">
          <option value="MAIN">DOSS Main</option>
          <option value="SONY">DOSS Indo (Sony)</option>
          <option value="ALL">Keduanya (All)</option>
        </select>
      </div>
      <div class="form-group">
        <label>Filter Berdasarkan Field</label>
        <select id="dateField">
          <option value="updated_at">Updated At</option>
          <option value="created_at">Created At</option>
        </select>
      </div>
      <div class="form-group">
        <label>Tanggal Mulai (Start Date)</label>
        <input type="date" id="startDate" required>
      </div>
      <div class="form-group">
        <label>Tanggal Akhir (End Date)</label>
        <input type="date" id="endDate" required>
      </div>
      <button id="btnSubmit" onclick="submitForm()">Tarik Data</button>
      <div id="status"></div>

      <script>
        function submitForm() {
          const target = document.getElementById('targetIndex').value;
          const dateField = document.getElementById('dateField').value;
          const startDate = document.getElementById('startDate').value;
          const endDate = document.getElementById('endDate').value;

          if (!startDate || !endDate) {
            alert('Harap isi Tanggal Mulai dan Tanggal Akhir!');
            return;
          }

          document.getElementById('btnSubmit').disabled = true;
          document.getElementById('status').innerText = 'Sedang menarik data ke Spreadsheet... Mohon tunggu.';

          google.script.run
            .withSuccessHandler(function() {
              google.script.host.close();
            })
            .withFailureHandler(function(err) {
              document.getElementById('status').innerText = 'Error: ' + err.message;
              document.getElementById('btnSubmit').disabled = false;
            })
            .processSyncWithFilter(target, dateField, startDate, endDate);
        }
      </script>
    </body>
    </html>
  `;
  
  const htmlOutput = HtmlService.createHtmlOutput(htmlContent)
    .setWidth(350)
    .setHeight(400);
    
  SpreadsheetApp.getUi().showModalDialog(htmlOutput, '📅 Filter Penarikan Data');
}

// ==========================================
// 2B. FUNGSI UI FILTER TANGGAL SHOPIFY (MODAL)
// ==========================================
function showShopifyFilterModal() {
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <base target="_top">
      <style>
        body { font-family: 'Segoe UI', Tahoma, sans-serif; padding: 15px; color: #333; }
        .form-group { margin-bottom: 15px; }
        label { display: block; font-weight: 500; margin-bottom: 5px; font-size: 14px; }
        select, input[type="date"] { width: 100%; padding: 8px; border: 1px solid #ccc; border-radius: 4px; box-sizing: border-box; }
        button { background-color: #008060; color: white; border: none; padding: 10px 15px; border-radius: 4px; cursor: pointer; width: 100%; font-weight: bold; margin-top: 10px; }
        button:hover { background-color: #004b36; }
        button:disabled { background-color: #a3e2d1; cursor: not-allowed; }
        #status { margin-top: 15px; font-size: 13px; color: #d97706; font-weight: bold; text-align: center; }
      </style>
    </head>
    <body>
      <div class="form-group">
        <label>Pilih Target Toko Shopify</label>
        <select id="targetShopify">
          <option value="SHOPIFY_MAIN">Shopify - DOSS Main</option>
          <option value="SHOPIFY_SONY">Shopify - DOSS Indo (Sony)</option>
        </select>
      </div>
      <div class="form-group">
        <label>Filter Berdasarkan Field</label>
        <select id="dateField">
          <option value="updated_at">Updated At</option>
          <option value="created_at">Created At</option>
        </select>
      </div>
      <div class="form-group">
        <label>Tanggal Mulai (Start Date)</label>
        <input type="date" id="startDate" required>
      </div>
      <div class="form-group">
        <label>Tanggal Akhir (End Date)</label>
        <input type="date" id="endDate" required>
      </div>
      <button id="btnSubmit" onclick="submitForm()">Tarik Data Shopify</button>
      <div id="status"></div>

      <script>
        function submitForm() {
          const target = document.getElementById('targetShopify').value;
          const dateField = document.getElementById('dateField').value;
          const startDate = document.getElementById('startDate').value;
          const endDate = document.getElementById('endDate').value;

          if (!startDate || !endDate) {
            alert('Harap isi Tanggal Mulai dan Tanggal Akhir!');
            return;
          }

          document.getElementById('btnSubmit').disabled = true;
          document.getElementById('status').innerText = 'Sedang menarik data Shopify... Mohon tunggu.';

          google.script.run
            .withSuccessHandler(function() {
              google.script.host.close();
            })
            .withFailureHandler(function(err) {
              document.getElementById('status').innerText = 'Error: ' + err.message;
              document.getElementById('btnSubmit').disabled = false;
            })
            .processShopifySyncWithFilter(target, dateField, startDate, endDate);
        }
      </script>
    </body>
    </html>
  `;
  
  const htmlOutput = HtmlService.createHtmlOutput(htmlContent)
    .setWidth(350)
    .setHeight(400);
    
  SpreadsheetApp.getUi().showModalDialog(htmlOutput, '📅 Filter Penarikan Data Shopify');
}

function processSyncWithFilter(target, dateField, startDateStr, endDateStr) {
  const filterData = {
    field: dateField,
    start: new Date(startDateStr + "T00:00:00").getTime(),
    end: new Date(endDateStr + "T23:59:59").getTime()
  };

  runSync(target, filterData);
}

function processShopifySyncWithFilter(target, dateField, startDateStr, endDateStr) {
  const filterData = {
    field: dateField === 'updated_at' ? 'updated_at' : 'created_at',
    start: startDateStr + "T00:00:00Z",
    end: endDateStr + "T23:59:59Z"
  };

  runShopifySyncWithFilter(target, filterData);
}

// ==========================================
// 3. FUNGSI EKSEKUSI UTAMA (TARIK DATA)
// ==========================================
function runSync(target, filterData = null) {
  const ui = SpreadsheetApp.getUi();
  const scriptProperties = PropertiesService.getScriptProperties();
  
  const ALGOLIA_APP_ID = scriptProperties.getProperty('ALGOLIA_APP_ID');
  const ALGOLIA_SEARCH_KEY = scriptProperties.getProperty('ALGOLIA_SEARCH_KEY');
  
  if (!ALGOLIA_APP_ID || !ALGOLIA_SEARCH_KEY) {
    throw new Error("ALGOLIA_APP_ID atau ALGOLIA_SEARCH_KEY belum diset pada Script Properties.");
  }

  const ss = SpreadsheetApp.getActiveSpreadsheet();

  try {
    if (target === 'MAIN' || target === 'ALL') {
      const ALGOLIA_INDEX_MAIN = scriptProperties.getProperty('ALGOLIA_INDEX_MAIN');
      if (!ALGOLIA_INDEX_MAIN) throw new Error("ALGOLIA_INDEX_MAIN belum diset.");
      
      ss.toast('Menarik data Algolia untuk DOSS Main...', 'Proses Berjalan', 5);
      fetchAndWriteToSheet(ALGOLIA_APP_ID, ALGOLIA_SEARCH_KEY, ALGOLIA_INDEX_MAIN, 'Index DOSS Main', ss, filterData);
    }

    if (target === 'SONY' || target === 'ALL') {
      const ALGOLIA_INDEX_SONY = scriptProperties.getProperty('ALGOLIA_INDEX_SONY');
      if (!ALGOLIA_INDEX_SONY) throw new Error("ALGOLIA_INDEX_SONY belum diset.");
      
      ss.toast('Menarik data Algolia untuk DOSS Indo (Sony)...', 'Proses Berjalan', 5);
      fetchAndWriteToSheet(ALGOLIA_APP_ID, ALGOLIA_SEARCH_KEY, ALGOLIA_INDEX_SONY, 'Index DOSS Indo (Sony)', ss, filterData);
    }

    let filterMsg = filterData ? ' (Dengan Filter Tanggal)' : ' (Semua Data)';
    let msg = target === 'ALL' ? 'kedua Index' : (target === 'MAIN' ? 'DOSS Main' : 'DOSS Indo (Sony)');
    
    if (!filterData) {
      ui.alert(`Sukses! Data produk dari ${msg}${filterMsg} berhasil ditarik.`);
    } else {
      ss.toast(`Sukses! Data dari ${msg} berhasil ditarik.`, 'Selesai', 5);
    }
    
  } catch (error) {
    Logger.log('Terjadi kesalahan: ' + error.toString());
    throw new Error(error.message); 
  }
}

function runShopifySyncWithFilter(target, filterData) {
  const ui = SpreadsheetApp.getUi();
  const scriptProperties = PropertiesService.getScriptProperties();
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  
  const apiVersion = scriptProperties.getProperty('SHOPIFY_API_VERSION') || '2024-01';

  try {
    if (target === 'SHOPIFY_MAIN') {
      const SHOPIFY_DOMAIN = scriptProperties.getProperty('SHOPIFY_DOMAIN');
      const CLIENT_ID = scriptProperties.getProperty('SHOPIFY_MAIN_CLIENT_ID');
      const CLIENT_SECRET = scriptProperties.getProperty('SHOPIFY_MAIN_CLIENT_SECRET');
      
      if (!SHOPIFY_DOMAIN || !CLIENT_ID || !CLIENT_SECRET) {
        ui.alert("Error: SHOPIFY_DOMAIN, SHOPIFY_MAIN_CLIENT_ID, atau SHOPIFY_MAIN_CLIENT_SECRET belum diset pada Script Properties.");
        return;
      }
      
      try {
        const sheetName = 'Shopify Product DOSS Main';
        ss.toast('Mengautentikasi Client ID & Secret Main...', 'Proses Berjalan', 3);
        const accessToken = fetchShopifyDynamicToken(SHOPIFY_DOMAIN, CLIENT_ID, CLIENT_SECRET);
        
        ss.toast('Mulai menarik data filter produk dari Shopify Main...', 'Proses Berjalan', 5);
        fetchAndWriteShopifyData(SHOPIFY_DOMAIN, accessToken, apiVersion, sheetName, ss, filterData);
        
      } catch (error) {
        Logger.log('Terjadi kesalahan Shopify (Main): ' + error.toString());
        ui.alert('Terjadi kesalahan saat menarik data Shopify (Main): ' + error.message);
        return;
      }
      
    } else if (target === 'SHOPIFY_SONY') {
      
      const SHOPIFY_SONY_DOMAIN = scriptProperties.getProperty('SHOPIFY_SONY_DOMAIN');
      const CLIENT_ID = scriptProperties.getProperty('SHOPIFY_SONY_CLIENT_ID');
      const CLIENT_SECRET = scriptProperties.getProperty('SHOPIFY_SONY_CLIENT_SECRET');
      const SHOPIFY_API_VERSION = scriptProperties.getProperty('SHOPIFY_SONY_API_VERSION') || '2024-01'; 
      
      if (!SHOPIFY_SONY_DOMAIN || !CLIENT_ID || !CLIENT_SECRET) {
        ui.alert("Error: SHOPIFY_SONY_DOMAIN, SHOPIFY_SONY_CLIENT_ID, atau SHOPIFY_SONY_CLIENT_SECRET belum diset pada Script Properties.");
        return;
      }
      
      try {
        const sheetName = 'Shopify Product DOSS Indo (Sony)';
        ss.toast('Mengautentikasi Client ID & Secret...', 'Proses Berjalan', 3);
        const accessToken = fetchShopifyDynamicToken(SHOPIFY_SONY_DOMAIN, CLIENT_ID, CLIENT_SECRET);
        ss.toast('Mulai menarik data produk dari Shopify (Sony)...', 'Proses Berjalan', 5);
        fetchAndWriteShopifyData(SHOPIFY_SONY_DOMAIN, accessToken, SHOPIFY_API_VERSION, sheetName, ss, filterData);

        ui.alert(`Sukses! Semua data produk dari Shopify berhasil ditarik ke sheet "${sheetName}".`);
      } catch (error) {
        Logger.log('Terjadi kesalahan Shopify (Sony): ' + error.toString());
        ui.alert('Terjadi kesalahan saat menarik data Shopify (Sony): ' + error.message);
      }
    }
    
    ss.toast(`Sukses! Data Shopify (Filter Tanggal) berhasil ditarik.`, 'Selesai', 5);
    
  } catch (error) {
    Logger.log('Terjadi kesalahan Shopify Filter: ' + error.toString());
    throw new Error(error.message);
  }
}

/**
 * Fungsi untuk menghapus baris yang sepenuhnya kosong pada sheet tertentu
 * @param {Sheet} sheet - Objek target sheet yang ingin dibersihkan
 */
function deleteEmptyRows(sheet) {
  const lastRow = sheet.getLastRow();
  const lastColumn = sheet.getLastColumn();
  
  // Jika sheet benar-benar kosong, tidak perlu ada yang dieksekusi
  if (lastRow === 0 || lastColumn === 0) return;

  // Ambil seluruh data yang ada di sheet
  const range = sheet.getRange(1, 1, lastRow, lastColumn);
  const values = range.getValues();

  // Loop berjalan mundur dari baris paling bawah ke atas
  for (let i = lastRow - 1; i >= 0; i--) {
    const rowValues = values[i];
    
    // Periksa apakah semua kolom pada baris tersebut kosong
    const isRowEmpty = rowValues.every(cellValue => {
      return cellValue === "" || cellValue === null || cellValue === undefined;
    });

    if (isRowEmpty) {
      // Ingat: indeks array dimulai dari 0, sedangkan baris di Sheet dimulai dari 1
      sheet.deleteRow(i + 1);
    }
  }
}

// ==========================================
// 4. FUNGSI MENGAMBIL DATA ALGOLIA
// ==========================================
function fetchAndWriteToSheet(appId, searchKey, indexName, sheetName, spreadsheet, filterData) {
  const url = `https://${appId}-dsn.algolia.net/1/indexes/${indexName}/browse`;
  let allHits = [];
  let cursor = null; 
  
  do {
    const payload = {
      params: "attributesToRetrieve=objectID,sku,title,vendor,category,Keyword,created_at,updated_at&hitsPerPage=1000"
    };
    if (cursor) payload.cursor = cursor;

    const options = {
      method: 'post',
      headers: {
        'X-Algolia-Application-Id': appId,
        'X-Algolia-API-Key': searchKey,
        'Content-Type': 'application/json'
      },
      payload: JSON.stringify(payload),
      muteHttpExceptions: true
    };

    const response = UrlFetchApp.fetch(url, options);
    const json = JSON.parse(response.getContentText());

    if (response.getResponseCode() !== 200) {
      throw new Error(`Gagal dari Algolia: ${json.message || response.getContentText()}`);
    }

    if (json.hits && json.hits.length > 0) {
      allHits = allHits.concat(json.hits);
    }
    cursor = json.cursor;
  } while (cursor);

  // --- BAGIAN YANG DIPERBAIKI (FILTER TANGGAL) ---
  if (filterData) {
    const formatToISO = (dateValue) => {
      if (!dateValue) return "";
      if (typeof dateValue === 'string' && /^\d{4}-\d{2}-\d{2}/.test(dateValue)) {
        return dateValue.replace(' ', 'T').substring(0, 19);
      }
      const d = new Date(dateValue);
      if (!isNaN(d.getTime())) {
        const pad = n => n < 10 ? '0' + n : n;
        return d.getFullYear() + '-' +
               pad(d.getMonth() + 1) + '-' +
               pad(d.getDate()) + 'T' +
               pad(d.getHours()) + ':' +
               pad(d.getMinutes()) + ':' +
               pad(d.getSeconds());
      }
      return String(dateValue).replace(' ', 'T').substring(0, 19);
    };

    const startTime = formatToISO(filterData.start);
    const endTime = formatToISO(filterData.end);

    allHits = allHits.filter(hit => {
      if (!hit[filterData.field]) return false;
      const itemTime = formatToISO(hit[filterData.field]);
      return itemTime >= startTime && itemTime <= endTime;
    });
  }
  // -----------------------------------------------

  let targetSheet = spreadsheet.getSheetByName(sheetName);
  if (!targetSheet) targetSheet = spreadsheet.insertSheet(sheetName);
  targetSheet.clear();

  if (allHits.length === 0) {
    targetSheet.getRange(1, 1).setValue("Tidak ada data ditemukan pada rentang tanggal tersebut.");
    return;
  }

  // PERUBAHAN HEADER: Tambahkan Sub Category 2
  const headers = ['objectID', 'sku', 'title', 'vendor', 'Category', 'Sub Category', 'Sub Category 2', 'keyword_suggestion', 'check', 'Keyword', 'created_at', 'updated_at'];
  const sheetData = [];
  sheetData.push(headers);

  allHits.forEach(hit => {
    const row = [];
    headers.forEach(header => {
      if (header === 'keyword_suggestion' || header === 'check') {
        row.push(""); 
      } else if (header === 'created_at' || header === 'updated_at') {
        const val = hit[header];
        if (val) {
          const dateStr = typeof val === 'string' ? val.replace('T', ' ').replace('Z', '') : val;
          row.push(dateStr);
        } else {
          row.push("");
        }
      } 
      // Ekstraksi Lvl0
      else if (header === 'Category') {
        let val = "";
        if (hit.category && typeof hit.category === 'object') {
          val = hit.category.lvl0 || "";
        } else if (hit.category) {
          val = hit.category; // Fallback jika format string biasa
        }
        row.push(val);
      } 
      // Ekstraksi Lvl1
      else if (header === 'Sub Category') {
        let val = "";
        if (hit.category && typeof hit.category === 'object' && hit.category.lvl1) {
          val = hit.category.lvl1;
          if (val.includes('>')) {
            val = val.split('>').pop().trim();
          }
        }
        row.push(val);
      } 
      // PERUBAHAN: Ekstraksi Lvl2 (Sub Category 2)
      else if (header === 'Sub Category 2') {
        let val = "";
        if (hit.category && typeof hit.category === 'object' && hit.category.lvl2) {
          val = hit.category.lvl2;
          // Mengambil kata paling belakang setelah tanda ">"
          if (val.includes('>')) {
            val = val.split('>').pop().trim();
          }
        }
        row.push(val);
      }
      else {
        let value = hit[header] !== undefined ? hit[header] : "";
        if (typeof value === 'object' && value !== null) {
          if (header === 'Keyword' && Array.isArray(value)) value = value.join(', ');
          else value = JSON.stringify(value);
        }
        row.push(value);
      }
    });
    sheetData.push(row);
  });

  targetSheet.getRange(1, 1, sheetData.length, sheetData[0].length).setValues(sheetData);
  targetSheet.getRange(1, 1, 1, sheetData[0].length).setFontWeight("bold");

  if (sheetData.length > 1) {
    // PERUBAHAN: Kolom checkbox bergeser ke kolom 9 (I) karena tambahan kolom Sub Category 2
    targetSheet.getRange(2, 9, sheetData.length - 1, 1).insertCheckboxes();
  }

  deleteEmptyRows(targetSheet);
}

// ==========================================
// 5. TRIGGER ONEDIT (DETEKSI CHECKBOX DITEKAN)
// ==========================================
function triggerGenerateKeyword(e) {
  if (!e || !e.range) return; 
  
  const sheet = e.source.getActiveSheet();
  const sheetName = sheet.getName();
  
  if (sheetName !== 'Index DOSS Main' && sheetName !== 'Index DOSS Indo (Sony)') return;

  const row = e.range.getRow();
  const col = e.range.getColumn();

  // PERUBAHAN: Checkbox sekarang berada di kolom ke-8
  if (col === 8 && row > 1) {
    const isChecked = e.range.getValue(); 

    if (isChecked === true) {
      showLoadingModal(row, sheetName);

      const title = sheet.getRange(row, 3).getValue();
      
      if (!title) {
        e.range.setValue(false); 
        SpreadsheetApp.getActiveSpreadsheet().toast("Gagal: Kolom Title kosong.", "Error", 3);
        return;
      }

      // PERUBAHAN: Target kolom keyword_suggestion bergeser ke kolom ke-7
      sheet.getRange(row, 7).setValue("Sedang generate AI...");

      const scriptProperties = PropertiesService.getScriptProperties();
      const CLAUDE_API_KEY = scriptProperties.getProperty('CLAUDE_API_KEY');
      const GEMINI_API_KEY = scriptProperties.getProperty('GEMINI_API_KEY'); 

      if (!CLAUDE_API_KEY && !GEMINI_API_KEY) {
        e.range.setValue(false);
        sheet.getRange(row, 7).setValue("Error: CLAUDE_API_KEY & GEMINI_API_KEY belum diset.");
        return;
      }

      const generatedKeyword = generateKeywordAdapter(title, CLAUDE_API_KEY, GEMINI_API_KEY);

      sheet.getRange(row, 7).setValue(generatedKeyword);
      e.range.setValue(false);
    }
  }
}

function showLoadingModal(row, sheetName) {
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <base target="_top">
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; text-align: center; padding-top: 25px; color: #333; background-color: #fdfdfd; }
        .spinner { width: 40px; height: 40px; border: 4px solid #e0e0e0; border-top: 4px solid #d97706; border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto 15px auto; }
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        p { font-size: 14px; margin: 0; font-weight: 500; }
        .sub-text { font-size: 12px; color: #666; margin-top: 5px; }
      </style>
    </head>
    <body>
      <div class="spinner"></div>
      <p>Mengenerate Keyword dengan Claude...</p>
      <div class="sub-text">Memproses AI untuk baris ke-${row}</div>
      <script>
        google.script.run
          .withSuccessHandler(function() {
            google.script.host.close();
          })
          .withFailureHandler(function(error) {
            alert('Gagal memproses: ' + error.message);
            google.script.host.close();
          })
          .processClaudeBackground(${row}, '${sheetName}');
      </script>
    </body>
    </html>
  `;
  
  const htmlOutput = HtmlService.createHtmlOutput(htmlContent)
    .setWidth(300)
    .setHeight(160);
    
  SpreadsheetApp.getUi().showModalDialog(htmlOutput, '🤖 Proses AI Berjalan');
}

// ==========================================
// 6. FUNGSI CLAUDE API UNTUK 1 PRODUK
// ==========================================
function generateSingleKeywordClaude(title, apiKey) {
  const url = "https://api.anthropic.com/v1/messages";
  
  // Menambahkan instruksi "tanpa penomoran" agar format koma tetap bersih
  const systemPrompt = "Anda adalah ahli SEO E-commerce dan Marketplace. Fokus pada optimasi SEO, pencarian Marketplace di Tokopedia, Shopee, dan Ecommerce. Hanya kembalikan string kata kuncinya saja, tanpa penomoran, tanpa penjelasan, tanpa format markdown, dan tanpa awalan apapun.";
  
  // Mengubah prompt untuk meminta maksimal 10 hasil terbaik
  const userPrompt = `Hasilkan maksimal 10 kata kunci (keywords) terbaik dan paling relevan yang dipisahkan dengan koma untuk produk berjudul: "${title}".`;

  const payload = {
    model: "claude-fable-5", // Catatan: Pastikan nama model ini benar/didukung oleh API yang Anda gunakan. Model standar biasanya "claude-3-5-sonnet-20241022" atau sejenisnya.
    max_tokens: 1024,
    system: systemPrompt,
    messages: [
      { role: "user", content: userPrompt }
    ]
  };

  const options = {
    method: 'post',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01', 
      'content-type': 'application/json'
    },
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  };

  try {
    const response = UrlFetchApp.fetch(url, options);
    const responseCode = response.getResponseCode();
    const responseText = response.getContentText();

    if (responseCode !== 200) {
      try {
         const errObj = JSON.parse(responseText);
         return "API Error: " + (errObj.error?.message || "Unknown error");
      } catch(e) {
         return "API Error: Code " + responseCode + " - " + responseText.substring(0, 50);
      }
    }

    const json = JSON.parse(responseText);
    let resultText = "";
    
    // --- PENGECEKAN FORMAT DINAMIS ---
    // Jika content berupa Array (Standar Anthropic dengan Thinking blocks)
    if (Array.isArray(json.content)) {
      // Cari elemen array yang memiliki type "text" (melewati blok "thinking")
      for (let i = 0; i < json.content.length; i++) {
        if (json.content[i].type === 'text' && json.content[i].text) {
          resultText = json.content[i].text;
          break; // Ditemukan, hentikan pencarian
        }
      }
    } 
    // Fallback: Kemungkinan content berupa String langsung
    else if (typeof json.content === 'string') {
      resultText = json.content;
    } 
    // Fallback: Menggunakan wrapper OpenAI-compatible
    else if (json.choices && json.choices.length > 0 && json.choices[0].message) {
      resultText = json.choices[0].message.content;
    }

    if (!resultText) {
       return "Error Format: " + JSON.stringify(json).substring(0, 200); 
    }

    return resultText.trim();
    
  } catch (error) {
    return "Error System: " + error.message; 
  }
}

// ==========================================
// 6.B FUNGSI ADAPTER (CLAUDE FALLBACK GEMINI)
// ==========================================
function generateKeywordAdapter(title, claudeKey, geminiKey) {
  // 1. Coba gunakan Claude API terlebih dahulu
  let result = generateSingleKeywordClaude(title, claudeKey);
  
  // 2. Deteksi jika terjadi error karena kredit habis dari Claude
  const isCreditError = result.toLowerCase().includes("credit balance is too low") || 
                        result.toLowerCase().includes("credit") ||
                        result.toLowerCase().includes("insufficient_quota") ||
                        result.toLowerCase().includes("billing");
                        
  if (isCreditError) {
    Logger.log("Claude kehabisan kredit. Fallback ke Gemini untuk: " + title);
    
    // Pastikan API Key Gemini sudah di-set
    if (!geminiKey) {
      return "Error: Kredit Claude Habis & GEMINI_API_KEY belum diset.";
    }
    
    // 3. Fallback: Eksekusi dengan Gemini API
    result = generateSingleKeywordGemini(title, geminiKey);
  }
  
  return result;
}

// ==========================================
// 6.C FUNGSI GEMINI API UNTUK 1 PRODUK
// ==========================================
function generateSingleKeywordGemini(title, apiKey) {
  // Menggunakan model Gemini 1.5 Flash (Sangat cepat dan cocok untuk task teks)
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
  
  const systemPrompt = "Anda adalah ahli SEO E-commerce dan Marketplace. Fokus pada optimasi SEO, pencarian Marketplace di Tokopedia, Shopee, dan Ecommerce. Hanya kembalikan string kata kuncinya saja, tanpa penomoran, tanpa penjelasan, tanpa format markdown, dan tanpa awalan apapun.";
  
  const userPrompt = `Hasilkan maksimal 10 kata kunci (keywords) terbaik dan paling relevan yang dipisahkan dengan koma untuk produk berjudul: "${title}".`;

  const payload = {
    systemInstruction: {
      parts: [{ text: systemPrompt }]
    },
    contents: [
      { parts: [{ text: userPrompt }] }
    ],
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 1024
    }
  };

  const options = {
    method: 'post',
    headers: { 'Content-Type': 'application/json' },
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  };

  try {
    const response = UrlFetchApp.fetch(url, options);
    const responseCode = response.getResponseCode();
    const responseText = response.getContentText();

    if (responseCode !== 200) {
      try {
         const errObj = JSON.parse(responseText);
         return "Gemini API Error: " + (errObj.error?.message || "Unknown error");
      } catch(e) {
         return "Gemini API Error: Code " + responseCode + " - " + responseText.substring(0, 50);
      }
    }

    const json = JSON.parse(responseText);
    
    // Ambil text balasan dari Gemini
    if (json.candidates && json.candidates.length > 0 && json.candidates[0].content && json.candidates[0].content.parts.length > 0) {
      return json.candidates[0].content.parts[0].text.trim();
    } else {
      return "Error Format Gemini: " + JSON.stringify(json).substring(0, 200);
    }
    
  } catch (error) {
    return "Error System Gemini: " + error.message; 
  }
}

// ==========================================
// 7. FUNGSI UPDATE/PUSH KE ALGOLIA (OPTIMIZED BATCH)
// ==========================================
function pushKeywordsToAlgolia(sheetName, propIndexName) {
  const ui = SpreadsheetApp.getUi();
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName);
  
  if (!sheet) {
    return ui.alert(`Sheet "${sheetName}" tidak ditemukan. Tarik data terlebih dahulu.`);
  }

  const scriptProperties = PropertiesService.getScriptProperties();
  const ALGOLIA_APP_ID = scriptProperties.getProperty('ALGOLIA_APP_ID');
  const ALGOLIA_ADMIN_KEY = scriptProperties.getProperty('ALGOLIA_ADMIN_KEY'); 
  const ALGOLIA_INDEX = scriptProperties.getProperty(propIndexName);

  if (!ALGOLIA_APP_ID || !ALGOLIA_ADMIN_KEY || !ALGOLIA_INDEX) {
    return ui.alert("Error: ALGOLIA_APP_ID, ALGOLIA_ADMIN_KEY, atau Index belum diset di Script Properties.");
  }

  const dataRange = sheet.getDataRange();
  const data = dataRange.getValues();
  if (data.length <= 1) return ui.alert("Tidak ada data untuk di-push.");

  const headers = data[0];
  const idIdx = headers.indexOf('objectID');
  const keywordSuggestionIdx = headers.indexOf('keyword_suggestion');
  const keywordIdx = headers.indexOf('Keyword');

  if (idIdx === -1 || keywordSuggestionIdx === -1) {
    return ui.alert("Kolom 'objectID' atau 'keyword_suggestion' tidak ditemukan. Pastikan Anda sudah menarik data ulang.");
  }

  // Siapkan rentang untuk mengubah warna di keyword_suggestion
  const numRows = data.length - 1;
  const sugBgRange = sheet.getRange(2, keywordSuggestionIdx + 1, numRows, 1);
  const sugBackgrounds = sugBgRange.getBackgrounds();
  
  // Siapkan rentang untuk menyalin nilai ke kolom keyword
  const keywordRange = keywordIdx !== -1 ? sheet.getRange(2, keywordIdx + 1, numRows, 1) : null;
  const keywordValues = keywordRange ? keywordRange.getValues() : null;

  const algoliaBatchRequests = [];
  const updatedRowsIndex = []; 

  // Ambil waktu saat ini dalam format UTC (ISO 8601)
  const currentUtcDate = new Date().toISOString(); 

  for (let i = 0; i < numRows; i++) {
    const rowData = data[i + 1];
    const objectID = String(rowData[idIdx]).trim();
    const newKeywords = String(rowData[keywordSuggestionIdx]).trim(); // Ambil dari keyword_suggestion
    const currentBgColor = sugBackgrounds[i][0]; 

    if (objectID && newKeywords && 
        !newKeywords.startsWith("Sedang generate AI") && 
        !newKeywords.startsWith("Error") && 
        currentBgColor !== "#d4edda") { 
      
      const keywordArray = newKeywords.split(',').map(kw => kw.trim()).filter(kw => kw !== "");
      
      algoliaBatchRequests.push({
        action: "partialUpdateObject",
        body: {
          objectID: objectID,
          Keyword: keywordArray,
          updated_at: currentUtcDate
        }
      });
      
      // Simpan index baris dan nilai keyword barunya
      updatedRowsIndex.push({
        index: i,
        value: newKeywords
      });
    }
  }

  if (algoliaBatchRequests.length === 0) {
    return ui.alert("Semua data sudah ter-update (hijau) atau tidak ada data yang valid untuk di-push.");
  }

  const url = `https://${ALGOLIA_APP_ID}.algolia.net/1/indexes/${ALGOLIA_INDEX}/batch`;
  const options = {
    method: 'post',
    headers: {
      'X-Algolia-Application-Id': ALGOLIA_APP_ID,
      'X-Algolia-API-Key': ALGOLIA_ADMIN_KEY,
      'Content-Type': 'application/json'
    },
    payload: JSON.stringify({ requests: algoliaBatchRequests }),
    muteHttpExceptions: true
  };

  let updateCount = 0;

  try {
    const response = UrlFetchApp.fetch(url, options);
    const responseCode = response.getResponseCode();
    
    if (responseCode === 200 || responseCode === 201) {
      updatedRowsIndex.forEach(item => {
        // Tandai sukses (hijau) di keyword_suggestion
        sugBackgrounds[item.index][0] = "#d4edda"; 
        
        // Salin teks ke kolom keyword
        if (keywordValues) {
          keywordValues[item.index][0] = item.value;
        }
      });
      updateCount = algoliaBatchRequests.length;
    } else {
      updatedRowsIndex.forEach(item => {
        sugBackgrounds[item.index][0] = "#f8d7da"; // Merah
      });
      Logger.log("Algolia Error: " + response.getContentText());
    }
  } catch (e) {
    updatedRowsIndex.forEach(item => {
      sugBackgrounds[item.index][0] = "#f8d7da"; // Merah
    });
    Logger.log("Fetch Error: " + e.message);
  }

  // Terapkan semua perubahan warna dan teks kembali ke Spreadsheet sekaligus
  sugBgRange.setBackgrounds(sugBackgrounds);
  if (keywordValues) {
    keywordRange.setValues(keywordValues);
  }

  ui.alert(`Proses Push Selesai! Sebanyak ${updateCount} data pada ${sheetName} berhasil diperbarui di Algolia.`);
}

// ==========================================
// 8. FUNGSI BACKGROUND UNTUK TRIGGER MODAL (CLAUDE)
// ==========================================
function processClaudeBackground(row, sheetName) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(sheetName);
  
  const title = sheet.getRange(row, 3).getValue(); 
  
  if (!title) {
    // PERUBAHAN: Kolom checkbox bergeser ke 8
    sheet.getRange(row, 8).setValue(false); 
    throw new Error("Kolom Title produk masih kosong.");
  }

  // PERUBAHAN: Kolom keyword_suggestion bergeser ke 7
  sheet.getRange(row, 7).setValue("Sedang generate AI...");
  sheet.getRange(row, 7).setBackground(null); 

  const scriptProperties = PropertiesService.getScriptProperties();
  const CLAUDE_API_KEY = scriptProperties.getProperty('CLAUDE_API_KEY');
  const GEMINI_API_KEY = scriptProperties.getProperty('GEMINI_API_KEY');

  if (!CLAUDE_API_KEY && !GEMINI_API_KEY) {
    sheet.getRange(row, 8).setValue(false);
    sheet.getRange(row, 7).setValue("Error: API KEY belum diset.");
    throw new Error("CLAUDE atau GEMINI API KEY belum diset di Script Properties.");
  }

  const generatedKeyword = generateKeywordAdapter(title, CLAUDE_API_KEY, GEMINI_API_KEY);

  sheet.getRange(row, 7).setValue(generatedKeyword);
  sheet.getRange(row, 8).setValue(false); 
  
  return true; 
}

// ==========================================
// 9. FUNGSI EKSEKUSI SHOPIFY (MAIN) DENGAN CLIENT ID & SECRET
// ==========================================
function syncShopifyMainData() {
  const ui = SpreadsheetApp.getUi();
  const scriptProperties = PropertiesService.getScriptProperties();
  
  const SHOPIFY_DOMAIN = scriptProperties.getProperty('SHOPIFY_DOMAIN');
  const CLIENT_ID = scriptProperties.getProperty('SHOPIFY_MAIN_CLIENT_ID');
  const CLIENT_SECRET = scriptProperties.getProperty('SHOPIFY_MAIN_CLIENT_SECRET');
  const SHOPIFY_API_VERSION = scriptProperties.getProperty('SHOPIFY_API_VERSION') || '2024-01';
  
  if (!SHOPIFY_DOMAIN || !CLIENT_ID || !CLIENT_SECRET) {
    ui.alert("Error: SHOPIFY_DOMAIN, SHOPIFY_MAIN_CLIENT_ID, atau SHOPIFY_MAIN_CLIENT_SECRET belum diset pada Script Properties.");
    return;
  }

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheetName = 'Shopify Product DOSS Main';
  
  try {
    ss.toast('Mengautentikasi Client ID & Secret Main...', 'Proses Berjalan', 3);
    
    // 1. Dapatkan token dinamis menggunakan fungsi bantuan yang sama dengan Sony
    const accessToken = fetchShopifyDynamicToken(SHOPIFY_DOMAIN, CLIENT_ID, CLIENT_SECRET);
    
    ss.toast('Mulai menarik data produk dari Shopify (Main)...', 'Proses Berjalan', 5);
    
    // 2. Gunakan token tersebut ke fungsi GraphQL
    fetchAndWriteShopifyData(SHOPIFY_DOMAIN, accessToken, SHOPIFY_API_VERSION, sheetName, ss);
    
    ui.alert(`Sukses! Semua data produk dari Shopify berhasil ditarik ke sheet "${sheetName}".`);
  } catch (error) {
    Logger.log('Terjadi kesalahan Shopify (Main): ' + error.toString());
    ui.alert('Terjadi kesalahan saat menarik data Shopify (Main): ' + error.message);
  }
}

// ==========================================
// 9.B FUNGSI EKSEKUSI SHOPIFY STOREFRONT (SONY)
// ==========================================
function syncShopifySonyData() {
  const ui = SpreadsheetApp.getUi();
  const scriptProperties = PropertiesService.getScriptProperties();
  
  const SHOPIFY_SONY_DOMAIN = scriptProperties.getProperty('SHOPIFY_SONY_DOMAIN'); 
  const CLIENT_ID = scriptProperties.getProperty('SHOPIFY_SONY_CLIENT_ID');
  const CLIENT_SECRET = scriptProperties.getProperty('SHOPIFY_SONY_CLIENT_SECRET');
  const SHOPIFY_API_VERSION = scriptProperties.getProperty('SHOPIFY_SONY_API_VERSION') || '2024-01'; 
  
  if (!SHOPIFY_SONY_DOMAIN || !CLIENT_ID || !CLIENT_SECRET) {
    ui.alert("Error: SHOPIFY_SONY_DOMAIN, SHOPIFY_SONY_CLIENT_ID, atau SHOPIFY_SONY_CLIENT_SECRET belum diset pada Script Properties.");
    return;
  }

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheetName = 'Shopify Product DOSS Indo (Sony)';
  
  try {
    ss.toast('Mengautentikasi Client ID & Secret...', 'Proses Berjalan', 3);
    
    // 1. Dapatkan token dinamis 
    const accessToken = fetchShopifyDynamicToken(SHOPIFY_SONY_DOMAIN, CLIENT_ID, CLIENT_SECRET);
    
    ss.toast('Mulai menarik data produk dari Shopify (Sony)...', 'Proses Berjalan', 5);
    
    // 2. Gunakan token tersebut ke fungsi GraphQL
    fetchAndWriteShopifyData(SHOPIFY_SONY_DOMAIN, accessToken, SHOPIFY_API_VERSION, sheetName, ss);
    
    ui.alert(`Sukses! Semua data produk dari Shopify berhasil ditarik ke sheet "${sheetName}".`);
  } catch (error) {
    Logger.log('Terjadi kesalahan Shopify (Sony): ' + error.toString());
    ui.alert('Terjadi kesalahan saat menarik data Shopify (Sony): ' + error.message);
  }
}

// ==========================================
// FUNGSI BANTUAN: GET TOKEN DARI CLIENT_ID & SECRET
// ==========================================
function fetchShopifyDynamicToken(domain, clientId, clientSecret) {
  // Endpoint URL disesuaikan dengan standar Admin OAuth Shopify
  // Ubah URL ini jika Anda menggunakan middleware/proxy eksternal
  const authUrl = `https://${domain}/admin/oauth/access_token`; 
  
  const payload = {
    client_id: clientId,
    client_secret: clientSecret,
    grant_type: "client_credentials"
  };

  const options = {
    method: 'post',
    contentType: 'application/json',
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  };

  const response = UrlFetchApp.fetch(authUrl, options);
  const json = JSON.parse(response.getContentText());

  console.log("Response dari Shopify Token Endpoint: " + response.getContentText());

  if (response.getResponseCode() !== 200 || !json.access_token) {
    // Menangkap error jika kredensial salah atau endpoint menolak request
    throw new Error("Gagal Autentikasi: " + (json.error_description || json.error || response.getContentText()));
  }

  console.log("Token dinamis berhasil diperoleh: " + json.access_token);
  return json.access_token;
}

// ==========================================
// 10. FUNGSI PENGAMBILAN DATA VIA GRAPHQL (SUPPORT FILTER)
// ==========================================
function fetchAndWriteShopifyData(domain, token, apiVersion, sheetName, spreadsheet, filterData = null) {
  // PERBAIKAN: Menambahkan /admin pada URL endpoint
  const url = `https://${domain}/admin/api/${apiVersion}/graphql.json`;
  
  let allProducts = [];
  let hasNextPage = true;
  let cursor = null; 
  
  // --- BAGIAN FILTER TANGGAL ---
  let shopifyQueryFilter = "";
  if (filterData) {
    shopifyQueryFilter = `${filterData.field}:>=\"${filterData.start}\" AND ${filterData.field}:<=\"${filterData.end}\"`;
  }
  // -----------------------------------------------
  
  while (hasNextPage) {
    const query = `
      query getProducts($cursor: String, $queryFilter: String) {
        products(first: 250, after: $cursor, query: $queryFilter) {
          pageInfo {
            hasNextPage
            endCursor
          }
          edges {
            node {
              id
              title
              vendor
              productType
              handle
              status
              createdAt
              updatedAt
              publishedAt
              collections(first: 10) {
                edges {
                  node {
                    id
                    title
                  }
                }
              }
              variants(first: 100) {
                edges {
                  node {
                    sku
                  }
                }
              }
            }
          }
        }
      }
    `;
    
    const payload = {
      query: query,
      variables: { 
        cursor: cursor,
        queryFilter: (filterData && shopifyQueryFilter !== "") ? shopifyQueryFilter : null,
        sortKey: "UPDATED_AT",
        reverse: true
      }
    };

    const options = {
      method: 'post',
      headers: {
        'X-Shopify-Access-Token': token, 
        'Content-Type': 'application/json'
      },
      payload: JSON.stringify(payload),
      muteHttpExceptions: true
    };

    const response = UrlFetchApp.fetch(url, options);
    const json = JSON.parse(response.getContentText());

    if (response.getResponseCode() !== 200 || json.errors) {
      const errMsg = json.errors ? JSON.stringify(json.errors) : response.getContentText();
      throw new Error(`Gagal dari Shopify: ${errMsg}`);
    }

    const productsData = json.data.products;
    
    if (productsData.edges && productsData.edges.length > 0) {
      productsData.edges.forEach(edge => {
        allProducts.push(edge.node);
      });
    }
    
    hasNextPage = productsData.pageInfo.hasNextPage;
    cursor = productsData.pageInfo.endCursor; 
  }

  let targetSheet = spreadsheet.getSheetByName(sheetName);
  if (!targetSheet) targetSheet = spreadsheet.insertSheet(sheetName);
  targetSheet.clear(); 

  if (allProducts.length === 0) {
    targetSheet.getRange(1, 1).setValue("Tidak ada produk ditemukan di Shopify.");
    return;
  }

  // PERUBAHAN: Tambahkan header untuk Sub Category 2
  const headers = [
    'Shopify_ID', 
    'SKU', 
    'Title', 
    'Handle', 
    'Vendor', 
    'Product Type', 
    'Status',
    'Collection Category',
    'Collection Sub Category',
    'Collection Sub Category 2', 
    'Created_At', 
    'Updated_At',
    'Published_At'
  ];
  
  const sheetData = [];
  sheetData.push(headers);

  allProducts.forEach(product => {
    
    const skus = product.variants.edges
      .map(v => v.node.sku)
      .filter(sku => sku)
      .join(', ');

    let collCategory = "";
    let collSubCategory = "";
    let collSubCategory2 = ""; // PERUBAHAN: Deklarasi variabel baru

    if (product.collections && product.collections.edges.length > 0) {
      const lastIndex = product.collections.edges.length - 1;
      const lastCollectionTitle = product.collections.edges[lastIndex].node.title;
      
      if (lastCollectionTitle.includes('>')) {
        const parts = lastCollectionTitle.split('>');
        
        // Level 0: Category
        collCategory = parts[0].trim();
        
        // Level 1: Sub Category
        if (parts.length > 1) {
          collSubCategory = parts[1].trim();
        }
        
        // Level 2: Sub Category 2 (Jika lebih dari 3 level, sisa hirarki akan digabung di sini)
        if (parts.length > 2) {
          collSubCategory2 = parts.slice(2).join('>').trim(); 
        }
        
      } else {
        collCategory = lastCollectionTitle.trim();
      }
    }

    sheetData.push([
      product.id,
      skus,
      product.title,
      product.handle,
      product.vendor,
      product.productType,
      product.status || "",
      collCategory,         
      collSubCategory,
      collSubCategory2,    // PERUBAHAN: Masukkan ke dalam array baris
      product.createdAt || "",
      product.updatedAt || "",
      product.publishedAt || ""
    ]);
  });

  targetSheet.getRange(1, 1, sheetData.length, sheetData[0].length).setValues(sheetData);
  targetSheet.getRange(1, 1, 1, sheetData[0].length).setFontWeight("bold");
  targetSheet.autoResizeColumns(1, sheetData[0].length);
}

// ==========================================
// FUNGSI UTAMA KOMPARASI DATA VIA SKU (TERPISAH)
// ==========================================
function compareMainSheets() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const ui = SpreadsheetApp.getUi();
  
  // PERUBAHAN: Tambahkan sheet PIM sebagai argumen ketiga
  const mainResult = runComparisonLogic(
    ss.getSheetByName('Index DOSS Main'), 
    ss.getSheetByName('Shopify Product DOSS Main'),
    ss.getSheetByName('PIM Product Doss Main'), 
    'Main'
  );
  
  if (!mainResult) {
    return ui.alert("Error: Pastikan sheet 'Index DOSS Main', 'Shopify Product DOSS Main', dan 'PIM Product Doss Main' sudah ditarik datanya dan tidak kosong.");
  }
  
  showSingleComparisonModal(mainResult, 'DOSS MAIN');
  writeComparisonToSheet('Hasil Komparasi Main', ss, mainResult);
  ss.toast('Berhasil membuat sheet Hasil Komparasi Main', 'Sukses', 5);
}

function compareSonySheets() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const ui = SpreadsheetApp.getUi();
  
  const sonyResult = runComparisonLogic(
    ss.getSheetByName('Index DOSS Indo (Sony)'), 
    ss.getSheetByName('Shopify Product DOSS Indo (Sony)'),
    ss.getSheetByName('PIM Product Sony'), 
    'Sony'
  );
  
  if (!sonyResult) {
    return ui.alert("Error: Pastikan sheet 'Index DOSS Indo (Sony)' dan 'Shopify Product DOSS Indo (Sony)' sudah ditarik datanya dan tidak kosong.");
  }
  
  showSingleComparisonModal(sonyResult, 'DOSS INDO (SONY)');
  writeComparisonToSheet('Hasil Komparasi Sony', ss, sonyResult);
  ss.toast('Berhasil membuat sheet Hasil Komparasi Sony', 'Sukses', 5);
}

// ==========================================
// FUNGSI LOGIKA KOMPARASI (SHOPIFY SEBAGAI SOURCE OF TRUTH)
// ==========================================
function runComparisonLogic(algoliaSheet, shopifySheet, pimSheet, label) {
  if (!algoliaSheet || !shopifySheet) return null;

  const algoliaData = algoliaSheet.getDataRange().getValues();
  const shopifyData = shopifySheet.getDataRange().getValues();

  if (algoliaData.length <= 1 && shopifyData.length <= 1) return null;

  // Cek apakah mode komparasi ini menyertakan PIM (Mode 3-Way)
  const hasPim = pimSheet != null;
  let pimData = [];
  if (hasPim) {
    pimData = pimSheet.getDataRange().getValues();
    if (pimData.length <= 1) return null;
  }

  const aHeaders = algoliaData[0];
  const aSkuIdx = aHeaders.indexOf('sku');
  
  const aIdIdx = aHeaders.indexOf('objectID'); 
  const aCatIdx = aHeaders.indexOf('Category') !== -1 ? aHeaders.indexOf('Category') : aHeaders.indexOf('Category Lvl0'); 
  const aSubCatIdx = aHeaders.indexOf('Sub Category') !== -1 ? aHeaders.indexOf('Sub Category') : aHeaders.indexOf('Sub Category Lvl1');
  const aSubCat2Idx = aHeaders.indexOf('Sub Category 2'); 

  const sHeaders = shopifyData[0];
  const sSkuIdx = sHeaders.indexOf('SKU');
  const sTitleIdx = sHeaders.indexOf('Title');
  const sCatIdx = sHeaders.indexOf('Collection Category');
  const sSubCatIdx = sHeaders.indexOf('Collection Sub Category');
  const sSubCat2Idx = sHeaders.indexOf('Collection Sub Category 2'); 
  const sStatusIdx = sHeaders.indexOf('Status');

  if (aSkuIdx === -1 || sSkuIdx === -1) throw new Error("Kolom SKU tidak ditemukan.");

  // Identifikasi Index Kolom PIM
  let pSkuIdx = -1, pCatIdx = -1, pSubCatIdx = -1, pSubCat2Idx = -1;
  if (hasPim) {
    const pHeaders = pimData[0];
    pSkuIdx = pHeaders.indexOf('SKU');
    pCatIdx = pHeaders.indexOf('Category');
    pSubCatIdx = pHeaders.indexOf('Sub Category');
    pSubCat2Idx = pHeaders.indexOf('Sub Category 2');
    if (pSkuIdx === -1) throw new Error("Kolom SKU tidak ditemukan di sheet PIM.");
  }

  // 1. Buat Peta (Map) Data Algolia
  const algoliaMap = new Map();
  for (let i = 1; i < algoliaData.length; i++) {
    const skuRaw = String(algoliaData[i][aSkuIdx]).trim();
    const objectId = String(algoliaData[i][aIdIdx]).trim();
    if (skuRaw) {
      skuRaw.split(',').forEach(s => {
        const cleanSku = s.trim();
        if (cleanSku) algoliaMap.set(cleanSku, { 
          id: objectId, 
          cat: aCatIdx !== -1 ? String(algoliaData[i][aCatIdx]).trim() : "", 
          subCat: aSubCatIdx !== -1 ? String(algoliaData[i][aSubCatIdx]).trim() : "", 
          subCat2: aSubCat2Idx !== -1 ? String(algoliaData[i][aSubCat2Idx]).trim() : "" 
        });
      });
    }
  }

  // 2. Buat Peta (Map) Data PIM
  const pimMap = new Map();
  if (hasPim) {
    for (let i = 1; i < pimData.length; i++) {
      const skuRaw = String(pimData[i][pSkuIdx]).trim();
      if (skuRaw) {
        skuRaw.split(',').forEach(s => {
          const cleanSku = s.trim();
          if (cleanSku) pimMap.set(cleanSku, { 
            cat: pCatIdx !== -1 ? String(pimData[i][pCatIdx]).trim() : "", 
            subCat: pSubCatIdx !== -1 ? String(pimData[i][pSubCatIdx]).trim() : "", 
            subCat2: pSubCat2Idx !== -1 ? String(pimData[i][pSubCat2Idx]).trim() : "" 
          });
        });
      }
    }
  }

  const comparisonResult = [];
  let matchCount = 0;
  let categoryMismatchCount = 0; 
  let skuNotMatchCount = 0;

  const cleanString = (val) => {
    if (val === null || val === undefined) return "";
    return String(val).trim().toLowerCase();
  };

  const isEmptyValue = (val) => {
    const cleaned = cleanString(val);
    return cleaned === "" || cleaned === "-";
  };

  const compareCategory = (valShop, valAlg, valPim, checkPim) => {
    const shopEmpty = isEmptyValue(valShop);
    const algEmpty = isEmptyValue(valAlg);

    if (checkPim) {
      const pimEmpty = isEmptyValue(valPim);
      if (shopEmpty && algEmpty && pimEmpty) return "Match";
      return (cleanString(valShop) === cleanString(valAlg) && cleanString(valShop) === cleanString(valPim)) ? "Match" : "Not Match";
    } else {
      if (shopEmpty && algEmpty) return "Match";
      return cleanString(valShop) === cleanString(valAlg) ? "Match" : "Not Match";
    }
  };

  // 3. Looping Data Shopify
  for (let i = 1; i < shopifyData.length; i++) {
    const row = shopifyData[i];
    const skuRaw = String(row[sSkuIdx]).trim();
    const title = row[sTitleIdx] || "No Title";
    const shopCat = sCatIdx !== -1 ? row[sCatIdx] : "";
    const shopSubCat = sSubCatIdx !== -1 ? row[sSubCatIdx] : "";
    const shopSubCat2 = sSubCat2Idx !== -1 ? row[sSubCat2Idx] : ""; 
    const productStatus = sStatusIdx !== -1 ? row[sStatusIdx] : "";

    let skuMatchStatus = "Not Match", catMatchStatus = "Not Match", subCatMatchStatus = "Not Match", subCat2MatchStatus = "Not Match", statusMatch = "Not Match"; 
    let algCat = "-", algSubCat = "-", algSubCat2 = "-"; 
    let pimCat = "-", pimSubCat = "-", pimSubCat2 = "-";

    if (skuRaw) {
      const skuArray = skuRaw.split(',').map(s => s.trim()).filter(s => s !== "");

      for (let s of skuArray) {
        let foundInAlg = algoliaMap.has(s);
        let foundInPim = hasPim ? pimMap.has(s) : true; 

        if (foundInAlg || (hasPim && foundInPim)) {
          if (foundInAlg) {
            const mAlg = algoliaMap.get(s);
            algCat = mAlg.cat || ""; algSubCat = mAlg.subCat || ""; algSubCat2 = mAlg.subCat2 || "";
          }
          if (hasPim && foundInPim) {
            const mPim = pimMap.get(s);
            pimCat = mPim.cat || ""; pimSubCat = mPim.subCat || ""; pimSubCat2 = mPim.subCat2 || "";
          }

          skuMatchStatus = (hasPim) ? ((foundInAlg && foundInPim) ? "Match" : "Not Match") : (foundInAlg ? "Match" : "Not Match");
          
          // --- MODIFIKASI: Hanya cek kategori jika SKU Match ---
          if (skuMatchStatus === "Match") {
            catMatchStatus = compareCategory(shopCat, algCat, pimCat, hasPim);
            subCatMatchStatus = compareCategory(shopSubCat, algSubCat, pimSubCat, hasPim);
            subCat2MatchStatus = compareCategory(shopSubCat2, algSubCat2, pimSubCat2, hasPim);
          } else {
            catMatchStatus = "Not Match";
            subCatMatchStatus = "Not Match";
            subCat2MatchStatus = "Not Match";
          }
          // ---------------------------------------------------

          if (skuMatchStatus === "Match" && catMatchStatus === "Match" && subCatMatchStatus === "Match" && subCat2MatchStatus === "Match") {
            statusMatch = "Match"; 
          }
          if (skuMatchStatus === "Match") break; 
        }
      }
    }

    if (statusMatch === "Match") matchCount++;
    else if (skuMatchStatus === "Match") categoryMismatchCount++; 
    else skuNotMatchCount++; 

    if (hasPim) {
      comparisonResult.push([
        skuRaw, title, productStatus, 
        pimCat === "" ? "-" : pimCat, pimSubCat === "" ? "-" : pimSubCat, pimSubCat2 === "" ? "-" : pimSubCat2, 
        shopCat === "" ? "-" : shopCat, shopSubCat === "" ? "-" : shopSubCat, shopSubCat2 === "" ? "-" : shopSubCat2, 
        algCat === "" ? "-" : algCat, algSubCat === "" ? "-" : algSubCat, algSubCat2 === "" ? "-" : algSubCat2, 
        skuMatchStatus, catMatchStatus, subCatMatchStatus, subCat2MatchStatus, statusMatch
      ]);
    } else {
      comparisonResult.push([
        skuRaw, title, productStatus, 
        shopCat === "" ? "-" : shopCat, shopSubCat === "" ? "-" : shopSubCat, shopSubCat2 === "" ? "-" : shopSubCat2, 
        algCat === "" ? "-" : algCat, algSubCat === "" ? "-" : algSubCat, algSubCat2 === "" ? "-" : algSubCat2, 
        skuMatchStatus, catMatchStatus, subCatMatchStatus, subCat2MatchStatus, statusMatch
      ]);
    }
  }

  return { label, hasPim, totalShopify: comparisonResult.length, matchCount, categoryMismatchCount, skuNotMatchCount, resultData: comparisonResult };
}

function writeComparisonToSheet(sheetName, spreadsheet, compData) {
  if (!compData || !compData.resultData || compData.resultData.length === 0) return;
  
  let targetSheet = spreadsheet.getSheetByName(sheetName);
  if (!targetSheet) targetSheet = spreadsheet.insertSheet(sheetName);
  targetSheet.clear();
  
  const hasPim = compData.hasPim;
  const totalCols = hasPim ? 17 : 14; 
  const lastColLetter = hasPim ? "Q" : "N"; 
  
  if (targetSheet.getMaxColumns() < totalCols) {
    targetSheet.insertColumnsAfter(targetSheet.getMaxColumns(), totalCols - targetSheet.getMaxColumns());
  }
  
  targetSheet.getRange("A1").setValue(`Laporan Komparasi: ${sheetName}`).setFontWeight("bold").setFontSize(14);
  targetSheet.getRange("A2").setValue(`Total Produk Shopify: ${compData.totalShopify}`);
  targetSheet.getRange("A3").setValue(`Total Match Sempurna (SKU & Kategori Match): ${compData.matchCount}`);
  targetSheet.getRange("A4").setValue(`Total Mismatch (SKU Ada, Namun Kategori Beda): ${compData.categoryMismatchCount}`);
  targetSheet.getRange("A5").setValue(`Total SKU Not Match (Tidak Ditemukan): ${compData.skuNotMatchCount}`);
  targetSheet.getRange("A6").setValue(`Terakhir Update: ${new Date().toLocaleString('id-ID')}`);
  
  let headerRow1, headerRow2;
  if (hasPim) {
    headerRow1 = ["SKU", "Name", "Status Product", "PIM", "", "", "Shopify", "", "", "Algolia", "", "", "SKU Match", "Category Match", "Sub Category Match", "Sub Category 2 Match", "Status Match"];
    headerRow2 = ["", "", "", "Category", "Sub Category", "Sub Category 2", "Category", "Sub Category", "Sub Category 2", "Category", "Sub Category", "Sub Category 2", "", "", "", "", ""];
  } else {
    headerRow1 = ["SKU", "Name", "Status Product", "Shopify", "", "", "Algolia", "", "", "SKU Match", "Category Match", "Sub Category Match", "Sub Category 2 Match", "Status Match"];
    headerRow2 = ["", "", "", "Category", "Sub Category", "Sub Category 2", "Category", "Sub Category", "Sub Category 2", "", "", "", "", ""];
  }
  
  targetSheet.getRange(`A8:${lastColLetter}8`).setValues([headerRow1]).setFontWeight("bold").setBackground("#f3f4f6").setHorizontalAlignment("center");
  targetSheet.getRange(`A9:${lastColLetter}9`).setValues([headerRow2]).setFontWeight("bold").setBackground("#f3f4f6").setHorizontalAlignment("center");
  
  // MERGE CELLS DASAR
  targetSheet.getRange("A8:A9").merge(); 
  targetSheet.getRange("B8:B9").merge(); 
  targetSheet.getRange("C8:C9").merge(); 
  
  if (hasPim) {
    targetSheet.getRange("D8:F8").merge(); // PIM Group
    targetSheet.getRange("G8:I8").merge(); // Shopify Group
    targetSheet.getRange("J8:L8").merge(); // Algolia Group
    targetSheet.getRange("M8:M9").merge(); 
    targetSheet.getRange("N8:N9").merge(); 
    targetSheet.getRange("O8:O9").merge(); 
    targetSheet.getRange("P8:P9").merge(); 
    targetSheet.getRange("Q8:Q9").merge(); 
  } else {
    targetSheet.getRange("D8:F8").merge(); // Shopify Group
    targetSheet.getRange("G8:I8").merge(); // Algolia Group
    targetSheet.getRange("J8:J9").merge(); 
    targetSheet.getRange("K8:K9").merge(); 
    targetSheet.getRange("L8:L9").merge(); 
    targetSheet.getRange("M8:M9").merge(); 
    targetSheet.getRange("N8:N9").merge(); 
  }
  
  targetSheet.getRange(`A8:${lastColLetter}9`).setVerticalAlignment("middle").setWrap(true);
  
  const sheetData = compData.resultData; 
  setValuesInChunks(targetSheet, sheetData, 10, 1);
  
  // SET CONDITIONAL FORMATTING
  const numRows = sheetData.length;
  if (numRows > 0) {
    targetSheet.clearConditionalFormatRules();
    const rules = [];

    // 1. Format Match / Not Match
    const startColMatch = hasPim ? 13 : 10;
    const matchRanges = targetSheet.getRange(10, startColMatch, numRows, 5); 
    
    rules.push(SpreadsheetApp.newConditionalFormatRule()
      .whenTextEqualTo("Match")
      .setBackground("#b7e1cd") 
      .setRanges([matchRanges])
      .build());
      
    rules.push(SpreadsheetApp.newConditionalFormatRule()
      .whenTextEqualTo("Not Match")
      .setBackground("#f4c7c3") 
      .setRanges([matchRanges])
      .build());

    // 2. Format Sel Merah Khusus untuk Category, Sub Category, Sub Category 2 (PIM Source of Truth)
    if (hasPim) {
      const mismatchBgColor = "#ea4335"; // Merah solid
      const mismatchFontColor = "#ffffff"; // Font putih

      // ==========================================
      // RULE SHOPIFY (Highlight Kolom G, H, I jika beda dengan PIM)
      // ==========================================
      
      // Kolom G (Shopify Category) vs Kolom D (PIM Category)
      rules.push(SpreadsheetApp.newConditionalFormatRule()
        .whenFormulaSatisfied('=LOWER(TRIM(G10)) <> LOWER(TRIM(D10))')
        .setBackground(mismatchBgColor).setFontColor(mismatchFontColor)
        .setRanges([targetSheet.getRange(10, 7, numRows, 1)]).build());

      // Kolom H (Shopify Sub Category) vs Kolom E (PIM Sub Category)
      rules.push(SpreadsheetApp.newConditionalFormatRule()
        .whenFormulaSatisfied('=LOWER(TRIM(H10)) <> LOWER(TRIM(E10))')
        .setBackground(mismatchBgColor).setFontColor(mismatchFontColor)
        .setRanges([targetSheet.getRange(10, 8, numRows, 1)]).build());

      // Kolom I (Shopify Sub Category 2) vs Kolom F (PIM Sub Category 2)
      rules.push(SpreadsheetApp.newConditionalFormatRule()
        .whenFormulaSatisfied('=LOWER(TRIM(I10)) <> LOWER(TRIM(F10))')
        .setBackground(mismatchBgColor).setFontColor(mismatchFontColor)
        .setRanges([targetSheet.getRange(10, 9, numRows, 1)]).build());

      // ==========================================
      // RULE ALGOLIA (Highlight Kolom J, K, L jika beda dengan PIM)
      // ==========================================
      
      // Kolom J (Algolia Category) vs Kolom D (PIM Category)
      rules.push(SpreadsheetApp.newConditionalFormatRule()
        .whenFormulaSatisfied('=LOWER(TRIM(J10)) <> LOWER(TRIM(D10))')
        .setBackground(mismatchBgColor).setFontColor(mismatchFontColor)
        .setRanges([targetSheet.getRange(10, 10, numRows, 1)]).build());

      // Kolom K (Algolia Sub Category) vs Kolom E (PIM Sub Category)
      rules.push(SpreadsheetApp.newConditionalFormatRule()
        .whenFormulaSatisfied('=LOWER(TRIM(K10)) <> LOWER(TRIM(E10))')
        .setBackground(mismatchBgColor).setFontColor(mismatchFontColor)
        .setRanges([targetSheet.getRange(10, 11, numRows, 1)]).build());

      // Kolom L (Algolia Sub Category 2) vs Kolom F (PIM Sub Category 2)
      rules.push(SpreadsheetApp.newConditionalFormatRule()
        .whenFormulaSatisfied('=LOWER(TRIM(L10)) <> LOWER(TRIM(F10))')
        .setBackground(mismatchBgColor).setFontColor(mismatchFontColor)
        .setRanges([targetSheet.getRange(10, 12, numRows, 1)]).build());
    }

    targetSheet.setConditionalFormatRules(rules);
  }
}

// ==========================================
// FUNGSI BANTUAN UNTUK WRITE DATA BESAR (CHUNKING)
// ==========================================
function setValuesInChunks(sheet, data, startRow = 1, startCol = 1) {
  if (!data || data.length === 0) return;
  
  const CHUNK_SIZE = 3000; // Tulis per 3000 baris agar Google Sheets tidak crash
  for (let i = 0; i < data.length; i += CHUNK_SIZE) {
    const chunk = data.slice(i, i + CHUNK_SIZE);
    sheet.getRange(startRow + i, startCol, chunk.length, chunk[0].length).setValues(chunk);
    SpreadsheetApp.flush(); // Paksa Google simpan data ke memori sebelum lanjut
  }
}

// ==========================================
// TAMPILAN MODAL DINAMIS UNTUK 1 TOKO
// ==========================================
function showSingleComparisonModal(compData, titleLabel) {
  const isSony = titleLabel.includes('SONY');
  const headerBg = isSony ? '#7c2d12' : '#1e3a8a';
  
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <base target="_top">
      <style>
        body { font-family: 'Segoe UI', Tahoma, sans-serif; padding: 15px; color: #333; margin: 0; background-color: #f9fafb; }
        .section-title { background: ${headerBg}; color: white; padding: 10px 15px; font-size: 15px; border-radius: 6px; margin-bottom: 20px; font-weight: bold; text-align: center; }
        .stats-grid { display: flex; flex-direction: column; gap: 10px; margin-bottom: 20px; }
        .stat-card { background: white; padding: 12px 15px; border-radius: 8px; border: 1px solid #e5e7eb; display: flex; justify-content: space-between; align-items: center; box-shadow: 0 1px 2px rgba(0,0,0,0.05); }
        .stat-label { font-size: 13px; font-weight: 500; color: #4b5563; }
        .stat-val { font-size: 18px; font-weight: bold; }
        
        .val-total { color: #374151; }
        .val-match { color: #10b981; }
        .val-catdiff { color: #d97706; }
        .val-notmatch { color: #ef4444; }
        
        button { background-color: #4b5563; color: white; border: none; padding: 12px; border-radius: 6px; cursor: pointer; width: 100%; font-weight: bold; margin-top: 10px; font-size: 14px; }
        button:hover { background-color: #374151; }
      </style>
    </head>
    <body>
      <div class="section-title">📊 HASIL KOMPARASI ${titleLabel}</div>
      
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-label">Total Data (Shopify)</div>
          <div class="stat-val val-total">${compData.totalShopify}</div>
        </div>
        <div class="stat-card" style="border-left: 4px solid #10b981;">
          <div class="stat-label">Match Sempurna</div>
          <div class="stat-val val-match">${compData.matchCount}</div>
        </div>
        <div class="stat-card" style="border-left: 4px solid #f59e0b;">
          <div class="stat-label">Terdapat Kategori Beda</div>
          <div class="stat-val val-catdiff">${compData.categoryMismatchCount}</div>
        </div>
        <div class="stat-card" style="border-left: 4px solid #ef4444;">
          <div class="stat-label">SKU Not Match</div>
          <div class="stat-val val-notmatch">${compData.skuNotMatchCount}</div>
        </div>
      </div>

      <button onclick="google.script.host.close()">Tutup & Lihat Sheet</button>
    </body>
    </html>
  `;
  
  const htmlOutput = HtmlService.createHtmlOutput(htmlContent)
    .setWidth(400)
    .setHeight(440);
    
  SpreadsheetApp.getUi().showModalDialog(htmlOutput, `🔍 Ringkasan Komparasi`);
}

// ==========================================
// 11. FUNGSI UI & MODAL UNTUK BULK GENERATE CLAUDE
// ==========================================
function showBulkKeywordModal() {
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <base target="_top">
      <style>
        body { font-family: 'Segoe UI', Tahoma, sans-serif; padding: 15px; color: #333; background-color: #f9fafb;}
        .form-group { margin-bottom: 15px; }
        label { display: block; font-weight: 500; margin-bottom: 5px; font-size: 14px; }
        select { width: 100%; padding: 8px; border: 1px solid #ccc; border-radius: 4px; box-sizing: border-box; }
        button { background-color: #8b5cf6; color: white; border: none; padding: 10px 15px; border-radius: 4px; cursor: pointer; width: 100%; font-weight: bold; margin-top: 10px; }
        button:hover { background-color: #7c3aed; }
        button:disabled { background-color: #c4b5fd; cursor: not-allowed; }
        #status { margin-top: 15px; font-size: 13px; color: #059669; font-weight: bold; text-align: center; }
      </style>
    </head>
    <body>
      <div class="form-group">
        <label>Pilih Target Index (Sheet)</label>
        <select id="targetSheet" onchange="loadVendors()">
          <option value="">-- Pilih Target Index --</option>
          <option value="Index DOSS Main">DOSS Main</option>
          <option value="Index DOSS Indo (Sony)">DOSS Indo (Sony)</option>
        </select>
      </div>
      
      <div class="form-group">
        <label>Pilih Vendor</label>
        <select id="vendorList" disabled>
          <option value="">-- Menunggu target index --</option>
        </select>
      </div>
      
      <button id="btnSubmit" onclick="submitForm()" disabled>Jalankan Bulk Generate di Background</button>
      <div id="status"></div>

      <script>
        function loadVendors() {
          const sheetName = document.getElementById('targetSheet').value;
          const vendorSelect = document.getElementById('vendorList');
          const btnSubmit = document.getElementById('btnSubmit');
          const status = document.getElementById('status');
          
          vendorSelect.innerHTML = '<option value="">-- Memuat daftar Vendor... --</option>';
          vendorSelect.disabled = true;
          btnSubmit.disabled = true;

          if (!sheetName) return;

          status.innerText = 'Mengambil data vendor dari Sheet...';
          status.style.color = '#d97706';

          google.script.run
            .withSuccessHandler(function(vendors) {
              status.innerText = '';
              status.style.color = '#059669';
              vendorSelect.innerHTML = '<option value="">-- Pilih Vendor --</option>';
              vendors.forEach(v => {
                vendorSelect.innerHTML += '<option value="' + v + '">' + v + '</option>';
              });
              vendorSelect.disabled = false;
              btnSubmit.disabled = false;
            })
            .withFailureHandler(function(err) {
              status.innerText = 'Error: ' + err.message;
              status.style.color = '#dc2626';
            })
            .getVendorsFromSheet(sheetName);
        }

        function submitForm() {
          const sheetName = document.getElementById('targetSheet').value;
          const vendor = document.getElementById('vendorList').value;

          if (!sheetName || !vendor) {
            alert('Harap pilih Target Index dan Vendor!');
            return;
          }

          document.getElementById('btnSubmit').disabled = true;
          const status = document.getElementById('status');
          status.innerText = 'Menyiapkan background proses...';
          status.style.color = '#d97706';

          google.script.run
            .withSuccessHandler(function() {
              status.innerText = '✅ Proses diserahkan ke Background! Anda bisa menutup tab ini dan melanjutkannya di spreadsheet.';
              status.style.color = '#059669';
              setTimeout(() => google.script.host.close(), 4000);
            })
            .withFailureHandler(function(err) {
              status.innerText = 'Error: ' + err.message;
              status.style.color = '#dc2626';
              document.getElementById('btnSubmit').disabled = false;
            })
            .startBulkBackgroundProcess(sheetName, vendor);
        }
      </script>
    </body>
    </html>
  `;
  
  const htmlOutput = HtmlService.createHtmlOutput(htmlContent)
    .setWidth(350)
    .setHeight(400);
    
  SpreadsheetApp.getUi().showModalDialog(htmlOutput, '🤖 Bulk Generate Keyword (Claude)');
}

// ==========================================
// 12. FUNGSI LOGIC BACKGROUND PROCESS (BULK)
// ==========================================

/**
 * Mengambil daftar vendor unik dari sheet terpilih
 */
function getVendorsFromSheet(sheetName) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName);
  if (!sheet) throw new Error("Sheet tidak ditemukan.");
  
  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) return [];
  
  const vendorIdx = data[0].indexOf('vendor');
  if (vendorIdx === -1) throw new Error("Kolom 'vendor' tidak ditemukan.");
  
  const vendors = new Set();
  for (let i = 1; i < data.length; i++) {
    const v = String(data[i][vendorIdx]).trim();
    if (v) vendors.add(v);
  }
  
  // Mengembalikan array yang sudah disortir alfabetis
  return Array.from(vendors).sort();
}

/**
 * Menyiapkan pemicu (trigger) untuk mengeksekusi script secara background
 */
function startBulkBackgroundProcess(sheetName, vendor) {
  const props = PropertiesService.getDocumentProperties();
  
  // Simpan pengaturan state
  props.setProperty('BULK_CLAUDE_SHEET', sheetName);
  props.setProperty('BULK_CLAUDE_VENDOR', vendor);
  props.setProperty('BULK_CLAUDE_ROW', '1'); // Kita akan loop mulai dari data baris ke-2 (index ke-1)

  // Hapus trigger batch lama yang mungkin masih gantung agar tidak bertumpuk
  deleteBulkTriggers();

  // Jadwalkan fungsi berjalan di background 1 detik dari sekarang
  ScriptApp.newTrigger('processBulkClaudeBatch')
    .timeBased()
    .after(1000)
    .create();
}

/**
 * Fungsi Engine utama yang berjalan otomatis secara mandiri
 */
function processBulkClaudeBatch() {
  const startTime = new Date().getTime();
  const MAX_EXECUTION_TIME = 4 * 60 * 1000; // 4 Menit limit aman
  
  const props = PropertiesService.getDocumentProperties();
  const sheetName = props.getProperty('BULK_CLAUDE_SHEET');
  const vendor = props.getProperty('BULK_CLAUDE_VENDOR');
  let startRowIndex = parseInt(props.getProperty('BULK_CLAUDE_ROW'), 10);

  if (!sheetName || !vendor || isNaN(startRowIndex)) return;

  const scriptProperties = PropertiesService.getScriptProperties();
  const CLAUDE_API_KEY = scriptProperties.getProperty('CLAUDE_API_KEY');
  const GEMINI_API_KEY = scriptProperties.getProperty('GEMINI_API_KEY'); // Tambahan
  
  if (!CLAUDE_API_KEY && !GEMINI_API_KEY) {
    console.error("Gagal Bulk AI: API KEY tidak ditemukan");
    return;
  }

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(sheetName);
  if (!sheet) return;

  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  
  const vendorIdx = headers.indexOf('vendor');
  const titleIdx = headers.indexOf('title');
  const keywordSugIdx = headers.indexOf('keyword_suggestion'); 
  
  if (vendorIdx === -1 || titleIdx === -1 || keywordSugIdx === -1) return;

  let isLimitReached = false;
  let itemsProcessed = 0;

  for (let i = startRowIndex; i < data.length; i++) {
    // 1. Cek Timeout Global
    if (new Date().getTime() - startTime > MAX_EXECUTION_TIME) {
      props.setProperty('BULK_CLAUDE_ROW', i.toString());
      ScriptApp.newTrigger('processBulkClaudeBatch').timeBased().after(15000).create();
      isLimitReached = true;
      break; 
    }

    const rowVendor = String(data[i][vendorIdx]).trim();
    const rowTitle = data[i][titleIdx];
    const currentKeyword = String(data[i][keywordSugIdx] || "").trim();

    if (rowVendor === vendor && (currentKeyword === "" || currentKeyword.startsWith("Error"))) {
      
      sheet.getRange(i + 1, keywordSugIdx + 1).setValue("Sedang generate AI...");
      SpreadsheetApp.flush(); 
      
      // GUNAKAN ADAPTER
      const generated = generateKeywordAdapter(rowTitle, CLAUDE_API_KEY, GEMINI_API_KEY);
      
      // 2. DETEKSI RATE LIMIT (Mendukung Claude & Gemini 429 error)
      if (generated.includes("429") || generated.toLowerCase().includes("rate limit") || generated.includes("overloaded") || generated.includes("exhausted")) {
        Logger.log("Terkena Rate Limit dari AI. Menjeda proses selama 60 detik...");
        
        sheet.getRange(i + 1, keywordSugIdx + 1).setValue(""); 
        props.setProperty('BULK_CLAUDE_ROW', i.toString());
        ScriptApp.newTrigger('processBulkClaudeBatch').timeBased().after(60 * 1000).create();
        
        isLimitReached = true;
        break; 
      }
      
      // Jika berhasil
      sheet.getRange(i + 1, keywordSugIdx + 1).setValue(generated);
      itemsProcessed++;
      
      // Delay aman agar tidak kena limit Gemini gratisan (15 RPM max)
      Utilities.sleep(4000); 
    }
  }

  // Jika semua baris sudah dicek dan selesai sepenuhnya
  if (!isLimitReached) {
    props.deleteProperty('BULK_CLAUDE_SHEET');
    props.deleteProperty('BULK_CLAUDE_VENDOR');
    props.deleteProperty('BULK_CLAUDE_ROW');
    deleteBulkTriggers();
    
    try {
      ss.toast(`Generate Keyword untuk vendor ${vendor} telah selesai!`, 'Berhasil 🤖', 10);
    } catch(e) {}
    
    Logger.log(`Proses Bulk Selesai Total!`);
  }
}

/**
 * Fungsi helper untuk menghapus trigger khusus batch ini
 */
function deleteBulkTriggers() {
  const triggers = ScriptApp.getProjectTriggers();
  triggers.forEach(trigger => {
    if (trigger.getHandlerFunction() === 'processBulkClaudeBatch') {
      ScriptApp.deleteTrigger(trigger);
    }
  });
}

// ==========================================
// 13A. FUNGSI EKSEKUSI PIM API (MAIN / DOSS)
// ==========================================
function syncPimMainData() {
  const ui = SpreadsheetApp.getUi();
  const scriptProperties = PropertiesService.getScriptProperties();
  
  // Ambil secret key dari Script Properties
  const clientSecret = scriptProperties.getProperty('PIM_CLIENT_SECRET');
  
  if (!clientSecret) {
    ui.alert("Error: PIM_CLIENT_SECRET belum diset pada Script Properties. Silakan tambahkan terlebih dahulu.");
    return;
  }

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheetName = 'PIM Product Doss Main';
  const storeName = 'Doss'; // Parameter pembeda
  
  try {
    ss.toast('Memulai koneksi ke PIM API (Doss)...', 'Proses Berjalan', 3);
    
    // Panggil fungsi penarikan data PIM dengan parameter store
    fetchAndWritePimData(clientSecret, sheetName, ss, storeName);
    
    ui.alert(`Sukses! Semua data produk dari PIM (Doss) berhasil ditarik ke sheet "${sheetName}".`);
  } catch (error) {
    Logger.log('Terjadi kesalahan PIM: ' + error.toString());
    ui.alert('Terjadi kesalahan saat menarik data PIM (Doss): ' + error.message);
  }
}

// ==========================================
// 13B. FUNGSI EKSEKUSI PIM API (SONY)
// ==========================================
function syncPimSonyData() {
  const ui = SpreadsheetApp.getUi();
  const scriptProperties = PropertiesService.getScriptProperties();
  
  // Ambil secret key dari Script Properties
  const clientSecret = scriptProperties.getProperty('PIM_CLIENT_SECRET');
  
  if (!clientSecret) {
    ui.alert("Error: PIM_CLIENT_SECRET belum diset pada Script Properties. Silakan tambahkan terlebih dahulu.");
    return;
  }

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheetName = 'PIM Product Sony';
  const storeName = 'Sony'; // Parameter pembeda
  
  try {
    ss.toast('Memulai koneksi ke PIM API (Sony)...', 'Proses Berjalan', 3);
    
    // Panggil fungsi penarikan data PIM dengan parameter store
    fetchAndWritePimData(clientSecret, sheetName, ss, storeName);
    
    ui.alert(`Sukses! Semua data produk dari PIM (Sony) berhasil ditarik ke sheet "${sheetName}".`);
  } catch (error) {
    Logger.log('Terjadi kesalahan PIM: ' + error.toString());
    ui.alert('Terjadi kesalahan saat menarik data PIM (Sony): ' + error.message);
  }
}

// ==========================================
// FUNGSI PENGAMBILAN DATA PIM VIA API (PAGINATION)
// ==========================================
function fetchAndWritePimData(clientSecret, sheetName, spreadsheet, storeName) {
  let allProducts = [];
  
  const scriptProperties = PropertiesService.getScriptProperties();
  const host = scriptProperties.getProperty('PIM_HOST');
  
  // URL Halaman Pertama (Menambahkan Query Parameter "store")
  let url = host + "/api/v1/pim-products?store=" + encodeURIComponent(storeName);
  
  const options = {
    method: 'get',
    headers: {
      'X-Client-Secret': clientSecret,
      'Accept': 'application/json'
    },
    muteHttpExceptions: true
  };

  // Lakukan Looping selama `next_page_url` tidak null
  while (url) {
    const response = UrlFetchApp.fetch(url, options);
    const responseCode = response.getResponseCode();
    
    if (responseCode !== 200) {
      throw new Error(`Gagal dari PIM API (Code ${responseCode}): ${response.getContentText()}`);
    }

    const json = JSON.parse(response.getContentText());
    
    if (!json.success || !json.data) {
      throw new Error(`Format response PIM tidak dikenali.`);
    }

    const productsData = json.data.data; // Array dari produk
    
    if (productsData && productsData.length > 0) {
      allProducts = allProducts.concat(productsData);
    }
    
    // Perbarui URL dengan halaman selanjutnya. 
    url = json.data.next_page_url; 
    
    // ==========================================
    // PERBAIKAN ISSUENYA DI SINI
    // ==========================================
    // Cek apakah url halaman selanjutnya tersedia. Jika ada, tambahkan parameter store kembali.
    // Karena dari response API URL-nya menggunakan "?page=x", kita cukup tambahkan "&store=..."
    if (url) {
      url += "&store=" + encodeURIComponent(storeName);
    }
    // ==========================================
  }

  // Persiapkan Sheet Tujuan
  let targetSheet = spreadsheet.getSheetByName(sheetName);
  if (!targetSheet) targetSheet = spreadsheet.insertSheet(sheetName);
  targetSheet.clear();

  if (allProducts.length === 0) {
    targetSheet.getRange(1, 1).setValue(`Tidak ada produk ditemukan di PIM untuk store ${storeName}.`);
    return;
  }

  // Buat Header Tabel
  const headers = [
    'SKU', 
    'Name', 
    'Category', 
    'Sub Category', 
    'Sub Category 2', 
    'Created_At', 
    'Updated_At'
  ];
  
  const sheetData = [];
  sheetData.push(headers);

  // Mapping hasil Array ke baris Data
  allProducts.forEach(product => {
    sheetData.push([
      product.sku || "",
      product.name || "",
      product.category || "-",
      product.sub_category || "-",
      product.sub_category_2 || "-",
      product.created_at || "",
      product.updated_at || ""
    ]);
  });

  // Tulis menggunakan fungsi bantuan Chunking agar tidak Limit Error (Ditulis mulai Baris 1, Kolom 1)
  // Pastikan function setValuesInChunks sudah terdefinisi di project Anda
  setValuesInChunks(targetSheet, sheetData, 1, 1);
  
  // Styling Header (Baris ke-1)
  targetSheet.getRange(1, 1, 1, headers.length)
    .setFontWeight("bold")
    .setBackground("#f3f4f6")
    .setHorizontalAlignment("center");
}