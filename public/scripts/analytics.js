document.addEventListener("DOMContentLoaded", async () => {
    const settings = getSettings();
    applyTheme(settings.darkMode);

    console.log("Pagina Analize încărcată.");
    let clients = await getClients();

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

    if (!clients || clients.length === 0) {
        console.warn("Nu există clienți. Adăugăm date de test.");
        clients = [
            { name: "Client 1", status: "Activ", orders: [{ orderName: "Comanda 1", orderDate: "2024-03-15", cost: 100 }] },
            { name: "Client 2", status: "Inactiv", orders: [{ orderName: "Comanda 2", orderDate: "2024-07-20", cost: 150 }] },
            { name: "Client 3", status: "Activ", orders: [
                { orderName: "Comanda 3", orderDate: "2024-12-10", cost: 200 },
                { orderName: "Comanda 4", orderDate: "2025-02-10", cost: 300 }
            ]}
        ];
        await saveClients(clients);
        clients = await getClients();
    }

    const isDarkMode = settings.darkMode;
    const textColor = isDarkMode ? "#a0aeca" : "#111827";

    const mainContent = document.querySelector(".main-content");
    const filterDiv = document.createElement("div");
    filterDiv.className = "mb-6";
    filterDiv.innerHTML = `
        <label for="year-filter" class="block text-gray-300 font-medium mb-2">Filtrează după an:</label>
        <select id="year-filter" class="p-2 border rounded-lg bg-gray-800 text-white border-gray-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-40">
            <option value="all">Toți anii</option>
        </select>
    `;
    mainContent.insertBefore(filterDiv, mainContent.querySelector(".grid"));

    const yearFilter = document.getElementById("year-filter");

    const years = new Set();
    clients.forEach(client => {
        (client.orders || []).forEach(order => {
            if (order.orderDate) {
                const year = new Date(order.orderDate).getFullYear();
                if (!isNaN(year)) years.add(year);
            }
        });
    });
    years.forEach(year => {
        const option = document.createElement("option");
        option.value = year;
        option.textContent = year;
        yearFilter.appendChild(option);
    });

    const ctxClients = document.getElementById("clientsChart").getContext("2d");
    if (!ctxClients) {
        console.error("Canvas clientsChart nu a fost găsit!");
        return;
    }
    const clientsChart = new Chart(ctxClients, {
        type: "pie",
        data: {
            labels: ["Clienți Activi", "Clienți Inactivi"],
            datasets: [{
                data: [],
                backgroundColor: ["#10b981", "#ef4444"],
                borderColor: isDarkMode ? ["#1e293b", "#1e293b"] : ["#d1d5db", "#d1d5db"],
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            aspectRatio: 1.5,
            plugins: {
                legend: { position: "bottom", labels: { color: textColor, font: { size: 14 } } },
                title: { display: true, text: "Distribuția Clienților", color: isDarkMode ? "#e2e8f0" : "#111827", font: { size: 16 } }
            }
        }
    });

    const ctxOrders = document.getElementById("ordersByMonthYearChart").getContext("2d");
    if (!ctxOrders) {
        console.error("Canvas ordersByMonthYearChart nu a fost găsit!");
        return;
    }
    const ordersByMonthYearChart = new Chart(ctxOrders, {
        type: "bar",
        data: { labels: [], datasets: [{ label: "Număr de comenzi", data: [], backgroundColor: "#3b82f6", borderColor: isDarkMode ? "#1e293b" : "#d1d5db", borderWidth: 1 }] },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            aspectRatio: 2,
            plugins: { 
                legend: { display: false }, 
                title: { display: true, text: "Total Comenzi pe Lună/An", color: isDarkMode ? "#e2e8f0" : "#111827", font: { size: 16 } }
            },
            scales: { 
                y: { beginAtZero: true, ticks: { color: textColor, stepSize: 50 } }, 
                x: { ticks: { color: textColor, font: { size: 10, weight: 'bold' }, maxRotation: 45, minRotation: 45 } }
            }
        }
    });

    const ctxTrend = document.getElementById("ordersTrendChart").getContext("2d");
    if (!ctxTrend) {
        console.error("Canvas ordersTrendChart nu a fost găsit!");
        return;
    }
    const ordersTrendChart = new Chart(ctxTrend, {
        type: "line",
        data: { labels: [], datasets: [{ label: "Evoluția Comenzilor", data: [], fill: false, borderColor: "#ef4444", tension: 0.1, borderWidth: 2, pointRadius: 3, pointBackgroundColor: "#ef4444" }] },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            aspectRatio: 2,
            plugins: { 
                legend: { display: true }, 
                title: { display: true, text: "Evoluția Comenzilor în Timp", color: isDarkMode ? "#e2e8f0" : "#111827", font: { size: 16 } }
            },
            scales: { 
                y: { beginAtZero: true, ticks: { color: textColor, stepSize: 50 } }, 
                x: { ticks: { color: textColor, font: { size: 10, weight: 'bold' }, maxRotation: 45, minRotation: 45 } }
            }
        }
    });

    function updateCharts(selectedYear = "all") {
        const activeClients = clients.filter(c => c.status === "Activ").length;
        const inactiveClients = clients.filter(c => c.status === "Inactiv").length;

        const orders = [];
        clients.forEach(client => {
            (client.orders || []).forEach(order => {
                if (order.orderDate && order.orderDate.match(/^\d{4}-\d{2}-\d{2}$/)) {
                    const date = new Date(order.orderDate);
                    if (!isNaN(date.getTime())) {
                        if (selectedYear === "all" || date.getFullYear().toString() === selectedYear) {
                            orders.push({ year: date.getFullYear(), month: date.getMonth() });
                        }
                    }
                }
            });
        });

        const ordersByMonthYear = {};
        orders.forEach(order => {
            const key = `${new Date(order.year, order.month).toLocaleString('ro', { month: 'short' }).toLowerCase()} ${order.year}`;
            ordersByMonthYear[key] = (ordersByMonthYear[key] || 0) + 1;
        });

        let labels = [];
        if (selectedYear === "all") {
            const allYears = Array.from(years).sort();
            allYears.forEach(year => {
                for (let month = 0; month < 12; month++) {
                    labels.push(`${new Date(year, month).toLocaleString('ro', { month: 'short' }).toLowerCase()} ${year}`);
                }
            });
        } else {
            for (let month = 0; month < 12; month++) {
                labels.push(`${new Date(selectedYear, month).toLocaleString('ro', { month: 'short' }).toLowerCase()} ${selectedYear}`);
            }
        }

        const data = labels.map(label => ordersByMonthYear[label] || 0);

        clientsChart.data.datasets[0].data = [activeClients, inactiveClients];
        clientsChart.update();

        ordersByMonthYearChart.data.labels = labels;
        ordersByMonthYearChart.data.datasets[0].data = data;
        ordersByMonthYearChart.update();

        ordersTrendChart.data.labels = labels;
        ordersTrendChart.data.datasets[0].data = data;
        ordersTrendChart.update();
    }

    yearFilter.addEventListener("change", () => updateCharts(yearFilter.value));
    updateCharts();
});