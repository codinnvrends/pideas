from google.cloud import storage

def set_cors(bucket_name):
    print(f"Configuring CORS for {bucket_name}...")
    try:
        storage_client = storage.Client()
        bucket = storage_client.get_bucket(bucket_name)

        cors_configuration = [
            {
                "origin": ["*"],
                "responseHeader": ["Content-Type", "Access-Control-Allow-Origin", "x-goog-resumable"],
                "method": ["GET", "HEAD", "OPTIONS"],
                "maxAgeSeconds": 3600
            }
        ]
        
        bucket.cors = cors_configuration
        bucket.patch()
        print(f"SUCCESS: CORS configured for {bucket_name}")
        print(f"Current CORS: {bucket.cors}")
    except Exception as e:
        print(f"ERROR: Failed to configure CORS: {e}")

if __name__ == "__main__":
    # Project ID pideas-76f25
    set_cors("pideas-76f25-downloads")
