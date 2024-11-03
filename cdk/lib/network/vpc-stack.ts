import { IpAddresses, ISubnet, IVpc, SubnetType, Vpc } from 'aws-cdk-lib/aws-ec2';
import { StringListParameter, StringParameter } from 'aws-cdk-lib/aws-ssm';

import { Construct } from 'constructs';
import { EnforcedNestedStack, EnforcedStackProps } from '@helpers';
export type NetworkStackProps =  EnforcedStackProps;
export class NetworkStack extends EnforcedNestedStack {

  public readonly vpc: IVpc;
  constructor(scope: Construct, id: string, props: NetworkStackProps) {
    super(scope, id, props);
    const { contextVariables: { stage: ENV, context: CONTEXT, owner: OWNER }} = props;

    const availabilityZones = [
      `${this.REGION}a`, 
      `${this.REGION}b`, 
      `${this.REGION}c`
    ];
    
    this.vpc = new Vpc(this, 'SharedVPC', {
      ipAddresses: IpAddresses.cidr("10.0.0.0/16"),
      natGateways: 0,
      enableDnsHostnames: true,
      enableDnsSupport: true,
      restrictDefaultSecurityGroup: true,
      availabilityZones,
      subnetConfiguration: [
        { name: "public", subnetType: SubnetType.PUBLIC},
        { name: "protected", subnetType: SubnetType.PRIVATE_WITH_EGRESS},
        { name: "private", subnetType: SubnetType.PRIVATE_ISOLATED},
      ],
    });

    const publicSubnets = this.vpc.publicSubnets;
    const privateSubnets = this.vpc.privateSubnets;
    const protectedSubnets = this.vpc.isolatedSubnets;
    
    new StringParameter(this, 'VpcId', {
      parameterName: `/${ENV}/${CONTEXT}/vpc/id`,
      stringValue: this.vpc.vpcId,
    });
    new StringParameter(this, 'VpcCidr', {
      parameterName: `/${ENV}/${CONTEXT}/vpc/cidr`,
      stringValue: this.vpc.vpcCidrBlock,
    });

    new StringListParameter(this, 'PublicSubnets', {
      parameterName: `/${ENV}/${CONTEXT}/subnets/public`,
      stringListValue: publicSubnets.map((subnet: ISubnet) => subnet.subnetId),
    });
    publicSubnets.forEach((subnet: ISubnet, index: number) => {
      new StringParameter(this, `PublicSubnet${index}`, {
        parameterName: `/${ENV}/${CONTEXT}/subnets/public/${subnet.availabilityZone}`,
        stringValue: subnet.subnetId,
        simpleName: false,
      });
    });

    new StringListParameter(this, 'PrivateSubnets', {
      parameterName: `/${ENV}/${CONTEXT}/subnets/private`,
      stringListValue: privateSubnets.map((subnet: ISubnet) => subnet.subnetId),
    });
    publicSubnets.forEach((subnet: ISubnet, index: number) => {
      new StringParameter(this, `PrivateSubnet${index}`, {
        parameterName: `/${ENV}/${CONTEXT}/subnets/private/${subnet.availabilityZone}`,
        stringValue: subnet.subnetId,
        simpleName: false,
      });
    });

    new StringListParameter(this, 'ProtectedSubnets', {
      parameterName: `/${ENV}/${CONTEXT}/subnets/protected`,
      stringListValue: protectedSubnets.map((subnet: ISubnet) => subnet.subnetId),
    });
    publicSubnets.forEach((subnet: ISubnet, index: number) => {
      new StringParameter(this, `ProtectedSubnet${index}`, {
        parameterName: `/${ENV}/${CONTEXT}/subnets/protected/${subnet.availabilityZone}`,
        stringValue: subnet.subnetId,
        simpleName: false,
      });
    });
  };
}
