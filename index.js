import { getRequestHeaders } from '../../../../script.js';
import { ToolManager } from '../../../tool-calling.js';
import { isValidUrl } from '../../../utils.js';

const getWebPageContentSchema = Object.freeze({
    $schema: 'http://json-schema.org/draft-04/schema#',
    type: 'object',
    properties: {
        url: {
            type: 'string'
        },
    },
    required: [
        'url',
    ],
});

const getYouTubeVideoScriptSchema = Object.freeze({
    $schema: 'http://json-schema.org/draft-04/schema#',
    type: 'object',
    properties: {
        url: {
            type: 'string'
        },
    },
    required: [
        'url',
    ],
});

function getUserEnvironment() {
    const dateTimeOptions = Intl.DateTimeFormat().resolvedOptions();
    const locale = localStorage.getItem('language') || dateTimeOptions.locale;
    const date = new Date();
    const timeZone = dateTimeOptions.timeZone;
    const localDate = date.toLocaleString(locale, { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' });
    const localTime = date.toLocaleString(locale, { hour: 'numeric', minute: 'numeric', second: 'numeric', hour12: false });
    return { locale, localDate, localTime, timeZone };
}

async function getWebPageContent({ url }) {
    if (!url) throw new Error('URL is required');
    if (!isValidUrl(url)) throw new Error('Invalid URL');

    const result = await fetch('/api/search/visit', {
        method: 'POST',
        headers: getRequestHeaders(),
        body: JSON.stringify({ url }),
    });

    if (!result.ok) {
        throw new Error('Failed to fetch web page content');
    }

    const blob = await result.blob();
    const text = await blob.text();

    return text;
}

async function getYouTubeVideoScript({ url }) {
    if (!url) throw new Error('URL is required');
    if (!isValidUrl(url)) throw new Error('Invalid URL');

    const parseId = (url) => {
        // If the URL is already an ID, return it
        if (/^[a-zA-Z0-9_-]{11}$/.test(url)) {
            return url;
        }

        const regex = /^.*(?:(?:youtu\.be\/|v\/|vi\/|u\/\w\/|embed\/|shorts\/)|(?:(?:watch)?\?v(?:i)?=|&v(?:i)?=))([^#&?]*).*/;
        const match = url.match(regex);
        return (match?.length && match[1] ? match[1] : url);
    };

    const id = parseId(url);
    const result = await fetch('/api/search/transcript', {
        method: 'POST',
        headers: getRequestHeaders(),
        body: JSON.stringify({ id }),
    });

    if (!result.ok) {
        throw new Error('Failed to fetch YouTube video transcript');
    }

    const blob = await result.blob();
    const text = await blob.text();

    return text;
}

(function () {
    ToolManager.registerFunctionTool(
        'GetUserEnvironment',
        'Returns the user environment information: preferred language, local date and time, and timezone.',
        {},
        getUserEnvironment,
    );

    ToolManager.registerFunctionTool(
        'GetYouTubeVideoScript',
        'Returns a YouTube video script. Called when a YouTube video URL is detected in the user input.',
        getYouTubeVideoScriptSchema,
        getYouTubeVideoScript,
    );

    ToolManager.registerFunctionTool(
        'GetWebPageContent',
        'Returns the text content of a web page. Called when a URL is detected in the user input.',
        getWebPageContentSchema,
        getWebPageContent,
    );
})();
