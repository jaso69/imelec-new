/* ========================================
   IMELEC - Formulario de Contacto
   ======================================== */

document.addEventListener('DOMContentLoaded', function() {
    const formulario = document.getElementById('formulario');
    const formStatus = document.getElementById('form-status');
    
    if (!formulario) return;

    // Declare DOM variables explicitly
    const nombreInput = document.getElementById('nombre');
    const telefonoInput = document.getElementById('telefono');
    const emailInput = document.getElementById('email');
    const serviceInput = document.getElementById('service');
    const locationInput = document.getElementById('location');
    const descripcionInput = document.getElementById('descripcion');
    const privacidadInput = document.getElementById('privacidad');
    const honeypotInput = document.getElementById('website');

    formulario.addEventListener('submit', async function(event) {
        event.preventDefault();

        // Honeypot anti-spam: if filled, silently reject (bots usually fill hidden fields)
        if (honeypotInput && honeypotInput.value.trim() !== '') {
            console.warn('Honeypot triggered - probable bot submission blocked');
            return;
        }

        const requiredFields = formulario.querySelectorAll('[required]');
        let firstInvalid = null;

        requiredFields.forEach(field => {
            if (field.type === 'checkbox' ? !field.checked : !field.value.trim()) {
                field.classList.add('form-error');
                field.setAttribute('aria-invalid', 'true');
                if (!firstInvalid) firstInvalid = field;
            } else {
                field.classList.remove('form-error');
                field.removeAttribute('aria-invalid');
            }
        });

        if (firstInvalid) {
            if (formStatus) {
                formStatus.className = 'mb-4 p-4 rounded-lg bg-red-100 text-red-700';
                formStatus.textContent = 'Por favor, complete todos los campos obligatorios.';
                formStatus.classList.remove('hidden');
            }
            firstInvalid.focus();
            return;
        }

        if (formStatus) {
            formStatus.className = 'hidden mb-4 p-4 rounded-lg';
        }

        await enviarCorreo();
    });
    
    async function enviarCorreo() {
        const formsend = { 
            email: emailInput ? emailInput.value : '',
            nombre: nombreInput ? nombreInput.value : '',
            telefono: telefonoInput ? telefonoInput.value : '',
            descripcion: descripcionInput ? descripcionInput.value : '',
        };
        
        try {
            const response = await fetch('https://imelec-emails.vercel.app/', {
                method: 'POST',
                mode: 'cors',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formsend),
            });

            if (response.ok) {
                if (formStatus) {
                    formStatus.className = 'mb-4 p-4 rounded-lg bg-green-100 text-green-700';
                    formStatus.textContent = 'Mensaje enviado correctamente. Redirigiendo...';
                    formStatus.classList.remove('hidden');
                }
                setTimeout(() => {
                    window.location.replace("index.html");
                }, 1500);
            } else {
                if (formStatus) {
                    formStatus.className = 'mb-4 p-4 rounded-lg bg-red-100 text-red-700';
                    formStatus.textContent = 'Error al enviar el mensaje. Inténtelo de nuevo o llámenos.';
                    formStatus.classList.remove('hidden');
                }
            }
        } catch (error) {
            if (formStatus) {
                formStatus.className = 'mb-4 p-4 rounded-lg bg-red-100 text-red-700';
                formStatus.textContent = 'Error de conexión. Inténtelo de nuevo o llámenos al 691 50 23 61.';
                formStatus.classList.remove('hidden');
            }
        }
    }
});
