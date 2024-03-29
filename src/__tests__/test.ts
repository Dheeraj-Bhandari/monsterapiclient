import { expect } from 'chai';
import * as sinon from 'sinon'; // Import sinon properly
import * as dotenv from 'dotenv';
import fetchMock from 'fetch-mock'; // Import fetch-mock
dotenv.config();

import  MonsterApiClient  from '../index'; // Adjust the import path as needed

describe('MonsterApiClient', () => {
    // Mock API key for testing purposes
    const apiKey = process.env.MONSTER_API_KEY || ""; // Replace with your actual API key
    let sandbox: sinon.SinonSandbox;

    // Create an instance of the MonsterApiClient
    const monsterClient = new MonsterApiClient(apiKey);

    before(() => {
        sandbox = sinon.createSandbox();
    });

    afterEach(() => {
        sandbox.restore();
        fetchMock.restore(); // Reset fetch-mock routes
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

        // Stubbing the generate method
        sandbox.stub(monsterClient, 'get_response' as keyof MonsterApiClient)
            .resolves({
                process_id: 'valid-process-id'
            });

        const response: Record<string, any> = await monsterClient.get_response(modelName, inputData);

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

        // Stubbing the get_response method to simulate an error response
        sandbox.stub(monsterClient, 'get_response' as keyof MonsterApiClient)
            .throws(new Error('Invalid model: invalid-model!'));

        try {
            await monsterClient.get_response(modelName, inputData);
        } catch (error: any) { // Specify the error type as any
            expect(error.message).to.include('Invalid model:');
        }
    });

    it('should get the status for a valid processId', async () => {
        const processId = '3cf44e87-cb4e-42c2-9ef4-e1bef7ac7065'; // Replace with a valid process ID

        // Stubbing the get_status method
        sandbox.stub(monsterClient, 'get_status' as keyof MonsterApiClient)
            .resolves({
                status: 'COMPLETED'
            });

        const statusResponse: Record<string, any> = await monsterClient.get_status(processId);

        expect(statusResponse).to.have.property('status');
        expect(statusResponse.status).to.equal('COMPLETED');
    });

    it('should handle invalid processIds', async () => {
        const processId = 'invalid-process-id'; // Replace with an invalid process ID

        // Stubbing the get_status method to simulate an error response
        sandbox.stub(monsterClient, 'get_status' as keyof MonsterApiClient)
            .throws(new Error('Invalid process ID: invalid-process-id!'));

        try {
            await monsterClient.get_status(processId);
        } catch (error: any) { // Specify the error type as any
            expect(error.message).to.include('Invalid process ID:');
        }
    });

    it('should wait for the result of a completed process', async () => {
        const processId = '3cf44e87-cb4e-42c2-9ef4-e1bef7ac7065'; // Replace with a completed process ID

        // Stubbing the wait_and_get_result method
        sandbox.stub(monsterClient, 'wait_and_get_result' as keyof MonsterApiClient)
            .resolves({
                output: 'result-output' // Adjust based on your response structure
            });

        const resultResponse: Record<string, any> = await monsterClient.wait_and_get_result(processId, 60000);

        expect(resultResponse).to.have.property('output');
    });

    it('should handle timeouts for long-running processes', async () => {
        const processId = '3cf44e87-cb4e-42c2-9ef4-e1bef7ac7065'; // Replace with a process ID that takes longer than the specified timeout

        // Stubbing the wait_and_get_result method to simulate a timeout
        sandbox.stub(monsterClient, 'wait_and_get_result' as keyof MonsterApiClient)
            .throws(new Error('Timeout waiting for process: ' + processId));

        try {
            await monsterClient.wait_and_get_result(processId, 1);
        } catch (error: any) { // Specify the error type as any
            expect(error.message).to.include('Timeout waiting for process:');
        }
    });
});
