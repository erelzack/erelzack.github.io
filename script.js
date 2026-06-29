const helloButton = document.querySelector("#helloButton");
const message = document.querySelector("#message");

helloButton.addEventListener("click", () => {
  message.textContent = "Your JavaScript is working!!!";
});
