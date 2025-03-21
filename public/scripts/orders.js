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

    async function saveClients(clients) {
        const token = localStorage.getItem("token");
        await fetch("http://localhost:3000/api/clients", {
            method: "POST",
            headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
            body: JSON.stringify(clients)
        });
    }

    let clients = await getClients();
    let currentTablePage = 1;
    const ordersPerPage = settings.itemsPerPage || 50;

    const tableBody = document.getElementById("orders-table");
    const exportBtn = document.getElementById("export-btn");
    const searchInput = document.getElementById("search-input");
    const sortDropdown = document.getElementById("sort-dropdown");
    const pagination = document.getElementById("pagination");
    const addOrderBtn = document.getElementById("add-order-btn");
    const orderModal = document.getElementById("order-modal");
    const orderModalTitle = document.getElementById("order-modal-title");
    const orderForm = document.getElementById("order-form");
    const closeOrderModal = document.getElementById("close-order-modal");
    const orderClientSelect = document.getElementById("order-client");
    const orderNameInput = document.getElementById("order-name");
    const orderDateInput = document.getElementById("order-date");
    const orderFinishDateInput = document.getElementById("order-finish-date");
    const orderDescriptionInput = document.getElementById("order-description");
    const orderImagesInput = document.getElementById("order-images");
    const orderCostInput = document.getElementById("order-cost");
    const orderDetailsModal = document.getElementById("order-details-modal");
    const closeOrderDetailsModal = document.getElementById("close-order-details-modal");
    const editOrderBtn = document.getElementById("edit-order-btn");
    const cancelEditBtn = document.getElementById("cancel-edit-btn");
    const saveEditBtn = document.getElementById("save-edit-btn");
    const viewOrderDetails = document.getElementById("view-order-details");
    const editOrderForm = document.getElementById("edit-order-form");

    let currentOrder = null;

    function populateClientSelect() {
        if (!orderClientSelect) return;
        orderClientSelect.innerHTML = '<option value="">Selectează un client</option>';
        clients.forEach((client, index) => {
            const option = document.createElement("option");
            option.value = index;
            option.textContent = client.name;
            orderClientSelect.appendChild(option);
        });
    }
    populateClientSelect();

    function getAllOrders() {
        const allOrders = [];
        clients.forEach((client, clientIndex) => {
            (client.orders || []).forEach(order => {
                allOrders.push({
                    clientName: client.name,
                    clientIndex: clientIndex,
                    ...order
                });
            });
        });
        return allOrders;
    }

    function sortOrders(orders, sortType) {
        const [field, direction] = sortType.split("-");
        return orders.sort((a, b) => {
            let valA, valB;
            if (field === "cost") {
                valA = a.cost || 0;
                valB = b.cost || 0;
            } else {
                valA = a[field];
                valB = b[field];
            }
            if (direction === "asc") {
                return valA > valB ? 1 : -1;
            } else {
                return valA < valB ? 1 : -1;
            }
        });
    }

    function renderOrders(search = "", sortType = "orderDate-asc") {
        if (!tableBody) return;
        tableBody.innerHTML = "";
        const allOrders = getAllOrders();
        let filteredOrders = allOrders.filter(order => 
            order.orderName.toLowerCase().includes(search.toLowerCase()) || 
            order.clientName.toLowerCase().includes(search.toLowerCase())
        );
        sortOrders(filteredOrders, sortType);
        const start = (currentTablePage - 1) * ordersPerPage;
        const end = start + ordersPerPage;
        const paginatedOrders = filteredOrders.slice(start, end);

        if (paginatedOrders.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="5" class="p-4 text-center">Nu există comenzi.</td></tr>';
        } else {
            paginatedOrders.forEach((order, index) => {
                const globalIndex = allOrders.indexOf(order);
                const rowHTML = `
                    <tr class="table-row cursor-pointer" data-order-index="${globalIndex}">
                        <td data-label="Nume Comandă" class="p-4">${order.orderName}</td>
                        <td data-label="Client" class="p-4">${order.clientName}</td>
                        <td data-label="Data Comenzii" class="p-4">${order.orderDate}</td>
                        <td data-label="Data Finisării" class="p-4">${order.finishDate || "N/A"}</td>
                        <td data-label="Cost" class="p-4">${order.cost || 0} lei</td>
                    </tr>
                `;
                tableBody.insertAdjacentHTML("beforeend", rowHTML);
            });

            const rows = tableBody.querySelectorAll(".table-row");
            rows.forEach(row => {
                row.addEventListener("click", () => {
                    showOrderDetails(allOrders[row.dataset.orderIndex]);
                });
            });
        }

        const totalPages = Math.ceil(filteredOrders.length / ordersPerPage);
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
                renderOrders(searchInput.value, sortDropdown.value);
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
                renderOrders(searchInput.value, sortDropdown.value);
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
            renderOrders(searchInput.value, sortDropdown.value);
        });
        pagination.appendChild(pageSelect);

        const nextBtn = document.createElement("button");
        nextBtn.textContent = "Înainte";
        nextBtn.className = "page-btn text-white";
        nextBtn.disabled = currentTablePage === totalPages;
        nextBtn.addEventListener("click", () => {
            if (currentTablePage < totalPages) {
                currentTablePage++;
                renderOrders(searchInput.value, sortDropdown.value);
            }
        });
        pagination.appendChild(nextBtn);
    }

    if (searchInput) {
        searchInput.addEventListener("input", () => {
            currentTablePage = 1;
            renderOrders(searchInput.value, sortDropdown.value);
        });
    }

    if (sortDropdown) {
        sortDropdown.addEventListener("change", () => {
            currentTablePage = 1;
            renderOrders(searchInput.value, sortDropdown.value);
        });
    }

    if (exportBtn) {
        exportBtn.addEventListener("click", () => {
            const allOrders = getAllOrders();
            sortOrders(allOrders, sortDropdown.value);

            const jsonStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(allOrders));
            const jsonAnchor = document.createElement("a");
            jsonAnchor.setAttribute("href", jsonStr);
            jsonAnchor.setAttribute("download", "orders.json");
            document.body.appendChild(jsonAnchor);
            jsonAnchor.click();
            jsonAnchor.remove();

            let csvContent = "Nume Comandă,Client,Data Comenzii,Data Finisării,Cost (lei)\n";
            allOrders.forEach(order => {
                csvContent += `${order.orderName},${order.clientName},${order.orderDate},${order.finishDate || ""},${order.cost || 0}\n`;
            });
            const csvStr = "data:text/csv;charset=utf-8," + encodeURIComponent(csvContent);
            const csvAnchor = document.createElement("a");
            csvAnchor.setAttribute("href", csvStr);
            csvAnchor.setAttribute("download", "orders.csv");
            document.body.appendChild(csvAnchor);
            csvAnchor.click();
            csvAnchor.remove();
        });
    }

    if (addOrderBtn) {
        addOrderBtn.addEventListener("click", () => {
            orderModalTitle.textContent = "Adaugă Comandă";
            orderForm.reset();
            orderModal.classList.remove("hidden");
        });
    }

    if (closeOrderModal) {
        closeOrderModal.addEventListener("click", () => {
            orderModal.classList.add("hidden");
        });
    }

    if (orderForm) {
        orderForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            const clientIndex = parseInt(orderClientSelect.value);
            if (isNaN(clientIndex)) {
                alert("Te rog selectează un client!");
                return;
            }

            const files = orderImagesInput.files;
            const readerPromises = [];
            for (let file of files) {
                const reader = new FileReader();
                readerPromises.push(new Promise((resolve) => {
                    reader.onload = () => resolve(reader.result);
                    reader.readAsDataURL(file);
                }));
            }

            Promise.all(readerPromises).then(async (imageData) => {
                const newOrder = {
                    orderName: orderNameInput.value,
                    orderDate: orderDateInput.value,
                    finishDate: orderFinishDateInput.value,
                    description: orderDescriptionInput.value,
                    images: imageData.length > 0 ? imageData : [],
                    cost: parseFloat(orderCostInput.value) || 0
                };

                clients[clientIndex].orders = clients[clientIndex].orders || [];
                clients[clientIndex].orders.push(newOrder);
                await saveClients(clients);
                clients = await getClients();
                renderOrders(searchInput.value, sortDropdown.value);
                orderModal.classList.add("hidden");
            });
        });
    }

    function showOrderDetails(order) {
        currentOrder = order;
        document.getElementById("order-name-detail").textContent = order.orderName;
        document.getElementById("order-client-detail").innerHTML = `<a href="client-details.html?id=${order.clientIndex}" class="text-blue-400 hover:text-blue-300">${order.clientName}</a>`;
        document.getElementById("order-date-detail").textContent = order.orderDate;
        document.getElementById("order-finish-date-detail").textContent = order.finishDate || "N/A";
        document.getElementById("order-description-detail").textContent = order.description || "N/A";
        document.getElementById("order-cost-detail").textContent = order.cost || 0;

        const orderImagesDetail = document.getElementById("order-images-detail");
        orderImagesDetail.innerHTML = "";
        (order.images || []).forEach(img => {
            const imgElement = document.createElement("img");
            imgElement.src = img;
            imgElement.className = "w-20 h-20 object-cover rounded cursor-pointer";
            imgElement.addEventListener("click", () => {
                const lightbox = document.getElementById("lightbox");
                const lightboxImage = document.getElementById("lightbox-image");
                lightboxImage.src = img;
                lightbox.classList.remove("hidden");
            });
            orderImagesDetail.appendChild(imgElement);
        });

        viewOrderDetails.classList.remove("hidden");
        editOrderForm.classList.add("hidden");
        orderDetailsModal.classList.remove("hidden");

        editOrderBtn.addEventListener("click", showEditForm, { once: true });
    }

    function showEditForm() {
        document.getElementById("edit-order-name").value = currentOrder.orderName;
        document.getElementById("edit-order-date").value = currentOrder.orderDate;
        document.getElementById("edit-order-finish-date").value = currentOrder.finishDate || "";
        document.getElementById("edit-order-description").value = currentOrder.description || "";
        document.getElementById("edit-order-cost").value = currentOrder.cost || 0;

        const previewContainer = document.getElementById("edit-order-images-preview");
        previewContainer.innerHTML = "";
        (currentOrder.images || []).forEach((img, index) => {
            const imgWrapper = document.createElement("div");
            imgWrapper.className = "relative";
            imgWrapper.innerHTML = `
                <img src="${img}" class="w-20 h-20 object-cover rounded">
                <button type="button" class="absolute top-0 right-0 text-red-500 hover:text-red-700 bg-gray-800 rounded-full w-5 h-5 flex items-center justify-center" data-index="${index}">✕</button>
            `;
            previewContainer.appendChild(imgWrapper);

            imgWrapper.querySelector("button").addEventListener("click", () => {
                currentOrder.images.splice(index, 1);
                showEditForm();
            });
        });

        viewOrderDetails.classList.add("hidden");
        editOrderForm.classList.remove("hidden");

        cancelEditBtn.addEventListener("click", () => {
            showOrderDetails(currentOrder);
        }, { once: true });

        saveEditBtn.addEventListener("click", () => {
            saveEditedOrder();
        }, { once: true });
    }

    async function saveEditedOrder() {
        const clientIndex = currentOrder.clientIndex;
        const orderIndex = clients[clientIndex].orders.findIndex(order => 
            order.orderName === currentOrder.orderName && 
            order.orderDate === currentOrder.orderDate
        );

        const files = document.getElementById("edit-order-images").files;
        const readerPromises = [];
        for (let file of files) {
            const reader = new FileReader();
            readerPromises.push(new Promise((resolve) => {
                reader.onload = () => resolve(reader.result);
                reader.readAsDataURL(file);
            }));
        }

        Promise.all(readerPromises).then(async (imageData) => {
            const updatedOrder = {
                orderName: document.getElementById("edit-order-name").value,
                orderDate: document.getElementById("edit-order-date").value,
                finishDate: document.getElementById("edit-order-finish-date").value || "",
                description: document.getElementById("edit-order-description").value || "",
                images: imageData.length > 0 ? [...(currentOrder.images || []), ...imageData] : currentOrder.images,
                cost: parseFloat(document.getElementById("edit-order-cost").value) || 0
            };

            clients[clientIndex].orders[orderIndex] = updatedOrder;
            await saveClients(clients);
            currentOrder = updatedOrder;
            showOrderDetails(currentOrder);
        });
    }

    closeOrderDetailsModal.addEventListener("click", () => {
        orderDetailsModal.classList.add("hidden");
    });

    const lightbox = document.getElementById("lightbox");
    if (lightbox) {
        const closeLightbox = document.getElementById("close-lightbox");
        closeLightbox.addEventListener("click", () => {
            lightbox.classList.add("hidden");
        });
        lightbox.addEventListener("click", (e) => {
            if (e.target === lightbox) {
                lightbox.classList.add("hidden");
            }
        });
    }

    renderOrders();
});