
$('.mostrarHorario').on('click', function () {
  $('.horarios').toggle('slow');
});

function updateCountdown() {
  const now = new Date();
  const nextMidnight = new Date();
  nextMidnight.setHours(24, 0, 0, 0); // Próxima meia-noite

  const diff = nextMidnight - now;

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);

  // document.getElementById("days").textContent = String(days).padStart(2, "0");
  // document.getElementById("hours").textContent = String(hours).padStart(2, "0");
  // document.getElementById("minutes").textContent = String(minutes).padStart(2, "0");
  // document.getElementById("seconds").textContent = String(seconds).padStart(2, "0");

  document.querySelectorAll("#minutes").forEach(el => el.textContent = String(minutes).padStart(2, "0"));
  document.querySelectorAll("#seconds").forEach(el => el.textContent = String(seconds).padStart(2, "0"));
}

// Atualiza o contador a cada segundo
setInterval(updateCountdown, 1000);

// Inicializa o contador
updateCountdown();