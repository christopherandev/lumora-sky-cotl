let     AppTimeZone  = { hour: 0, min: 0};
const   SkyTimeZone  = { hour: -7, min: 0};
let     DiffTimeZone = { hour: 0, min: 0};
let     Events;

const StrWeek = [ "Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado" ];
const StrMonth = [ "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro" ];
window.onload = async () =>
{
    const user_tz = GetAppTimerZone() * (-1);

    AppTimeZone.hour = Math.floor(user_tz / 60);
    AppTimeZone.min = user_tz % 60;

    DiffTimeZone.hour = (AppTimeZone.hour - SkyTimeZone.hour);
    DiffTimeZone.min = (AppTimeZone.min - SkyTimeZone.min);

    await init();

    OnAppUpdate();
    setInterval(OnAppUpdate, 1000);
}

async function init()
{
    const response = await fetch("./events.json");

    Events = await response.json();
}

function GetAppTimerZone()
{
    const date = new Date;
    return date.getTimezoneOffset();
}

function OnAppUpdate()
{
    const appdate = new Date();
    const skydate = new Date();

    appdate.setUTCHours(appdate.getUTCHours() + AppTimeZone.hour);
    appdate.setUTCMinutes(appdate.getUTCMinutes() + AppTimeZone.min);

    skydate.setUTCHours(skydate.getUTCHours() + SkyTimeZone.hour);
    // skydate.setUTCMinutes(skydate.getUTCMinutes() + SkyTimeZone.min);

    const app_hour = appdate.getUTCHours().toString().padStart(2, '0');
    const app_min  = appdate.getUTCMinutes().toString().padStart(2, '0');
    const sky_hour = skydate.getUTCHours().toString().padStart(2, '0');
    const sky_min  = skydate.getUTCMinutes().toString().padStart(2, '0');

    const sec  = appdate.getUTCSeconds().toString().padStart(2, '0');
    const gmt = (AppTimeZone.hour >= 0 ? '+' : '') + AppTimeZone.hour.toString().padStart(2, '0');

    document.getElementById("clk-local").innerText = `Horário Atual:`;
    document.getElementById("clk-global").innerText = `Horário Servidor Sky:`;
    document.getElementById("clk-local").innerText = `${app_hour}:${app_min}:${sec}`;
    document.getElementById("clk-global").innerText = `${sky_hour}:${sky_min}:${sec}`;

    document.getElementById('current-weekday').innerText = StrWeek[appdate.getUTCDay()];
    document.getElementById('current-date').innerText = `${String(appdate.getUTCDate()).padStart(2, '0')} de ${StrMonth[appdate.getUTCMonth()]} de ${appdate.getUTCFullYear()}`;
    
    for(const event of Events)
    {
        const schedule = event.schedule;

        switch(schedule.type)
        {
            case "daily":
            {
                const at = schedule.at;
                
                const cpydate = new Date();

                const [hour, min] = at.split(':').map(Number);
                
                cpydate.setHours(DiffTimeZone.hour + hour);
                cpydate.setMinutes(DiffTimeZone.min + min);
                cpydate.setSeconds(0);

                const str = `${String(cpydate.getHours()).padStart(2, '0')} h ` + `${String(cpydate.getMinutes()).padStart(2, '0')} m`

                document.getElementById(event.element.event).innerText = str;

                const cpydiff = new Date(cpydate - new Date());

                const doc = `${String(cpydiff.getHours()).padStart(2, '0')} h ` + `${String(cpydiff.getMinutes()).padStart(2, '0')} m ` + `${String(cpydiff.getSeconds()).padStart(2, '0')} s`

                document.getElementById(event.element.diff).innerText = doc;
            
                break;
            }
            case "interval":
            {
                const now   = new Date(skydate);
                const start = new Date(now);
                const every = schedule.every * 60 * 1000;

                const [hour, min] = schedule.start.split(':').map(Number);

                start.setUTCHours(hour, min, 0, 0);

                const elapsed = (now - start);

                let next = new Date(start.getTime() + Math.ceil(elapsed / every) * every);
    
                next.setUTCHours(next.getUTCHours() + DiffTimeZone.hour);
                next.setUTCMinutes(next.getUTCMinutes() + DiffTimeZone.min);

                const str = `${String(next.getUTCHours()).padStart(2,'0')} h ` + `${String(next.getUTCMinutes()).padStart(2,'0')} m`;
                
                document.getElementById(event.element.event).innerText = str;
                
                const remaining = (next.getTime() - appdate);

                const timestamp = Math.floor(remaining / 1000);

                const hours = Math.floor(timestamp / 3600);

                const minutes = Math.floor((timestamp % 3600) / 60);

                const seconds = timestamp % 60;

                const doc = `${String(hours).padStart(2, '0')} h ` + `${String(minutes).padStart(2, '0')} m ` + `${String(seconds).padStart(2, '0')} s`

                document.getElementById(event.element.diff).innerText = doc;

                break;
            }

            case "weekly":
            {
                const now        = new Date(skydate);
                const weekday    = schedule.weekday;
                const now_weeday = now.getUTCDay();

                const [hour, min] = schedule.at.split(':').map(Number);

                const next = new Date(now);
                next.setUTCHours(hour, min, 0, 0);

                const day_diff = (weekday - now_weeday + 7) % 7;
                
                if(day_diff === 0 && next < now)
                {
                    next.setUTCDate(next.getUTCDate() + 7);
                }

                next.setUTCDate(next.getUTCDate() + day_diff);

                next.setUTCHours(next.getUTCHours() + DiffTimeZone.hour);
                next.setUTCMinutes(next.getUTCMinutes() + DiffTimeZone.min);

                const str = 
                `${StrWeek[next.getUTCDay()]} às ` +
                `${String(next.getUTCHours()).padStart(2,'0')} h ` + `${String(next.getUTCMinutes()).padStart(2,'0')} m`;
                
                document.getElementById(event.element.event).innerText = str;

                const remaining = (next.getTime() - appdate);
                
                const timestamp = Math.floor(remaining / 1000);

                const hours = Math.floor(timestamp / 3600);

                const minutes = Math.floor((timestamp % 3600) / 60);

                const seconds = timestamp % 60;

                const doc = `${String(hours).padStart(2, '0')} h ` + `${String(minutes).padStart(2, '0')} m ` + `${String(seconds).padStart(2, '0')} s`

                document.getElementById(event.element.diff).innerText = doc;

                break;
            }

            case "weekly-interval":
            {
                const now        = new Date(skydate);
                const weekday    = schedule.everyday;
                const now_weeday = now.getUTCDay();

                const [hour, min] = schedule.at.split(':').map(Number);

                const next = new Date(now);
                next.setUTCHours(hour, min, 0, 0);

                const day_diff = (weekday - now_weeday + 7) % 7;
                
                if(day_diff === 0 && next < now)
                {
                    next.setUTCDate(next.getUTCDate() + 7);
                }

                next.setUTCDate(next.getUTCDate() + day_diff);

                next.setUTCHours(next.getUTCHours() + DiffTimeZone.hour);
                next.setUTCMinutes(next.getUTCMinutes() + DiffTimeZone.min);

                const str = 
                `${StrWeek[next.getUTCDay()]} às ` +
                `${String(next.getUTCHours()).padStart(2,'0')} h ` + `${String(next.getUTCMinutes()).padStart(2,'0')} m`;

                document.getElementById(event.element.event).innerText = str;

                const remaining = (next.getTime() - appdate);
                
                const timestamp = Math.floor(remaining / 1000);

                const hours = Math.floor(timestamp / 3600);

                const minutes = Math.floor((timestamp % 3600) / 60);

                const seconds = timestamp % 60;

                const doc = `${String(hours).padStart(2, '0')} h ` + `${String(minutes).padStart(2, '0')} m ` + `${String(seconds).padStart(2, '0')} s`

                document.getElementById(event.element.diff).innerText = doc;

                break;
            }

            case "date":
            {
                const now = new Date(skydate);
                const next_date = new Date(schedule.isodate);
                
                next_date.setUTCHours(next_date.getUTCHours() + DiffTimeZone.hour);
                next_date.setUTCMinutes(next_date.getUTCMinutes() + DiffTimeZone.min);

                let remaining = (next_date.getTime() - now.getTime());

                console.log(next_date.getUTCHours(), now.getUTCHours());
                let str;
                
                if(remaining < 604800 * 1000)
                {
                    const weekday = StrWeek[next_date.getUTCDay()];
                    const hour  = String(next_date.getUTCHours()).padStart(2, '0');
                    const min   = String(next_date.getUTCMinutes()).padStart(2, '0');
                    const sec   = String(next_date.getUTCSeconds()).padStart(2, '0');
                    str = `${ weekday } às ${ hour }:${ min }:${ sec }`;
                }

                else
                {
                    const day   = String(next_date.getUTCDate()).padStart(2, '0');
                    const month = String(next_date.getUTCMonth() + 1).padStart(2, '0');
                    const year  = String(next_date.getUTCFullYear()).padStart(4, '0');
                    const hour  = String(next_date.getUTCHours()).padStart(2, '0');
                    const min   = String(next_date.getUTCMinutes()).padStart(2, '0');
                    const sec   = String(next_date.getUTCSeconds()).padStart(2, '0');
                    str = `${ day }/${ month }/${ year } às ${ hour }:${ min }:${ sec }`;
                }

                document.getElementById(event.element.event).innerText = str;

                const timestamp = Math.floor(remaining / 1000);

                const days      = Math.floor(timestamp / 86400);
                const hours     = Math.floor(timestamp / 3600);
                const minutes   = Math.floor((timestamp % 3600) / 60);
                const seconds   = timestamp % 60;

                const doc = `${String(days).padStart(2, '0')} dias ` + `${String(hours).padStart(2, '0')} h ` + `${String(minutes).padStart(2, '0')} m ` + `${String(seconds).padStart(2, '0')} s`

                document.getElementById(event.element.diff).innerText = doc;

                break;
            }

            default:
    
        }
        //console.log(schedule.type);
    }

}

document.addEventListener('scroll', () => 
{
    const bg = document.querySelector('.background-layer');
    if (bg) bg.style.transform = `translate3d(0, ${window.scrollY * 0.18}px, 0)`;
}, { passive: true });

document.querySelector('[data-theme-toggle]').addEventListener('click', () => 
{
    const root = document.documentElement;
    const nextTheme = root.dataset.theme === 'light' ? 'dark' : 'light';
    root.dataset.theme = nextTheme;
    document.querySelector('.theme-toggle-icon').innerText = nextTheme === 'light' ? '☀' : '☾';
});