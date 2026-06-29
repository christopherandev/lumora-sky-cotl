let     AppTimeZone  = { hour: 0, min: 0};
const   SkyTimeZone  = { hour: -7, min: 0};
let     DiffTimeZone = { hour: 0, min: 0};
let     Events;

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

            default:
    
        }
        //console.log(schedule.type);
    }

}
