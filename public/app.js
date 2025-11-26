// Controle do Sidebar
const sidebar = document.getElementById('sidebar');
const openSidebarBtn = document.getElementById('openSidebar'); // Botão para abrir
const closeSidebarBtn = document.getElementById('closeSidebar');

openSidebarBtn?.addEventListener('click', () => {
  sidebar.classList.add('open');
});

closeSidebarBtn?.addEventListener('click', () => {
  sidebar.classList.remove('open');
});

// Controle do Modal
const modal = document.getElementById('addOmModal');
const addOmButton = document.querySelector('[data-action="add-om"]');
const closeModalBtn = document.getElementById('closeModal');
const cancelBtn = document.getElementById('cancelButton');
const submitBtn = document.getElementById('submitButton');

addOmButton?.addEventListener('click', () => {
  modal.style.display = 'flex';
  sidebar.classList.remove('open');
});

closeModalBtn?.addEventListener('click', () => {
  modal.style.display = 'none';
  clearForm();
});

cancelBtn?.addEventListener('click', () => {
  modal.style.display = 'none';
  clearForm();
});

// Validação de formulário
function validateForm() {
  const errors = {};
  
  const hostname = document.getElementById('hostname').value.trim();
  const nome = document.getElementById('nome').value.trim();
  const ip = document.getElementById('ip').value.trim();
  const latitude = document.getElementById('latitude').value.trim();
  const longitude = document.getElementById('longitude').value.trim();
  
  if (!hostname) errors.hostname = 'Hostname é obrigatório';
  if (!nome) errors.nome = 'Nome é obrigatório';
  
  const ipRegex = /^(\d{1,3}\.){3}\d{1,3}$/;
  if (!ip) {
    errors.ip = 'IP é obrigatório';
  } else if (!ipRegex.test(ip)) {
    errors.ip = 'IP inválido';
  }
  
  const lat = parseFloat(latitude);
  const lng = parseFloat(longitude);
  
  if (!latitude || isNaN(lat) || lat < -90 || lat > 90) {
    errors.latitude = 'Latitude inválida';
  }
  
  if (!longitude || isNaN(lng) || lng < -180 || lng > 180) {
    errors.longitude = 'Longitude inválida';
  }
  
  // Limpar erros anteriores
  document.querySelectorAll('.error-message').forEach(el => el.textContent = '');
  
  // Mostrar novos erros
  Object.keys(errors).forEach(field => {
    const errorEl = document.getElementById(`${field}Error`);
    if (errorEl) errorEl.textContent = errors[field];
  });
  
  return Object.keys(errors).length === 0;
}

// Submeter formulário
submitBtn?.addEventListener('click', async () => {
  if (!validateForm()) {
    showNotification('Corrija os erros no formulário', 'error');
    return;
  }
  
  const formData = {
    hostname: document.getElementById('hostname').value.trim(),
    nome: document.getElementById('nome').value.trim(),
    ip: document.getElementById('ip').value.trim(),
    hostgroup: document.getElementById('hostgroup').value,
    latitude: parseFloat(document.getElementById('latitude').value),
    longitude: parseFloat(document.getElementById('longitude').value),
    foto: document.getElementById('foto').value.trim() || '/assets/fotos/default.png'
  };
  
  try {
    const response = await fetch('/api/locations/add', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(formData)
    });
    
    const result = await response.json();
    
    if (response.ok) {
      showNotification('OM adicionada com sucesso!', 'success');
      modal.style.display = 'none';
      clearForm();
      
      // Recarregar mapa após 1.5s
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } else {
      showNotification(result.message || 'Erro ao adicionar OM', 'error');
    }
  } catch (error) {
    console.error('Erro:', error);
    showNotification('Erro ao comunicar com o servidor', 'error');
  }
});

// Obter localização atual
document.getElementById('getCurrentLocation')?.addEventListener('click', () => {
  if ('geolocation' in navigator) {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        document.getElementById('latitude').value = position.coords.latitude.toFixed(8);
        document.getElementById('longitude').value = position.coords.longitude.toFixed(8);
        showNotification('Localização obtida com sucesso!', 'success');
      },
      (error) => {
        showNotification('Erro ao obter localização', 'error');
      }
    );
  } else {
    showNotification('Geolocalização não suportada', 'error');
  }
});

// Limpar formulário
function clearForm() {
  document.getElementById('hostname').value = '';
  document.getElementById('nome').value = '';
  document.getElementById('ip').value = '';
  document.getElementById('latitude').value = '';
  document.getElementById('longitude').value = '';
  document.getElementById('foto').value = '';
  document.querySelectorAll('.error-message').forEach(el => el.textContent = '');
}

// Sistema de notificações
function showNotification(message, type = 'success') {
  const notification = document.createElement('div');
  notification.className = `notification ${type}`;
  notification.textContent = message;
  document.body.appendChild(notification);
  
  setTimeout(() => {
    notification.remove();
  }, 4000);
}