const pages = 
{
    "Home": ["home"],
    "Relógios": ["clock"]
};

const menuitem = document.querySelectorAll('.menu-item');

menuitem.forEach(item => 
{
    item.addEventListener('click', () => 
    {
        menuitem.forEach(element => element.classList.remove('active'));

        item.classList.add('active');

        const name = item.innerText;
    
        loadPage(pages[name]);
    });
});

let currentPageInstance = null;

async function loadPage(name) 
{
    const contentArea = document.getElementById('content-area');
    const pageStyle = document.getElementById('page-style');

    
    try 
    {
        if(currentPageInstance && typeof currentPageInstance.destroy === 'function') 
        {
            currentPageInstance.destroy();
            currentPageInstance = null;
        }
        const response = await fetch(`./pages/${name}.html`);
        
        if(!response.ok) throw new Error('Erro ao carregar a página');
        
        const htmlContent = await response.text();

        contentArea.innerHTML = htmlContent;

        pageStyle.href = `./styles/${name}.css`;

        initPageScript(`${name}`);
    } 

    catch (error) 
    {
        console.error(error);
        contentArea.innerHTML = `<p style="color: red;">Erro ao carregar a ferramenta: ${pageName}</p>`;
    }
}

window.addEventListener('DOMContentLoaded', () => 
{
    loadPage('home');
});

function initPageScript(name) 
{
    if(name === 'clock') 
    {
        if (window.ClockPage) 
        {
            window.ClockPage.init();
            currentPageInstance = window.ClockPage;
        }
    }
}