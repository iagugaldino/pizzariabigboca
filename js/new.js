// Classe para gerenciar os prêmios da roleta
class PrizeManager {
  constructor(prizes) {
    this.prizes = prizes || [];
    this.blockedPrizes = ['Combo Casal gratuito']; // Prêmios que nunca devem ser sorteados
  }

  // Adicionar um prêmio à lista de bloqueados
  blockPrize(prizeName) {
    if (!this.blockedPrizes.includes(prizeName)) {
      this.blockedPrizes.push(prizeName);
    }
  }

  // Remover um prêmio da lista de bloqueados
  unblockPrize(prizeName) {
    this.blockedPrizes = this.blockedPrizes.filter(name => name !== prizeName);
  }

  // Obter um prêmio aleatório, excluindo os bloqueados
  getRandomPrize() {
    // Filtra os prêmios bloqueados
    const allowedPrizes = this.prizes.filter(prize => !this.blockedPrizes.includes(prize.name));

    // Retorna um prêmio aleatório entre os disponíveis
    if (allowedPrizes.length > 0) {
      const index = Math.floor(Math.random() * allowedPrizes.length);
      return allowedPrizes[index];
    }

    // Fallback caso todos os prêmios estejam bloqueados
    return { name: 'Tente Novamente', icon: '', color: '#222222' };
  }

  // Bloquear o último elemento da lista de prêmios
  blockLastPrize() {
    if (this.prizes.length > 0) {
      const lastPrize = this.prizes[this.prizes.length - 1];
      this.blockPrize(lastPrize.name);
    }
  }

  // Obter índice de um prêmio na lista completa
  getPrizeIndex(prizeName) {
    return this.prizes.findIndex(prize => prize.name === prizeName);
  }
}

// Classe para gerenciar a roleta
class RouletteManager {
  constructor(config) {
    this.prizeManager = new PrizeManager(config.prizes);
    this.elements = this.initElements();
    this.state = {
      isSpinning: false,
      currentRotation: 0,
      resizeTimer: null
    };

    // Bloquear o último prêmio conforme solicitado
    this.prizeManager.blockLastPrize();

    this.initialize();
  }

  // Inicializa os elementos do DOM
  initElements() {
    return {
      rouletteModal: document.getElementById('roulette-modal-container'),
      wheel: document.getElementById('wheel'),
      spinButton: document.getElementById('spin-button'),
      prizeModal: document.getElementById('prize-modal'),
      prizeModalTitle: document.getElementById('prize-modal-title'),
      prizeWonText: document.getElementById('prize-won-text'),
      collectPrizeBtn: document.getElementById('collect-prize-btn'),
      closeRouletteBtn: document.getElementById('close-roulette-modal-btn'),
      toast: document.getElementById('toast'),
      toastDescription: document.getElementById('toast-description'),
      confettiContainer: document.getElementById('confetti-container')
    };
  }

  // Inicializa os eventos da roleta
  initialize() {
    if (!this.validateElements()) {
      console.error("Elementos essenciais da roleta não encontrados!");
      return;
    }

    // Configura eventos para fechar o modal
    if (this.elements.closeRouletteBtn) {
      this.elements.closeRouletteBtn.addEventListener('click', () => {
        this.elements.rouletteModal.style.display = 'none';
        this.resetWheelState();
      });
    }

    // Fecha o modal da roleta clicando fora
    this.elements.rouletteModal.addEventListener('click', (event) => {
      if (event.target === this.elements.rouletteModal) {
        this.elements.rouletteModal.style.display = 'none';
        this.resetWheelState();
      }
    });

    // Configura os eventos para girar e coletar prêmio
    this.elements.spinButton.addEventListener('click', () => this.spinWheel());

    if (this.elements.collectPrizeBtn) {
      this.elements.collectPrizeBtn.addEventListener('click', () => this.closePrizeModal());

      if (this.elements.closeRouletteBtn) {
        this.elements.closeRouletteBtn.addEventListener('click', () => {
          this.elements.rouletteModal.style.display = 'none';
          this.resetWheelState();
        });
      }
    }

    // Recria a roleta quando a janela é redimensionada
    window.addEventListener('resize', () => {
      clearTimeout(this.state.resizeTimer);
      this.state.resizeTimer = setTimeout(() => {
        if (this.elements.rouletteModal.style.display === 'flex' && !this.state.isSpinning) {
          this.createWheel();
        }
      }, 200);
    });

    // Expõe métodos para uso global
    window.resetWheelState = () => this.resetWheelState();
    window.createWheel = () => this.createWheel();
  }

