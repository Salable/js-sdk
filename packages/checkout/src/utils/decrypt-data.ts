/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { AES, enc } from 'crypto-js';

declare global {
  interface Window {
    CryptoJS: {
      AES: typeof AES;
      enc: typeof enc;
    };
  }
}
export const decryptAccount = <T extends 'stripe' | 'paddle'>(
  data: string,
  key: string
): T extends 'stripe'
  ? { accountId: string; paymentProvider: string; status: string }
  : { paddleVendorId: string; paddleAuthKey: string } => {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call
  const decryptedData = window.CryptoJS.AES.decrypt(data, key).toString(window.CryptoJS.enc.Utf8);

  // eslint-disable-next-line @typescript-eslint/no-unsafe-return
  return JSON.parse(decryptedData);
};
