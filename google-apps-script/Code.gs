/**
 * ============================================================
 * CustomKaosWeb — Google Drive Storage via Apps Script
 * ============================================================
 * 
 * CARA SETUP:
 * 1. Buka https://script.google.com
 * 2. Klik "New project"
 * 3. Hapus semua isi Code.gs, lalu paste seluruh kode ini
 * 4. Klik "Deploy" → "New deployment"
 * 5. Pilih Type: "Web app"
 * 6. Execute as: "Me" (akun Google kamu)
 * 7. Who has access: "Anyone"
 * 8. Klik "Deploy" → Copy URL deployment-nya
 * 9. Paste URL tersebut di Admin Dashboard CustomKaosWeb
 *    (menu Product Database → section "Google Drive Config")
 * 
 * STRUKTUR FOLDER YANG DIBUAT:
 *   📁 Google Drive (Akun kamu)
 *   └── 📁 CustomKaos Orders
 *       ├── 📁 CK-XXXXXX
 *       │   ├── 🖼️ mockup-preview.jpg
 *       │   ├── 🖼️ design-FRONT-namafile.png
 *       │   ├── 🖼️ design-BACK-namafile.png
 *       │   └── 📄 order-details.txt
 *       └── 📁 CK-YYYYYY
 *           └── ...
 */

var PARENT_FOLDER_NAME = 'CustomKaos Orders';

/**
 * Handle POST requests from the web app
 */
function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);

    var orderId = data.orderId || 'UNKNOWN';
    var orderDetails = data.orderDetails || '';
    var mockupBase64 = data.mockupPreview || null;
    var mockupPreviews = data.mockupPreviews || [];
    var designFiles = data.designFiles || [];

    // Get or create parent "CustomKaos Orders" folder
    var parentFolder = getOrCreateFolder_(PARENT_FOLDER_NAME);

    // Check if order folder already exists (avoid duplicates)
    var existingFolders = parentFolder.getFoldersByName(orderId);
    var orderFolder;
    if (existingFolders.hasNext()) {
      orderFolder = existingFolders.next();
    } else {
      orderFolder = parentFolder.createFolder(orderId);
    }

    // Upload multi-angle mockup previews (FRONT, BACK, SLEEVE-LEFT, SLEEVE-RIGHT)
    if (mockupPreviews && mockupPreviews.length > 0) {
      for (var m = 0; m < mockupPreviews.length; m++) {
        var item = mockupPreviews[m];
        var viewName = (item.view || 'view').toUpperCase();
        var fileName = 'mockup-' + viewName + '.jpg';

        var existingFiles = orderFolder.getFilesByName(fileName);
        while (existingFiles.hasNext()) {
          existingFiles.next().setTrashed(true);
        }

        var blob = Utilities.newBlob(
          Utilities.base64Decode(item.base64),
          'image/jpeg',
          fileName
        );
        orderFolder.createFile(blob);

        // Also duplicate first/front view as mockup-preview.jpg for quick preview
        if (m === 0 || viewName === 'FRONT') {
          var mainPreviewBlob = Utilities.newBlob(
            Utilities.base64Decode(item.base64),
            'image/jpeg',
            'mockup-preview.jpg'
          );
          var existingMain = orderFolder.getFilesByName('mockup-preview.jpg');
          while (existingMain.hasNext()) {
            existingMain.next().setTrashed(true);
          }
          orderFolder.createFile(mainPreviewBlob);
        }
      }
    } else if (mockupBase64) {
      // Fallback single mockup preview
      var mockupBlob = Utilities.newBlob(
        Utilities.base64Decode(mockupBase64),
        'image/jpeg',
        'mockup-preview.jpg'
      );
      var existingMockups = orderFolder.getFilesByName('mockup-preview.jpg');
      while (existingMockups.hasNext()) {
        existingMockups.next().setTrashed(true);
      }
      orderFolder.createFile(mockupBlob);
    }

    // Upload design files
    for (var i = 0; i < designFiles.length; i++) {
      var file = designFiles[i];
      var ext = file.fileName.toLowerCase().endsWith('.svg') ? '.svg' : '.png';
      var mimeType = ext === '.svg' ? 'image/svg+xml' : 'image/png';
      var safeName = 'design-' + (file.view || 'unknown').toUpperCase() + '-' + file.fileName;
      
      // Sanitize filename
      safeName = safeName.replace(/[^a-zA-Z0-9._\-]/g, '_');

      var fileBlob = Utilities.newBlob(
        Utilities.base64Decode(file.base64),
        mimeType,
        safeName
      );
      orderFolder.createFile(fileBlob);
    }

    // Create order details text file
    if (orderDetails) {
      var existingDetails = orderFolder.getFilesByName('order-details.txt');
      while (existingDetails.hasNext()) {
        existingDetails.next().setTrashed(true);
      }
      orderFolder.createFile('order-details.txt', orderDetails, MimeType.PLAIN_TEXT);
    }

    // Make the folder viewable by anyone with the link
    orderFolder.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

    var folderUrl = orderFolder.getUrl();

    return ContentService
      .createTextOutput(JSON.stringify({
        success: true,
        folderId: orderFolder.getId(),
        folderUrl: folderUrl,
        orderId: orderId,
        filesUploaded: 1 + designFiles.length + (orderDetails ? 1 : 0)
      }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({
        success: false,
        error: error.toString()
      }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Handle GET requests (health check)
 */
function doGet() {
  return ContentService
    .createTextOutput(JSON.stringify({
      status: 'ok',
      message: 'CustomKaosWeb Drive Storage API is running.',
      parentFolder: PARENT_FOLDER_NAME,
      timestamp: new Date().toISOString()
    }))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * Get existing folder by name, or create it in root
 */
function getOrCreateFolder_(folderName) {
  var folders = DriveApp.getFoldersByName(folderName);
  if (folders.hasNext()) {
    return folders.next();
  }
  return DriveApp.createFolder(folderName);
}

