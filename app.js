/**
 * Remodeling Estimation Framework Core Architecture
 */

let currentProject = {
    id: null,
    info: { name: "", date: "", clientName: "", clientPhone: "", clientEmail: "", clientAddress: "", employee: "" },
    prices: {},
    rooms: { "Sallon": [], "Dhomë": [], "WC": [], "Kuzhinë": [], "Shtëpia jashtë": [] },
    discount: 0,
    vat: 0,
    stiropor: { include: false, thickness: "5", area: 0, price: 0, cost: 0 }
};

const app = {
    init: function() {
        this.ui.loadDefaults();
        this.storage.loadLastEditedOrNew();
        this.calculations.recomputeAll();
    }
};

// ==========================================
// AUTHENTICATION MODULE (PASSWORD SECURITY)
// ==========================================
app.auth = {
    verifyPIN: function() {
        const pinInput = document.getElementById("txt-login-pin").value;
        if (pinInput === "1401") {
            document.getElementById("auth-screen").classList.add("hidden");
            document.getElementById("app-content").classList.remove("hidden");
            localStorage.setItem("APP_AUTHENTICATED", "true");
        } else {
            document.getElementById("lbl-login-error").classList.remove("hidden");
            document.getElementById("txt-login-pin").value = "";
        }
    }
};

// ==========================================
// CALCULATIONS MODULE
// ==========================================
app.calculations = {
    recomputeAll: function() {
        Object.keys(CONFIG.categories).forEach(cat => {
            const el = document.getElementById(`cfg-p-${cat}`);
            if (el) currentProject.prices[cat] = parseFloat(el.value) || 0;
        });

        currentProject.discount = parseFloat(document.getElementById("inp-discount").value) || 0;
        currentProject.vat = parseFloat(document.getElementById("inp-vat").value) || 0;

        // Leximi i të dhënave të Stiroporit
        currentProject.stiropor.include = document.getElementById("chk-include-stiropor").checked;
        currentProject.stiropor.thickness = document.getElementById("st-thickness").value;
        currentProject.stiropor.area = parseFloat(document.getElementById("st-area").value) || 0;
        currentProject.stiropor.price = parseFloat(document.getElementById("st-price").value) || 0;
        currentProject.stiropor.cost = currentProject.stiropor.area * currentProject.stiropor.price;

        document.getElementById("lbl-stiropor-total").innerText = currentProject.stiropor.cost.toFixed(2) + " €";

        let totalArea = 0;
        let subtotal = 0;
        const categoryTotals = {};
        
        Object.keys(CONFIG.categories).forEach(c => categoryTotals[c] = 0);

        Object.keys(currentProject.rooms).forEach(roomName => {
            if (!currentProject.rooms[roomName]) currentProject.rooms[roomName] = [];
            currentProject.rooms[roomName].forEach(item => {
                const currentRate = currentProject.prices[item.category] !== undefined ? currentProject.prices[item.category] : CONFIG.categories[item.category].defaultPrice;
                item.price = currentRate;
                
                if (item.mode === "dims") {
                    item.area = (item.width * item.height) * item.qty;
                } else {
                    item.area = item.directArea * item.qty;
                }

                item.cost = item.area * item.price;
                totalArea += item.area;
                subtotal += item.cost;
                categoryTotals[item.category] += item.area;
            });
        });

        // Nëse stiropori përfshihet në totalin e faturës
        let cumulativeBase = subtotal;
        if (currentProject.stiropor.include) {
            cumulativeBase += currentProject.stiropor.cost;
            document.getElementById("sum-stiropor-val").innerText = currentProject.stiropor.cost.toFixed(2) + " €";
            document.getElementById("div-summary-stiropor-row").style.display = "flex";
        } else {
            document.getElementById("sum-stiropor-val").innerText = "0.00 €";
            document.getElementById("div-summary-stiropor-row").style.display = "none";
        }

        const discountValue = cumulativeBase * (currentProject.discount / 100);
        const subtotalAfterDiscount = cumulativeBase - discountValue;
        const vatValue = subtotalAfterDiscount * (currentProject.vat / 100);
        const grandTotal = subtotalAfterDiscount + vatValue;

        document.getElementById("sum-total-area").innerText = totalArea.toFixed(2) + " m²";
        document.getElementById("sum-subtotal").innerText = subtotal.toFixed(2) + " €";
        document.getElementById("sum-discount-val").innerText = discountValue.toFixed(2) + " €";
        document.getElementById("sum-vat-val").innerText = vatValue.toFixed(2) + " €";
        document.getElementById("sum-grand-total").innerText = grandTotal.toFixed(2) + " €";

        app.ui.renderRoomsDataGrid();
        this.calculateMaterialsEstimator(categoryTotals);
    },

    calculateMaterialsEstimator: function(categoryTotals) {
        const tbody = document.getElementById("materials-tbody");
        tbody.innerHTML = "";
        let dynamicRowHTML = "";
        let componentsCount = 0;

        CONFIG.materialFormulas.forEach(formula => {
            let targetedAreaSum = 0;
            formula.supportedCategories.forEach(cat => { targetedAreaSum += (categoryTotals[cat] || 0); });

            if (targetedAreaSum > 0) {
                const calculatedQuantity = targetedAreaSum * formula.factor;
                componentsCount++;
                dynamicRowHTML += `
                    <tr class="hover:bg-slate-50 border-b border-slate-100 text-xs text-slate-700">
                        <td class="p-2.5 font-medium">${formula.item}</td>
                        <td class="p-2.5 font-bold text-blue-700">${calculatedQuantity.toFixed(1)}</td>
                        <td class="p-2.5 text-slate-500">${formula.unit}</td>
                        <td class="p-2.5 text-slate-400 italic">Analizë Normative</td>
                    </tr>
                `;
            }
        });

        tbody.innerHTML = componentsCount === 0 ? `<tr><td colspan="4" class="p-4 text-center text-xs text-slate-400">Shto matje dhomash.</td></tr>` : dynamicRowHTML;
    }
};

