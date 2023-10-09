


# monsterapi

**monsterapi** is a JavaScript client library for interacting with the Monster API. It provides an easy way to access the API's features and integrate them into your applications.



### Available Models

#### Text Generation / Language Models (LLMs):

1. falcon-7b-instruct
2. mpt-7b-instruct
3. llama2-7b-chat
4. falcon-40b-instruct
5. mpt-30b-instruct

**Note:** Other models are accessible through the client but are not activated yet. They will be updated shortly.

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
import MonsterApiClient from 'monsterapi';
```
or

```javascript
const MonsterApiClient = require('monsterapi');
```
### Initialize the Client

Create an instance of the `MonsterApiClient` class by providing your API key:

```javascript
const client = new MonsterApiClient('your-api-key');
```

Replace `'your-api-key'` with your actual Monster API key.

### Get Response

You can use the `get_response` method to generate the Process Id of your request:

```javascript

const model = 'whisper'; // Replace with a valid model name
const input = {
  // Replace with valid input data for the model
};

client.get_response(model, input)
  .then((result) => {
    // Handle the status response from the API
    console.log('Generated Data:', result);
  })
  .catch((error) => {
    // Handle API errors
    console.error('Error:', error);
  });
```

### Check Status

You can use the `get_status` method to check the status of a Process Id:

```javascript
const processId = 'your-process-id'; // Replace with the actual process ID

client.get_status(processId)
  .then((status) => {
    // Handle the status response from the API
    console.log('Status:', status);
  })
  .catch((error) => {
    // Handle API errors
    console.error('Error:', error);
  });
```

### Wait and Get Result

You can use the `wait_and_get_result` method it take process id and wait till status get completed and retrieve the result:

```javascript
const processId = 'your-process-id'; // Replace with the actual process ID

client.wait_and_get_result(processId)
  .then((result) => {
    // Handle the generated content result
    console.log('Generated content result:', result);
  })
  .catch((error) => {
    // Handle API errors or timeout
    console.error('Error:', error);
  });
```
### Generate Content

You can use the `generate` method to retrive the result directly without using each function separately. `generate` method Generate the process Id and Retrive it Result :

```javascript
const model = 'whisper'; // Replace with a valid model name
const input = {
  // Replace with valid input data for the model
};

client.generate(model, input)
  .then((response) => {
    // Handle the response from the API
    console.log('Generated content:', response);
  })
  .catch((error) => {
    // Handle API errors
    console.error('Error:', error);
  });
```

## Documentation

For more details on the **monsterapi** library and its methods, refer to the [documentation](https://developer.monsterapi.ai/reference/getting-started-1).

## License

This project is licensed under the MIT License.
```
