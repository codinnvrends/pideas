// Firebase Configuration
// Replace these values with your actual Firebase project configuration
const firebaseConfig = {
  apiKey: "your-api-key-here",
  authDomain: "your-project-id.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project-id.appspot.com",
  messagingSenderId: "your-sender-id",
  appId: "your-app-id"
};

// Initialize Firebase
if (typeof firebase !== 'undefined') {
  firebase.initializeApp(firebaseConfig);

  // Initialize Firebase services
  const auth = firebase.auth();
  const firestore = firebase.firestore();
  const functions = firebase.functions();

  // Connect to emulators if running locally
  if (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1") {
    console.log("Using local emulators");
    functions.useEmulator("127.0.0.1", 5001);
    // Uncomment the following lines if you want to use Auth and Firestore emulators
    // auth.useEmulator("http://127.0.0.1:9099");
    // firestore.useEmulator("127.0.0.1", 8080);
  }

  console.log('Firebase initialized successfully');
} else {
  console.error('Firebase SDK not loaded');
}
