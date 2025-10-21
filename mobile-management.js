// ========================================
// ADD MOBILE MODAL FUNCTIONS
// ========================================
function openAddMobileModal() {
    document.getElementById("adminModal").style.display = "flex";
    document.getElementById("mobileModalTitle").textContent = "Add Mobile";
    document.getElementById("mobileForm").reset();
    document.getElementById("mobileForm").removeAttribute("data-row");
}

function closeAddMobileModal() {
    document.getElementById("adminModal").style.display = "none";
}

// ========================================
//   SUBMIT MOBILE (CORRECTED)
// ========================================
async function submitMobile(e) {
    e.preventDefault();
    
    // Collect all data from the form with correct element IDs
    var mobile = {
        setName: document.getElementById("mobileSetName").value,
        variant: document.getElementById("mobileVariant").value,
        customerName: document.getElementById("mobileCustomerName").value || "", // Optional
        customerAddress: document.getElementById("mobileCustomerAddress").value || "", // Optional
        customerNumber: document.getElementById("mobileCustomerNumber").value || "", // Optional
        alternativeNumber: document.getElementById("mobileAlternativeNumber").value || "", // Optional
        price: parseFloat(document.getElementById("mobilePrice").value) || 0,
        imeis: document.getElementById("mobileImeis").value.split('\n').filter(imei => imei.trim() !== '')
    };
    
    if (mobile.imeis.length === 0) {
        Swal.fire("Error", "Please enter at least one IMEI number", "error");
        return;
    }
    
    var rowIndex = document.getElementById("mobileForm").getAttribute("data-row");
    
    try {
        if (rowIndex) {
            const res = await callAPI('updateMobileRecord', { rowIndex: parseInt(rowIndex), mobile });
            Swal.fire("Success", res, "success");
            document.getElementById("mobileForm").removeAttribute("data-row");
        } else {
            const res = await callAPI('addMobile', { mobile });
            Swal.fire("Success", res, "success");
            
            // Refresh set names
            const sets = await callAPI('getSetNames');
            var options = "<option value=''>Select Set</option>";
            sets.forEach(function(s) { 
                options += "<option value='" + s + "'>" + s + "</option>"; 
            });
            document.getElementById("setNameDropdown").innerHTML = options;
        }
        
        closeAddMobileModal();
        showStock();
    } catch (err) {
        Swal.fire("Error", err.message, "error");
    }
}