  // Valida se todos os elementos necessários estão disponíveis
  validateElements() {
    return this.elements.wheel &&
      this.elements.spinButton &&
      this.elements.prizeModal &&
      this.elements.rouletteModal;
  }

  // Cria a roleta com os segmentos e textos
  createWheel() {
    const wheel = this.elements.wheel;
    if (!wheel) return;

    wheel.innerHTML = ''; // Limpa a roleta
    const prizes = this.prizeManager.prizes;
    const segmentAngle = 360 / prizes.length;

    // Cria o fundo da roleta com gradiente cônico
    let gradient = 'conic-gradient(';
    prizes.forEach((prize, index) => {
      const startAngle = index * segmentAngle;
      const endAngle = (index + 1) * segmentAngle;
      gradient += `${prize.color} ${startAngle}deg ${endAngle}deg${index < prizes.length - 1 ? ', ' : ''}`;
    });
    gradient += ')';
    wheel.style.background = gradient;

    // Adiciona os textos dos prêmios em orientação radial
    prizes.forEach((prize, index) => {
      // Ângulo médio do segmento em radianos
      const segmentMidAngle = (index * segmentAngle + segmentAngle / 2) * Math.PI / 180;

      // Cria o elemento de texto
      const text = document.createElement('div');
      text.className = 'segment-text';
      text.innerHTML = `${prize.icon || ''} ${prize.name}`;

      // Posição no círculo - Ajustado para ficar centralizado no segmento
      const wheelRadius = wheel.offsetWidth / 2;
      // Posicionando o texto no meio do raio (50% entre centro e borda)
      const midRadius = wheelRadius * 0.5; // 50% do raio para centralizar o texto

      // Calcula posição X,Y para o meio do segmento
      const midX = midRadius * Math.cos(segmentMidAngle - Math.PI / 2);
      const midY = midRadius * Math.sin(segmentMidAngle - Math.PI / 2);

      // Aplicando a transformação radial
      text.style.transformOrigin = 'center'; // Ponto de origem para a rotação
      text.style.transform = `
        translate(-50%, -50%)
        translate(${midX}px, ${midY}px)
        rotate(${(index * segmentAngle + segmentAngle / 2) - 90}deg)
      `;

      // Ajustando estilos para texto radial centralizado
      text.style.width = '90px'; // Comprimento do texto no raio
      text.style.height = '25px'; // Altura fixa para o texto
      text.style.fontSize = '13px'; // Fonte um pouco maior
      text.style.textAlign = 'center';
      text.style.whiteSpace = 'nowrap'; // Sem quebra de linha em orientação radial
      text.style.display = 'flex';
      text.style.alignItems = 'center';
      text.style.justifyContent = 'center';
      text.style.textWrap = 'wrap';

      wheel.appendChild(text);
    });

    this.adjustTextSizeBasedOnViewport();
  }

  // Ajusta o tamanho do texto baseado no tamanho da tela
  adjustTextSizeBasedOnViewport() {
    const viewportWidth = window.innerWidth;
    const textElements = document.querySelectorAll('.segment-text');

    if (viewportWidth < 400) {
      textElements.forEach(text => {
        text.style.fontSize = '11px';
      });
    } else if (viewportWidth < 600) {
      textElements.forEach(text => {
        text.style.fontSize = '12px';
      });
    } else {
      textElements.forEach(text => {
        text.style.fontSize = '14px';
      });
    }
  }

