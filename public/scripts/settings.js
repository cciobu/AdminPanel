document.addEventListener("DOMContentLoaded", () => {
    console.log("Pagina Setări încărcată.");

    const darkModeToggle = document.getElementById("dark-mode-toggle");
    const resetDataBtn = document.getElementById("reset-data-btn");

    function getSettings() {
        return JSON.parse(localStorage.getItem("settings")) || { darkMode: true };
    }

    function saveSettings(settings) {
        localStorage.setItem("settings", JSON.stringify(settings));
    }

    const settings = getSettings();
    darkModeToggle.checked = settings.darkMode;
    applyTheme(settings.darkMode);

    darkModeToggle.addEventListener("change", () => {
        const isDark = darkModeToggle.checked;
        settings.darkMode = isDark;
        saveSettings(settings);
        applyTheme(isDark);
    });

    resetDataBtn.addEventListener("click", async () => {
        if (confirm("Sigur vrei să resetezi toate datele? Această acțiune nu poate fi anulată.")) {
            const token = localStorage.getItem("token");
            await fetch("http://localhost:3000/api/clients/reset", {
                method: "DELETE",
                headers: { "Authorization": `Bearer ${token}` }
            });
            alert("Datele au fost resetate cu succes!");
        }
    });
});