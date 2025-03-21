const express = require("express");
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const cors = require("cors");
const app = express();

app.use(express.json());
app.use(cors());

// Înlocuiește cu connection string-ul tău corect
mongoose.connect("mongodb+srv://cristian:ck183461@admin-panel.krzqf.mongodb.net/?retryWrites=true&w=majority&appName=Admin-Panel", {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => console.log("Conectat la MongoDB"))
  .catch(err => console.error("Eroare MongoDB:", err));

const CompanySchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
});
const Company = mongoose.model("Company", CompanySchema);

const ClientSchema = new mongoose.Schema({
    companyId: { type: mongoose.Schema.Types.ObjectId, ref: "Company", required: true },
    name: String,
    email: String,
    phone: String,
    status: { type: String, default: "Activ" },
    orders: [{
        orderName: String,
        orderDate: String,
        finishDate: String,
        description: String,
        images: [String],
        cost: Number
    }]
});
const Client = mongoose.model("Client", ClientSchema);

app.post("/api/register", async (req, res) => {
    const { name, email, password } = req.body;
    try {
        const existingCompany = await Company.findOne({ email });
        if (existingCompany) {
            return res.status(400).json({ message: "Email-ul este deja folosit!" });
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        const company = new Company({ name, email, password: hashedPassword });
        await company.save();
        res.status(201).json({ message: "Companie înregistrată cu succes!" });
    } catch (error) {
        console.error("Eroare la înregistrare - Detalii:", error.stack);
        res.status(500).json({ message: "Eroare la înregistrare!", error: error.message });
    }
});

app.post("/api/login", async (req, res) => {
    const { email, password } = req.body;
    try {
        const company = await Company.findOne({ email });
        if (!company || !await bcrypt.compare(password, company.password)) {
            return res.status(401).json({ message: "Credențiale invalide!" });
        }
        const token = jwt.sign({ id: company._id }, "secret_key", { expiresIn: "1h" });
        res.json({ token, companyId: company._id });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Eroare la logare!" });
    }
});

const authenticate = (req, res, next) => {
    const token = req.headers["authorization"]?.split(" ")[1];
    if (!token) return res.status(401).json({ message: "Autentificare necesară!" });
    try {
        const decoded = jwt.verify(token, "secret_key");
        req.companyId = decoded.id;
        next();
    } catch (error) {
        res.status(401).json({ message: "Token invalid!" });
    }
};

app.get("/api/clients", authenticate, async (req, res) => {
    try {
        const clients = await Client.find({ companyId: req.companyId });
        res.json(clients);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Eroare la obținerea clienților!" });
    }
});

app.post("/api/client", authenticate, async (req, res) => {
    try {
        const client = { ...req.body, companyId: req.companyId };
        const newClient = new Client(client);
        await newClient.save();
        res.status(201).json({ message: "Client adăugat!", client: newClient });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Eroare la adăugarea clientului!" });
    }
});

app.put("/api/client/:id", authenticate, async (req, res) => {
    try {
        const clientId = req.params.id;
        const updatedClient = { ...req.body, companyId: req.companyId };
        const client = await Client.findOneAndUpdate(
            { _id: clientId, companyId: req.companyId },
            updatedClient,
            { new: true }
        );
        if (!client) {
            return res.status(404).json({ message: "Clientul nu a fost găsit!" });
        }
        res.json({ message: "Client actualizat!", client });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Eroare la actualizarea clientului!" });
    }
});

app.delete("/api/client/:id", authenticate, async (req, res) => {
    try {
        const clientId = req.params.id;
        const client = await Client.findOneAndDelete({ _id: clientId, companyId: req.companyId });
        if (!client) {
            return res.status(404).json({ message: "Clientul nu a fost găsit!" });
        }
        res.json({ message: "Client șters!" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Eroare la ștergerea clientului!" });
    }
});

app.post("/api/clients", authenticate, async (req, res) => {
    try {
        const clients = req.body.map(client => ({ ...client, companyId: req.companyId }));
        await Client.deleteMany({ companyId: req.companyId });
        await Client.insertMany(clients);
        res.status(201).json({ message: "Clienți salvați!" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Eroare la salvarea clienților!" });
    }
});

app.delete("/api/clients/reset", authenticate, async (req, res) => {
    try {
        await Client.deleteMany({ companyId: req.companyId });
        res.json({ message: "Datele au fost resetate!" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Eroare la resetarea datelor!" });
    }
});

app.listen(3000, () => console.log("Server pornit pe port 3000"));