  // Gira a roleta
  spinWheel() {
    if (this.state.isSpinning || !this.elements.wheel) return;

    this.state.isSpinning = true;
    this.elements.spinButton.disabled = true;
    this.elements.spinButton.textContent = 'Girando...';
    this.elements.spinButton.classList.remove('animate-pulse');

    // Seleciona prêmio aleatório
    const winningPrize = this.prizeManager.getRandomPrize();
    const winningSegmentIndex = this.prizeManager.getPrizeIndex(winningPrize.name);

    // Calcula rotação para o prêmio selecionado
    const segmentAngle = 360 / this.prizeManager.prizes.length;
    const targetAngle = 360 - ((winningSegmentIndex * segmentAngle) + (segmentAngle / 2));
    const randomOffset = (Math.random() - 0.5) * segmentAngle * 0.8; // Variação dentro do segmento
    const fullSpins = 6 + Math.floor(Math.random() * 3); // 6 a 8 rotações completas
    const totalRotation = (fullSpins * 360) + targetAngle + randomOffset;

    // Atualiza rotação atual
    const finalRotation = this.state.currentRotation + totalRotation;
    this.state.currentRotation = finalRotation;

    // Aplica a rotação
    this.elements.wheel.style.transform = `rotate(${finalRotation}deg)`;

    // Após a animação terminar
    setTimeout(() => {
      this.state.isSpinning = false;
      this.elements.spinButton.disabled = false;
      this.elements.spinButton.textContent = 'GIRAR NOVAMENTE!';
      this.elements.spinButton.classList.add('animate-pulse');

      // Mostra prêmio ganho
      this.showToast(`Você ganhou ${winningPrize.name}!`);
      this.createConfetti();

      // Atualiza e mostra o modal de prêmio
      if (this.elements.prizeModalTitle && this.elements.prizeWonText) {
        this.elements.prizeModalTitle.textContent = 'PARABÉNS!';
        this.elements.prizeWonText.innerHTML = `${winningPrize.icon || ''} ${winningPrize.name}`;
        this.showPrizeModal();
      }

      // Salvar informação do prêmio ganho
      this.savePrizeInfo(winningPrize.name);

      // Configura um temporizador para recarregar a página após o modal de prêmio ser exibido
      setTimeout(() => {
        // Apenas recarrega se o modal de prêmio estiver visível
        // Isso permite que o usuário veja a animação e o prêmio antes do reload
        if (this.elements.prizeModal && this.elements.prizeModal.classList.contains('show')) {
          window.location.reload();
        }
      }, 3000); // 3 segundos após exibir o prêmio
    }, 5500);
  }

  // Exibe uma mensagem de toast
  showToast(message) {
    if (!this.elements.toast || !this.elements.toastDescription) return;
    this.elements.toastDescription.textContent = message;
    this.elements.toast.classList.add('show');
    setTimeout(() => this.elements.toast.classList.remove('show'), 4500);
  }

  // Mostra o modal com o prêmio
  showPrizeModal() {
    if (!this.elements.prizeModal) return;
    this.elements.prizeModal.classList.add('show');
  }

  // Fecha o modal do prêmio
  closePrizeModal() {
    if (!this.elements.prizeModal) return;
    this.elements.prizeModal.classList.remove('show');

    // Fechar também o modal da roleta
    if (this.elements.rouletteModal) {
      this.elements.rouletteModal.style.display = 'none';
    }

    // Remover o canvas de confetti
    const confettiCanvas = document.getElementById('confetti-canvas');
    if (confettiCanvas && confettiCanvas.parentNode) {
      confettiCanvas.parentNode.removeChild(confettiCanvas);
    }

    // Mostrar o prêmio na interface principal (opcional)
    this.showPrizeOnMainUI();

    // Recarregar a página para exibir o prêmio no header
    window.location.reload();
  }

  // Reseta o estado da roleta
  resetWheelState() {
    if (this.elements.wheel) {
      this.elements.wheel.style.transition = 'none';
      this.state.currentRotation = this.state.currentRotation % 360; // Mantém apenas a posição atual
      this.elements.wheel.style.transform = `rotate(${this.state.currentRotation}deg)`;
      setTimeout(() => {
        this.elements.wheel.style.transition = 'transform 5.5s cubic-bezier(0.15, 0.75, 0.25, 1)';
      }, 10);
    }

    if (this.elements.spinButton) {
      this.state.isSpinning = false;
      this.elements.spinButton.disabled = false;
      this.elements.spinButton.textContent = 'GIRAR AGORA!';
      this.elements.spinButton.classList.add('animate-pulse');
    }

    this.closePrizeModal();
    if (this.elements.confettiContainer) this.elements.confettiContainer.innerHTML = '';
  }

