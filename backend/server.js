const express = require("express");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());

const PORT = 5000;

app.get("/", (req, res) => {
    res.send("THIS IS THE CORRECT SERVER");
});

app.get("/message", (req, res) => {
    res.send("Hello from the backend!");
});

app.post("/signup", (req, res) => {

    console.log(req.body);

    res.send("Data received successfully!");

});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});