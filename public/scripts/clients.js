document.addEventListener("DOMContentLoaded", async () => {
    const settings = getSettings();
    applyTheme(settings.darkMode);

    async function getClients() {
        const token = localStorage.getItem("token");
        const response = await fetch("http://localhost:3000/api/clients", {
            headers: { "Authorization": `Bearer ${token}` }
        });
        return response.ok ? await response.json() : [];
    }

    async function addClient(client) {
        const token = localStorage.getItem("token");
        const response = await fetch("http://localhost:3000/api/client", {
            method: "POST",
            headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
            body: JSON.stringify(client)
        });
        return response.ok ? await response.json() : null;
    }

    async function updateClient(clientId, client) {
        const token = localStorage.getItem("token");
        const response = await fetch(`http://localhost:3000/api/client/${clientId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
            body: JSON.stringify(client)
        });
        return response.ok ? await response.json() : null;
    }

    async function deleteClient(clientId) {
        const token = localStorage.getItem("token");
        const response = await fetch(`http://localhost:3000/api/client/${clientId}`, {
            method: "DELETE",
            headers: { "Authorization": `Bearer ${token}` }
        });
        return response.ok;
    }

    let clients = await getClients();
    let editClientId = null;
    let currentTablePage = 1;
    const clientsPerPage = 50;

    const tableBody = document.getElementById("client-table");
    const addClientBtn = document.getElementById("add-client-btn");
    const exportBtn = document.getElementById("export-btn");
    const modal = document.getElementById("client-modal");
    const modalTitle = document.getElementById("modal-title");
    const form = document.getElementById("client-form");
    const closeModalBtn = document.getElementById("close-modal");
    const nameInput = document.getElementById("client-name");
    const emailInput = document.getElementById("client-email");
    const phoneInput = document.getElementById("client-phone");
    const statusInput = document.getElementById("client-status");
    const searchInput = document.getElementById("search-input");
    const pagination = document.getElementById("pagination");
    const sortDropdown = document.getElementById("sort-dropdown");

    function sortClients(clients, sortType) {
        const [field, direction] = sortType.split("-");
        return clients.sort((a, b) => {
            let valA = a[field] || "";
            let valB = b[field] || "";
            if (field === "status") {
                valA = valA === "Activ" ? 0 : 1;
                valB = valB === "Activ" ? 0 : 1;
            }
            if (direction === "asc") {
                return valA > valB ? 1 : -1;
            } else {
                return valA < valB ? 1 : -1;
            }
        });
    }

    function renderClients(filter = "", sortType = "name-asc") {
        tableBody.innerHTML = "";
        const filteredClients = clients.filter(client => 
            client.name.toLowerCase().includes(filter.toLowerCase()) || 
            (client.email && client.email.toLowerCase().includes(filter.toLowerCase())) ||
            (client.phone && client.phone.toLowerCase().includes(filter.toLowerCase()))
        );
        sortClients(filteredClients, sortType);
        const start = (currentTablePage - 1) * clientsPerPage;
        const end = start + clientsPerPage;
        const paginatedClients = filteredClients.slice(start, end);

        paginatedClients.forEach((client, index) => {
            const globalIndex = clients.indexOf(client);
            const rowHTML = `
                <tr class="table-row" data-client-id="${client._id}">
                    <td data-label="Nume" class="p-4"><a href="client-details.html?id=${globalIndex}" class="text-blue-400 hover:text-blue-300">${client.name}</a></td>
                    <td data-label="Email" class="p-4">${client.email || "N/A"}</td>
                    <td data-label="Telefon" class="p-4">${client.phone || "N/A"}</td>
                    <td data-label="Status" class="p-4 ${client.status === 'Activ' ? 'status-active' : 'status-inactive'}">${client.status}</td>
                    <td data-label="Acțiuni" class="p-4">
                        <button class="edit-btn text-blue-400 hover:text-blue-300" data-id="${client._id}">Editează</button>
                        <button class="delete-btn text-red-400 ml-2 hover:text-red-300" data-id="${client._id}">Șterge</button>
                    </td>
                </tr>
            `;
            tableBody.insertAdjacentHTML("beforeend", rowHTML);
        });

        const rows = tableBody.querySelectorAll(".table-row");
        rows.forEach(row => {
            row.addEventListener("click", (e) => {
                if (!e.target.classList.contains("edit-btn") && !e.target.classList.contains("delete-btn")) {
                    const link = row.querySelector("a");
                    if (link) link.click();
                }
            });
        });

        tableBody.querySelectorAll(".edit-btn").forEach(btn => {
            btn.addEventListener("click", () => editClient(btn.dataset.id));
        });
        tableBody.querySelectorAll(".delete-btn").forEach(btn => {
            btn.addEventListener("click", () => deleteClientHandler(btn.dataset.id));
        });

        const totalPages = Math.ceil(filteredClients.length / clientsPerPage);
        renderPagination(totalPages);
    }

    function renderPagination(totalPages) {
        pagination.innerHTML = "";
        if (totalPages <= 1) return;

        const prevBtn = document.createElement("button");
        prevBtn.textContent = "Înapoi";
        prevBtn.className = "page-btn text-white";
        prevBtn.disabled = currentTablePage === 1;
        prevBtn.addEventListener("click", () => {
            if (currentTablePage > 1) {
                currentTablePage--;
                renderClients(searchInput.value, sortDropdown.value);
            }
        });
        pagination.appendChild(prevBtn);

        let startPage = Math.max(1, currentTablePage - 1);
        let endPage = Math.min(totalPages, startPage + 2);
        if (endPage - startPage < 2) {
            startPage = Math.max(1, endPage - 2);
        }

        for (let i = startPage; i <= endPage; i++) {
            const pageBtn = document.createElement("button");
            pageBtn.textContent = i;
            pageBtn.className = `page-btn text-white ${i === currentTablePage ? 'active' : ''}`;
            pageBtn.addEventListener("click", () => {
                currentTablePage = i;
                renderClients(searchInput.value, sortDropdown.value);
            });
            pagination.appendChild(pageBtn);
        }

        const pageSelect = document.createElement("select");
        for (let i = 1; i <= totalPages; i++) {
            const option = document.createElement("option");
            option.value = i;
            option.textContent = `Pagina ${i}`;
            if (i === currentTablePage) option.selected = true;
            pageSelect.appendChild(option);
        }
        pageSelect.addEventListener("change", () => {
            currentTablePage = parseInt(pageSelect.value);
            renderClients(searchInput.value, sortDropdown.value);
        });
        pagination.appendChild(pageSelect);

        const nextBtn = document.createElement("button");
        nextBtn.textContent = "Înainte";
        nextBtn.className = "page-btn text-white";
        nextBtn.disabled = currentTablePage === totalPages;
        nextBtn.addEventListener("click", () => {
            if (currentTablePage < totalPages) {
                currentTablePage++;
                renderClients(searchInput.value, sortDropdown.value);
            }
        });
        pagination.appendChild(nextBtn);
    }

    searchInput.addEventListener("input", (e) => {
        currentTablePage = 1;
        renderClients(e.target.value, sortDropdown.value);
    });

    sortDropdown.addEventListener("change", () => {
        currentTablePage = 1;
        renderClients(searchInput.value, sortDropdown.value);
    });

    exportBtn.addEventListener("click", () => {
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(clients));
        const downloadAnchor = document.createElement("a");
        downloadAnchor.setAttribute("href", dataStr);
        downloadAnchor.setAttribute("download", "clients.json");
        document.body.appendChild(downloadAnchor);
        downloadAnchor.click();
        downloadAnchor.remove();
    });

    addClientBtn.addEventListener("click", () => {
        modalTitle.textContent = "Adaugă Client";
        form.reset();
        editClientId = null;
        modal.classList.remove("hidden");
    });

    closeModalBtn.addEventListener("click", () => {
        modal.classList.add("hidden");
    });

    form.addEventListener("submit", async (e) => {
        e.preventDefault();
        if (!phoneInput.value) {
            alert("Numărul de telefon este obligatoriu!");
            return;
        }

        const clientData = {
            name: nameInput.value,
            email: emailInput.value || "",
            phone: phoneInput.value,
            status: statusInput.value,
            orders: []
        };

        if (editClientId === null) {
            const result = await addClient(clientData);
            if (result) clients.push(result.client);
        } else {
            const result = await updateClient(editClientId, clientData);
            if (result) {
                const index = clients.findIndex(c => c._id === editClientId);
                clients[index] = result.client;
            }
            editClientId = null;
        }

        clients = await getClients();
        renderClients(searchInput.value, sortDropdown.value);
        modal.classList.add("hidden");
    });

    window.editClient = function(clientId) {
        const client = clients.find(c => c._id === clientId);
        if (!client) return;
        editClientId = clientId;
        nameInput.value = client.name;
        emailInput.value = client.email || "";
        phoneInput.value = client.phone || "";
        statusInput.value = client.status;
        modalTitle.textContent = "Editează Client";
        modal.classList.remove("hidden");
    };

    window.deleteClientHandler = async function(clientId) {
        if (confirm("Sigur vrei să ștergi acest client?")) {
            const success = await deleteClient(clientId);
            if (success) {
                clients = clients.filter(c => c._id !== clientId);
                renderClients(searchInput.value, sortDropdown.value);
            }
        }
    };

    renderClients();
});