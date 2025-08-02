/**
 * 时间工具模块
 * 提供统一的时间处理和格式化功能，支持时区
 */

// 默认时区设置（可通过环境变量配置）
const DEFAULT_TIMEZONE = process.env.TZ || 'Asia/Shanghai';

/**
 * 获取当前时间
 * @param {string} timezone - 时区，默认为Asia/Shanghai
 * @returns {Date} 当前时间
 */
function getCurrentTime(timezone = DEFAULT_TIMEZONE) {
    return new Date();
}

/**
 * 格式化时间为ISO字符串（带时区信息）
 * @param {Date} date - 日期对象
 * @param {string} timezone - 时区
 * @returns {string} ISO格式的时间字符串
 */
function formatToISO(date, timezone = DEFAULT_TIMEZONE) {
    return date.toISOString();
}

/**
 * 格式化时间为本地化字符串
 * @param {Date} date - 日期对象
 * @param {string} timezone - 时区
 * @param {string} locale - 语言环境，默认为zh-CN
 * @returns {string} 本地化时间字符串
 */
function formatToLocal(date, timezone = DEFAULT_TIMEZONE, locale = 'zh-CN') {
    return date.toLocaleString(locale, {
        timeZone: timezone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        timeZoneName: 'short'
    });
}

/**
 * 格式化时间为紧凑格式
 * @param {Date} date - 日期对象
 * @param {string} timezone - 时区
 * @returns {string} 紧凑格式时间字符串 YYYY-MM-DD HH:mm:ss
 */
function formatCompact(date, timezone = DEFAULT_TIMEZONE) {
    return date.toLocaleString('sv-SE', {
        timeZone: timezone
    }).replace('T', ' ');
}

/**
 * 计算时间差并格式化
 * @param {Date} startTime - 开始时间
 * @param {Date} endTime - 结束时间，默认为当前时间
 * @returns {Object} 格式化的时间差对象
 */
function calculateUptime(startTime, endTime = new Date()) {
    const uptime = endTime - startTime;
    
    const days = Math.floor(uptime / (1000 * 60 * 60 * 24));
    const hours = Math.floor((uptime % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((uptime % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((uptime % (1000 * 60)) / 1000);
    
    return {
        total_milliseconds: uptime,
        total_seconds: Math.floor(uptime / 1000),
        days,
        hours,
        minutes,
        seconds,
        formatted: `${days}天 ${hours}小时 ${minutes}分钟 ${seconds}秒`,
        formatted_en: `${days}d ${hours}h ${minutes}m ${seconds}s`,
        human_readable: formatHumanReadableUptime(days, hours, minutes, seconds)
    };
}

/**
 * 格式化人类可读的运行时长
 * @param {number} days - 天数
 * @param {number} hours - 小时数
 * @param {number} minutes - 分钟数
 * @param {number} seconds - 秒数
 * @returns {string} 人类可读的时长字符串
 */
function formatHumanReadableUptime(days, hours, minutes, seconds) {
    const parts = [];
    
    if (days > 0) {
        parts.push(`${days}天`);
    }
    if (hours > 0 || days > 0) {
        parts.push(`${hours}小时`);
    }
    if (minutes > 0 || hours > 0 || days > 0) {
        parts.push(`${minutes}分钟`);
    }
    parts.push(`${seconds}秒`);
    
    return parts.join(' ');
}

/**
 * 获取时区信息
 * @param {string} timezone - 时区
 * @returns {Object} 时区信息对象
 */
function getTimezoneInfo(timezone = DEFAULT_TIMEZONE) {
    const now = new Date();
    const utcTime = now.getTime() + (now.getTimezoneOffset() * 60000);
    
    try {
        const localTime = new Date(utcTime + (getTimezoneOffset(timezone) * 60000));
        
        return {
            timezone,
            offset: getTimezoneOffset(timezone),
            offsetString: formatTimezoneOffset(getTimezoneOffset(timezone)),
            localTime: formatToLocal(now, timezone),
            utcTime: now.toISOString()
        };
    } catch (error) {
        return {
            timezone: 'UTC',
            offset: 0,
            offsetString: '+00:00',
            localTime: now.toISOString(),
            utcTime: now.toISOString(),
            error: `Invalid timezone: ${timezone}`
        };
    }
}

/**
 * 获取时区偏移量（分钟）
 * @param {string} timezone - 时区
 * @returns {number} 偏移量（分钟）
 */
function getTimezoneOffset(timezone) {
    const now = new Date();
    const utc = new Date(now.toLocaleString('en-US', { timeZone: 'UTC' }));
    const local = new Date(now.toLocaleString('en-US', { timeZone: timezone }));
    return (local.getTime() - utc.getTime()) / (1000 * 60);
}

/**
 * 格式化时区偏移量为字符串
 * @param {number} offsetMinutes - 偏移量（分钟）
 * @returns {string} 格式化的偏移量字符串
 */
function formatTimezoneOffset(offsetMinutes) {
    const sign = offsetMinutes >= 0 ? '+' : '-';
    const absOffset = Math.abs(offsetMinutes);
    const hours = Math.floor(absOffset / 60);
    const minutes = absOffset % 60;
    return `${sign}${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
}

/**
 * 创建带时区信息的时间戳对象
 * @param {Date} date - 日期对象，默认为当前时间
 * @param {string} timezone - 时区
 * @returns {Object} 完整的时间戳对象
 */
function createTimestamp(date = new Date(), timezone = DEFAULT_TIMEZONE) {
    return {
        iso: formatToISO(date, timezone),
        local: formatToLocal(date, timezone),
        compact: formatCompact(date, timezone),
        unix: Math.floor(date.getTime() / 1000),
        milliseconds: date.getTime(),
        timezone: getTimezoneInfo(timezone)
    };
}

/**
 * 验证时区是否有效
 * @param {string} timezone - 时区字符串
 * @returns {boolean} 是否为有效时区
 */
function isValidTimezone(timezone) {
    try {
        Intl.DateTimeFormat(undefined, { timeZone: timezone });
        return true;
    } catch (error) {
        return false;
    }
}

/**
 * 获取常用时区列表
 * @returns {Array} 常用时区数组
 */
function getCommonTimezones() {
    return [
        'Asia/Shanghai',    // 中国标准时间
        'Asia/Tokyo',       // 日本标准时间
        'Asia/Seoul',       // 韩国标准时间
        'Asia/Hong_Kong',   // 香港时间
        'Asia/Singapore',   // 新加坡时间
        'Europe/London',    // 英国时间
        'Europe/Paris',     // 中欧时间
        'America/New_York', // 美国东部时间
        'America/Los_Angeles', // 美国西部时间
        'UTC'              // 协调世界时
    ];
}

module.exports = {
    getCurrentTime,
    formatToISO,
    formatToLocal,
    formatCompact,
    calculateUptime,
    getTimezoneInfo,
    createTimestamp,
    isValidTimezone,
    getCommonTimezones,
    DEFAULT_TIMEZONE
};