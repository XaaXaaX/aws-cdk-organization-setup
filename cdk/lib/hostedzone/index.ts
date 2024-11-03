import { Construct } from 'constructs';
import { EnforcedStack, EnforcedStackProps } from '@helpers';
import { StringParameter } from 'aws-cdk-lib/aws-ssm';
import { HostedZone, MxRecord } from 'aws-cdk-lib/aws-route53';
import { SesStack } from './ses-stack';
import { DNSConfig } from '@type';

export type HostedZoneStackProps = EnforcedStackProps & { dnsConfig: DNSConfig }
export class HostedZoneStack extends EnforcedStack {
  constructor(scope: Construct, id: string, props: HostedZoneStackProps) {
    super(scope, id, props);

    const { dnsConfig } = props;

    let hostedZone = dnsConfig.isExternal ?
      HostedZone.fromHostedZoneId(this, 'HostedZone', dnsConfig.hostedZoneId) :
      new HostedZone(this, 'HostedZone', { zoneName: dnsConfig.domainName, comment: 'Managed by Serverless Folks' });
    
    new MxRecord(this, 'MXRecord', {
      zone: hostedZone,
      values: [{
        hostName: `inbound-smtp.${this.REGION}.amazonaws.com`,
        priority: 10,
      }],
      recordName: dnsConfig.mailExchangeDomainName,
      deleteExisting: true,
    });

    new SesStack(this, 'SesStack', {
      hostedZone,
      contextVariables: props.contextVariables,
    });

    new StringParameter(this, 'HostedZoneId', {
      parameterName: `/${this.ENV}/${this.CONTEXT}/serverlessfolks.com/hostedzone/id`,
      stringValue: hostedZone.hostedZoneId,
    })
  }
}
