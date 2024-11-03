import { RemovalPolicy } from 'aws-cdk-lib';
import { IVpc, Peer, Port, SecurityGroup } from 'aws-cdk-lib/aws-ec2';
import { StringParameter } from 'aws-cdk-lib/aws-ssm';

import { Construct } from 'constructs';
import { AwsCustomResource, AwsCustomResourcePolicy, PhysicalResourceId } from 'aws-cdk-lib/custom-resources';
import { RetentionDays } from 'aws-cdk-lib/aws-logs';
import { EnforcedNestedStack, EnforcedStackProps } from '@helpers';

export type SecurityStackProps = EnforcedStackProps & { network: { vpc: IVpc } }
export class SecurityStack extends EnforcedNestedStack {

  constructor(scope: Construct, id: string, props: SecurityStackProps) {
    super(scope, id, props);
    const{ vpc } = props.network;
    
    const httpsVpcSecurityGroup = new SecurityGroup(this, 'HttpsVpcSecurityGroup', {
      vpc: vpc,
      description: 'Allow HTTPS access from VPC',
      allowAllOutbound: false,
      securityGroupName: `${this.CONTEXT}-https-vpc-${this.ENV}`,
    });
    
    httpsVpcSecurityGroup.addIngressRule(
      Peer.ipv4(vpc.vpcCidrBlock),
      Port.tcp(443),
      'Allow incoming traffic on port 443'
    );
    httpsVpcSecurityGroup.addEgressRule(Peer.anyIpv4(), Port.tcp(443), 'Allow outgoing traffic on port 443');

    const httpVpcSecurityGroup = new SecurityGroup(this, 'HttpVpcSecurityGroup', {
      vpc: vpc,
      description: 'Allow HTTP access from VPC',
      allowAllOutbound: false,
      securityGroupName: `${this.CONTEXT}-http-vpc-${this.ENV}`,
    });
    
    httpVpcSecurityGroup.addIngressRule(
      Peer.ipv4(vpc.vpcCidrBlock),
      Port.tcp(80),
      'Allow incoming traffic on port 80'
    );
    httpVpcSecurityGroup.addEgressRule(Peer.anyIpv4(), Port.tcp(80), 'Allow outgoing traffic on port 80');

    const cloudFrontPrefixListId = this.getCloudFrontPrefixListId(this.CONTEXT, this.ENV);
    const httpsCloudFrontSecurityGroup = new SecurityGroup(this, 'HttpsCloudFrontSecurityGroup', {
      vpc: vpc,
      description: 'Allow HTTPS access from CloudFront',
      allowAllOutbound: false,
      securityGroupName: `${this.CONTEXT}-https-cloudfront-${this.ENV}`,
    });
    httpsCloudFrontSecurityGroup.addIngressRule(
      Peer.prefixList(cloudFrontPrefixListId),
      Port.tcp(443),
      'Allow incoming traffic on port 443'
    );
    httpsCloudFrontSecurityGroup.addEgressRule(
      Peer.prefixList(cloudFrontPrefixListId),
      Port.tcp(443),
      'Allow outgoing traffic on port 443'
    );

    const httpsInternetSecurityGroup = new SecurityGroup(this, 'HttpsInternetSecurityGroup', {
      vpc: vpc,
      description: 'Allow HTTPS access from internet',
      allowAllOutbound: false,
      securityGroupName: `${this.CONTEXT}-https-internet-${this.ENV}`,
    });

    httpsInternetSecurityGroup.addIngressRule(Peer.anyIpv4(), Port.tcp(443), 'Allow incoming traffic on port 443');
    httpsInternetSecurityGroup.addEgressRule(Peer.anyIpv4(), Port.tcp(443), 'Allow outgoing traffic on port 443');

    const httpInternetSecurityGroup = new SecurityGroup(this, 'HttpInternetSecurityGroup', {
      vpc: vpc,
      description: 'Allow HTTP access from internet',
      allowAllOutbound: false,
      securityGroupName: `${this.CONTEXT}-http-internet-${this.ENV}`,
    });
    
    httpInternetSecurityGroup.addIngressRule(Peer.anyIpv4(), Port.tcp(80), 'Allow incoming traffic on port 80');
    httpInternetSecurityGroup.addEgressRule(Peer.anyIpv4(), Port.tcp(80), 'Allow outgoing traffic on port 80');


    new StringParameter(this, 'VpcId', {
      parameterName: `/${this.ENV}/${this.CONTEXT}/vpc/id`,
      stringValue: vpc.vpcId,
    });
    new StringParameter(this, 'VpcCidr', {
      parameterName: `/${this.ENV}/${this.CONTEXT}/vpc/cidr`,
      stringValue: vpc.vpcCidrBlock,
    });

    new StringParameter(this, 'HttpsVpcSecurityGroupId', {
      parameterName: `/${this.ENV}/${this.CONTEXT}/security-group/https/vpc/id`,
      stringValue: httpsVpcSecurityGroup.securityGroupId,
    });
    new StringParameter(this, 'HttpVpcSecurityGroupId', {
      parameterName: `/${this.ENV}/${this.CONTEXT}/security-group/http/vpc/id`,
      stringValue: httpVpcSecurityGroup.securityGroupId,
    });
    new StringParameter(this, 'HttpsCloudFrontSecurityGroupId', {
      parameterName: `/${this.ENV}/${this.CONTEXT}/security-group/https/cloudfront/id`,
      stringValue: httpsCloudFrontSecurityGroup.securityGroupId,
    });
    new StringParameter(this, 'HttpsInternetSecurityGroupId', {
      parameterName: `/${this.ENV}/${this.CONTEXT}/security-group/https/internet/id`,
      stringValue: httpsInternetSecurityGroup.securityGroupId,
    });
    new StringParameter(this, 'HttpInternetSecurityGroupId', {
      parameterName: `/${this.ENV}/${this.CONTEXT}/security-group/http/internet/id`,
      stringValue: httpInternetSecurityGroup.securityGroupId,
    });
  };
  private getCloudFrontPrefixListId = (
    CONTEXT: string,
    ENV: string
  ): string => {
    return new AwsCustomResource(this, 'GetCloudFrontPrefixListId', {
      installLatestAwsSdk: false,
      functionName: `${CONTEXT}-${ENV}-GetCloudFrontPrefixListId`,
      logRetention: RetentionDays.ONE_MONTH,
      removalPolicy: RemovalPolicy.DESTROY,
      onUpdate: {
        physicalResourceId: PhysicalResourceId.of('GetCloudFrontPrefixListId'),
        service: '@aws-sdk/client-ec2',
        action: 'DescribeManagedPrefixListsCommand',
        parameters: {
          Filters: [{ Name: 'prefix-list-name', Values: ['com.amazonaws.global.cloudfront.origin-facing'] }],
        },
      },
      policy: AwsCustomResourcePolicy.fromSdkCalls({ resources: ['*'] }),
    }).getResponseField('PrefixLists.0.PrefixListId');
  };
}
