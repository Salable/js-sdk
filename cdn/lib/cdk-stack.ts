import {
  Stack,
  StackProps,
  aws_s3,
  aws_cloudfront,
  aws_certificatemanager,
  aws_cloudfront_origins,
} from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { IEnvironment } from '../bin/types';

export class CdkStack extends Stack {
  constructor(scope: Construct, id: string, environment: IEnvironment, props?: StackProps) {
    super(scope, id, props);

    const salableJsSdkCdnBucket = new aws_s3.Bucket(this, 'salableJsSdkCdnBucket', {
      publicReadAccess: false,
      cors: [
        {
          allowedMethods: [aws_s3.HttpMethods.GET],
          allowedOrigins: ['*'],
          allowedHeaders: ['*'],
        },
      ],
    });

    const certificate = aws_certificatemanager.Certificate.fromCertificateArn(
      this,
      'certificate',
      environment.certificateArn
    );

    new aws_cloudfront.Distribution(this, 'salableJsSdkCdnCloudfront', {
      defaultBehavior: {
        origin: new aws_cloudfront_origins.S3Origin(salableJsSdkCdnBucket),
        viewerProtocolPolicy: aws_cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        responseHeadersPolicy: aws_cloudfront.ResponseHeadersPolicy.CORS_ALLOW_ALL_ORIGINS,
        originRequestPolicy: aws_cloudfront.OriginRequestPolicy.CORS_S3_ORIGIN,
        cachePolicy: aws_cloudfront.CachePolicy.CACHING_DISABLED,
      },
      domainNames: [environment.cdnDomain],
      certificate,
    });
  }
}
