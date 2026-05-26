import json
import boto3
import os
from algoliasearch.search_client import SearchClient

# 1. Use Environment Variables for Security
# Set these in Lambda Console -> Configuration -> Environment variables
ALGOLIA_APP_ID = os.environ.get('ALGOLIA_APP_ID')
ALGOLIA_API_KEY = os.environ.get('ALGOLIA_API_KEY')

algolia_client = SearchClient.create(ALGOLIA_APP_ID, ALGOLIA_API_KEY)
index = algolia_client.init_index("dev_project")
location_client = boto3.client('location')

def lambda_handler(event, context):
    print(event)
    
    for i in event['Records']:
        if i['eventName'] in ['INSERT', 'MODIFY']:
            # 2. Safely get fields. If a field doesn't exist, return an empty string.
            new_image = i['dynamodb']['NewImage']
            
            locationId = new_image.get('locationId', {}).get('S', '')
            name = new_image.get('name', {}).get('S', '')
            line1 = new_image.get('line1', {}).get('S', '')
            line2 = new_image.get('line2', {}).get('S', '')
            city = new_image.get('city', {}).get('S', '')
            state = new_image.get('state', {}).get('S', '')
            country = new_image.get('country', {}).get('S', '')
            zipCode = new_image.get('zipCode', {}).get('S', '')
            
            # Filter out empty strings for a cleaner address query
            address_parts = [p for p in [locationId, name, line1, line2, city, state, zipCode] if p]
            complete_address = ', '.join(address_parts)
            
            print(f"Complete Address: {complete_address}")
            
            record = {
                "objectID": locationId, 
                "name": name, 
                "line1": line1,
                "line2": line2,
                "city": city,
                "state": state,
                "country": country,
                "zipCode": zipCode
            }
            
            response = location_client.search_place_index_for_text(
                IndexName='Placetest', 
                FilterCountries=["IND"], 
                MaxResults=1, 
                Text=complete_address
            )
            
            # 3. Prevent crashes if the address isn't found
            if response.get("Results"):
                location_response = response["Results"][0]['Place']['Geometry']['Point']
                record['_geoloc'] = {
                    "lat": location_response[1],
                    "lng": location_response[0]
                }
            else:
                print(f"WARNING: Could not geocode address: {complete_address}")
                # Optional: You can choose to skip saving, or save the record without coordinates.
                # We will save it without coordinates so the text is still searchable.
            
            print(record)
            index.save_object(record).wait()
            
        elif i['eventName'] == 'REMOVE':
            # Safely get the ID just in case
            old_image = i['dynamodb'].get('OldImage', {})
            location_id = old_image.get('locationId', {}).get('S', '')
            
            if location_id:
                print(f"Deleting the location ID: {location_id}")
                index.delete_object(location_id)
