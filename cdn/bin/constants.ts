import * as dotenv from 'dotenv';
import {IEnvironment} from './types';

dotenv.config();

const CERTIFICATE_ARN = process.env.CERTIFICATE_ARN;
const CDN_DOMAIN = process.env.CDN_DOMAIN;

if (!CERTIFICATE_ARN) throw new Error('Missing CERTIFICATE_ARN');
if (!CDN_DOMAIN) throw new Error('Missing CDN_DOMAIN');

export const environment: IEnvironment = {
  certificateArn: CERTIFICATE_ARN,
  cdnDomain: CDN_DOMAIN,
};
