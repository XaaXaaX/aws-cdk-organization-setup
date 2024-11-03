import { Construct } from 'constructs';
import { EnforcedStackProps } from '@helpers';
import { IHostedZone } from 'aws-cdk-lib/aws-route53';
import { NestedStack } from 'aws-cdk-lib';
import { EmailIdentity, Identity, ReceiptRuleSet, TlsPolicy } from 'aws-cdk-lib/aws-ses';
import { Bucket } from 'aws-cdk-lib/aws-s3';
import { Effect, PolicyStatement, ServicePrincipal } from 'aws-cdk-lib/aws-iam';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { Code, Runtime } from 'aws-cdk-lib/aws-lambda';
import { Lambda, S3 } from 'aws-cdk-lib/aws-ses-actions';
import { AwsCustomResource, AwsCustomResourcePolicy, AwsSdkCall, PhysicalResourceId } from 'aws-cdk-lib/custom-resources';
import { RetentionDays } from 'aws-cdk-lib/aws-logs';

export type SesStackProps = EnforcedStackProps & { hostedZone: IHostedZone };

export class SesStack extends NestedStack {
  constructor(scope: Construct, id: string, props: SesStackProps) {
    super(scope, id, props);

    const { hostedZone: HOSTED_ZONE } = props;

    new EmailIdentity(this, 'Identity', {
      identity: Identity.publicHostedZone(HOSTED_ZONE),
    });

    const deliveryBucket = new Bucket(this, "MailDeliveryBucket", {});
    const sesPrincipal = new ServicePrincipal('ses.amazonaws.com');
    deliveryBucket.grantWrite(sesPrincipal);

    const receivedMailLambda = new NodejsFunction(this, "ReceivedMailLambda", {
          runtime: Runtime.NODEJS_20_X,
          handler: 'index.handler',
          code: Code.fromInline(`
            exports.handler = async (event) => {
              console.log('Email Received: ', JSON.stringify(event, null, 2));
            };
          `),
      },
    );
    receivedMailLambda.grantInvoke(sesPrincipal);

    const receiptRuleSet = new ReceiptRuleSet(this, 'MailReceivedRuleSet', {
        dropSpam: false,
        rules: [{
          tlsPolicy: TlsPolicy.REQUIRE,
          scanEnabled: false,
          enabled: true,
          recipients: [ HOSTED_ZONE.zoneName ],
          actions: [
            new S3({ bucket: deliveryBucket }),
            new Lambda({ function: receivedMailLambda }),
          ],
        }],
    });

    const rulesetActivationSDKCall: AwsSdkCall = {
        service: 'SES',
        action: 'setActiveReceiptRuleSet',
        physicalResourceId: PhysicalResourceId.of('SesCustomResource'),
    };
 
    const setActiveReceiptRuleSetSdkCall: AwsSdkCall = {
      ...rulesetActivationSDKCall,
      parameters: { RuleSetName: receiptRuleSet.receiptRuleSetName }
    };
    const deleteReceiptRuleSetSdkCall: AwsSdkCall = rulesetActivationSDKCall;

    new AwsCustomResource(this, "setActiveReceiptRuleSetCustomResource", {
      onCreate: setActiveReceiptRuleSetSdkCall,
      onUpdate: setActiveReceiptRuleSetSdkCall,
      onDelete: deleteReceiptRuleSetSdkCall,
      logRetention: RetentionDays.ONE_WEEK,
      policy: AwsCustomResourcePolicy.fromStatements([
        new PolicyStatement({
          sid: 'SesCustomResourceSetActiveReceiptRuleSet',
          effect: Effect.ALLOW,
          actions: [
            'ses:SetActiveReceiptRuleSet',
            'ses:DeleteReceiptRuleSet',
          ],
          resources: ['*']
        }),
      ]),
    });
  }
}
