declare class MonsterApiClient {
    private apiKey;
    constructor(apiKey: string);
    private apiUrl;
    generate(model: string, data: Record<string, any>): Promise<Record<string, any>>;
    get_status(processId: string): Promise<Record<string, any>>;
    wait_and_get_result(processId: string, timeout?: number): Promise<Record<string, any>>;
}
export default MonsterApiClient;
