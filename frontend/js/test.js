const button = document.getElementById("btn");
const result = document.getElementById("result");

button.addEventListener("click", async () => {
    try {
        const response = await fetch("http://localhost:5000/message");

        const data = await response.text();

        result.textContent = data;

    } catch (error) {
        console.error(error);
        result.textContent = "Something went wrong.";
    }
});