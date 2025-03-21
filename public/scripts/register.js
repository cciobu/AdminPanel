document.addEventListener("DOMContentLoaded", () => {
    applyTheme(getSettings().darkMode);
    particlesJS.load("particles-js", "particles.json");

    const form = document.getElementById("register-form");
    form.addEventListener("submit", async (e) => {
        e.preventDefault();
        const companyName = document.getElementById("company-name").value;
        const email = document.getElementById("email").value;
        const password = document.getElementById("password").value;

        try {
            const response = await fetch("http://localhost:3000/api/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name: companyName, email, password })
            });
            const data = await response.json();
            if (response.ok) {
                alert("Companie înregistrată cu succes! Te poți loga acum.");
                window.location.href = "login.html";
            } else {
                alert(data.message || "Eroare la înregistrare!");
            }
        } catch (error) {
            console.error("Eroare:", error);
            alert("A apărut o problemă la conectarea cu serverul!");
            
        }
        
    });
});