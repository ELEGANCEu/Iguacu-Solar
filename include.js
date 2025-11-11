//Carrega os arquivos footer e header
async function includePartials() {
    const includes = document.querySelectorAll('[data-include]');
    for (const el of includes) {
        const file = el.getAttribute('data-include');
        const response = await fetch(file);
        const content = await response.text();
        el.innerHTML = content;
    }

    //Marca a página ativa
    const page = location.pathname.split("/").pop() || "index.html";
    document.querySelectorAll("a[data-nav]").forEach(a => {
        a.setAttribute("aria-current", a.getAttribute("href") === page ? "page" : "false");
    });
}

// executa assim que a página carrega
includePartials();