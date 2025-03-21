document.addEventListener("DOMContentLoaded", async () => {
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

    const settings = getSettings();
    applyTheme(settings.darkMode);
    const urlParams = new URLSearchParams(window.location.search);
    const clientIndex = parseInt(urlParams.get("id"), 10);
    let clients = await getClients();
    const client = clients[clientIndex];
    let editOrderIndex = null;

    if (!client) {
        alert("Clientul nu a fost găsit!");
        window.location.href = "clients.html";
        return;
    }

    document.getElementById("client-name").textContent = client.name;
    document.getElementById("client-name-detail").textContent = client.name;
    document.getElementById("client-email").textContent = client.email || "N/A";
    document.getElementById("client-phone").textContent = client.phone || "N/A";
    const statusEl = document.getElementById("client-status");
    statusEl.textContent = client.status;
    statusEl.className = client.status === "Activ" ? "status-active text-green-600" : "status-inactive text-red-600";

    const ordersList = document.getElementById("orders-list");
    function renderOrders() {
        ordersList.innerHTML = "";
        let totalCost = 0;
        (client.orders || []).forEach((order, index) => {
            totalCost += order.cost || 0;
            const orderDiv = document.createElement("div");
            orderDiv.className = "order-item p-3 bg-gray-900 border border-blue-600 rounded-lg shadow-sm flex items-center justify-between cursor-pointer";
            orderDiv.innerHTML = `
                <div class="flex items-center space-x-2">
                    <div class="flex space-x-1">
                        ${(order.images || []).map(img => `<img src="${img}" class="w-8 h-8 object-cover rounded cursor-pointer order-image" alt="Imagine comandă" data-src="${img}" data-index="${index}">`).join("")}
                    </div>
                    <div class="min-w-0">
                        <h4 class="text-sm font-medium text-white truncate max-w-[150px]">${order.orderName}</h4>
                        <p class="text-xs text-gray-400 truncate max-w-[150px]">${order.orderDate} - ${order.finishDate || "N/A"}</p>
                    </div>
                </div>
                <div class="flex items-center space-x-1">
                    <p class="text-xs text-gray-400">Cost: ${order.cost || 0} lei</p>
                    <button class="edit-order-btn text-blue-400 hover:text-blue-500 text-xs px-2 py-1 bg-transparent border border-blue-600 rounded-lg" data-index="${index}">Editează</button>
                    <button class="delete-order-btn text-red-400 hover:text-red-500 text-xs px-1 py-0.5 bg-transparent border border-red-600 rounded-lg" data-index="${index}">Șterge</button>
                </div>
            `;
            ordersList.appendChild(orderDiv);

            orderDiv.addEventListener("click", (e) => {
                if (!e.target.classList.contains("edit-order-btn") && !e.target.classList.contains("delete-order-btn") && !e.target.classList.contains("order-image")) {
                    showOrderDetails(order, index);
                }
            });
        });

        const totalDiv = document.createElement("div");
        totalDiv.className = "mt-4 text-sm text-gray-300";
        totalDiv.textContent = `Total câștigat de pe client: ${totalCost} lei`;
        ordersList.appendChild(totalDiv);

        ordersList.querySelectorAll(".edit-order-btn").forEach(btn => {
            btn.addEventListener("click", () => editOrder(btn.dataset.index));
        });
        ordersList.querySelectorAll(".delete-order-btn").forEach(btn => {
            btn.addEventListener("click", () => deleteOrder(btn.dataset.index));
        });

        ordersList.querySelectorAll(".order-image").forEach(img => {
            img.addEventListener("click", () => {
                const lightbox = document.getElementById("lightbox");
                const lightboxImage = document.getElementById("lightbox-image");
                lightboxImage.src = img.dataset.src;
                lightbox.classList.remove("hidden");
            });
        });
    }
    renderOrders();

    const addOrderBtn = document.getElementById("add-order-btn");
    const orderModal = document.getElementById("order-modal");
    const orderModalTitle = document.getElementById("order-modal-title");
    const orderForm = document.getElementById("order-form");
    const closeOrderModal = document.getElementById("close-order-modal");
    const orderNameInput = document.getElementById("order-name");
    const orderDateInput = document.getElementById("order-date");
    const orderFinishDateInput = document.getElementById("order-finish-date");
    const orderDescriptionInput = document.getElementById("order-description");
    const orderImagesInput = document.getElementById("order-images");
    const orderCostInput = document.getElementById("order-cost");

    addOrderBtn.addEventListener("click", () => {
        orderModalTitle.textContent = "Adaugă Comandă";
        orderForm.reset();
        editOrderIndex = null;
        orderModal.classList.remove("hidden");
    });

    closeOrderModal.addEventListener("click", () => {
        orderModal.classList.add("hidden");
    });

    orderForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        if (!orderNameInput.value || !orderDateInput.value) {
            alert("Numele comenzii și data comenzii sunt obligatorii!");
            return;
        }

        const files = orderImagesInput.files;
        const readerPromises = [];
        if (files.length > 0) {
            for (let file of files) {
                const reader = new FileReader();
                readerPromises.push(new Promise((resolve, reject) => {
                    reader.onload = () => resolve(reader.result);
                    reader.onerror = () => reject("Eroare la citirea imaginii");
                    reader.readAsDataURL(file);
                }));
            }
        }

        Promise.all(readerPromises)
            .then(async (imageData) => {
                const newOrder = {
                    orderName: orderNameInput.value,
                    orderDate: orderDateInput.value,
                    finishDate: orderFinishDateInput.value || "",
                    description: orderDescriptionInput.value || "",
                    images: imageData.length > 0 ? imageData : (editOrderIndex !== null && client.orders[editOrderIndex] ? client.orders[editOrderIndex].images : []),
                    cost: parseFloat(orderCostInput.value) || 0
                };

                client.orders = client.orders || [];
                if (editOrderIndex === null) {
                    client.orders.push(newOrder);
                } else {
                    client.orders[editOrderIndex] = newOrder;
                    editOrderIndex = null;
                }

                clients[clientIndex] = client;
                await saveClients(clients);
                clients = await getClients();
                renderOrders();
                orderModal.classList.add("hidden");
            })
            .catch((error) => {
                console.error("Eroare la procesarea imaginilor:", error);
                alert("A apărut o eroare la salvarea comenzii!");
            });
    });

    function editOrder(index) {
        editOrderIndex = parseInt(index);
        const order = client.orders[editOrderIndex];
        if (!order) return;
        orderNameInput.value = order.orderName;
        orderDateInput.value = order.orderDate;
        orderFinishDateInput.value = order.finishDate || "";
        orderDescriptionInput.value = order.description || "";
        orderCostInput.value = order.cost || "";
        orderModalTitle.textContent = "Editează Comandă";
        orderModal.classList.remove("hidden");
    }

    async function deleteOrder(index) {
        if (confirm("Sigur vrei să ștergi această comandă?")) {
            client.orders.splice(index, 1);
            clients[clientIndex] = client;
            await saveClients(clients);
            clients = await getClients();
            renderOrders();
        }
    }

    function showOrderDetails(order, index) {
        document.getElementById("order-name-detail").textContent = order.orderName;
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

        document.getElementById("order-details-modal").classList.remove("hidden");
    }

    document.getElementById("close-order-details-modal").addEventListener("click", () => {
        document.getElementById("order-details-modal").classList.add("hidden");
    });

    const lightbox = document.getElementById("lightbox");
    const closeLightbox = document.getElementById("close-lightbox");
    closeLightbox.addEventListener("click", () => {
        lightbox.classList.add("hidden");
    });
    lightbox.addEventListener("click", (e) => {
        if (e.target === lightbox) {
            lightbox.classList.add("hidden");
        }
    });
});