const publicVapidKey = "BERFtuniQ3lkLYfgxI2p43QluJypt29m8pnMxbfzNJ8aQbokQENB5eBODaYj2fwM1cCel8Jtdpn0uDjdrJY6Fqs";

if("serviceWorker" in navigator){
    send().catch(err => console.log(err));
}

async function send(){
    console.log("registering service worker")
    const register = await navigator.serviceWorker.register("/worker.js", {
        scope: "/"
    });
    console.log("Service worker registered");

    const subscription = await register.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicVapidKey)
    })

    console.log("subscription ", subscription)
    alert("subscripto!")

    await fetch("/subscribe", {
        method: "POST",
        body: JSON.stringify(subscription),
        headers: {
            "content-type": "application/json"
        }
    })
}

function urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/');
  
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
  
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }