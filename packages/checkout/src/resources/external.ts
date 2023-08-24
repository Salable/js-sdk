export const Stripe = (key: string) => {
  if (window && window.Stripe) {
    return window.Stripe(key);
  }
};

interface IPaddle {
  Checkout: {
    open: (load: unknown) => void;
  };
  Environment: {
    set: (data: unknown) => void;
  };
  Setup: (data: unknown) => void;
}

declare global {
  interface Window {
    Paddle: IPaddle;
  }
}

export const Paddle = (): IPaddle | undefined => {
  if (window && window.Paddle) {
    return window.Paddle;
  }
};
