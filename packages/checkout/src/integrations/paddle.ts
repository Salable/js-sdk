import { BaseComponent } from '../components/base';
import { Paddle } from '../resources/external';

interface IPaddleRender {
  vendor: number;
  environment?: string;
  planID: string;
  node: string;
  checkoutConfig?: object;
  eventCallback?: (data: { event: string }) => void;
}

export class PaddleProvider extends BaseComponent {
  constructor() {
    super();
  }

  _render({ node, vendor, planID }: IPaddleRender) {
    void (async () => {
      await this._loadScript('https://cdn.paddle.com/paddle/paddle.js', 'salablePaddleScript');

      const paddle = Paddle();
      if (!paddle) return;

      paddle.Setup({
        vendor: vendor,
      });
      // paddle.Environment.set('sandbox');
      paddle.Checkout.open({
        method: 'inline',
        product: planID,
        frameTarget: node,
        frameInitialHeight: 416,
        frameStyle: 'width:100%; min-width:376px; background-color: transparent; border: none;',
      });
    })();
  }
}