// ==========================================
// STORAGE MODULE
// ==========================================
app.storage = {
    saveCurrentProject: function() {
        this.syncFormFieldsToState();
        if (!currentProject.info.name) return alert("Shkruani Emrin e Projektit.");
        if (!currentProject.id) currentProject.id = "PRJ-" + Date.now();
        
        localStorage.setItem(currentProject.id, JSON.stringify(currentProject));
        localStorage.setItem("LAST_ACTIVE_PROJECT_ID", currentProject.id);
        
        document.getElementById("lbl-project-status").innerText = "I Ruajtur";
        document.getElementById("lbl-project-status").className = "text-xs bg-emerald-100 text-emerald-800 font-semibold px-2.5 py-1 rounded-full";
        alert("Projekti u ruajt me sukses!");
    },

    syncFormFieldsToState: function() {
        currentProject.info.name = document.getElementById("p-name").value;
        currentProject.info.date = document.getElementById("p-date").value;
        currentProject.info.clientName = document.getElementById("c-name").value;
        currentProject.info.clientPhone = document.getElementById("c-phone").value;
        currentProject.info.clientEmail = document.getElementById("c-email").value;
        currentProject.info.clientAddress = document.getElementById("c-address").value;
        currentProject.info.employee = document.getElementById("p-employee").value;
    },

    loadLastEditedOrNew: function() {
        const lastId = localStorage.getItem("LAST_ACTIVE_PROJECT_ID");
        if (lastId && localStorage.getItem(lastId)) { this.loadProjectById(lastId); } 
        else { this.setupNewBlankProjectState(); }
    },

    loadProjectById: function(id) {
        const data = localStorage.getItem(id);
        if (data) {
            currentProject = JSON.parse(data);
            
            document.getElementById("p-name").value = currentProject.info.name || "";
            document.getElementById("p-date").value = currentProject.info.date || "";
            document.getElementById("c-name").value = currentProject.info.clientName || "";
            document.getElementById("c-phone").value = currentProject.info.clientPhone || "";
            document.getElementById("c-email").value = currentProject.info.clientEmail || "";
            document.getElementById("c-address").value = currentProject.info.clientAddress || "";
            document.getElementById("p-employee").value = currentProject.info.employee || "";
            document.getElementById("inp-discount").value = currentProject.discount || 0;
            document.getElementById("inp-vat").value = currentProject.vat || 0;

            if (currentProject.stiropor) {
                document.getElementById("chk-include-stiropor").checked = currentProject.stiropor.include || false;
                document.getElementById("st-thickness").value = currentProject.stiropor.thickness || "5";
                document.getElementById("st-area").value = currentProject.stiropor.area || 0;
                document.getElementById("st-price").value = currentProject.stiropor.price || 0;
            }

            Object.keys(CONFIG.categories).forEach(cat => {
                const inputField = document.getElementById(`cfg-p-${cat}`);
                if (inputField && currentProject.prices && currentProject.prices[cat] !== undefined) {
                    inputField.value = currentProject.prices[cat];
                }
            });

            app.calculations.recomputeAll();
            document.getElementById("lbl-project-status").innerText = "I Ngarkuar";
            document.getElementById("lbl-project-status").className = "text-xs bg-blue-100 text-blue-800 font-semibold px-2.5 py-1 rounded-full";
        }
    },

    setupNewBlankProjectState: function() {
        currentProject = {
            id: null,
            info: { name: "Projekt i Ri", date: new Date().toISOString().split('T')[0], clientName: "", clientPhone: "", clientEmail: "", clientAddress: "", employee: "" },
            prices: {},
            rooms: { "Sallon": [], "Dhomë": [], "WC": [], "Kuzhinë": [], "Shtëpia jashtë": [] },
            discount: 0,
            vat: 0,
            stiropor: { include: false, thickness: "5", area: 0, price: 0, cost: 0 }
        };

        Object.keys(CONFIG.categories).forEach(cat => {
            currentProject.prices[cat] = CONFIG.categories[cat].defaultPrice;
            const inputField = document.getElementById(`cfg-p-${cat}`);
            if (inputField) inputField.value = CONFIG.categories[cat].defaultPrice;
        });

        document.getElementById("form-project").reset();
        document.getElementById("p-date").value = currentProject.info.date;
        document.getElementById("inp-discount").value = 0;
        document.getElementById("inp-vat").value = 0;
        document.getElementById("chk-include-stiropor").checked = false;
        document.getElementById("st-area").value = 0;
        document.getElementById("st-price").value = 0;

        app.calculations.recomputeAll();
        document.getElementById("lbl-project-status").innerText = "Skicë e Re";
        document.getElementById("lbl-project-status").className = "text-xs bg-amber-100 text-amber-800 font-semibold px-2.5 py-1 rounded-full";
    },

    duplicateProject: function() {
        if (!currentProject.info.name) return alert("Ska projekt aktiv.");
        this.syncFormFieldsToState();
        currentProject.id = "PRJ-" + Date.now();
        currentProject.info.name += " - Kopje";
        document.getElementById("p-name").value = currentProject.info.name;
        this.saveCurrentProject();
    }
};

