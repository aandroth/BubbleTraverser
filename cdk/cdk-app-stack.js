const cdk = require("aws-cdk-lib");

const s3 = require("aws-cdk-lib/aws-s3");
const iam = require("aws-cdk-lib/aws-iam");
const ec2 = require("aws-cdk-lib/aws-ec2");

class CdkAppStack extends cdk.Stack
{
    /**
     *
     * @param {cdk.Construct} scope
     * @param {string} id
     * @param {cdk.StackProps=} props
     */
    constructor(scope, id, props) {
        super(scope, id, props);

        const myBucket = new s3.Bucket(this, 'my-bubble-traverser-site-bucket', {
            bucketName: 'my-bubble-traverser-site-bucket',
            publicReadAccess: true,
            blockPublicAccess: {
                blockPublicAcls: false,
                blockPublicPolicy: false,
                ignorePublicAcls: false,
                restrictPublicBuckets: false,
            },
            removalPolicy: cdk.RemovalPolicy.DESTROY,
            websiteIndexDocument: 'index.html'
        });

        new s3Deploy.BucketDeployment(this, 'BucketDeploymentId', {
            sources: [s3Deploy.Source.asset("./")],
            destinationBucket: myBucket,
        });

        // Get the default VPC. This is the network where your instance will be provisioned
        // All activated regions in AWS have a default vpc. 
        // You can create your own of course as well. https://aws.amazon.com/vpc/
        const defaultVpc = ec2.Vpc.fromLookup(this, 'VPC', { isDefault: true })

        // Lets create a role for the instance
        // You can attach permissions to a role and determine what your
        // instance can or can not do
        const role = new iam.Role(
            this,
            'simple-site-instance-1-role', // this is a unique id that will represent this resource in a Cloudformation template
            { assumedBy: new iam.ServicePrincipal('ec2.amazonaws.com') }
        )

        // lets create a security group for our instance
        // A security group acts as a virtual firewall for your instance to control inbound and outbound traffic.
        const securityGroup = new ec2.SecurityGroup(
            this,
            'simple-site-instance-1-sg',
            {
                vpc: defaultVpc,
                allowAllOutbound: true, // will let your instance send outbound traffic
                securityGroupName: 'simple-site-instance-1-sg',
            }
        )

        // lets use the security group to allow inbound traffic on specific ports
        securityGroup.addIngressRule(
            ec2.Peer.anyIpv4(),
            ec2.Port.tcp(22),
            'Allows SSH access from Internet'
        )

        securityGroup.addIngressRule(
            ec2.Peer.anyIpv4(),
            ec2.Port.tcp(80),
            'Allows HTTP access from Internet'
        )

        securityGroup.addIngressRule(
            ec2.Peer.anyIpv4(),
            ec2.Port.tcp(443),
            'Allows HTTPS access from Internet'
        )

        const userData = ec2.UserData.forLinux();
        userData.addCommands(
            'sudo yum update',
            'sudo yum install ruby',
            'wget https://aws-codedeploy-us-west-2.s3.us-west-2.amazonaws.com/latest/install',
            'chmod +x ./install',
            'sudo ./install auto',
            'sudo service codedeploy-agent status',
        );

        // Finally lets provision our ec2 instance
        const instance = new ec2.Instance(this, 'bubble-traverser-instance', {
            vpc: defaultVpc,
            role: role,
            securityGroup: securityGroup,
            instanceName: 'bubble-traverser-instance',
            instanceType: ec2.InstanceType.of( // t2.micro has free tier usage in aws
                ec2.InstanceClass.T2,
                ec2.InstanceSize.MICRO
            ),
            machineImage: ec2.MachineImage.latestAmazonLinux({
                generation: ec2.AmazonLinuxGeneration.AMAZON_LINUX_2,
            }),
            userData: Fn.base64(userData.render()),
            
        })

        // cdk lets us output prperties of the resources we create after they are created
        // we want the ip address of this new instance so we can ssh into it later
        new cdk.CfnOutput(this, 'bubble-traverser-instance-output', {
            value: instance.instancePublicIp
        })
    }
}

module.exports = { CdkAppStack };