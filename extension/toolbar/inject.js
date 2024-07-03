var platform = typeof browser === 'undefined' ? chrome : browser;
var userEmail = null;

// Função para solicitar o email do usuário
function promptUserEmail() {
  userEmail = prompt("Por favor, insira seu e-mail:");
  if (userEmail) {
    platform.storage.sync.set({ userEmail: userEmail }, function() {
      console.log('User email is set to', userEmail);
    });
    handleToolAccess(userEmail);
  }
}

// Recuperar dados do armazenamento e verificar acesso
platform.storage.sync.get(['userEmail', 'colorMode'], function(result) {
  if (!result.userEmail) {
    promptUserEmail();
  } else {
    console.log('User email currently is', result.userEmail);
    handleToolAccess(result.userEmail);
  }
});

// Função para lidar com o acesso à ferramenta
function handleToolAccess(email) {
  checkEmailAccess(email)
    .then(hasAccess => {
      if (hasAccess) {
        loadTool();
      } else {
        alert("Desculpe, você não tem acesso a esta ferramenta.");
      }
    })
    .catch(error => {
      console.error("Erro ao verificar o acesso do e-mail:", error);
      alert("Ocorreu um erro ao verificar o acesso. Por favor, tente novamente mais tarde.");
    });
}

// Função para carregar a ferramenta
function loadTool() {
  const script = document.createElement('script');
  script.type = 'module';
  script.src = platform.runtime.getURL('toolbar/bundle.min.js');
  document.body.appendChild(script);

  const visbug = document.createElement('vis-bug');
  const src_path = platform.runtime.getURL(`tuts/guides.gif`);
  visbug.setAttribute('tutsBaseURL', src_path.slice(0, src_path.lastIndexOf('/')));
  document.body.prepend(visbug);

  platform.runtime.onMessage.addListener(request => {
    if (request.action === 'COLOR_MODE')
      visbug.setAttribute('color-mode', request.params.mode);
    else if (request.action === 'COLOR_SCHEME')
      visbug.setAttribute("color-scheme", request.params.mode);
  });
}

// Salvar dados no armazenamento
function saveColorMode(mode) {
  platform.storage.sync.set({ colorMode: mode }, function() {
    console.log('Color mode is set to', mode);
  });
}

// Função para verificar o acesso do e-mail
function checkEmailAccess(email) {
  const apiUrl = 'https://api-aicopi.zapime.com.br/verify-email';
  const requestBody = {
    email: email
  };

  return fetch(apiUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(requestBody)
  })
  .then(response => {
    if(response.status === 200) {
      return true;
    } else {
      return false;
    }
  })
  .catch(error => {
    console.error("Erro ao fazer a chamada de API:", error);
    return false;
  });
}
