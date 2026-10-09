const parseInterval = (interval) => {
    if (!interval) return null;

    if (typeof interval === 'string') {
        return parseIntervalValue(interval);
    }

    if (typeof interval === 'object') {
        if (interval.span && interval.type) {
            return {
                span: Number(interval.span),
                type: interval.type
            };
        }

        if (interval.value) {
            return parseIntervalValue(interval.value);
        }
    }

    return null;
};

const parseIntervalValue = (value) => {
    if (value === 'day') {
        return { span: 1, type: 'day' };
    }

    if (value === 'minute') {
        return { span: 1, type: 'minute' };
    }

    const match = String(value).match(/^([0-9]+)minute$/);
    if (!match) {
        console.error('Unsupported interval value:', value);
        return null;
    }

    return {
        span: Number(match[1]),
        type: 'minute'
    };
};

export const calculateFromDate = (interval) => {
    const parsed = parseInterval(interval);
    if (!parsed || !parsed.span || !parsed.type) {
        console.error('Invalid interval for from-date calculation:', interval);
        return null;
    }

    const now = new Date();
    const CANDLES_NEEDED = 2000;
    const minutesPerCandle = parsed.type === 'day'
        ? parsed.span * 1440
        : parsed.span;

    const totalMinutesNeeded = CANDLES_NEEDED * minutesPerCandle;
    const fromDate = new Date(now.getTime() - totalMinutesNeeded * 60 * 1000);

    if (isNaN(fromDate.getTime())) {
        console.error('Invalid date calculated');
        return null;
    }

    return fromDate.toISOString().slice(0, 19);
};

export const getCurrentDate = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');

    return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
};