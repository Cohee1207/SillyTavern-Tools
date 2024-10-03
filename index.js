import { getRequestHeaders } from '../../../../script.js';
import { ToolManager } from '../../../tool-calling.js';
import { isValidUrl, getReadableText } from '../../../utils.js';

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

const parseId = (url) => {
    // If the URL is already an ID, return it
    if (/^[a-zA-Z0-9_-]{11}$/.test(url)) {
        return url;
    }

    const regex = /^.*(?:(?:youtu\.be\/|v\/|vi\/|u\/\w\/|embed\/|shorts\/)|(?:(?:watch)?\?v(?:i)?=|&v(?:i)?=))([^#&?]*).*/;
    const match = url.match(regex);
    return (match?.length && match[1] ? match[1] : url);
};

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
    const html = await blob.text();
    const domParser = new DOMParser();
    const document = domParser.parseFromString(DOMPurify.sanitize(html), 'text/html');
    const title = document.querySelector('title')?.textContent;
    const text = await getReadableText(document, 'body');
    return { title, text };
}

async function getYouTubeVideoScript({ url }) {
    if (!url) throw new Error('URL is required');
    if (!isValidUrl(url)) throw new Error('Invalid URL');


    const id = parseId(url);
    const result = await fetch('/api/search/transcript', {
        method: 'POST',
        headers: getRequestHeaders(),
        body: JSON.stringify({ id, json: true }),
    });

    if (!result.ok) {
        throw new Error('Failed to fetch YouTube video transcript');
    }

    const text = await result.text();
    try {
        const data = JSON.parse(text);
        const transcript = data.transcript;
        const domParser = new DOMParser();
        const document = domParser.parseFromString(DOMPurify.sanitize(data.html), 'text/html');
        const title = document.querySelector('meta[itemprop="name"]')?.getAttribute('content');
        const description = document.querySelector('meta[itemprop="description"]')?.getAttribute('content');
        const date = document.querySelector('meta[itemprop="uploadDate"]')?.getAttribute('content');
        const author = document.querySelector('link[itemprop="name"]')?.getAttribute('content');
        const views = document.querySelector('meta[itemprop="interactionCount"]')?.getAttribute('content');

        return { title, date, views, author, description, transcript };
    } catch (error) {
        return { transcript: text };
    }
}

(function () {
    ToolManager.registerFunctionTool({
        name: 'GetUserEnvironment',
        displayName: 'User Environment',
        description: 'Returns the user environment information: preferred language, local date and time, and timezone.',
        parameters: {},
        action: getUserEnvironment,
        formatMessage: () => '', // Suppress the default message
    });

    ToolManager.registerFunctionTool({
        name: 'GetYouTubeVideoScript',
        displayName: 'YouTube Video Script',
        description: 'Returns a YouTube video script. Called when a YouTube video URL is detected in the user input.',
        parameters: getYouTubeVideoScriptSchema,
        action: getYouTubeVideoScript,
        formatMessage: (args) => args && args.url ? `Getting video script for ${parseId(args.url)}...` : '',
    });

    ToolManager.registerFunctionTool({
        name: 'GetWebPageContent',
        displayName: 'Web Page Content',
        description: 'Returns the text content of a web page. Called when a URL is detected in the user input.',
        parameters: getWebPageContentSchema,
        action: getWebPageContent,
        formatMessage: (args) => args && args.url ? `Getting content from ${new URL(args.url).hostname}...` : '',
    });
})();
