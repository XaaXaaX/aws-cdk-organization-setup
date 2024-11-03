import { Construct } from 'constructs';
import { EnforcedStack, EnforcedStackProps } from '@helpers';
import { StringParameter } from 'aws-cdk-lib/aws-ssm';
import { HostedZone, IHostedZone, MxRecord } from 'aws-cdk-lib/aws-route53';
import { SesStack } from './ses-stack';
import { DNSConfig } from '@type';

export type HostedZoneStackProps = EnforcedStackProps & { dnsConfig: DNSConfig }
export class HostedZoneStack extends EnforcedStack {
  constructor(scope: Construct, id: string, props: HostedZoneStackProps) {
    super(scope, id, props);

    const { dnsConfig } = props;

    let hostedZone: IHostedZone;
    if(dnsConfig.isExternal)
      hostedZone = HostedZone.fromHostedZoneId(this, 'HostedZone', dnsConfig.hostedZoneId);
    else {
      hostedZone = new HostedZone(this, 'HostedZone', { zoneName: dnsConfig.domainName, comment: 'Managed by CDK' });
      
      new StringParameter(this, 'HostedZoneId', {
        parameterName: `/${this.ENV}/${this.CONTEXT}/${dnsConfig.domainName}/hostedzone/id`,
        stringValue: hostedZone.hostedZoneId,
      })
    }
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
  }
}
