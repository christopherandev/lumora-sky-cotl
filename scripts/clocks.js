let     AppTimeZone  = { hour: 0, min: 0};
const   SkyTimeZone  = { hour: -7, min: 0};
let     DiffTimeZone = { hour: 0, min: 0};
let     Events;

const StrWeek  = [ "Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado" ];
const StrMonth = [ "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro" ];

async function init()
{
    const response = await fetch("./events.json");
    Events = await response.json();
}

window.ClockPage = 
{
    updateInterval: null,

    init: async function() 
    {
        const date = new Date();
        const user_tz = date.getTimezoneOffset() * (-1);

        AppTimeZone.hour = Math.floor(user_tz / 60);
        AppTimeZone.min = user_tz % 60;

        DiffTimeZone = 
        { 
            hour: (AppTimeZone.hour - SkyTimeZone.hour), 
            min:  (AppTimeZone.min - SkyTimeZone.min) 
        };
        
        const app_utc = `${negPad(AppTimeZone.hour, 2)}:${String(AppTimeZone.min).padStart(2, '0')}`;
        const sky_utc = `${negPad(SkyTimeZone.hour, 2)}:${String(SkyTimeZone.min).padStart(2, '0')}`;

        document.getElementById("had-local-gmt").innerText  = `UTC ${app_utc}`;
        document.getElementById("had-global-gmt").innerText = `UTC ${sky_utc}`;
       
        await init();

        this.OnAppUpdate();

        this.updateInterval = setInterval(() => 
        {
            this.OnAppUpdate();
        }, 1000);
    },

  
    OnAppUpdate: function() 
    {
        // Data atual no UTC +00:00
        const appdate = new Date();
        const skydate = new Date(); 

        // Data convertida para UTC -07:00 (ATENÇÃO: appdate e skydate estão deslocados de UTC +0)
        setHourOffset(appdate,   AppTimeZone.hour);
        setMinuteOffset(appdate, AppTimeZone.min);
        setHourOffset(skydate,   SkyTimeZone.hour);
        setMinuteOffset(skydate, SkyTimeZone.min);

        document.getElementById("clk-local").innerText = `${getHour(appdate)}:${getMin(appdate)}:${getSec(appdate)}`;
        document.getElementById("clk-global").innerText = `${getHour(skydate)}:${getMin(skydate)}:${getSec(skydate)}`;

        for(const event of Events)
        {
            const schedule  = event.schedule;

            let   str_next = '';
            let   str_diff = '';

            switch(schedule.type)
            {
                /* Por padrão, colocaremos a referência no UTC -7, tanto para lógica quanto events.json  */
                
                /*
                    now  -> estara sempre no UTC do usuário
                    next -> 
                            começa em UTC -7, recebe offset para próxima ocorrência e já é 
                            convertido para o UTC do usuário pelo DiffTimeZone
                */
                case "daily":
                {
                    const now   = new Date(appdate);
                    let   next  = new Date(skydate);
            
                    const at = schedule.at;
                    const [hour, min] = at.split(':').map(Number);
                        
                    setRawHour(next, hour);
                    setRawMinute(next, min);
                    setRawSecond(next, 0);

                    let elapsed = (next - skydate);

                    if(elapsed < 0)
                    {
                        elapsed += days(1);
                        setDayOffset(next, 1);
                        str_next = "Amanhã às ";
                    }

                    else
                        str_next = "Hoje às ";

                    setHourOffset(next, DiffTimeZone.hour);
                    setMinuteOffset(next, DiffTimeZone.min);

                    str_next += `${getHour(next)} : ` + `${getMin(next).padStart(2, '0')} : ` + `${getSec(next).padStart(2, '0')}`;
                    
                    const remaining = (next - now);

                    str_diff = `${getHoursFromMilis(remaining)} h ` + `${getMinutesFromMilis(remaining)} m ` + `${getSecondsFromMilis(remaining)} s`;
                
                    break;
                }

                case "interval":
                {
                    const now   = new Date(skydate);
                    const start = new Date(now);

                    const every       = minutes(schedule.every);
                    const [hour, min] = schedule.start.split(':').map(Number);

                    setRawHour(start, hour, min, 0);
                
                    const elapsed = (now - start);

                    let next = new Date(start.getTime() + Math.ceil(elapsed / every) * every);
                    
                    if(now.getUTCDate() > next.getUTCDate())
                        str_next = "Ontem às ";
                    else if(now.getUTCDate() < next.getUTCDate())
                    {
                        str_next = "Amanhã às ";
                    }
                    else
                        str_next = "Hoje às ";

                    setHourOffset(next, DiffTimeZone.hour);
                    setMinuteOffset(next, DiffTimeZone.min);

                    str_next += `${getHour(next)} : ` + `${getMin(next).padStart(2, '0')} : ` + `${getSec(next).padStart(2, '0')}`;
                    
                    const remaining = (next - appdate);

                    str_diff = `${getHoursFromMilis(remaining)} h ` + `${getMinutesFromMilis(remaining)} m ` + `${getSecondsFromMilis(remaining)} s`;
                
                    break;
                }

                case "weekly":
                {
                    const now         = new Date(skydate);
                    const next        = new Date(now);

                    const weekday     = schedule.weekday;
                    const now_weeday  = now.getUTCDay();
                    const [hour, min] = schedule.at.split(':').map(Number);

                    setRawHour(next, hour, min, 0);

                    const day_diff = (weekday - now_weeday + 7) % 7;
                    
                    if(day_diff === 0 && next < now)
                        next.setUTCDate(next.getUTCDate() + 7);
                
                    next.setUTCDate(next.getUTCDate() + day_diff);

                    if(now.getUTCDate() > next.getUTCDate())
                        str_next = "Ontem às ";
                    else if((now.getUTCDate() + 1) === next.getUTCDate())
                    {
                        str_next = "Amanhã às ";
                    }
                    else if(now.getUTCDate() === next.getUTCDate())
                        str_next = "Hoje às ";
                    else
                        str_next = `${StrWeek[next.getUTCDay()]} às `;

                    setHourOffset(next, DiffTimeZone.hour);
                    setMinuteOffset(next, DiffTimeZone.min);

                    str_next += `${getHour(next)} : ` + `${getMin(next).padStart(2, '0')} : ` + `${getSec(next).padStart(2, '0')}`;
                    
                    const remaining = (next - appdate);
                    
                    str_diff = `${getHoursFromMilis(remaining)} h ` + `${getMinutesFromMilis(remaining)} m ` + `${getSecondsFromMilis(remaining)} s`;
                
                    break;
                }

                case "date":
                {
                    const now  = new Date(skydate);
                    const next = new Date(schedule.isodate);

                    if(next < now) 
                    {
                        str_next = 'carregando...';
                        str_diff = 'O evento acabou';
                        break;
                    }

                    const remaining = (next - now);
                    
                    setHourOffset(next, DiffTimeZone.hour);
                    setMinuteOffset(next, DiffTimeZone.min);
                    
                    if(remaining < weeks(1))
                    {
                        str_next = `${ getDayName(next) } às ${ getHour(next) } : ${ getMin(next) } : ${ getSec(next) }`;
                        str_diff = `${getHoursFromMilis(remaining)} h ` + `${getMinutesFromMilis(remaining)} m ` + `${getSecondsFromMilis(remaining)} s`;
                    }
                    else
                    {
                        str_next = `${ getDay(next) } de ${ getMonthName(next) } às ${ getHour(next) } : ${ getMin(next) }:${ getSec(next) }`;
                        str_diff = `${getDaysFromMilis(remaining)} dias ` + `${getHoursFromMilis(remaining)} h ` + `${getMinutesFromMilis(remaining)} m ` + `${getSecondsFromMilis(remaining)} s`;
                    }

                    break;
                }

                default:
                {
                    break;
                }
            }

            document.getElementById(event.element.event).innerText = str_next;
            document.getElementById(event.element.diff).innerText  = str_diff;
        }
    },

    destroy: function() 
    {
        if(this.updateInterval) 
        {
            clearInterval(this.updateInterval);
            this.updateInterval = null;
        }
    }
};

