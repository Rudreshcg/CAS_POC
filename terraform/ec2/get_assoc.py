
import boto3
import sys

subnet_id = "subnet-0194df32f60d6813a"
ec2 = boto3.client('ec2', region_name='us-east-1')

response = ec2.describe_route_tables(
    Filters=[{'Name': 'association.subnet-id', 'Values': [subnet_id]}]
)

for rt in response['RouteTables']:
    for assoc in rt['Associations']:
        if assoc.get('SubnetId') == subnet_id:
            print(f"ID: {assoc['RouteTableAssociationId']}, RT: {assoc['RouteTableId']}, Main: {assoc.get('Main', False)}")
