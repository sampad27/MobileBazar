// ========================================
// HISTORY FUNCTIONS - CORRECTED
// ========================================
function toggleHistory() {
    document.getElementById("invoiceForm").style.display = "none";
    document.getElementById("stockSection").style.display = "none";
    document.getElementById("imeiStockSection").style.display = "none";
    document.getElementById("historySection").classList.remove("hidden");
    
    loadHistory();
}

function backToInvoice() {
    document.getElementById("historySection").classList.add("hidden");
    document.getElementById("invoiceForm").style.display = "block";
    document.getElementById("stockSection").style.display = "none";
    document.getElementById("imeiStockSection").style.display = "none";
}

async function loadHistory() {
    try {
        const data = await callAPI('getAllInvoices', { currentUser, currentUserType });
        renderHistoryTable(data);
    } catch (err) {
        Swal.fire("Error", "Failed to load history: " + err.message, "error");
    }
}

function renderHistoryTable(data) {
    // Destroy existing DataTable if it exists
    if (historyDataTable) {
        historyDataTable.destroy();
    }
    
    var tbody = document.querySelector("#historyTable tbody");
    tbody.innerHTML = "";
    
    if (data.length === 0) {
        var tr = document.createElement("tr");
        tr.innerHTML = `<td colspan="9" class="text-center py-4">No invoices found</td>`;
        tbody.appendChild(tr);
    } else {
        data.forEach(function (row) {
            var tr = document.createElement("tr");
            tr.innerHTML = `
                <td>${row.invoiceNo || ''}</td>
                <td>${row.date || ''}</td>
                <td>${row.name || ''}</td>
                <td>${row.contact || ''}</td>
                <td>${(row.setName || '') + ' - ' + (row.variant || '')}</td>
                <td>${row.imeiDisplay || (row.imei1 || '') + (row.imei2 ? ', ' + row.imei2 : '')}</td>
                <td>₹${parseFloat(row.baseAmount || 0).toFixed(2)}</td>
                <td>${row.user || ""}</td>
                <td class="history-actions">
                    <button class="bg-blue-500 hover:bg-blue-600 text-white py-1 px-2 rounded text-sm" onclick="viewInvoice('${row.invoiceNo}')">
                        View
                    </button>
                    <button class="bg-green-500 hover:bg-green-600 text-white py-1 px-2 rounded text-sm ml-1" onclick="printInvoice('${row.invoiceNo}')">
                        Print
                    </button>
                </td>
            `;
            tbody.appendChild(tr);
        });
    }
    
    // Initialize DataTable with proper configuration
    historyDataTable = $("#historyTable").DataTable({ 
        responsive: true,
        autoWidth: false,
        pageLength: 25,
        order: [[1, 'desc']], // Sort by date descending
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

function filterByDate() {
    var start = document.getElementById("startDate").value;
    var end = document.getElementById("endDate").value;
    
    if (!start && !end) {
        historyDataTable.search('').draw();
        return;
    }
    
    // Custom filtering function for dates
    $.fn.dataTable.ext.search.push(
        function(settings, data, dataIndex) {
            var dateStr = data[1]; // Date is in second column
            if (!dateStr) return false;
            
            // Parse the date - handle different formats
            var invoiceDate;
            if (dateStr.includes('/')) {
                // MM/DD/YYYY format
                var parts = dateStr.split('/');
                invoiceDate = new Date(parts[2], parts[0] - 1, parts[1]);
            } else if (dateStr.includes('-')) {
                // YYYY-MM-DD format
                invoiceDate = new Date(dateStr);
            } else {
                return false;
            }
            
            var startDate = start ? new Date(start) : null;
            var endDate = end ? new Date(end) : null;
            
            if (startDate && endDate) {
                return invoiceDate >= startDate && invoiceDate <= endDate;
            } else if (startDate) {
                return invoiceDate >= startDate;
            } else if (endDate) {
                return invoiceDate <= endDate;
            }
            
            return true;
        }
    );
    
    historyDataTable.draw();
    $.fn.dataTable.ext.search.pop(); // Remove the filter function
}

function clearFilter() {
    document.getElementById("startDate").value = "";
    document.getElementById("endDate").value = "";
    historyDataTable.search('').draw();
}

async function viewInvoice(invoiceNo) {
    try {
        const inv = await callAPI('getInvoiceByNo', { invoiceNo, currentUser, currentUserType });
        
        if (!inv) {
            Swal.fire("Not found", "No invoice found or no permission.", "error");
            return;
        }
        
        // Populate form fields
        document.getElementById("invoiceNumberField").value = inv.invoiceNo || "";
        
        // Handle date format conversion
        var dateValue = inv.date || "";
        if (dateValue.includes('/')) {
            var parts = dateValue.split('/');
            if (parts.length === 3) {
                dateValue = parts[2] + '-' + parts[0].padStart(2, '0') + '-' + parts[1].padStart(2, '0');
            }
        }
        document.getElementById("dateField").value = dateValue;
        
        document.querySelector('input[name="name"]').value = inv.name || "";
        document.querySelector('input[name="address"]').value = inv.address || "";
        document.querySelector('input[name="contact"]').value = inv.contact || "";
        
        // Set mobile dropdowns
        var setName = inv.setName || "";
        var variant = inv.variant || "";
        
        document.getElementById("setNameDropdown").value = setName;
        
        // Wait for variants to load
        await updateVariantDropdown();
        
        // Small delay to ensure dropdown is populated
        setTimeout(function() {
            document.getElementById("variantDropdown").value = variant;
            
            // Set other fields
            document.querySelector('input[name="modelNo"]').value = inv.modelNo || "";
            document.querySelector('input[name="imei1"]').value = inv.imei1 || "";
            document.querySelector('input[name="imei2"]').value = inv.imei2 || "";
            document.getElementById("qtyField").value = inv.qty || 0;
            document.getElementById("rateField").value = inv.rate || 0;
            document.getElementById("cgstField").value = inv.cgstPercentage || 0;
            document.getElementById("sgstField").value = inv.sgstPercentage || 0;
            
            updateAmounts();
            
            // Return to invoice view
            backToInvoice();
            window.scrollTo({ top: 0, behavior: "smooth" });
            
        }, 500);
        
    } catch (err) {
        Swal.fire("Error", err.message, "error");
    }
}

async function printInvoice(invoiceNo) {
    try {
        const inv = await callAPI('getInvoiceByNo', { invoiceNo, currentUser, currentUserType });
        
        if (!inv) {
            Swal.fire("Not found", "No invoice found or no permission.", "error");
            return;
        }
        
        // Create a temporary print view
        var printWindow = window.open('', '_blank');
        printWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Invoice ${inv.invoiceNo}</title>
                <style>
                    body { font-family: Arial, sans-serif; margin: 20mm; }
                    .header { background: #2563eb; color: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
                    .section { margin-bottom: 15px; }
                    table { width: 100%; border-collapse: collapse; margin: 15px 0; }
                    th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                    th { background-color: #f2f2f2; }
                    .total { font-weight: bold; font-size: 1.1em; }
                    @media print {
                        @page { margin: 20mm; }
                        body { margin: 0; }
                    }
                </style>
            </head>
            <body>
                <div class="header">
                    <h1>MOBILE BAZAR NATNA</h1>
                    <p>Address: Natna</p>
                    <p>GSTIN: 09CEOPS1586K1ZL</p>
                </div>
                
                <div class="section">
                    <p><strong>Invoice No:</strong> ${inv.invoiceNo}</p>
                    <p><strong>Date:</strong> ${inv.date}</p>
                </div>
                
                <div class="section">
                    <p><strong>Customer:</strong> ${inv.name}</p>
                    <p><strong>Address:</strong> ${inv.address}</p>
                    <p><strong>Contact:</strong> ${inv.contact}</p>
                </div>
                
                <table>
                    <thead>
                        <tr>
                            <th>Description</th>
                            <th>Qty</th>
                            <th>Rate</th>
                            <th>Amount</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td>${inv.setName} - ${inv.variant}<br>
                                Model: ${inv.modelNo || 'N/A'}<br>
                                IMEI1: ${inv.imei1}<br>
                                IMEI2: ${inv.imei2 || 'N/A'}
                            </td>
                            <td>${inv.qty}</td>
                            <td>₹${inv.rate}</td>
                            <td>₹${inv.baseAmount}</td>
                        </tr>
                    </tbody>
                </table>
                
                <div class="section">
                    <p class="total">Total Amount: ₹${inv.baseAmount}</p>
                    <p>CGST @${inv.cgstPercentage}%: ₹${(inv.baseAmount * inv.cgstPercentage / 100).toFixed(2)}</p>
                    <p>SGST @${inv.sgstPercentage}%: ₹${(inv.baseAmount * inv.sgstPercentage / 100).toFixed(2)}</p>
                    <p class="total">GRAND TOTAL: ₹${inv.grandTotal}</p>
                </div>
                
                <div class="section">
                    <p><strong>Terms & Conditions:</strong></p>
                    <ul>
                        <li>All Subject to Kaushambi Jurisdiction</li>
                        <li>Goods once sold will not be taken back</li>
                        <li>Will be valid as per the service center.</li>
                    </ul>
                </div>
                
                <div class="section" style="text-align: right;">
                    <p>For: MRI</p>
                    <p>Signature</p>
                </div>
                
                <script>
                    window.onload = function() {
                        window.print();
                        setTimeout(function() {
                            window.close();
                        }, 500);
                    };
                </script>
            </body>
            </html>
        `);
        printWindow.document.close();
        
    } catch (err) {
        Swal.fire("Error", "Failed to print invoice: " + err.message, "error");
    }
}
