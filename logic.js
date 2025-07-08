async function encryptFile(file, key) {
    const iv = crypto.getRandomValues(new Uint8Array(12)); // Generate a random IV
    
    const encoder = new TextEncoder();
    const encodedKey = encoder.encode(key.padEnd(32, ' ')).slice(0, 32); // Ensure 256-bit key
    
    const cryptoKey = await crypto.subtle.importKey(
        "raw",
        encodedKey,
        { name: "AES-GCM", length: 256 },
        false,
        ["encrypt"]
    );
    
    const fileArrayBuffer = await file.arrayBuffer();
    const encryptedData = await crypto.subtle.encrypt(
        { name: "AES-GCM", iv: iv },
        cryptoKey,
        fileArrayBuffer
    );
    
    return { encryptedData, iv };
}

async function decryptFile(encryptedFile, key) {
    const fileArrayBuffer = await encryptedFile.arrayBuffer();
    
    const iv = new Uint8Array(fileArrayBuffer.slice(0, 12)); // Extract IV from the file
    const encryptedData = fileArrayBuffer.slice(12);
    
    const encoder = new TextEncoder();
    const encodedKey = encoder.encode(key.padEnd(32, ' ')).slice(0, 32); // Ensure 256-bit key
    
    const cryptoKey = await crypto.subtle.importKey(
        "raw",
        encodedKey,
        { name: "AES-GCM", length: 256 },
        false,
        ["decrypt"]
    );
    
    try {
        const decryptedData = await crypto.subtle.decrypt(
            { name: "AES-GCM", iv: iv },
            cryptoKey,
            encryptedData
        );
        return new Blob([decryptedData], { type: 'application/octet-stream' });
    } catch (error) {
        alert("Decryption failed. Incorrect key or corrupted file.");
        return null;
    }
}

// Example usage for encryption
document.getElementById('fileInput').addEventListener('change', async (event) => {
    const fileInput = event.target;
    const file = fileInput.files[0];
    if (!file) return;
    
    const key = prompt("Enter your encryption phrase (note it down you can not decrypt this file without this phrase.):");
    if (!key) return;
    
    const { encryptedData, iv } = await encryptFile(file, key);
    
    // Create a Blob and download encrypted file
    const blob = new Blob([iv, new Uint8Array(encryptedData)], { type: 'application/octet-stream' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = file.name + ".enc";
    a.click();
    
    // Clear the file input field
    fileInput.value = "";
});

// Example usage for decryption
document.getElementById('decryptInput').addEventListener('change', async (event) => {
    const fileInput = event.target;
    const file = fileInput.files[0];
    if (!file) return;
    
    const key = prompt("Enter your decryption key:");
    if (!key) return;
    
    const decryptedBlob = await decryptFile(file, key);
    if (!decryptedBlob) return;
    
    // Create a download link for decrypted file
    const a = document.createElement('a');
    a.href = URL.createObjectURL(decryptedBlob);
    a.download = file.name.replace(".enc", "");
    a.click();
    
    // Clear the file input field
    fileInput.value = "";
});