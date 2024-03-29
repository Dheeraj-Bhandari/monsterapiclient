# monsterapi

**monsterapi** is a JavaScript client library for adding Generative AI model capabilities in your application using Monster API. With this package you can send generative AI requests for Large language models hosted by MonsterAPI..

### Available Models

#### Text Generation / Language Models (LLMs):

1. falcon-7b-instruct
2. mpt-7b-instruct
3. llama2-7b-chat

#### Image Generation:

1. txt2img - stable-diffusion v1.5
2. sdxl - stable-diffusion XL V1.0
3. pix2pix - Instruct-pix2pix
4. img2img - Image to Image using Stable Diffusion

#### Speech Generation:

1. sunoai-bark - Bark (Sunoai Bark)
2. whisper - Whisper Large V2

## Usage

## Installation

You can install the `monsterapi` package using npm or yarn:

```bash
npm install monsterapi
```

or

```bash
yarn add monsterapi
```

### Import the Library

To use the **monsterapi** library in your project, import the `MonsterApiClient` class:

```javascript
import MonsterApiClient from "monsterapi";
```

or

```javascript
const { default: MonsterApiClient } = require("monsterapi");
```

### Initialize the Client

Create an instance of the `MonsterApiClient` class by providing your API key:

```javascript
const client = new MonsterApiClient("your-api-key");
```

Replace `'your-api-key'` with your actual Monster API key.


---

# New Feature: Synchronous Large Language Model (LLM) API

We're excited to introduce a new feature to the **monsterapi** package: the Synchronous Large Language Model (LLM) API. This addition allows users to directly generate responses from our LLMs in a synchronous manner, streamlining the integration into applications requiring real-time AI-generated text.

## How to Use the Synchronous LLM API

To use the synchronous LLM API, you will utilize the `generateSync` method of the `MonsterApiClient`. This method simplifies the process of sending requests and receiving immediate responses from our LLMs.

### Generate Synchronous Responses

Here's how to generate responses synchronously:

```javascript

const requestData = {
    messages: [
        {"role": "user", "content": "How many helicopters can a human eat in one sitting?"},
        {"role": "system", "content": "You are a friendly chatbot who always responds in the style of a pirate"}
    ],
    model: "TinyLlama/TinyLlama-1.1B-Chat-v1.0",
    top_k: 121,
    top_p: 0.5,
    temp: 0.65,
    max_length: 128,
    repetition_penalty: 1.2,
    beam_size: 1
};

client.generateSync(requestData)
    .then(response => {
        console.log("Synchronous response:", response);
    })
    .catch(error => {
        console.error("Error:", error);
    });
```

This method expects a `requestData` object, which includes parameters for `messages`, `model`, and other configuration options detailed in the API documentation. The method returns a promise that resolves with the generated response.

## Supported Models

With the introduction of our synchronous LLM API, you can now access several cutting-edge models for real-time text generation, including:

- **TinyLlama/TinyLlama-1.1B-Chat-v1.0**: A compact, efficient model suitable for applications with limited computational resources.
- **microsoft/phi-2**: Excels in reasoning and language understanding, setting a new standard for base language models.
- **HuggingFaceH4/zephyr-7b-beta**: A refined iteration of AI models enhanced for diverse applications.
- **mistralai/Mistral-7B-Instruct-v0.2**: Improved version fine-tuned for instructive responses.

Each model is designed to meet specific needs, from chat applications to content generation. Explore the capabilities of each model to find the perfect fit for your application.

# Asynchronous Functions (Can also act as Synchronous)
### Get Response

You can use the `get_response` method to generate the Process Id of your request:

```javascript
const model = "whisper"; // Replace with a valid model name
const input = {
  // Replace with valid input data for the model
};

client
  .get_response(model, input)
  .then((result) => {
    // Handle the status response from the API
    console.log("Generated Data:", result);
  })
  .catch((error) => {
    // Handle API errors
    console.error("Error:", error);
  });
```

### Check Status

You can use the `get_status` method to check the status of a Process Id:

```javascript
const processId = "your-process-id"; // Replace with the actual process ID

client
  .get_status(processId)
  .then((status) => {
    // Handle the status response from the API
    console.log("Status:", status);
  })
  .catch((error) => {
    // Handle API errors
    console.error("Error:", error);
  });
```

### Wait and Get Result

You can use the `wait_and_get_result` method it take process id and wait till status get completed and retrieve the result:

```javascript
const processId = "your-process-id"; // Replace with the actual process ID

client
  .wait_and_get_result(processId)
  .then((result) => {
    // Handle the generated content result
    console.log("Generated content result:", result);
  })
  .catch((error) => {
    // Handle API errors or timeout
    console.error("Error:", error);
  });
```

### Generate Content

You can use the `generate` method to retrive the result directly without using each function separately. `generate` method Generate the process Id and Retrive it Result :

```javascript
const model = "whisper"; // Replace with a valid model name
const input = {
  // Replace with valid input data for the model
};

client
  .generate(model, input)
  .then((response) => {
    // Handle the response from the API
    console.log("Generated content:", response);
  })
  .catch((error) => {
    // Handle API errors
    console.error("Error:", error);
  });
```

### Handle File Upload From Local Device

You can use the `uploadFile` method to handle file uploads from your local computer and use them in various model requests.

#### Using `uploadFile` in a Browser Environment (e.g. React, Next.js)

In browser-based environments, such as React or Next.js, you can use the `uploadFile` method as follows:

```javascript
const model = 'img2img'; // Replace with a valid model name
const selectedFile = // Replace with your local file input

const response = await client.uploadFile(selectedFile); // Use the 'await' keyword to handle the Promise

const input = {
  // Replace with valid input data for the model
  init_image_url: response, // Use the response URL as the 'file' input
};

// Make a model request using the input
const generatedResponse = await client.generate(model, input);

// Handle the response from the API
console.log('Generated content:', generatedResponse);

```

#### Using `uploadFile` with Node.js

In a Node.js environment, the `uploadFile` method returns an object containing both the `upload_url` and `download_url`. You should perform the upload request directly to the `upload_url` API. Here's an example of how to use the `uploadFile` method in Node.js. For More Details Visit https://developer.monsterapi.ai/reference/get_upload:

```javascript

const model = 'img2img'; // Replace with a valid model name
const selectedFile = // Replace with your local file input

const uploadResponse = await client.uploadFile(selectedFile); // Use the 'await' keyword to handle the Promise

// The response object contains the 'upload_url' and 'download_url' fields
const { upload_url, download_url } = uploadResponse;

// Now, you can use the 'upload_url' for direct file upload
// Perform an HTTP PUT request to 'upload_url' with the file content

// After successful upload, you can use the 'download_url' as an input in your model request
const input = {
  // Replace with valid input data for the model
  init_image_url: download_url, // Use the 'download_url' as the 'file' input
};

// Make a model request using the input
const generatedResponse = await client.generate(model, input);

// Handle the response from the API
console.log('Generated content:', generatedResponse);


// Please note that all files uploaded via the uploadFile function are automatically removed from the database after 30 Min for privacy and security purposes.

```

## Documentation

For more details on the **monsterapi** library and its models, refer to the [documentation](https://developer.monsterapi.ai/reference/getting-started-1).
