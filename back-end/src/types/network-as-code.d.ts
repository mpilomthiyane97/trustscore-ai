declare module "network-as-code" {
  export class NetworkAsCodeClient {
    constructor(applicationKey: string);
    devices?: {
      get?: (input: { phoneNumber: string }) => {
        verifySimSwap?: (...args: unknown[]) => Promise<unknown>;
        getSimSwapDate?: () => Promise<unknown>;
        verifyNumber?: (code: string, state: string) => Promise<unknown>;
        verifyLocation?: (
          latitude: number,
          longitude: number,
          radiusMeters: number,
          maxAgeSeconds?: number
        ) => Promise<unknown>;
        phoneNumber?: string;
      };
    };
    authorization?: {
      createAuthorizationLink?: (
        redirectUri: string,
        scope: string,
        loginHint: string,
        state: string
      ) => Promise<string>;
    };
  }
}
