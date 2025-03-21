particlesJS("particles-js", {
    particles: {
        number: { value: 80, density: { enable: true, value_area: 800 } },
        color: { value: "#3b82f6" },
        shape: { type: "circle" },
        opacity: { value: 0.5, random: true },
        size: { value: 3, random: true },
        line_linked: { enable: true, distance: 150, color: "#9333ea", opacity: 0.4, width: 1 },
        move: { enable: true, speed: 2, direction: "none", random: false, straight: false, out_mode: "out" }
    },
    interactivity: { detect_on: "canvas", events: { onhover: { enable: true, mode: "repulse" }, onclick: { enable: true, mode: "push" } } },
    retina_detect: true
});

function getSettings() {
    return JSON.parse(localStorage.getItem("settings")) || { darkMode: true };
}

function saveSettings(settings) {
    localStorage.setItem("settings", JSON.stringify(settings));
}

function applyTheme(isDark) {
    if (isDark) {
        document.body.classList.remove("light-mode");
        document.body.classList.add("dark-mode");
    } else {
        document.body.classList.remove("dark-mode");
        document.body.classList.add("light-mode");
    }
}

function checkAuth() {
    const token = localStorage.getItem("token");
    const currentPage = window.location.pathname.split("/").pop() || "index.html";
    if (!token && currentPage !== "login.html" && currentPage !== "register.html") {
        window.location.href = "login.html";
    }
}

const settings = getSettings();
applyTheme(settings.darkMode);
checkAuth();

window.getSettings = getSettings;
window.saveSettings = saveSettings;
window.applyTheme = applyTheme;

document.addEventListener("DOMContentLoaded", () => {
    const sidebar = document.querySelector(".sidebar");
    const hamburger = document.querySelector(".hamburger");
    const sidebarLinks = document.querySelectorAll(".sidebar-item a");

    if (sidebar && hamburger && sidebarLinks.length > 0) {
        if (window.innerWidth <= 768) {
            sidebar.classList.remove("open");
            sidebar.style.width = "";
        }

        hamburger.addEventListener("click", (e) => {
            e.stopPropagation();
            sidebar.classList.toggle("open");
        });

        sidebarLinks.forEach(link => {
            link.addEventListener("click", (e) => {
                e.preventDefault();
                const href = link.getAttribute("href");
                if (window.innerWidth <= 768) {
                    sidebar.classList.remove("open");
                    setTimeout(() => window.location.href = href, 300);
                } else {
                    window.location.href = href;
                }
            });
        });

        document.addEventListener("click", (e) => {
            if (!sidebar.contains(e.target) && !hamburger.contains(e.target) && sidebar.classList.contains("open")) {
                sidebar.classList.remove("open");
            }
        });

        window.addEventListener("resize", () => {
            if (window.innerWidth > 768 && sidebar.classList.contains("open")) {
                sidebar.classList.remove("open");
            }
        });

        const sidebarItems = document.querySelectorAll(".sidebar-item");
        const currentPage = window.location.pathname.split("/").pop() || "index.html";
        sidebarItems.forEach(item => {
            const link = item.querySelector("a");
            if (link && link.getAttribute("href") === currentPage) {
                item.classList.add("bg-blue-700", "font-semibold");
            } else {
                item.classList.remove("bg-blue-700", "font-semibold");
            }
        });

        const logoutItem = document.createElement("div");
        logoutItem.className = "sidebar-item p-4 hover:bg-gray-700 cursor-pointer";
        logoutItem.innerHTML = `<a href="#" class="flex items-center space-x-2"><svg class="w-5 h-5" fill="currentColor"><path d="M16 17v-2H9V9h7V7l5 5-5 5zM14 2H4a2 2 0 00-2 2v16a2 2 0 002 2h10V2z"/></svg><span>Logout</span></a>`;
        sidebar.appendChild(logoutItem);
        logoutItem.addEventListener("click", () => {
            localStorage.removeItem("token");
            localStorage.removeItem("companyId");
            window.location.href = "login.html";
        });
    }
});