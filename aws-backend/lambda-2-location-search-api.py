import json
import boto3
import os
from algoliasearch.search_client import SearchClient

ALGOLIA_APP_ID = os.environ.get('ALGOLIA_APP_ID')
ALGOLIA_API_KEY = os.environ.get('ALGOLIA_API_KEY')
ALGOLIA_INDEX_NAME = os.environ.get('ALGOLIA_INDEX_NAME', 'dev_project')
PLACE_INDEX_NAME = os.environ.get('PLACE_INDEX_NAME', 'Placetest')

algolia_client = SearchClient.create(ALGOLIA_APP_ID, ALGOLIA_API_KEY)
index = algolia_client.init_index(ALGOLIA_INDEX_NAME)

location_client = boto3.client('location')

HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': '*',
    'Access-Control-Allow-Methods': '*',
    'Content-Type': 'application/json'
}

def lambda_handler(event, context):
    try:
        body = json.loads(event.get('body', '{}'))

        complete_address = body.get('complete_address')
        radius = max(1000, min(int(body.get('radius', 50000)), 100000))

        if not complete_address:
            return {
                'statusCode': 400,
                'headers': HEADERS,
                'body': json.dumps({'message': 'complete_address is required'})
            }

        location_response = location_client.search_place_index_for_text(
            IndexName=PLACE_INDEX_NAME,
            MaxResults=1,
            Text=complete_address
        )

        if not location_response['Results']:
            return {
                'statusCode': 404,
                'headers': HEADERS,
                'body': json.dumps({'message': 'Location not found'})
            }

        longitude, latitude = location_response['Results'][0]['Place']['Geometry']['Point']

        algolia_results = index.search(
            '',
            {
                'aroundLatLng': f'{latitude}, {longitude}',
                'aroundRadius': radius,
                'hitsPerPage': 10,
                'page': 0
            }
        )

        clean_results = [
            {
                'name': hit.get('name'),
                'line1': hit.get('line1'),
                'city': hit.get('city'),
                'state': hit.get('state'),
                'zipCode': hit.get('zipCode'),
                'latitude': hit.get('_geoloc', {}).get('lat'),
                'longitude': hit.get('_geoloc', {}).get('lng'),
                'objectID': hit.get('objectID'),
                'type': hit.get('type', 'Location'),
                'category': hit.get('category', 'Location')
            }
            for hit in algolia_results.get('hits', [])
        ]

        return {
            'statusCode': 200,
            'headers': HEADERS,
            'body': json.dumps({
                'success': True,
                'search_location': complete_address,
                'search_latitude': latitude,
                'search_longitude': longitude,
                'radius': radius,
                'total_results': algolia_results.get('nbHits', 0),
                'results': clean_results
            })
        }

    except Exception as e:
        return {
            'statusCode': 500,
            'headers': HEADERS,
            'body': json.dumps({'error': str(e)})
        }