// ==========================================
// UI INTERACTIONS & RENDERING MODULE
// ==========================================
app.ui = {
    loadDefaults: function() {
        const priceContainer = document.getElementById("price-inputs-grid");
        priceContainer.innerHTML = "";
        
        Object.keys(CONFIG.categories).forEach(key => {
            const cat = CONFIG.categories[key];
            priceContainer.innerHTML += `
                <div>
                    <label class="block text-[11px] font-medium text-slate-500 truncate" title="${cat.name}">${cat.name}</label>
                    <div class="relative mt-1">
                        <input type="number" step="0.01" id="cfg-p-${key}" value="${cat.defaultPrice}" onchange="app.calculations.recomputeAll()" class="w-full border border-slate-300 rounded px-2 py-1 text-xs bg-white pr-5 font-semibold">
                        <span class="absolute right-1.5 top-1 text-[10px] text-slate-400">€</span>
                    </div>
                </div>
            `;
        });

        const catSelect = document.getElementById("m-category");
        catSelect.innerHTML = "";
        Object.keys(CONFIG.categories).forEach(key => {
            catSelect.innerHTML += `<option value="${key}">${CONFIG.categories[key].name}</option>`;
        });

        this.updatePriceFieldFromCategory();
    },

    updatePriceFieldFromCategory: function() {
        const selectedCat = document.getElementById("m-category").value;
        const customPriceField = document.getElementById(`cfg-p-${selectedCat}`);
        document.getElementById("m-price").value = customPriceField ? parseFloat(customPriceField.value) : CONFIG.categories[selectedCat].defaultPrice;
    },

    switchCalcMode: function(mode) {
        if (mode === 'dims') {
            document.getElementById("div-dim-width").classList.remove("hidden");
            document.getElementById("div-dim-height").classList.remove("hidden");
            document.getElementById("div-dim-direct").classList.add("hidden");
        } else {
            document.getElementById("div-dim-width").classList.add("hidden");
            document.getElementById("div-dim-height").classList.add("hidden");
            document.getElementById("div-dim-direct").classList.remove("hidden");
        }
    },

    addMeasurementItem: function() {
        const room = document.getElementById("m-room").value;
        const category = document.getElementById("m-category").value;
        const desc = document.getElementById("m-desc").value.trim();
        const mode = document.querySelector('input[name="calc-mode"]:checked').value;
        const qty = parseInt(document.getElementById("m-qty").value) || 1;
        const price = parseFloat(document.getElementById("m-price").value) || 0;
        const notes = document.getElementById("m-notes").value.trim();

        let width = 0, height = 0, directArea = 0;
        if (mode === "dims") {
            width = parseFloat(document.getElementById("m-width").value) || 0;
            height = parseFloat(document.getElementById("m-height").value) || 0;
            if (width <= 0 || height <= 0) return alert("Gjatësia dhe lartësia duhet të jenë mbi 0.");
        } else {
            directArea = parseFloat(document.getElementById("m-area-direct").value) || 0;
            if (directArea <= 0) return alert("Sipërfaqja direkte duhet të jetë mbi 0.");
        }

        const newItem = {
            id: "ITEM-" + Date.now(), category, desc: desc || CONFIG.categories[category].name,
            mode, width, height, directArea, qty, price, notes
        };

        if (!currentProject.rooms[room]) currentProject.rooms[room] = [];
        currentProject.rooms[room].push(newItem);
        
        document.getElementById("m-desc").value = "";
        document.getElementById("m-width").value = "";
        document.getElementById("m-height").value = "";
        document.getElementById("m-area-direct").value = "";
        document.getElementById("m-notes").value = "";
        document.getElementById("m-qty").value = "1";

        app.calculations.recomputeAll();
    },

    deleteItem: function(room, itemId) {
        if (confirm("Dëshironi të fshini këtë matje?")) {
            currentProject.rooms[room] = currentProject.rooms[room].filter(i => i.id !== itemId);
            app.calculations.recomputeAll();
        }
    },

    renderRoomsDataGrid: function() {
        const wrapper = document.getElementById("rooms-wrapper");
        wrapper.innerHTML = "";

        Object.keys(currentProject.rooms).forEach(roomName => {
            const items = currentProject.rooms[roomName] || [];
            if (items.length === 0) return; // Mos e shfaq dhomën në listën live nëse nuk ka ende matje

            let roomSubtotal = items.reduce((acc, curr) => acc + (curr.cost || 0), 0);
            let itemsRowsHTML = "";

            items.forEach(item => {
                const formulaText = item.mode === "dims" ? `${item.width} × ${item.height} m` : "Direkte";
                itemsRowsHTML += `
                    <tr class="hover:bg-slate-50 border-b border-slate-100 text-xs text-slate-700">
                        <td class="p-2.5">
                            <span class="block text-slate-900 font-bold">${CONFIG.categories[item.category].name}</span>
                            <span class="text-slate-500">${item.desc}</span>
                            ${item.notes ? `<span class="block text-[11px] text-amber-600 italic font-medium"><i class="fa-solid fa-comment-dots"></i> ${item.notes}</span>` : ''}
                        </td>
                        <td class="p-2.5 text-center bg-slate-50/50">${formulaText}</td>
                        <td class="p-2.5 text-center">${item.qty} x</td>
                        <td class="p-2.5 text-right font-semibold text-slate-900">${item.area.toFixed(2)} m²</td>
                        <td class="p-2.5 text-right font-medium text-slate-600">${item.price.toFixed(2)} €</td>
                        <td class="p-2.5 text-right font-bold text-blue-900">${item.cost.toFixed(2)} €</td>
                        <td class="p-2.5 text-center">
                            <button onclick="app.ui.deleteItem('${roomName}', '${item.id}')" class="text-red-500 hover:text-red-700 p-1"><i class="fa-solid fa-trash-can"></i></button>
                        </td>
                    </tr>
                `;
            });

            wrapper.innerHTML += `
                <div class="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                    <div class="bg-slate-100 px-4 py-2.5 flex justify-between items-center border-b border-slate-200">
                        <span class="font-bold text-xs text-slate-800 uppercase tracking-wider"><i class="fa-solid fa-house-chimney text-blue-600 mr-1.5"></i>${roomName}</span>
                        <span class="text-xs font-bold text-slate-600">Nëntotali: <span class="text-blue-900">${roomSubtotal.toFixed(2)} €</span></span>
                    </div>
                    <table class="w-full text-left border-collapse">
                        <tbody>${itemsRowsHTML}</tbody>
                    </table>
                </div>
            `;
        });
    },

    toggleCollapse: function(id) {
        const content = document.getElementById(id);
        content.classList.toggle("open");
    },

    toggleProjectList: function() {
        const modal = document.getElementById("modal-projects-list");
        modal.classList.toggle("hidden");
        if (!modal.classList.contains("hidden")) this.renderStoredProjectsList();
    },

    renderStoredProjectsList: function() {
        const container = document.getElementById("projects-browser-container");
        container.innerHTML = "";
        let count = 0;

        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key.startsWith("PRJ-")) {
                count++;
                const prj = JSON.parse(localStorage.getItem(key));
                container.innerHTML += `
                    <div class="py-3 flex justify-between items-center hover:bg-slate-50 px-2 rounded-lg dynamic-prj-row" data-search="${(prj.info.clientName + ' ' + prj.info.name).toLowerCase()}">
                        <div>
                            <h5 class="font-bold text-sm text-blue-900">${prj.info.name}</h5>
                            <p class="text-xs text-slate-600">Klienti: <b>${prj.info.clientName}</b> | Data: ${prj.info.date}</p>
                        </div>
                        <div class="flex space-x-1">
                            <button onclick="app.storage.loadProjectById('${key}'); app.ui.toggleProjectList();" class="bg-blue-600 text-white text-xs font-semibold px-2.5 py-1 rounded shadow"><i class="fa-solid fa-folder-open"></i> Hap</button>
                            <button onclick="app.ui.deleteProjectDirect('${key}')" class="bg-red-100 text-red-700 text-xs p-1.5 rounded"><i class="fa-solid fa-trash"></i></button>
                        </div>
                    </div>
                `;
            }
        }
        if(count === 0) container.innerHTML = `<div class="p-8 text-center text-sm text-slate-400 italic">Ska projekte.</div>`;
    },

    filterProjectsList: function() {
        const query = document.getElementById("txt-search-projects").value.toLowerCase();
        document.querySelectorAll(".dynamic-prj-row").forEach(row => {
            row.classList.toggle("hidden", !row.getAttribute("data-search").includes(query));
        });
    },

    deleteProjectDirect: function(id) {
        if (confirm("Fshini këtë projekt përgjithmonë?")) {
            localStorage.removeItem(id);
            if(currentProject.id === id) app.storage.setupNewBlankProjectState();
            this.renderStoredProjectsList();
        }
    },

    deleteCurrentProject: function() {
        if(!currentProject.id) return alert("Ky projekt nuk është ruajtur akoma.");
        if (confirm("Fshini projektin aktual?")) {
            localStorage.removeItem(currentProject.id);
            app.storage.setupNewBlankProjectState();
        }
    },

    openNewProjectModal: function() {
        if(confirm("Hap skicë të re? Sigurohuni që keni ruajtur ndryshimet.")) app.storage.setupNewBlankProjectState();
    }
};

