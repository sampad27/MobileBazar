// ========================================
// CONFIGURATION - UPDATE THIS URL
// ========================================
const API_URL = 'https://script.google.com/macros/s/AKfycbxt1ZX2URSNRUMBjSDpyIpfMr64yzXRXAlV8wsfyRhjl5hMfQM2Cea-VOnjIdnENplo/exec';

// ========================================
// GLOBAL VARIABLES
// ========================================
var currentUser = "";
var currentUserType = "";
var mobilesData = [];
var imeiStockData = [];
var historyDataTable = null;

// ========================================
// API HELPER FUNCTION
// ========================================
async function callAPI(action, data = {}) {
    try {
        showLoading();
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
                action: action,
                data: JSON.stringify(data)
            })
        });
        
        const result = await response.json();
        hideLoading();
        
        if (result.error) {
            throw new Error(result.error);
        }
        
        return result.data;
    } catch (error) {
        hideLoading();
        console.error('API Error:', error);
        throw error;
    }
}

// ========================================
// LOADING INDICATOR
// ========================================
function showLoading() {
    document.getElementById("loadingIndicator").classList.remove("hidden");
}

function hideLoading() {
    document.getElementById("loadingIndicator").classList.add("hidden");
}

// ========================================
// TIME DISPLAY
// ========================================
function updateTime() {
    const now = new Date();
    document.getElementById("currentTime").textContent = now.toLocaleString();
}
setInterval(updateTime, 1000);
updateTime();

// ========================================
// PAGE LOAD INITIALIZATION
// ========================================
document.addEventListener("DOMContentLoaded", async function () {
    // Set today's date
    var today = new Date();
    var yyyy = today.getFullYear();
    var mm = String(today.getMonth() + 1).padStart(2, "0");
    var dd = String(today.getDate()).padStart(2, "0");
    document.getElementById("dateField").value = yyyy + "-" + mm + "-" + dd;
    
    // Event listeners
    document.getElementById("qtyField").addEventListener("input", updateAmounts);
    document.getElementById("rateField").addEventListener("input", updateAmounts);
    document.getElementById("cgstField").addEventListener("input", updateAmounts);
    document.getElementById("sgstField").addEventListener("input", updateAmounts);
    document.getElementById("setNameDropdown").addEventListener("change", updateVariantDropdown);
    document.getElementById("variantDropdown").addEventListener("change", fetchPrice);
    document.getElementById("sendMethod").addEventListener("change", toggleSendFields);
    
    // Form submissions
    document.getElementById("loginForm").addEventListener("submit", handleLogin);
    document.getElementById("invoiceForm").addEventListener("submit", handleFormSubmit);
    document.getElementById("mobileForm").addEventListener("submit", submitMobile);
    
    updateAmounts();
});

// ========================================
// UTILITY FUNCTIONS
// ========================================
function toISODate(mdyString) {
    if (!mdyString) return "";
    if (mdyString.match(/^\d{4}-\d{2}-\d{2}$/)) return mdyString;
    var parts = mdyString.split("/");
    if (parts.length === 3) {
        var m = parts[0].padStart(2, "0");
        var d = parts[1].padStart(2, "0");
        var y = parts[2];
        return y + "-" + m + "-" + d;
    }
    return "";
}

function updateAmounts() {
    var qty = parseFloat(document.getElementById("qtyField").value) || 0;
    var rate = parseFloat(document.getElementById("rateField").value) || 0;
    var baseAmount = qty * rate;
    var cgstPercentage = parseFloat(document.getElementById("cgstField").value) || 0;
    var sgstPercentage = parseFloat(document.getElementById("sgstField").value) || 0;
    var cgstAmount = baseAmount * (cgstPercentage / 100);
    var sgstAmount = baseAmount * (sgstPercentage / 100);
    var grandTotal = baseAmount + cgstAmount + sgstAmount;
    document.getElementById("amountDisplay").textContent = baseAmount.toFixed(2);
    document.getElementById("baseAmountDisplay").textContent = baseAmount.toFixed(2);
    document.getElementById("grandTotalDisplay").textContent = grandTotal.toFixed(2);
}

/**
 * Send invoice via backend and handle result:
 * - method: 'whatsapp' | 'email' | 'print'
 * - recipient: phone number for whatsapp, email for email, ignored for print
 */
async function sendInvoiceClient(invoiceData, method, recipient) {
    try {
        const res = await callAPI('sendInvoice', { invoiceData: invoiceData, method: method, recipient: recipient });
        // res should be the data returned by server (see Code.gs)
        if (!res) throw new Error('No response data from server');

        if (method === 'whatsapp') {
            // server returns { url: whatsappUrl, pdfUrl: driveUrl } or similar
            if (res.url) window.open(res.url, '_blank');
            if (res.pdfUrl) window.open(res.pdfUrl, '_blank'); // opens PDF link so user can download/view
            return res;
        }

        if (method === 'email') {
            // server already sent email; show success message if available
            if (res && res.success) {
                alert(res.message || 'Email sent successfully');
            } else {
                alert('Email request sent. Server response: ' + JSON.stringify(res));
            }
            return res;
        }

        if (method === 'print') {
            // server returns { pdfUrl: 'https://...' }
            if (res && res.pdfUrl) {
                openPdfAndPrint(res.pdfUrl);
            } else {
                alert('PDF URL not returned by server. Check server logs.');
            }
            return res;
        }

        return res;
    } catch (err) {
        console.error('sendInvoiceClient error:', err);
        alert('Send failed: ' + (err && err.message ? err.message : err));
        throw err;
    }
}

/**
 * Open a PDF URL in a new window, wait for load and trigger print.
 * Some browsers block scripts printing cross-origin PDFs; in that case the PDF will open and user can print manually.
 */
function openPdfAndPrint(pdfUrl) {
    const w = window.open(pdfUrl, '_blank', 'noopener');
    if (!w) {
        alert('Popup blocked. Allow popups for this site and try again.');
        return;
    }
    // Try to auto-print: works when browser allows access/embedding
    // If cross-origin prevents scripting, user can print the opened PDF manually.
    w.onload = function () {
        try {
            w.focus();
            w.print();
            // optionally close after print - avoid auto-close if browser blocks
            // setTimeout(() => w.close(), 1000);
        } catch (e) {
            // ignore - cross-origin or blocked
            console.warn('Auto-print failed:', e);
        }
    };
}

// convenience calls from UI:
// send via WhatsApp:
window.sendInvoiceWhatsApp = function(invoiceData, phone) {
    return sendInvoiceClient(invoiceData, 'whatsapp', phone);
};
// send via Email:
window.sendInvoiceEmail = function(invoiceData, email) {
    return sendInvoiceClient(invoiceData, 'email', email);
};
// print PDF:
window.printInvoicePdf = function(invoiceData) {
    return sendInvoiceClient(invoiceData, 'print', null);
};
