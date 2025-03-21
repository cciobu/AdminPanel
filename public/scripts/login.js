document.addEventListener("DOMContentLoaded", () => {
    applyTheme(getSettings().darkMode);
    particlesJS.load("particles-js", "particles.json");

    const form = document.getElementById("login-form");
    form.addEventListener("submit", async (e) => {
        e.preventDefault();
        const email = document.getElementById("email").value;
        const password = document.getElementById("password").value;

        try {
            const response = await fetch("http://localhost:3000/api/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password })
            });
            const data = await response.json();
            if (response.ok) {
                localStorage.setItem("token", data.token);
                localStorage.setItem("companyId", data.companyId);
                window.location.href = "index.html";
            } else {
                alert(data.message || "Eroare la logare!");
            }
        } catch (error) {
            console.error("Eroare:", error);
            alert("A apărut o problemă la conectarea cu serverul!");
        }
    });
});