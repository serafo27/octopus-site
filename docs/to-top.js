// The back-to-top button: shown once the page is scrolled past the first screen.
(() => {
  const button = document.createElement("button");
  button.className = "to-top";
  button.type = "button";
  button.setAttribute("aria-label", "Back to top");
  button.innerHTML =
    '<svg aria-hidden="true" viewBox="0 0 16 16" width="18" height="18"><path fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" d="M8 13V3M3.5 7.5 8 3l4.5 4.5"/></svg>';
  button.addEventListener("click", () => window.scrollTo({ top: 0 }));
  document.body.append(button);
  const update = () => button.classList.toggle("shown", window.scrollY > window.innerHeight * 0.8);
  window.addEventListener("scroll", update, { passive: true });
  update();
})();