const negPad = (number, padlen) => 
{
    const signal = number < 0 ? '-' : '';
    const abs = Math.abs(number).toString();
    return signal + abs.padStart(padlen, '0');
};

const getHour = (date) => { return String(date.getUTCHours()).padStart(2, '0'); };
const getMin = (date) => { return String(date.getUTCMinutes()).padStart(2, '0'); };
const getSec = (date) => { return String(date.getUTCSeconds()).padStart(2, '0'); };
const getDay = (date) => { return String(date.getUTCDate()).padStart(2, '0'); };
const getDayName = (date) => { return StrWeek[date.getUTCDay()]; };
const getMonthName = (date) => { return StrMonth[date.getUTCMonth()]; };
const getYear = (date) => { return String(date.getUTCFullYear()).padStart(4, '0'); };

const setDayOffset   = (date, value) => { date.setUTCDate(date.getUTCDate() + value) }
const setHourOffset   = (date, value) => { date.setUTCHours(date.getUTCHours() + value) }
const setMinuteOffset = (date, value) => { date.setUTCMinutes(date.getUTCMinutes() + value) }
const setRawHour = (date, hour, min = 0, sec = 0) => { date.setUTCHours(hour, min, sec) }
const setRawMinute = (date, value) => { date.setUTCMinutes(value) }
const setRawSecond = (date, value) => { date.setUTCSeconds(value) }

const getDaysFromMilis = (timestamp) => { return String(Math.floor(timestamp / 86400000)).padStart(2, '0') }
const getHoursFromMilis = (timestamp) => { return String(Math.floor(timestamp % 86400000 / 3600000)).padStart(2, '0') }
const getMinutesFromMilis = (timestamp) => { return String(Math.floor((timestamp % 3600000) / 60000)).padStart(2, '0') }
const getSecondsFromMilis = (timestamp) => { return String(Math.floor((timestamp % 60000) / 1000)).padStart(2, '0') }

const weeks   = (w) => 604800000 * w;
const days    = (d) => 86400000 * d;
const hours   = (h) => 3600000 * h;
const minutes = (m) => 60000 * m;
const seconds = (s) => 1000 * s;


