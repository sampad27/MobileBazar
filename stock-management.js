// ========================================
// ADMIN MOBILE MANAGEMENT
// ========================================
async function showStock() {
    document.getElementById("invoiceForm").style.display = "none";
    document.getElementById("historySection").style.display = "none";
    document.getElementById("imeiStockSection").style.display = "none";
    
    try {
        const mobiles = await callAPI('getAllMobiles');
        mobilesData = mobiles;
        renderStock(mobilesData);
        document.getElementById("stockSection").style.display = "block";
    } catch (err) {
        Swal.fire("Error", err.message, "error");
    }
}

function closeStock() {
    document.getElementById("stockSection").style.display = "none";
    document.getElementById("invoiceForm").style.display = "block";
}

function renderStock(mobiles) {
    var searchQuery = document.getElementById("stockSearchInput").value.toLowerCase();
    var container = document.getElementById("stockContainer");
    container.innerHTML = "";
    
    var filteredMobiles = mobiles.filter(function(m) {
        var searchTarget = (m.setName + " " + m.variant).toLowerCase();
        return searchTarget.indexOf(searchQuery) !== -1;
    });
    
    if (filteredMobiles.length === 0) {
        container.innerHTML = '<div class="text-center py-4 text-gray-500">No mobiles found</div>';
        return;
    }
    
    filteredMobiles.forEach(function (m) {
        var div = document.createElement("div");
        div.className = "border p-4 rounded mb-2 flex items-center justify-between bg-gray-100";
        div.innerHTML = `
            <div>
                <span class="font-bold">📱 ${m.setName}</span> - ${m.variant} <br>
                Price: ₹${m.price} | Stock: ${m.stock} units<br>
                <small class="text-gray-600">Based on IMEI count</small>
            </div>
            <div class="space-x-2">
                <button class="bg-yellow-500 hover:bg-yellow-600 text-white py-1 px-2 rounded" onclick="editMobile(${m.rowIndex},'${m.setName}','${m.variant}',${m.price},'${m.customerName || ''}','${m.customerAddress || ''}','${m.customerNumber || ''}','${m.alternativeNumber || ''}')">Edit</button>
                <button class="bg-red-500 hover:bg-red-600 text-white py-1 px-2 rounded" onclick="deleteMobileRecord(${m.rowIndex})">Delete</button>
            </div>
        `;
        container.appendChild(div);
    });
}

function filterStock() {
    renderStock(mobilesData);
}

async function editMobile(rowIndex, setName, variant, price, customerName = "", customerAddress = "", customerNumber = "", alternativeNumber = "") {
    openAddMobileModal();
    document.getElementById("mobileModalTitle").textContent = "Edit Mobile";
    
    document.getElementById("mobileSetName").value = setName;
    document.getElementById("mobileVariant").value = variant;
    document.getElementById("mobilePrice").value = price;
    document.getElementById("mobileCustomerName").value = customerName || "";
    document.getElementById("mobileCustomerAddress").value = customerAddress || "";
    document.getElementById("mobileCustomerNumber").value = customerNumber || "";
    document.getElementById("mobileAlternativeNumber").value = alternativeNumber || "";
    document.getElementById("mobileForm").setAttribute("data-row", rowIndex);
    
    try {
        const imeis = await callAPI('getAvailableImeis', { setName, variant });
        document.getElementById("mobileImeis").value = imeis.join('\n');
    } catch (err) {
        console.error('Error loading IMEIs:', err);
    }
}

async function deleteMobileRecord(rowIndex) {
    const result = await Swal.fire({
        title: 'Are you sure?',
        text: "You won't be able to revert this!",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#3085d6',
        confirmButtonText: 'Yes, delete it!'
    });
    
    if (result.isConfirmed) {
        try {
            const res = await callAPI('deleteMobile', { rowIndex });
            Swal.fire("Deleted", res, "success");
            showStock();
        } catch (err) {
            Swal.fire("Error", err.message, "error");
        }
    }
}
