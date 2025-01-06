document.addEventListener("DOMContentLoaded", () => {

    const startScanButton = document.getElementById("startScan");
    const manualEntryButton = document.getElementById("manualEntry");
    const eanInput = document.getElementById("ean");
    const searchProductButton = document.getElementById("searchProduct");
    const formContainer = document.getElementById("form-container");

    document.getElementById("startScan").addEventListener("click", () => {
        const videoContainer = document.getElementById("videoContainer");
        const barcodeMessage = document.getElementById("barcodeMessage");
        const stopScanButton = document.getElementById("stopScan");

        let isScanning = false;
        barcodeMessage.classList.add("hidden");
        videoContainer.classList.remove("hidden");
        stopScanButton.classList.remove("hidden");
        manualEntryButton.classList.add("hidden");

        // Reseteamos el formulario para la nueva búsqueda y ocultamos el contenedor
        formContainer.style.display = "none";  // Ocultar el formulario al comenzar un nuevo escaneo
        resetProductForm();

        // Deshabilitar el campo EAN-13 y ocultar el botón de búsqueda
        eanInput.disabled = true;
        searchProductButton.style.display = "none";

        const codeReader = new ZXing.BrowserMultiFormatReader();

        // Configuración personalizada para alta resolución
        const constraints = {
            video: {
                facingMode: "environment", // Usamos la cámara trasera
                width: { ideal: 1280 },     // Resolución ideal
                height: { ideal: 720 }      // Resolución ideal
            }
        };

        // Acceso a la cámara con la configuración de resolución
        navigator.mediaDevices.getUserMedia(constraints)
            .then((stream) => {
                video.srcObject = stream;

                // Aplicar filtros para mejorar la calidad de la imagen
                const videoTrack = stream.getVideoTracks()[0];
                const capabilities = videoTrack.getCapabilities();
                if (capabilities.focusDistance) {
                    videoTrack.applyConstraints({
                        advanced: [{
                            focusMode: 'continuous',
                            focusDistance: { min: capabilities.focusDistance.min, max: capabilities.focusDistance.max }
                        }]
                    });
                }
            })
            .catch((err) => {
                console.error('Error al acceder a la cámara:', err);
            });


        //escaneo
        codeReader
            .decodeFromVideoDevice(null, video, (result, err) => {
                if (result && !isScanning) {
                    isScanning = true;

                    // Reproducir el sonido de escaneo
                    const scannerSound = new Audio('sounds/scaner.mp3');  // Ruta del archivo de sonido
                    scannerSound.play();

                    // Mostrar el código EAN-13 escaneado en el formulario
                    eanInput.value = result.text;

                    // Buscar en el JSON los detalles del producto
                    fetch('productos.json')
                        .then(response => response.json())
                        .then(productos => {
                            const producto = productos.find(p => p.ean === result.text);
                            if (producto) {
                                // Mostrar la información del producto en el formulario
                                document.getElementById("nombre").value = producto.nombre;
                                document.getElementById("precio").value = producto.precio;
                                document.getElementById("stock").value = producto.stock;
                                document.getElementById("descuento").value = `${producto.descuento}%`; // Mostrar porcentaje
                                document.getElementById("precio_descuento").value = producto.precio_descuento;
                                document.getElementById("categoria").value = producto.categoria;
                                document.getElementById("as400").value = producto.as400;

                                // Mostrar la imagen del producto
                                const imgElement = document.getElementById("imagenProducto");
                                imgElement.src = producto.imagen;
                                imgElement.alt = `Imagen de ${producto.nombre}`;
                                imgElement.style.display = "block"; // Asegurarse de que sea visible

                            } else {
                                alert("Producto no encontrado");
                            }
                        })
                        .catch(err => {
                            console.error("Error al cargar los productos:", err);
                            alert("Error al buscar la información del producto.");
                        });

                    // Detener el escaneo
                    videoContainer.classList.add("hidden");
                    stopScanButton.classList.add("hidden");
                    manualEntry.classList.add("hidden");
                    formContainer.style.display = "block";  // Mostrar el formulario

                    codeReader.reset();
                }

                if (err && !(err instanceof ZXing.NotFoundException)) {
                    console.warn("Error al leer el código:", err.message);
                }
            })
            .catch((err) => {
                console.error("Error al inicializar el lector:", err);
            });

        // Detener el escaneo al presionar el botón
        stopScanButton.addEventListener("click", () => {
            codeReader.reset();
            videoContainer.classList.add("hidden");
            stopScanButton.classList.add("hidden");
            barcodeMessage.classList.remove("hidden");
            manualEntry.classList.remove("hidden");
            isScanning = false;

            // Reseteamos el formulario y ocultamos los datos
            resetProductForm();
            formContainer.style.display = "none";  // Ocultar el formulario al detener el escaneo
        });

        // Detener la cámara cuando se abandone la página
        window.addEventListener("beforeunload", () => {
            codeReader.reset();
        });
    });

    // Función para buscar el producto
    document.getElementById("searchProduct").addEventListener("click", () => {
        const ean = document.getElementById("ean").value;
        fetch('productos.json')
            .then(response => response.json())
            .then(productos => {
                const producto = productos.find(p => p.ean === ean);

                if (producto) {
                    // Llenar los campos con los datos del producto
                    document.getElementById("nombre").value = producto.nombre;
                    document.getElementById("as400").value = producto.as400;
                    document.getElementById("categoria").value = producto.categoria;
                    document.getElementById("stock").value = producto.stock;
                    document.getElementById("precio").value = producto.precio;
                    document.getElementById("descuento").value = producto.descuento;
                    document.getElementById("precio_descuento").value = producto.precio_descuento;
                    document.getElementById("imagenProducto").src = producto.imagen;
                    document.getElementById("imagenProducto").style.display = "block";
                } else {
                    alert("Producto no encontrado.");
                }
            })
            .catch(error => {
                console.error("Error al cargar los productos:", error);
            });
    });

    // Función para resetear el formulario de producto
    function resetProductForm() {
        // Limpiar los campos del formulario
        document.getElementById("ean").value = '';
        document.getElementById("nombre").value = '';
        document.getElementById("precio").value = '';
        document.getElementById("stock").value = '';
        document.getElementById("descuento").value = '';
        document.getElementById("precio_descuento").value = '';
        document.getElementById("categoria").value = '';
        document.getElementById("as400").value = '';

        // Ocultar la imagen del producto
        const imgElement = document.getElementById("imagenProducto");
        imgElement.style.display = "none";
        imgElement.src = '';
    }

    // Cuando se haga clic en "Buscar Manualmente"
    manualEntryButton.addEventListener("click", () => {
        // Habilitar el campo EAN-13 y mostrar el botón de búsqueda
        eanInput.disabled = false;
        searchProductButton.style.display = "inline-block";  // Mostrar el botón de buscar producto
        formContainer.style.display = "block"; // Mostrar el formulario

        // Mostrar también el botón de "Buscar Producto"
        manualEntryButton.classList.add("hidden");
    });

});