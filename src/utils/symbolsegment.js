export const symbolSegment = ['FOREX', 'CRYPTO', 'COMEX'];

export function formatInstrument(data) {
    if (!data) {
        return {
            symbol: "",
            strike: ""
        };
    }

    if (data.instrument_type === "FUT") {
        return {
            symbol: data.script || data.symbol,
            strike: ""
        };
    }

    if (
        data.segment === "INDEX-OPT" ||
        data.segment === "NFO-OPT" ||
        data.segment === "BFO-OPT" ||
        data.segment === "STOCK-OPT" ||
        data.segment === "MCX-OPT"
    ) {
        return {
            symbol: data.script || data.symbol,
            strike: data.strike
                ? String(parseInt(data.strike))
                : ""
        };
    }

    return {
        symbol: data.symbol,
        strike: ""
    };
}

export const isMarketClosed = (exchange) => {
    const exchangeUpper = String(exchange || '').toUpperCase();

    if (exchangeUpper === 'CRYPTO') {
        return false;
    }

    const now = new Date();
    const istOffset = 5.5 * 60 * 60 * 1000;
    const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
    const istDate = new Date(utc + istOffset);

    const day = istDate.getDay();
    const hour = istDate.getHours();
    const minute = istDate.getMinutes();
    const timeInMinutes = hour * 60 + minute;

    if (day === 0 || day === 6) {
        return true;
    }

    if (exchangeUpper === 'FOREX' || exchangeUpper === 'COMEX') {
        return false;
    }

    if (exchangeUpper === 'MCX') {
        return timeInMinutes < (9 * 60) || timeInMinutes > (23 * 60 + 30);
    }

    return timeInMinutes < (9 * 60 + 15) || timeInMinutes > (15 * 60 + 30);
};