// ==========================================
// PDF GENERATION MODULE (jsPDF)
// ==========================================
app.pdf = {
    compileTemplateData: function() {
        app.storage.syncFormFieldsToState();
        
        document.getElementById("pdf-c-name").innerText = currentProject.info.clientName || "/";
        document.getElementById("pdf-c-phone").innerText = currentProject.info.clientPhone || "/";
        document.getElementById("pdf-c-email").innerText = currentProject.info.clientEmail || "/";
        document.getElementById("pdf-c-address").innerText = currentProject.info.clientAddress || "/";
        document.getElementById("pdf-p-name").innerText = currentProject.info.name || "/";
        document.getElementById("pdf-p-date").innerText = currentProject.info.date || "/";
        document.getElementById("pdf-p-employee").innerText = currentProject.info.employee || "/";

        const tableBody = document.getElementById("pdf-table-items");
        tableBody.innerHTML = "";

        let totalArea = 0;
        let subtotal = 0;

        // Renditja e punimeve të dhomave
        Object.keys(currentProject.rooms).forEach(roomName => {
            const items = currentProject.rooms[roomName] || [];
            items.forEach(item => {
                const formulaText = item.mode === "dims" ? `${item.width}×${item.height}` : "Direkte";
                const tr = document.createElement("tr");
                tr.className = "text-[11px] text-slate-800 border-b border-slate-200";
                tr.innerHTML = `
                    <td class="p-2 font-bold bg-slate-50">${roomName}</td>
                    <td class="p-2">
                        <span class="font-medium block text-slate-900">${CONFIG.categories[item.category].name}</span>
                        <span class="text-[10px] text-slate-500">${item.desc}</span>
                    </td>
                    <td class="p-2 text-center">${formulaText} [${item.qty}x]</td>
                    <td class="p-2 text-right">${item.area.toFixed(2)} m²</td>
                    <td class="p-2 text-right">${item.price.toFixed(2)} €</td>
                    <td class="p-2 text-right font-bold text-blue-950">${item.cost.toFixed(2)} €</td>
                `;
                tableBody.appendChild(tr);
                totalArea += item.area;
                subtotal += item.cost;
            });
        });

        // Shtimi i Stiroporit si rresht në faturën PDF nëse është i përfshirë
        let baseTotalWithStiropor = subtotal;
        if (currentProject.stiropor.include && currentProject.stiropor.cost > 0) {
            baseTotalWithStiropor += currentProject.stiropor.cost;
            document.getElementById("pdf-row-stiropor").style.display = "flex";
            document.getElementById("pdf-sum-stiropor").innerText = currentProject.stiropor.cost.toFixed(2) + " €";

            const trSt = document.createElement("tr");
            trSt.className = "text-[11px] text-indigo-900 bg-indigo-50/50 border-b border-indigo-200 font-semibold";
            trSt.innerHTML = `
                <td class="p-2 font-bold uppercase">Fasadë</td>
                <td class="p-2">Stiropor Fasada (Trashësia: ${currentProject.stiropor.thickness} cm)</td>
                <td class="p-2 text-center">Fikse</td>
                <td class="p-2 text-right">${currentProject.stiropor.area.toFixed(2)} m²</td>
                <td class="p-2 text-right">${currentProject.stiropor.price.toFixed(2)} €</td>
                <td class="p-2 text-right font-black">${currentProject.stiropor.cost.toFixed(2)} €</td>
            `;
            tableBody.appendChild(trSt);
        } else {
            document.getElementById("pdf-row-stiropor").style.display = "none";
        }

        const discountValue = baseTotalWithStiropor * (currentProject.discount / 100);
        const subtotalAfterDiscount = baseTotalWithStiropor - discountValue;
        const vatValue = subtotalAfterDiscount * (currentProject.vat / 100);
        const grandTotal = subtotalAfterDiscount + vatValue;

        document.getElementById("pdf-sum-area").innerText = totalArea.toFixed(2) + " m²";
        document.getElementById("pdf-sum-subtotal").innerText = subtotal.toFixed(2) + " €";
        
        document.getElementById("pdf-row-discount").style.display = discountValue > 0 ? "flex" : "none";
        document.getElementById("pdf-sum-discount").innerText = `-${discountValue.toFixed(2)} € (${currentProject.discount}%)`;
        
        document.getElementById("pdf-row-vat").style.display = vatValue > 0 ? "flex" : "none";
        document.getElementById("pdf-sum-vat").innerText = `${vatValue.toFixed(2)} € (${currentProject.vat}%)`;

        document.getElementById("pdf-sum-grand").innerText = grandTotal.toFixed(2) + " €";
    },

    generate: function(isPrintMode = false) {
        this.compileTemplateData();
        const element = document.getElementById("pdf-rendering-template");
        
        html2canvas(element, { scale: 2, useCORS: true }).then(canvas => {
            const imgData = canvas.toDataURL('image/jpeg', 0.95);
            const pdf = new jspdf.jsPDF('p', 'mm', 'a4');
            const imgWidth = 210;
            const pageHeight = 295;
            const imgHeight = (canvas.height * imgWidth) / canvas.width;
            let heightLeft = imgHeight;
            let position = 0;

            pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
            heightLeft -= pageHeight;

            while (heightLeft >= 0) {
                position = heightLeft - imgHeight;
                pdf.addPage();
                pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
                heightLeft -= pageHeight;
            }

            if (isPrintMode) {
                pdf.autoPrint();
                window.open(pdf.output('bloburl'), '_blank');
            } else {
                pdf.save(`${(currentProject.info.name || "Kuotacion").replace(/[^a-z0-9]/gi, '_').toLowerCase()}.pdf`);
            }
        });
    }
};

