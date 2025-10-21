// ========================================
// IMEI STOCK FUNCTIONS
// ========================================
async function showImeiStock() {
    document.getElementById("invoiceForm").style.display = "none";
    document.getElementById("historySection").style.display = "none";
    document.getElementById("stockSection").style.display = "none";
    
    try {
        const imeiData = await callAPI('getAllImeiStock');
        imeiStockData = imeiData;
        renderImeiStock(imeiStockData);
        document.getElementById("imeiStockSection").style.display = "block";
    } catch (err) {
        Swal.fire("Error", err.message, "error");
    }
}

function closeImeiStock() {
    document.getElementById("imeiStockSection").style.display = "none";
    document.getElementById("invoiceForm").style.display = "block";
}

function renderImeiStock(imeiData) {
    if ($.fn.DataTable.isDataTable("#imeiStockTable")) {
        $("#imeiStockTable").DataTable().destroy();
    }
    var tbody = document.querySelector("#imeiStockTable tbody");
    tbody.innerHTML = "";
    imeiData.forEach(function (row) {
        var tr = document.createElement("tr");
        var statusClass = row.status === "AVAILABLE" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800";
        tr.innerHTML = `
            <td>${row.setName}</td>
            <td>${row.variant}</td>
            <td><code>${row.imei}</code></td>
            <td><span class="px-2 py-1 rounded text-xs font-bold ${statusClass}">${row.status}</span></td>
            <td>${row.customerName || '-'}</td>
            <td>${row.customerAddress || '-'}</td>
            <td>${row.customerNumber || '-'}</td>
            <td>${row.alternativeNumber || '-'}</td>
            <td>${row.dateAdded}</td>
        `;
        tbody.appendChild(tr);
    });
    $("#imeiStockTable").DataTable({ 
        responsive: true, 
        autoWidth: false, 
        width: "100%",
        pageLength: 25,
        dom: '<"flex justify-between items-center mb-4"lf>rt<"flex justify-between items-center mt-4"ip>',
        language: {
            search: "Search:",
            lengthMenu: "Show _MENU_ entries",
            info: "Showing _START_ to _END_ of _TOTAL_ entries",
            paginate: {
                first: "First",
                last: "Last",
                next: "Next",
                previous: "Previous"
            }
        }
    });
}

function filterImeiStock() {
    var searchQuery = document.getElementById("imeiSearchInput").value.toLowerCase();
    var table = $("#imeiStockTable").DataTable();
    table.search(searchQuery).draw();
}
