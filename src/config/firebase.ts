import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyAX1V9NamRT8kutrg4OV-hg3AoRNPf5Em8",
    authDomain: "dattadharma.firebaseapp.com",
    databaseURL:
    "https://dattadharma-default-rtdb.europe-west1.firebasedatabase.app",
    projectId: "dattadharma",
    storageBucket: "dattadharma.firebasestorage.app",
    messagingSenderId: "9927339396",
    appId: "1:9927339396:web:b04e5791f6360e919641d1",
    measurementId: "G-Q6WJ0XQ3QL",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);
