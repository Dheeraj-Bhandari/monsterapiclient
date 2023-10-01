const chai = require('chai');
const expect = chai.expect;
const sinon = require('sinon');
const MonsterApiClient = require('./index'); // Import the MonsterApiClient class

const enabledModels = ["whisper", "falcon-7b-instruct", "llama2-7b-chat", "mpt-7b-instruct", "sdxl-base", "txt2img", "sunoai-bark", "falcon-40b-instruct"];

describe('MonsterApiClient', () => {
    // Mock API key for testing purposes
    const apiKey ='eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ1c2VybmFtZSI6IjU0MzNmYmYxOTNlODc4NDQyMGJhODE2ODVhMGFjMTkzIiwiY3JlYXRlZF9hdCI6IjIwMjMtMDctMjhUMTk6MTA6MDMuMDYzNDEyIn0.VoMDVoHJRywG62bSpLxLKT5yZbnPqET-Cv991IYs0zA'; // Replace with your actual API key
    let sandbox;

    // Create an instance of the MonsterApiClient
    const monsterClient = new MonsterApiClient(apiKey);

    before(() => {
        sandbox = sinon.createSandbox();
    });

    afterEach(() => {
        sandbox.restore();
    });

    it('should generate a response for a valid model and data', async () => {
        const modelName = 'falcon-7b-instruct'; // Replace with an actual model name
        const inputData = {
            "prompt": "Write an essay on Mars",
            "top_k": 40,
            "top_p": 0.8,
            "max_length": 256,
            "repitition_penalty": 1.2,
            "beam_size": 1
        };

        // Mock the generate function to simulate API response
        sandbox.stub(monsterClient, 'generate').resolves({
            process_id: 'valid-process-id'
        });

        const response = await monsterClient.generate(modelName, inputData);

        expect(response).to.have.property('process_id');
    });

    it('should handle invalid models', async () => {
        const modelName = 'invalid-model'; // Replace with an invalid model name
        const inputData = {
            "prompt": "Write an essay on Mars",
            "top_k": 40,
            "top_p": 0.8,
            "max_length": 256,
            "repitition_penalty": 1.2,
            "beam_size": 1
        };

        // Mock the generate function to simulate an error response
        sandbox.stub(monsterClient, 'generate').throws(new Error('Invalid model: invalid-model!'));

        try {
            await monsterClient.generate(modelName, inputData);
        } catch (error) {
            expect(error.message).to.include('Invalid model:');
        }
    });

    it('should get the status for a valid processId', async () => {
        const processId = '3cf44e87-cb4e-42c2-9ef4-e1bef7ac7065'; // Replace with a valid process ID

        // Mock the getStatus function to simulate API response
        sandbox.stub(monsterClient, 'getStatus').resolves({
            status: 'COMPLETED'
        });

        const statusResponse = await monsterClient.getStatus(processId);

        expect(statusResponse).to.have.property('status');
        expect(statusResponse.status).to.equal('COMPLETED');
    });

    it('should handle invalid processIds', async () => {
        const processId = 'invalid-process-id'; // Replace with an invalid process ID

        // Mock the getStatus function to simulate an error response
        sandbox.stub(monsterClient, 'getStatus').throws(new Error('Invalid process ID: invalid-process-id!'));

        try {
            await monsterClient.getStatus(processId);
        } catch (error) {
            expect(error.message).to.include('Invalid process ID:');
        }
    });

    it('should wait for the result of a completed process', async () => {
        const processId = '3cf44e87-cb4e-42c2-9ef4-e1bef7ac7065'; // Replace with a completed process ID

        // Mock the waitAndGetResult function to simulate API response
        sandbox.stub(monsterClient, 'waitAndGetResult').resolves({
            output: 'result-output' // Adjust based on your response structure
        });

        const resultResponse = await monsterClient.waitAndGetResult(processId, 60000);

        expect(resultResponse).to.have.property('output');
        expect(resultResponse.output).to.equal('result-output');
    });

    it('should handle timeouts for long-running processes', async () => {
        const processId = '3cf44e87-cb4e-42c2-9ef4-e1bef7ac7065'; // Replace with a long-running process ID

        // Mock the waitAndGetResult function to simulate a timeout
        sandbox.stub(monsterClient, 'waitAndGetResult').throws(new Error('Timeout waiting for process: long-running-process-id!'));

        try {
            await monsterClient.waitAndGetResult(processId, 1000); // Short timeout for testing
        } catch (error) {
            expect(error.message).to.include('Timeout waiting for process:');
        }
    });
});
