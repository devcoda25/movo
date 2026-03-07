const { Storage } = require('@google-cloud/storage');
const fs = require('fs');

// Read CORS config
const corsConfig = JSON.parse(fs.readFileSync('./firebase-cors.json', 'utf8'));

// Initialize storage with Firebase project
const storage = new Storage({
  projectId: 'studio-5774129835-63da4',
  keyFilename: './firebase-service-account.json' // You'll need to download this from Firebase Console
});

async function setCors() {
  try {
    // Get the bucket
    const bucket = storage.bucket('studio-5774129835-63da4.firebasestorage.app');
    
    // Set CORS configuration
    await bucket.setMetadata({
      cors: corsConfig
    });
    
    console.log('CORS configuration applied successfully!');
  } catch (error) {
    console.error('Error setting CORS:', error.message);
    console.log('\nTo configure CORS manually:');
    console.log('1. Go to Firebase Console > Storage');
    console.log('2. Click on the "Rules" tab');
    console.log('3. Add CORS configuration to your rules');
    console.log('\nOr use gsutil:');
    console.log('gsutil cors set firebase-cors.json gs://studio-5774129835-63da4.firebasestorage.app');
  }
}

setCors();