// ==========================================
// EMAIL SENDING MODULE (Direct Format Mailto)
// ==========================================
app.email = {
    sendReport: function() {
        app.storage.syncFormFieldsToState();
        if (!currentProject.info.name || !currentProject.info.clientName) return alert("Plotësoni Emrin e Projektit dhe Klientit.");

        const toEmail = "shabanimevaip1@gmail.com";
        const subject = encodeURIComponent(`Parallogaritje: ${currentProject.info.name} - ${currentProject.info.clientName}`);
        
        const grandTotal = document.getElementById("sum-grand-total").innerText;
        const totalArea = document.getElementById("sum-total-area").innerText;
        const subtotal = document.getElementById("sum-subtotal").innerText;

        let emailBody = `Përshëndetje,\n\nMë poshtë gjeni përmbledhjen e ofertës financiare:\n\n`;
        emailBody += `PROJEKTI:       ${currentProject.info.name}\n`;
        emailBody += `KLIENTI:        ${currentProject.info.clientName}\n`;
        emailBody += `TELEFONI:       ${currentProject.info.clientPhone}\n`;
        emailBody += `PËRGATITUR NGA: ${currentProject.info.employee}\n`;
        emailBody += `DATA:           ${currentProject.info.date}\n\n`;
        if(currentProject.stiropor.include) {
            emailBody += `STIROPORI:      Sipërfaqja: ${currentProject.stiropor.area}m² | Trashësia: ${currentProject.stiropor.thickness}cm | Vlera: ${currentProject.stiropor.cost.toFixed(2)}€\n`;
        }
        emailBody += `Sipërfaqja Punimeve: ${totalArea}\n`;
        emailBody += `TOTALI PËR PAGESË:   ${grandTotal}\n\n`;
        emailBody += `Shkarkoni PDF-në nga sistemi dhe bashkëngjiteni këtu.\n\nMe respekt,\n${currentProject.info.employee}`;

        window.location.href = `mailto:${toEmail}?subject=${subject}&body=${encodeURIComponent(emailBody)}`;
    }
};

window.onload = function() {
    // Kontrollo nëse përdoruesi ishte loguar më parë në këtë sesion
    if (localStorage.getItem("APP_AUTHENTICATED") === "true") {
        document.getElementById("auth-screen").classList.add("hidden");
        document.getElementById("app-content").classList.remove("hidden");
    }
    app.init();
};