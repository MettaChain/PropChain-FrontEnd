declare module '*.css' {
  const content: { [className: string]: string };
  export default content;
}

export {};

declare global {
  interface EthereumRequestArguments {
    method: string;
    params?: readonly unknown[] | Record<string, unknown>;
  }

  interface EthereumProvider {
    isMetaMask?: boolean;
    isCoinbaseWallet?: boolean;
    request<T = unknown>(args: EthereumRequestArguments): Promise<T>;
    on?(
      eventName: 'accountsChanged' | 'chainChanged' | 'disconnect',
      listener: (...args: unknown[]) => void,
    ): void;
    removeListener?(
      eventName: 'accountsChanged' | 'chainChanged' | 'disconnect',
      listener: (...args: unknown[]) => void,
    ): void;
  }

  interface Navigator {
    xr?: {
      isSessionSupported(mode: string): Promise<boolean>;
      requestSession(
        mode: string,
        options?: { requiredFeatures?: string[]; optionalFeatures?: string[] },
      ): Promise<unknown>;
    };
  }

  interface Window {
    ethereum?: EthereumProvider;
    suppressErrors?: () => void;
    suppressExtensionErrors?: () => void;
  }

  interface DeviceOrientationEventConstructor {
    requestPermission?: () => Promise<'granted' | 'denied'>;
  }

  var DeviceOrientationEvent: DeviceOrientationEventConstructor;
}
