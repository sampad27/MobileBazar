// ========================================
// FORM SUBMISSION
// ========================================
async function handleFormSubmit(event) {
    event.preventDefault();
    var formData = new FormData(event.target);
    var obj = {};
    formData.forEach(function (value, key) { obj[key] = value; });
    
    // Make IMEI 2 optional - if empty, set to empty string
    if (!obj.imei2) {
        obj.imei2 = "";
    }
    
    try {
        const response = await callAPI('processForm', obj);
        Swal.fire({ 
            title: "Success!", 
            text: response, 
            icon: "success", 
            confirmButtonText: "OK" 
        });
        
        if (!document.getElementById("historySection").classList.contains("hidden")) {
            loadHistory();
        }
    } catch (err) {
        Swal.fire({ 
            title: "Error!", 
            text: "Error: " + err.message, 
            icon: "error", 
            confirmButtonText: "OK" 
        });
    }
}

// ========================================
// MOBILE DROPDOWN FUNCTIONS
// ========================================
async function updateVariantDropdown() {
    var setName = document.getElementById("setNameDropdown").value;
    if (!setName) {
        document.getElementById("variantDropdown").innerHTML = "<option value=''>Select Variant</option>";
        return;
    }
    
    try {
        const variants = await callAPI('getVariantsForSet', { setName });
        var options = "<option value=''>Select Variant</option>";
        variants.forEach(function (v) {
            options += "<option value='" + v + "'>" + v + "</option>";
        });
        document.getElementById("variantDropdown").innerHTML = options;
    } catch (err) {
        console.error('Error loading variants:', err);
    }
}

async function fetchPrice() {
    var setName = document.getElementById("setNameDropdown").value;
    var variant = document.getElementById("variantDropdown").value;
    if (!setName || !variant) return;
    
    try {
        const mobile = await callAPI('getMobileDetail', { setName, variant });
        if (mobile) {
            document.getElementById("rateField").value = mobile.price;
            updateAmounts();
        }
    } catch (err) {
        console.error('Error fetching price:', err);
    }
}

// ========================================
// SEND INVOICE FUNCTIONS
// ========================================
function openSendModal() {
    document.getElementById("sendModal").style.display = "flex";
}

function closeSendModal() {
    document.getElementById("sendModal").style.display = "none";
    document.getElementById("whatsappNumber").value = "";
    document.getElementById("emailAddress").value = "";
}

function toggleSendFields() {
    var method = document.getElementById("sendMethod").value;
    document.getElementById("whatsappField").style.display = method === "whatsapp" ? "block" : "none";
    document.getElementById("emailField").style.display = method === "email" ? "block" : "none";
}

async function sendInvoice() {
    var method = document.getElementById("sendMethod").value;
    var number = document.getElementById("whatsappNumber").value;
    var email = document.getElementById("emailAddress").value;
    
    if (method === "whatsapp" && !number) {
        Swal.fire("Error", "Please enter WhatsApp number", "error");
        return;
    }
    
    if (method === "email" && !email) {
        Swal.fire("Error", "Please enter email address", "error");
        return;
    }
    
    var invoiceData = collectInvoiceData();
    
    // Add current user info to invoice data
    invoiceData.currentUser = currentUser;
    invoiceData.currentUserType = currentUserType;
    
    Swal.fire({
        title: 'Sending Invoice...',
        text: 'Please wait while we process your request',
        allowOutsideClick: false,
        didOpen: () => { Swal.showLoading(); }
    });
    
    try {
        const response = await callAPI('sendInvoice', {
            invoiceData: invoiceData,
            method: method,
            recipient: method === "whatsapp" ? number : email
        });
        
        Swal.close();
        
        if (method === "whatsapp") {
            if (response.url) {
                // Open WhatsApp in new tab
                window.open(response.url, "_blank");
                Swal.fire({
                    title: "Success!",
                    html: "WhatsApp message prepared!<br><br>" +
                          "The WhatsApp window should open automatically.<br>" +
                          "<a href='" + response.url + "' target='_blank' style='color: blue; text-decoration: underline;'>Click here if it doesn't open</a>",
                    icon: "success",
                    confirmButtonText: "OK"
                });
            } else {
                Swal.fire("Error", "Failed to prepare WhatsApp message", "error");
            }
        } else if (method === "email") {
            Swal.fire("Success", response.message || "Email sent successfully!", "success");
        }
        
        closeSendModal();
    } catch (err) {
        Swal.close();
        Swal.fire("Error", "Failed to send invoice: " + err.message, "error");
    }
}

function collectInvoiceData() {
    return {
        invoiceNo: document.getElementById("invoiceNumberField").value,
        date: document.getElementById("dateField").value,
        name: document.querySelector('input[name="name"]').value,
        address: document.querySelector('input[name="address"]').value,
        contact: document.querySelector('input[name="contact"]').value,
        alternativeContact: document.querySelector('input[name="alternativeContact"]').value || '',
        setName: document.getElementById("setNameDropdown").value,
        variant: document.getElementById("variantDropdown").value,
        modelNo: document.querySelector('input[name="modelNo"]').value || '',
        imei1: document.querySelector('input[name="imei1"]').value,
        imei2: document.querySelector('input[name="imei2"]').value || '',
        qty: document.getElementById("qtyField").value,
        rate: document.getElementById("rateField").value,
        baseAmount: document.getElementById("baseAmountDisplay").textContent.replace('₹', ''),
        cgst: document.getElementById("cgstField").value,
        sgst: document.getElementById("sgstField").value,
        grandTotal: document.getElementById("grandTotalDisplay").textContent.replace('₹', ''),
        currentUser: currentUser,
        currentUserType: currentUserType
    };
}

// ========================================
// OTHER UTILITY FUNCTIONS
// ========================================
function clearForm() {
    document.getElementById("invoiceForm").reset();
    
    // Set today's date
    var today = new Date();
    var yyyy = today.getFullYear();
    var mm = String(today.getMonth() + 1).padStart(2, "0");
    var dd = String(today.getDate()).padStart(2, "0");
    document.getElementById("dateField").value = yyyy + "-" + mm + "-" + dd;
    
    document.getElementById("amountDisplay").textContent = "0.00";
    document.getElementById("baseAmountDisplay").textContent = "0.00";
    document.getElementById("grandTotalDisplay").textContent = "0.00";
    document.getElementById("currentUserField").value = currentUser;
    document.getElementById("currentUserTypeField").value = currentUserType;
    
    // Get new invoice number
    callAPI('getNewInvoiceNumber').then(function(invoiceNo) {
        document.getElementById("invoiceNumberField").value = invoiceNo;
    }).catch(function(err) {
        console.error('Error getting new invoice number:', err);
    });
}

async function newInvoice() {
    document.getElementById("historySection").classList.add("hidden");
    document.getElementById("stockSection").style.display = "none";
    document.getElementById("imeiStockSection").style.display = "none";
    document.getElementById("invoiceForm").style.display = "block";
    
    clearForm();
}

function logout() {
    currentUser = "";
    currentUserType = "";
    document.getElementById("loginSection").style.display = "flex";
    document.getElementById("dashboardSection").style.display = "none";
    document.getElementById("invoiceForm").reset();
    document.getElementById("historySection").classList.add("hidden");
}