  // Cria confetti para celebração
  createConfetti() {
    // Verificar se o canvas já existe e removê-lo se necessário
    const existingCanvas = document.getElementById('confetti-canvas');
    if (existingCanvas) {
      existingCanvas.parentNode.removeChild(existingCanvas);
    }

    // Criar e configurar o canvas para o confetti
    const canvas = document.createElement('canvas');
    canvas.id = 'confetti-canvas';
    canvas.style.position = 'fixed';
    canvas.style.top = '0';
    canvas.style.left = '0';
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    canvas.style.pointerEvents = 'none';
    canvas.style.zIndex = '9999';
    document.body.appendChild(canvas);

    // Criar a instância do confetti
    const myConfetti = confetti.create(canvas, {
      resize: true,
      useWorker: true
    });

    // Definir duração e cores
    const duration = 5 * 1000;
    const end = Date.now() + duration;
    const colors = ['#e63946', '#fcbf49', '#f4a261', '#a97c50', '#2a9d8f', '#e9c46a'];

    // Função para disparar confetti
    const frame = () => {
      // Disparar confetti do lado esquerdo
      myConfetti({
        particleCount: 5,
        angle: 60,
        spread: 75,
        origin: { x: 0, y: 0.5 },
        colors: colors,
        shapes: ['circle', 'square'],
        zIndex: 100
      });

      // Disparar confetti do lado direito
      myConfetti({
        particleCount: 5,
        angle: 120,
        spread: 75,
        origin: { x: 1, y: 0.5 },
        colors: colors,
        shapes: ['circle', 'square'],
        zIndex: 100
      });

      // Disparar confetti do topo
      myConfetti({
        particleCount: 3,
        angle: 90,
        spread: 70,
        origin: { x: 0.5, y: 0 },
        colors: colors,
        shapes: ['circle', 'square'],
        zIndex: 100
      });

      // Continuar disparando enquanto estiver dentro da duração
      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    };

    // Iniciar a animação
    frame();

    // Disparar explosão inicial de confetti
    myConfetti({
      particleCount: 150,
      spread: 100,
      origin: { y: 0.6 },
      colors: colors,
      zIndex: 100
    });
  }

  // Salva informações do prêmio ganho
  savePrizeInfo(prizeName) {
    localStorage.setItem('rouletteWon', 'true');
    localStorage.setItem('roulettePrize', prizeName);
    localStorage.setItem('rouletteDate', new Date().toISOString());

    // Também define um cookie como backup
    setCookie('rouletteWon', 'true', 30); // Cookie válido por 30 dias

    // Atualiza o display do prêmio no header, se a função existir
    if (typeof updatePrizeDisplay === 'function') {
      updatePrizeDisplay('#prize-display');
    }
  }

  // Mostra o prêmio na interface principal (opcional)
  showPrizeOnMainUI() {
    const prize = localStorage.getItem('roulettePrize');
    if (prize) {
      // Implementação para mostrar o prêmio na interface principal
      console.log("Prêmio salvo:", prize);
    }
  }
}

// Mapeamento de estados e suas siglas
const estados = {
  "Rondônia": "RO", "Acre": "AC", "Amazonas": "AM", "Roraima": "RR", "Pará": "PA",
  "Amapá": "AP", "Tocantins": "TO", "Maranhão": "MA", "Piauí": "PI", "Ceará": "CE",
  "Rio Grande do Norte": "RN", "Paraíba": "PB", "Pernambuco": "PE", "Alagoas": "AL", "Sergipe": "SE",
  "Bahia": "BA", "Minas Gerais": "MG", "Espírito Santo": "ES", "Rio de Janeiro": "RJ", "São Paulo": "SP",
  "Paraná": "PR", "Santa Catarina": "SC", "Rio Grande do Sul": "RS", "Mato Grosso do Sul": "MS", "Mato Grosso": "MT",
  "Goiás": "GO", "Distrito Federal": "DF"
};

// Funções utilitárias

// Verifica se o usuário já ganhou um prêmio
function checkIfRouletteAlreadyPlayed() {
  const alreadyWon = localStorage.getItem('rouletteWon') === 'true';

  // Também verificar o cookie como backup
  const cookieWon = getCookie('rouletteWon') === 'true';

  return alreadyWon || cookieWon;
}

// Define um cookie
function setCookie(name, value, days) {
  let expires = new Date(Date.now() + days * 864e5).toUTCString();
  document.cookie = `${name}=${value}; expires=${expires}; path=/`;
}

