// ========================================
// LOGIN FUNCTION
// ========================================

// ensure globals exist
if (typeof window.currentUser === "undefined") window.currentUser = "";
if (typeof window.currentUserType === "undefined") window.currentUserType = "";

// Simple mock API fallback so login works without backend during development
function mockCallAPI(action, data) {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            if (action === 'login') {
                const u = (data && data.username) || '';
                const p = (data && data.password) || '';
                // simple dev credentials
                if ((u === 'admin' && p === 'admin') || (u.toLowerCase() === 'admin' && p === 'admin')) {
                    return resolve({ username: 'Admin', userType: 'Admin' });
                }
                if ((u === 'user' && p === 'user') || (u.toLowerCase() === 'user' && p === 'user')) {
                    return resolve({ username: 'User', userType: 'User' });
                }
                return reject(new Error('Invalid username or password (dev fallback)'));
            }
            if (action === 'getSetNames') return resolve(['Default Set']);
            if (action === 'getNewInvoiceNumber') return resolve('INV-0001');
            return reject(new Error('Unknown action: ' + action));
        }, 250);
    });
}

async function handleLogin(e) {
    e.preventDefault();
    const formData = new FormData(e.target);
    const username = formData.get("username");
    const password = formData.get("password");
    const loginErrorEl = document.getElementById('loginError');

    try {
        // use real callAPI if available, otherwise mock
        const api = (typeof callAPI === 'function') ? callAPI : mockCallAPI;

        const res = await api('login', { username, password });

        window.currentUser = res && res.username ? res.username : "";
        window.currentUserType = res && res.userType ? res.userType : "";

        const currentUserField = document.getElementById("currentUserField");
        const currentUserTypeField = document.getElementById("currentUserTypeField");
        const headerUser = document.getElementById("headerUser");
        const loginSection = document.getElementById("loginSection");
        const dashboardSection = document.getElementById("dashboardSection");
        const adminControls = document.getElementById("adminControls");

        if (currentUserField) currentUserField.value = window.currentUser;
        if (currentUserTypeField) currentUserTypeField.value = window.currentUserType;
        if (headerUser) headerUser.textContent = window.currentUser ? "Logged in as: " + window.currentUser : "";

        // toggle visibility using Tailwind 'hidden' class
        if (loginSection) loginSection.classList.add('hidden');
        if (dashboardSection) dashboardSection.classList.remove('hidden');

        if (adminControls) {
            if (window.currentUserType === "Admin") adminControls.classList.remove('hidden');
            else adminControls.classList.add('hidden');
        }

        // Load sets for dropdown (guard element existence)
        const sets = await api('getSetNames').catch(() => []);
        const setDropdown = document.getElementById("setNameDropdown");
        if (setDropdown && Array.isArray(sets)) {
            let options = "<option value=''>Select Set</option>";
            sets.forEach(function (s) { options += "<option value='" + s + "'>" + s + "</option>"; });
            setDropdown.innerHTML = options;
        }

        // Get new invoice number
        const invoiceNo = await api('getNewInvoiceNumber').catch(() => null);
        const invoiceField = document.getElementById("invoiceNumberField");
        if (invoiceField && invoiceNo !== undefined && invoiceNo !== null) invoiceField.value = invoiceNo;

        // clear any previous error
        if (loginErrorEl) {
            loginErrorEl.textContent = '';
            loginErrorEl.classList.add('hidden');
        }

    } catch (err) {
        const msg = (err && err.message) ? err.message : String(err);
        if (typeof Swal !== "undefined") Swal.fire("Error", msg, "error");
        else {
            if (loginErrorEl) {
                loginErrorEl.textContent = msg;
                loginErrorEl.classList.remove('hidden');
            } else alert("Error: " + msg);
        }
        console.error("Login error:", err);
    }
}

// attach listener if not already attached
document.getElementById('loginForm')?.addEventListener('submit', handleLogin);
