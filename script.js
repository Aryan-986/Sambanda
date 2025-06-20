document.addEventListener('DOMContentLoaded', function () {
    let client = AgoraRTC.createClient({ mode: 'rtc', codec: "vp8" });

    let config = {
        appid: "b22359b3feb544fa8d5e16c466078a15",
        token: "007eJxTYCj873aGt11jca7Jem3HO20/7IpnXzr3Lr3k6LzznzVyr/grMFiaJpqlGBukmVpYmJoYmZsnpaSamaaZJiWmWKQYmJuaM17zymgIZGTQLuJnZmSAQBCfkyElNTkzNzHHzJKBAQBdKiGY", // ❌ Don't expose in production
        uid: null,
        channel: "decimal69",
    };

    let localTracks = {
        audioTrack: null,
        videoTrack: null
    };

    let localTrackState = {
        audioTrackMuted: false,
        videoTrackMuted: false
    };

    let remoteTracks = {};

    // ✅ New facing mode variable
    let currentFacingMode = 'user';

    const joinButton = document.getElementById('join-btn');
    const aiChatContainer = document.getElementById('ai-chat-container');

    if (joinButton && aiChatContainer) {
        joinButton.addEventListener('click', async () => {
            const usernameInput = document.getElementById('username');
            if (!usernameInput || !usernameInput.value.trim()) {
                alert('Please enter a valid username.');
                return;
            }

            aiChatContainer.style.display = 'none';
            config.uid = usernameInput.value.trim();

            await joinStreams();

            const joinWrapper = document.getElementById('join-wrapper');
            const footer = document.getElementById('footer');
            if (joinWrapper) joinWrapper.style.display = 'none';
            if (footer) footer.style.display = 'flex';
        });
    } else {
        console.error('Join button or AI chat container not found.');
    }

    const micBtn = document.getElementById('mic-btn');
    if (micBtn) {
        micBtn.addEventListener('click', async () => {
            if (!localTrackState.audioTrackMuted) {
                await localTracks.audioTrack.setMuted(true);
                localTrackState.audioTrackMuted = true;
                micBtn.style.backgroundColor = 'rgb(255, 80, 80, 0.7)';
            } else {
                await localTracks.audioTrack.setMuted(false);
                localTrackState.audioTrackMuted = false;
                micBtn.style.backgroundColor = '#1f1f1f8e';
            }
        });
    }

    const cameraBtn = document.getElementById('camera-btn');
    if (cameraBtn) {
        cameraBtn.addEventListener('click', async () => {
            if (!localTrackState.videoTrackMuted) {
                await localTracks.videoTrack.setMuted(true);
                localTrackState.videoTrackMuted = true;
                cameraBtn.style.backgroundColor = 'rgb(255, 80, 80, 0.7)';
            } else {
                await localTracks.videoTrack.setMuted(false);
                localTrackState.videoTrackMuted = false;
                cameraBtn.style.backgroundColor = '#1f1f1f8e';
            }
        });
    }

    const leaveBtn = document.getElementById('leave-btn');
    if (leaveBtn) {
        leaveBtn.addEventListener('click', async () => {
            for (let trackName in localTracks) {
                let track = localTracks[trackName];
                if (track) {
                    track.stop();
                    track.close();
                    localTracks[trackName] = null;
                }
            }

            await client.leave();

            const footer = document.getElementById('footer');
            const userStreams = document.getElementById('user-streams');
            const joinWrapper = document.getElementById('join-wrapper');

            if (footer) footer.style.display = 'none';
            if (userStreams) userStreams.innerHTML = '';
            if (joinWrapper) joinWrapper.style.display = 'block';

            aiChatContainer.style.display = 'block';
        });
    }

    // ✅ Flip Camera Button Handler
    const flipCameraBtn = document.getElementById('flip-camera-btn');
    if (flipCameraBtn) {
        flipCameraBtn.addEventListener('click', async () => {
            try {
                const newFacingMode = currentFacingMode === 'user' ? 'environment' : 'user';
                const newVideoTrack = await AgoraRTC.createCameraVideoTrack({ facingMode: newFacingMode });

                await client.unpublish([localTracks.videoTrack]);
                localTracks.videoTrack.stop();
                localTracks.videoTrack.close();

                await client.publish([newVideoTrack]);
                localTracks.videoTrack = newVideoTrack;
                currentFacingMode = newFacingMode;

                newVideoTrack.play(`stream-${config.uid}`);
            } catch (error) {
                console.error('Camera flip failed:', error);
                alert('Camera flip unavailable - check device support');
            }
        });
    }

    let joinStreams = async () => {
        client.on("user-published", handleUserJoined);
        client.on("user-left", handleUserLeft);

        client.enableAudioVolumeIndicator();
        client.on("volume-indicator", function (evt) {
            for (let i = 0; i < evt.length; i++) {
                let speaker = evt[i].uid;
                let volume = evt[i].level;
                const volumeIcon = document.getElementById(`volume-${speaker}`);
                if (volumeIcon) {
                    volumeIcon.src = volume > 0 ? './assets/volume-on.svg' : './assets/volume-off.svg';
                }
            }
        });

        [config.uid, localTracks.audioTrack, localTracks.videoTrack] = await Promise.all([
            client.join(config.appid, config.channel, config.token || null, config.uid || null),
            AgoraRTC.createMicrophoneAudioTrack(),
            AgoraRTC.createCameraVideoTrack({ facingMode: currentFacingMode }) // ✅ use tracked mode
        ]);

        const player = `
            <div class="video-containers" id="video-wrapper-${config.uid}">
                <p class="user-uid"><img class="volume-icon" id="volume-${config.uid}" src="./assets/volume-on.svg" /> ${config.uid}</p>
                <div class="video-player player" id="stream-${config.uid}"></div>
            </div>`;
        const userStreams = document.getElementById('user-streams');
        if (userStreams) {
            userStreams.insertAdjacentHTML('beforeend', player);
        }
        localTracks.videoTrack.play(`stream-${config.uid}`);

        await client.publish([localTracks.audioTrack, localTracks.videoTrack]);
    };

    let handleUserJoined = async (user, mediaType) => {
        console.log('Handle user joined');
        remoteTracks[user.uid] = user;
        await client.subscribe(user, mediaType);

        if (mediaType === 'video') {
            let player = document.getElementById(`video-wrapper-${user.uid}`);
            if (player !== null) {
                player.remove();
            }

            player = `
                <div class="video-containers" id="video-wrapper-${user.uid}">
                    <p class="user-uid"><img class="volume-icon" id="volume-${user.uid}" src="./assets/volume-on.svg" /> ${user.uid}</p>
                    <div class="video-player player" id="stream-${user.uid}"></div>
                </div>`;
            const userStreams = document.getElementById('user-streams');
            if (userStreams) {
                userStreams.insertAdjacentHTML('beforeend', player);
            }

            user.videoTrack.play(`stream-${user.uid}`);
        }

        if (mediaType === 'audio') {
            user.audioTrack.play();
        }
    };

    let handleUserLeft = (user) => {
        console.log('Handle user left!');
        delete remoteTracks[user.uid];
        const userVideo = document.getElementById(`video-wrapper-${user.uid}`);
        if (userVideo) {
            userVideo.remove();
        }
    };
});