// Obtém o valor de um cookie
function getCookie(name) {
  return document.cookie.split('; ').reduce((acc, cookie) => {
    let [key, val] = cookie.split('=');
    return key === name ? val : acc;
  }, "");
}

// Verifica se um cookie existe
function checkCookie(nome) {
  return getCookie(nome) !== "";
}

const themeColor = '#C11E24';

function setCookie(name, value, days) {
  let expires = new Date(Date.now() + days * 864e5).toUTCString();
  document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/`;
}

function getCookie(name) {
  let value = "; " + document.cookie;
  let parts = value.split(`; ${name}=`);
  if (parts.length === 2) return decodeURIComponent(parts.pop().split(";").shift());
}

function checkCookie(name) {
  return getCookie(name) !== undefined;
}

async function fetchLocation() {
  try {
    let response = await fetch('https://get.geojs.io/v1/ip/geo.json');
    let { city = "Sua Cidade", region = "Seu Estado" } = await response.json();
    return { city, region };
  } catch (error) {
    console.error('Erro ao obter a localização:', error);
    return { city: "Sua Cidade", region: "Seu Estado" };
  }
}

async function atualizarLocalizacao(cidade, estado) {
  const locationDisplay = document.getElementById('location-display');
  if (cidade && estado) {
    locationDisplay.innerHTML = `
                    <i class="fa fa-map-marker-alt" aria-hidden="true"></i>
                    <span>${cidade} - ${estado} • 1,8km de você</span>
                `;
  }
  document.querySelectorAll(".localCidade").forEach(el => el.textContent = cidade);
}
async function escolherLocalizacaoManualmente(detectedRegion) {
  const { value: stateData } = await Swal.fire({
    title: 'Onde você está?',
    text: "Selecione seu estado para continuar.",
    input: 'select',
    inputPlaceholder: 'Selecione o estado',
    confirmButtonText: 'Próximo <i class="fa fa-arrow-right"></i>',
    confirmButtonColor: themeColor,
    allowOutsideClick: false,
    customClass: {
      input: 'select-sem-borda'
    },
    inputOptions: (async () => {
      try {
        const response = await fetch('https://servicodados.ibge.gov.br/api/v1/localidades/estados?orderBy=nome');
        const states = await response.json();
        const options = {};
        states.forEach(state => {
          options[JSON.stringify({ id: state.id, sigla: state.sigla, nome: state.nome })] = `${state.nome} (${state.sigla})`;
        });
        return options;
      } catch (error) { return { error: 'Não foi possível carregar os estados' }; }
    })(),
    preConfirm: (value) => {
      if (!value) { Swal.showValidationMessage('Você precisa selecionar um estado!'); }
      return JSON.parse(value);
    },
    didOpen: () => {
      if (detectedRegion) {
        const select = Swal.getInput();
        for (let i = 0; i < select.options.length; i++) {
          const option = select.options[i];
          if (option.text.includes(detectedRegion)) {
            select.value = option.value;
            break;
          }
        }
      }
    }
  });

  if (stateData) {
    const { value: city } = await Swal.fire({
      title: 'Agora, sua cidade',
      text: `Selecione sua cidade em ${stateData.nome}.`,
      input: 'select',
      inputPlaceholder: 'Selecione a cidade',
      confirmButtonText: 'Confirmar',
      confirmButtonColor: themeColor,
      allowOutsideClick: false,
      inputOptions: (async () => {
        try {
          const response = await fetch(`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${stateData.id}/municipios?orderBy=nome`);
          const cities = await response.json();
          const options = {};
          cities.forEach(city => { options[city.nome] = city.nome; });
          return options;
        } catch (error) { return { error: 'Não foi possível carregar as cidades' }; }
      })(),
      inputValidator: (value) => { if (!value) { return 'Você precisa selecionar uma cidade!' } }
    });

    if (city) {
      Swal.fire({
        title: 'Verificando localização...',
        html: `<div class="flex flex-col items-center"><div class="w-8 h-8 border-4 border-t-red-500 border-gray-200 rounded-full animate-spin"></div><p class="mt-2">Aguarde um momento</p></div>`,
        timer: 2000, showConfirmButton: false, allowOutsideClick: false
      }).then(() => {
        setCookie("localCidade", city, 365);
        setCookie("localEstado", `${stateData.nome} - ${stateData.sigla}`, 365);
        atualizarLocalizacao(city, `${stateData.nome} - ${stateData.sigla}`);
        Swal.fire({
          title: 'Localização confirmada!',
          html: `
                                <div class="text-center">
                                    <i class="fas fa-check-circle text-5xl text-green-500 mb-4"></i>
                                    <p class="text-lg font-semibold">Perfeito!</p>
                                    <p class="text-gray-600">${city} - ${stateData.sigla}</p>
                                    <div class="bg-green-50 text-green-800 p-3 rounded-lg my-4 text-left text-sm">
                                        <p><i class="fas fa-map-marker-alt mr-2"></i>Estamos a 4.5km de você!</p>
                                        <p><i class="fas fa-clock mr-2"></i>Entrega de 25 a 40 minutos</p>
                                    </div>
                                </div>`,
          confirmButtonText: 'Continuar',
          confirmButtonColor: themeColor
        });
      });
    }
  }
}
async function iniciarVerificacaoLocal() {
  if (checkCookie("localCidade") && checkCookie("localEstado")) {
    atualizarLocalizacao(getCookie("localCidade"), getCookie("localEstado"));
    return;
  }

  const { city, region } = await fetchLocation();

  Swal.fire({
    title: 'Confirme sua localização',
    html: `
                    <div style="display: flex; flex-direction: column; align-items: center;">
						<i class="fas fa-map-marker-alt" style="font-size: 40px; color: #C11E24; margin-bottom: 12px;"></i>
						<h2 style="font-size: 22px; font-weight: 600; margin-bottom: 4px;">Detectamos sua localização!</h2>
						<div class="caixa-cidade">
							<p>${city}</p>
							<p>${region}</p>
						</div>
						<p style="color: #666; font-size: 14px;">Esta é sua localização atual?</p>
						</div>
						`,
    showCancelButton: true,
    confirmButtonText: 'Sim, confirmar localização',
    cancelButtonText: 'Não, escolher outro local',
    confirmButtonColor: themeColor,
    cancelButtonColor: '#6B7280',
    customClass: {
      popup: 'rounded-xl'
    }
  }).then((result) => {
    if (result.isConfirmed) {
      setCookie("localCidade", city, 365);
      setCookie("localEstado", region, 365);
      atualizarLocalizacao(city, region);

      Swal.fire({
        title: 'Localização confirmada!',
        html: `
							<div class="text-center">
							<i class="fas fa-check-circle text-5xl text-green-500 mb-4" style="font-size: 48px; color: #22c55e;"></i>
							<p class="text-lg font-semibold">Perfeito!</p>
							<p class="text-gray-600">${city} - ${region}</p>
							<div class="bg-green-50 text-green-800 p-3 rounded-lg my-4 text-left text-sm" style="background-color: #ecfdf5; color: #065f46;">
								<p><i class="fas fa-map-marker-alt mr-2"></i>Estamos a 4,5km de você!</p>
								<p><i class="fas fa-clock mr-2"></i>Entrega de 25 a 40 minutos</p>
							</div>
							</div>
						`,
        confirmButtonText: 'Continuar',
        confirmButtonColor: themeColor
      });
    } else if (result.dismiss === Swal.DismissReason.cancel) {
      escolherLocalizacaoManualmente(region);
    }
  });
}

document.addEventListener("DOMContentLoaded", () => {
  iniciarVerificacaoLocal();
});

// Inicialização do documento
document.addEventListener('DOMContentLoaded', function () {
  // Configuração dos Prêmios
  const prizes = [
    { name: '50% de CASH BACK', icon: '', color: '#d10000' },
    { name: '30% de desconto', icon: '', color: '#222222' },
    { name: '1 Combo grátis no próximo pedido', icon: '', color: '#d10000' },
    { name: '5% de desconto', icon: '', color: '#222222' },
    { name: '20% de desconto', icon: '', color: '#d10000' },
    { name: 'Combo Casal gratuito', icon: '', color: '#222222' }
  ];

  // Inicia o gerenciador da roleta
  const rouletteManager = new RouletteManager({ prizes });

  // Configura os timers para as notificações e atualização de estoque
  setInterval(() => {
    const fraseAleatoria = escolherFraseAleatoria();
    mostrarNotificacao(fraseAleatoria);
  }, 25000);

  setInterval(diminuirEstoque, 15000);

  // Inicia o processo de localização
  escolherLocalizacao();
});