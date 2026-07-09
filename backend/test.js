const button = document.getElementById("btn");
const result = document.getElementById("result");

button.addEventListener("click", async () => {

    const response = await fetch("http://localhost:5000/message");

    const data = await response.text();

    result.textContent = data;

});