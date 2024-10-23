# Function Tools Collection

A set of [function tools](https://docs.sillytavern.app/for-contributors/function-calling/) that provide useful utilities for your chats.

## Installation

Install using a third-party extensions installer using the following URL:

```txt
https://github.com/SillyTavern/SillyTavern-Tools
```

## Usage

1. Make sure you're using SillyTavern 1.13.0 or later. Prior versions do not support function tools.
2. Tools are currently only supported by Chat Completion API with the select sources. As a free local option, you can use [Ollama](https://ollama.com/) as a Custom OpenAI-compatible API.
3. "Enable function calling" setting should be enabled in the AI Response Configuration panel.
4. The selected model must support tool calling. Check the model's documentation for more information.

## Available Tools

### GetUserEnvironment

Returns the user environment information: preferred language, local date and time, and timezone.

### GetYouTubeVideoScript

Returns a YouTube video script. Called when a YouTube video URL is detected in the user input.

**MORE TOOLS COMING SOON!**

## Credits

Licensed under AGPLv3.
