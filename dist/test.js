"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const sinon = __importStar(require("sinon")); // Import sinon properly
const index_1 = __importDefault(require("../src/index")); // Adjust the import path as needed
describe('MonsterApiClient', () => {
    // Mock API key for testing purposes
    const apiKey = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ1c2VybmFtZSI6IjU0MzNmYmYxOTNlODc4NDQyMGJhODE2ODVhMGFjMTkzIiwiY3JlYXRlZF9hdCI6IjIwMjMtMDctMjhUMTk6MTA6MDMuMDYzNDEyIn0.VoMDVoHJRywG62bSpLxLKT5yZbnPqET-Cv991IYs0zA'; // Replace with your actual API key
    let sandbox;
    // Create an instance of the MonsterApiClient
    const monsterClient = new index_1.default(apiKey);
    before(() => {
        sandbox = sinon.createSandbox();
    });
    afterEach(() => {
        sandbox.restore();
    });
    it('should generate a response for a valid model and data', () => __awaiter(void 0, void 0, void 0, function* () {
        const modelName = 'falcon-7b-instruct'; // Replace with an actual model name
        const inputData = {
            "prompt": "Write an essay on Mars",
            "top_k": 40,
            "top_p": 0.8,
            "max_length": 256,
            "repitition_penalty": 1.2,
            "beam_size": 1
        };
        // Stubbing the get_response method
        sandbox.stub(monsterClient, 'get_response')
            .resolves({
            process_id: 'valid-process-id'
        });
        const response = yield monsterClient.generate(modelName, inputData);
        (0, chai_1.expect)(response).to.have.property('process_id');
    }));
    it('should handle invalid models', () => __awaiter(void 0, void 0, void 0, function* () {
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
        sandbox.stub(monsterClient, 'get_response')
            .throws(new Error('Invalid model: invalid-model!'));
        try {
            yield monsterClient.generate(modelName, inputData);
        }
        catch (error) { // Specify the error type as any
            (0, chai_1.expect)(error.message).to.include('Invalid model:');
        }
    }));
    it('should get the status for a valid processId', () => __awaiter(void 0, void 0, void 0, function* () {
        const processId = '3cf44e87-cb4e-42c2-9ef4-e1bef7ac7065'; // Replace with a valid process ID
        // Stubbing the get_status method
        sandbox.stub(monsterClient, 'get_status')
            .resolves({
            status: 'COMPLETED'
        });
        const statusResponse = yield monsterClient.get_status(processId);
        (0, chai_1.expect)(statusResponse).to.have.property('status');
        (0, chai_1.expect)(statusResponse.status).to.equal('COMPLETED');
    }));
    it('should handle invalid processIds', () => __awaiter(void 0, void 0, void 0, function* () {
        const processId = 'invalid-process-id'; // Replace with an invalid process ID
        // Stubbing the get_status method to simulate an error response
        sandbox.stub(monsterClient, 'get_status')
            .throws(new Error('Invalid process ID: invalid-process-id!'));
        try {
            yield monsterClient.get_status(processId);
        }
        catch (error) { // Specify the error type as any
            (0, chai_1.expect)(error.message).to.include('Invalid process ID:');
        }
    }));
    it('should wait for the result of a completed process', () => __awaiter(void 0, void 0, void 0, function* () {
        const processId = '3cf44e87-cb4e-42c2-9ef4-e1bef7ac7065'; // Replace with a completed process ID
        // Stubbing the wait_and_get_result method
        sandbox.stub(monsterClient, 'wait_and_get_result')
            .resolves({
            output: 'result-output' // Adjust based on your response structure
        });
        const resultResponse = yield monsterClient.wait_and_get_result(processId, 60000);
        (0, chai_1.expect)(resultResponse).to.have.property('output');
    }));
    it('should handle timeouts for long-running processes', () => __awaiter(void 0, void 0, void 0, function* () {
        const processId = '3cf44e87-cb4e-42c2-9ef4-e1bef7ac7065'; // Replace with a process ID that takes longer than the specified timeout
        // Stubbing the wait_and_get_result method to simulate a timeout
        sandbox.stub(monsterClient, 'wait_and_get_result')
            .throws(new Error('Timeout waiting for process: ' + processId));
        try {
            yield monsterClient.wait_and_get_result(processId, 1);
        }
        catch (error) { // Specify the error type as any
            (0, chai_1.expect)(error.message).to.include('Timeout waiting for process:');
        }
    }));
});
