export const commands = [
  'head scan',
]

export const description = `diagnose potential performance issues in your page's tags`

export default function () {
  const ct = document.createElement("link");
  ct.rel = "stylesheet";
  ct.href = "https://csswizardry.com/ct/ct.css";
  ct.classList.add("ct");
  document.head.appendChild(ct);
}