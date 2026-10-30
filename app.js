// filepath: c:\Users\USUARIO\Documents\Alanstp\Gestion_de_inverntario\app.js
const STORAGE_KEY = "inventario_productos";

const productosIniciales = [
    {
        id: 1,
        codigo_barras: "1234567890123",
        nombre: "Laptop HP pavilion",
        categorias: "Electronicos",
        descripcion: 'laptos HP pavilion 15" con 8GB RAM',
        stock: 10,
        precio: 599.99,
        stock_minimo: 2
    },
    {
        id: 2,
        codigo_barras: "1234567890123",
        nombre: "Camiseta Basica",
        categorias: "Ropas",
        descripcion: "Camisetas 100%",
        stock: 50,
        precio: 19.99,
        stock_minimo: 10
    },
    {
        id: 3,
        codigo_barras: "34567890123",
        nombre: "Sillas de oficina",
        categorias: "Hogar",
        descripcion: "Silla ergonomica para oficina",
        stock: 8,
        precio: 149.99,
        stock_minimo: 3
    }
];

let productos = cargarDatosGuardados();
let productoEditando = null;
let lectorQR = null;

function cargarDatosGuardados() {
    try {
        const guardados = localStorage.getItem(STORAGE_KEY);
        return guardados ? JSON.parse(guardados) : [...productosIniciales];
    } catch {
        return [...productosIniciales];
    }
}

function guardarProductos() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(productos));
}

function mostrarTab(tabName) {
    document.querySelectorAll(".tab-content").forEach(contenido => {
        contenido.classList.toggle("active", contenido.id === `content-${tabName}`);
    });

    document.querySelectorAll(".tab-button").forEach(boton => {
        boton.classList.toggle("active", boton.id === `tab-${tabName}`);
    });

    if (tabName === "productos") cargarProductos();
}

function prepararFormulario() {
    const formulario = document.getElementById("formProducto");
    if (!formulario) return;

    formulario.addEventListener("submit", guardarProducto);
    document.getElementById("cancelarEdicion").addEventListener("click", cancelarEdicion);
}

function cargarProductos(lista = productos) {
    const tbody = document.getElementById("tablaProductos");
    if (!tbody) return;

    tbody.replaceChildren();

    lista.forEach(producto => {
        const fila = document.createElement("tr");
        const valores = [
            producto.id,
            producto.codigo_barras || "N/A",
            producto.nombre,
            `$${Number(producto.precio || 0).toFixed(2)}`,
            producto.stock
        ];

        valores.forEach((valor, indice) => {
            const celda = document.createElement("td");
            celda.textContent = valor ?? "";
            if (indice === 1) celda.style.fontFamily = "monospace";
            if (indice === 4 && Number(producto.stock) <= Number(producto.stock_minimo || 0)) {
                celda.classList.add("stock-low");
            }
            fila.appendChild(celda);
        });

        const acciones = document.createElement("td");
        acciones.className = "actions-cell";
        const grupoAcciones = document.createElement("div");
        grupoAcciones.className = "product-actions";

        const botonEditar = document.createElement("button");
        botonEditar.type = "button";
        botonEditar.className = "btn action-button action-edit";
        botonEditar.setAttribute("aria-label", `Editar ${producto.nombre}`);
        botonEditar.innerHTML = '<span class="action-icon" aria-hidden="true">✎</span><span>Editar</span>';
        botonEditar.addEventListener("click", () => editarProducto(producto.id));

        const botonEliminar = document.createElement("button");
        botonEliminar.type = "button";
        botonEliminar.className = "btn action-button action-delete";
        botonEliminar.setAttribute("aria-label", `Eliminar ${producto.nombre}`);
        botonEliminar.innerHTML = '<span class="action-icon" aria-hidden="true">×</span><span>Eliminar</span>';
        botonEliminar.addEventListener("click", () => eliminarProducto(producto.id));

        grupoAcciones.append(botonEditar, botonEliminar);
        acciones.appendChild(grupoAcciones);
        fila.appendChild(acciones);
        tbody.appendChild(fila);
    });

    actualizarEstadisticas();
}

function actualizarEstadisticas() {
    const total = document.getElementById("TotalProductos");
    const valor = document.getElementById("ValorTotal");

    if (total) total.textContent = productos.length;

    if (valor) {
        const suma = productos.reduce(
            (acumulado, producto) =>
                acumulado + Number(producto.stock || 0) * Number(producto.precio || 0),
            0
        );
        valor.textContent = suma.toFixed(2);
    }
}

