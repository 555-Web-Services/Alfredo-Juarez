document.addEventListener('DOMContentLoaded', () => {
  let clientId = localStorage.getItem('chatClientId');
  if (!clientId) {
    clientId = 'anon_' + Math.random().toString(36).substring(2, 10);
    localStorage.setItem('chatClientId', clientId);
  }

  const chatBox = document.createElement('div');
  chatBox.innerHTML = `
    <div id="chat-toggle"><img src="img/chat.png" alt="Imagen chat"></div>
    <div id="chat-container" style="display:none;">
      <div id="chat-messages"></div>
      <input type="text" id="chat-input" placeholder="Escribe un mensaje..." />
    </div>
  `;
  document.body.appendChild(chatBox);

  const toggleBtn = document.getElementById('chat-toggle');
  const container = document.getElementById('chat-container');
  const input = document.getElementById('chat-input');
  const messages = document.getElementById('chat-messages');

  // 🔗 Conexión con tu servidor backend en Render
  const socket = io('https://alfredo-backend.onrender.com'); // reemplaza con tu URL real

  socket.emit('identificar', clientId);

  const preguntasFrecuentes = [
    '¿Cuáles son los horarios de atención?',
    '¿Cómo puedo comprar una obra?',
    '¿Tienen envío a domicilio?',
    '¿Dónde están ubicados?'
  ];

  const faqBox = document.createElement('div');
  faqBox.style.marginBottom = '5px';
  const respuestasAuto = {
    '¿Cuáles son los horarios de atención?': 'Nuestro horario es de lunes a viernes de 9:00 a 18:00 hrs.',
    '¿Cómo puedo comprar una obra?': 'Puedes comprar una obra contactándonos por este chat o en la sección "Ventas".',
    '¿Tienen envío a domicilio?': 'Sí, realizamos envíos a todo el país con costo adicional.',
    '¿Dónde están ubicados?': 'Estamos en Oaxaca, puedes agendar una visita con cita previa.'
  };

  let asesorTimeout = null;

  preguntasFrecuentes.forEach(pregunta => {
    const btn = document.createElement('button');
    btn.textContent = pregunta;
    btn.style.display = 'block';
    btn.style.margin = '2px 0';
    btn.style.width = '100%';
    btn.onclick = () => {
      socket.emit('clientMessage', pregunta);
      appendMessage('Tú', pregunta);
      setTimeout(() => {
        const respuesta = respuestasAuto[pregunta] || 'Gracias por tu mensaje, en breve te responderemos.';
        appendMessage('Auto', respuesta);
        mostrarConsultaAsesor();
      }, 800);
    };
    faqBox.appendChild(btn);
  });

  function mostrarConsultaAsesor() {
    const container = document.createElement('div');
    container.style.marginTop = '10px';
    container.innerHTML = `
      <div style="margin-bottom: 6px;"><strong>¿Deseas que te atienda un asesor personalmente?</strong></div>
      <button style="margin-right: 10px;" onclick="responderAsesor('sí')">Sí</button>
      <button onclick="responderAsesor('no')">No</button>
    `;
    messages.appendChild(container);
    messages.scrollTop = messages.scrollHeight;
  }

  window.responderAsesor = function (respuesta) {
    const texto = respuesta === 'sí'
      ? 'Sí, quiero que me atienda un asesor.'
      : 'No, gracias.';
    appendMessage('Tú', texto);
    socket.emit('clientMessage', texto);

    if (respuesta === 'sí') {
      setTimeout(() => {
        appendMessage('Auto', 'Un asesor se comunicará contigo en breve...');
      }, 500);

      asesorTimeout = setTimeout(() => {
        appendMessage('Auto', 'También puedes comunicarte al 📞 951-591-1400');

        const btnLlamar = document.createElement('button');
        btnLlamar.textContent = '📞 Llamar ahora';
        btnLlamar.style.marginTop = '5px';
        btnLlamar.style.padding = '6px 12px';
        btnLlamar.style.background = '#007bff';
        btnLlamar.style.color = 'white';
        btnLlamar.style.border = 'none';
        btnLlamar.style.cursor = 'pointer';
        btnLlamar.onclick = () => {
          window.location.href = 'tel:9515911400';
        };

        messages.appendChild(btnLlamar);
        messages.scrollTop = messages.scrollHeight;
      }, 60000);

    } else {
      appendMessage('Auto', 'Gracias por tu consulta. Si necesitas más ayuda, estamos aquí para apoyarte.');
    }
  };

  container.insertBefore(faqBox, input);

  toggleBtn.onclick = () => {
    container.style.display = container.style.display === 'none' ? 'block' : 'none';
  };

  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && input.value.trim()) {
      socket.emit('clientMessage', input.value);
      appendMessage('Tú', input.value);
      input.value = '';
    }
  });

  socket.on('adminMessage', msg => appendMessage('Admin', msg));

  function appendMessage(sender, text) {
    messages.innerHTML += `<div><strong>${sender}:</strong> ${text}</div>`;
    messages.scrollTop = messages.scrollHeight;
  }
});
