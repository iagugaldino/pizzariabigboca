/**
 * Função para exibir o status do prêmio da roleta no header ou em qualquer elemento HTML
 * @param {string} elementSelector - O seletor CSS do elemento onde exibir o status do prêmio
 */
function displayRouletteStatus(elementSelector) {
  // Busca o elemento onde exibir o status
  const displayElement = document.querySelector(elementSelector);
  if (!displayElement) {
    console.error(`Elemento "${elementSelector}" não encontrado no DOM.`);
    return;
  }
  
  // Verifica se o usuário já ganhou um prêmio na roleta
  const hasPlayed = localStorage.getItem('rouletteWon') === 'true' || getCookie('rouletteWon') === 'true';
  
  if (hasPlayed) {
    // Busca qual prêmio foi ganho
    const prize = localStorage.getItem('roulettePrize') || "um prêmio";
    
    // Exibe o prêmio ganho
    displayElement.innerHTML = `<span class="prize-won">Prêmio da roleta: <strong>${prize}</strong></span>`;
    displayElement.classList.add('has-prize');
  } else {
    // Exibe mensagem incentivando a girar a roleta
    displayElement.innerHTML = '<span class="prize-available">Você tem 1 giro na roleta!</span>';
    displayElement.classList.add('no-prize');
    // Não adiciona nenhum evento de clique
  }
}

/**
 * Atualiza o status do prêmio quando o premio é ganho
 * @param {string} elementSelector - O seletor CSS do elemento onde exibir o status do prêmio
 */
function updatePrizeDisplay(elementSelector) {
  const prize = localStorage.getItem('roulettePrize') || "um prêmio";
  const displayElement = document.querySelector(elementSelector);
  
  if (displayElement) {
    displayElement.innerHTML = `<span class="prize-won">Prêmio da roleta: <strong>${prize}</strong></span>`;
    displayElement.classList.remove('no-prize');
    displayElement.classList.add('has-prize');
  }
}

// Adiciona estilo CSS para o elemento de exibição do prêmio
function addPrizeDisplayStyles() {
  const styleElement = document.createElement('style');
  styleElement.textContent = `
    .prize-available {
      color: #d10000;
      font-weight: bold;
      display: inline-block;
      padding: 5px 10px;
      border-radius: 5px;
      background-color: rgba(209, 0, 0, 0.1);
    }
    
    .prize-won {
      color: #ffffff;
      display: inline-block;
      padding: 5px 10px;
      border-radius: 5px;
      background-color: rgba(34, 34, 34, 0.1);
    }
    
    .prize-won strong {
      color: #d10000;
    }
    
    .no-prize {
      animation: pulse 2s infinite;
    }
    
    @keyframes pulse {
      0% { transform: scale(1); }
      50% { transform: scale(1.05); }
      100% { transform: scale(1); }
    }
  `;
  document.head.appendChild(styleElement);
}

// Exemplo de uso: chamar no DOMContentLoaded
document.addEventListener('DOMContentLoaded', function() {
  // Adicionar os estilos
  // addPrizeDisplayStyles();
  
  // Exibir o status do prêmio no elemento com ID "prize-display"
  // Substitua "#prize-display" pelo seletor do elemento onde deseja exibir
  // displayRouletteStatus('#prize-display');
  
  // Modificar a função savePrizeInfo para atualizar o display quando um prêmio for ganho
  const originalSavePrizeInfo = PrizeManager.prototype.savePrizeInfo;
  if (originalSavePrizeInfo) {
    PrizeManager.prototype.savePrizeInfo = function(prizeName) {
      // Chama a função original
      originalSavePrizeInfo.call(this, prizeName);
      
      // Atualiza o display
      updatePrizeDisplay('#prize-display');
    };
  }
});
