document.addEventListener('DOMContentLoaded', () => {
  const urlOriginalInput = document.getElementById('urlOriginal');
  const dataValidadeInput = document.getElementById('dataValidade');
  const encurtarBtn = document.getElementById('encurtarBtn');
  const urlEncurtadaOutput = document.getElementById('urlEncurtada');

  urlEncurtadaOutput.addEventListener('click', function() {
      var range = document.createRange();
      range.selectNode(urlEncurtadaElement);
      window.getSelection().removeAllRanges();
      window.getSelection().addRange(range);
      document.execCommand('copy');
      window.getSelection().removeAllRanges();
      alert('URL encurtada copiada para a área de transferência!');
  });
  
  encurtarBtn.addEventListener('click', () => {
    const urlOriginal = urlOriginalInput.value;

    const data = {
      urlOriginal
    };

    fetch(process.env.REACT_APP_BACKEND_URL + '/encurtar', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    })
    .then(response => response.json())
    .then(result => {
      urlEncurtadaOutput.textContent = result.urlEncurtada;
    })
    .catch(error => {
      console.error('Erro:', error);
    });
  });
});
