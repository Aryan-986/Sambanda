let currentCamera = 'user'; // Track the current camera facing mode

const flipCameraBtn = document.getElementById('flip-camera-btn');
if (flipCameraBtn) {
    flipCameraBtn.addEventListener('click', async () => {
        if (localTracks.videoTrack) {
            // Stop the current video track
            await localTracks.videoTrack.setMuted(true);
            localTracks.videoTrack.close();

            // Toggle the camera facing mode
            currentCamera = currentCamera === 'user' ? 'environment' : 'user';

            // Create a new video track with the opposite camera
            localTracks.videoTrack = await AgoraRTC.createCameraVideoTrack({
                cameraId: currentCamera
            });

            // Play the new video track
            localTracks.videoTrack.play(`stream-${config.uid}`);
            await client.publish(localTracks.videoTrack);
        }
    });
} 