function guardarProducto(evento) {
    evento.preventDefault();

    const formulario = evento.currentTarget;
    const datos = new FormData(formulario);
    const codigo = String(datos.get("codigo_barras") || "").trim();

    if (codigo && productos.some(producto =>
        String(producto.codigo_barras || "").toLowerCase() === codigo.toLowerCase()
        && producto.id !== productoEditando
    )) {
        alert("Ya existe un producto con ese código de barras.");
        return;
    }

    const producto = {
        id: productoEditando ?? Math.max(0, ...productos.map(p => Number(p.id) || 0)) + 1,
        codigo_barras: codigo,
        nombre: String(datos.get("nombre") || "").trim(),
        categorias: String(datos.get("categorias") || "").trim(),
        descripcion: String(datos.get("descripcion") || "").trim(),
        stock: Number(datos.get("stock")),
        precio: Number(datos.get("precio")),
        stock_minimo: Number(datos.get("stock_minimo") || 0)
    };

    if (!producto.nombre || !producto.categorias ||
        !Number.isFinite(producto.stock) || !Number.isFinite(producto.precio)) {
        alert("Completa correctamente los datos del producto.");
        return;
    }

    if (productoEditando !== null) {
        productos = productos.map(p => p.id === productoEditando ? producto : p);
    } else {
        productos.push(producto);
    }

    guardarProductos();
    cancelarEdicion();
    cargarProductos();
    mostrarTab("productos");
}

function editarProducto(id) {
    const producto = productos.find(p => p.id === id);
    if (!producto) return;

    productoEditando = id;
    const formulario = document.getElementById("formProducto");

    formulario.elements.codigo_barras.value = producto.codigo_barras || "";
    formulario.elements.nombre.value = producto.nombre || "";
    formulario.elements.categorias.value = producto.categorias ?? producto.categoria ?? "";
    formulario.elements.descripcion.value = producto.descripcion || "";
    formulario.elements.stock.value = producto.stock ?? 0;
    formulario.elements.precio.value = producto.precio ?? 0;
    formulario.elements.stock_minimo.value = producto.stock_minimo ?? 0;

    formulario.querySelector('button[type="submit"]').textContent = "Guardar cambios";
    document.getElementById("cancelarEdicion").hidden = false;
    mostrarTab("agregar");
}

function eliminarProducto(id) {
    if (!confirm("¿Seguro que quieres eliminar este producto?")) return;

    productos = productos.filter(producto => producto.id !== id);
    guardarProductos();
    cargarProductos();
}

function cancelarEdicion() {
    const formulario = document.getElementById("formProducto");
    if (!formulario) return;

    formulario.reset();
    productoEditando = null;
    formulario.querySelector('button[type="submit"]').textContent = "Agregar producto";
    document.getElementById("cancelarEdicion").hidden = true;
}

function buscarProductos() {
    const consulta = String(
        document.getElementById("buscarProductos")?.value || ""
    ).trim().toLowerCase();

    const resultados = productos.filter(producto => {
        const camposBuscables = [
            producto.nombre,
            producto.codigo_barras,
            producto.categorias ?? producto.categoria,
            producto.descripcion
        ];

        return camposBuscables.some(campo =>
            String(campo || "").toLowerCase().includes(consulta)
        );
    });

    cargarProductos(resultados);
}

function prepararScanner() {
    document.getElementById("iniciarScanner").addEventListener("click", iniciarScanner);
    document.getElementById("detenerScanner").addEventListener("click", detenerScanner);
}

async function iniciarScanner() {
    const mensaje = document.getElementById("mensajeScanner");

    if (typeof Html5Qrcode === "undefined") {
        mensaje.textContent = "No se pudo cargar el lector de códigos.";
        return;
    }

    try {
        if (!lectorQR) lectorQR = new Html5Qrcode("lectorQR");

        await lectorQR.start(
            { facingMode: "environment" },
            { fps: 10, qrbox: 250 },
            codigo => {
                document.getElementById("codigobarras").value = codigo;
                mensaje.textContent = `Código leído: ${codigo}`;
                detenerScanner();
                mostrarTab("agregar");
            }
        );

        mensaje.textContent = "Cámara iniciada.";
    } catch {
        mensaje.textContent = "No se pudo iniciar la cámara. Revisa los permisos del navegador.";
    }
}

async function detenerScanner() {
    if (!lectorQR) return;

    try {
        if (lectorQR.isScanning) await lectorQR.stop();
    } catch {
        // El lector ya estaba detenido.
    }
}

window.mostrarTab = mostrarTab;
window.buscarProductos = buscarProductos;
window.editarProducto = editarProducto;
window.eliminarProducto = eliminarProducto;

document.addEventListener("DOMContentLoaded", () => {
    prepararFormulario();
    prepararScanner();
    cargarProductos();

    document.getElementById("buscarProductos")
        ?.addEventListener("input", buscarProductos);
});
