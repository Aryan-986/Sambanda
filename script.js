document.addEventListener('DOMContentLoaded', function() {
    // Agora setup
    let client = AgoraRTC.createClient({mode:'rtc', codec:"vp8"});

    let config = {
        appid:"b22359b3feb544fa8d5e16c466078a15",
        token:"007eJxTYOj52vfWzUddcvsKt6KmU6q1809f989aKaxuVlK8+Kgn+3QFhiQjI2NTyyTjtNQkUxOTtESLFNNUQ7NkEzMzA3OLREPT4yGr0xsCGRkaBDKZGBkgEMTnYEhJTc7MTcwxZmAAAKdvH8o=",
        uid:null,
        channel:"decimal3",
    };

    let localTracks = {
        audioTrack:null,
        videoTrack:null
    };

    let localTrackState = {
        audioTrackMuted:false,
        videoTrackMuted:false
    };

    let remoteTracks = {};


    // AI Chat Box handling
    const joinButton = document.getElementById('join-btn');
    const aiChatContainer = document.getElementById('ai-chat-container');


    if (joinButton && aiChatContainer) {
        joinButton.addEventListener('click', async () => {

            //Hide the ai chat container

            aiChatContainer.style.display = 'none';

            config.uid = document.getElementById('username').value
            await joinStreams()
            document.getElementById('join-wrapper').style.display = 'none'
            document.getElementById('footer').style.display = 'flex'
        });
    } else {
        console.error('Join button or AI chat container not found.');
    }

    document.getElementById('mic-btn').addEventListener('click', async () => {
        if(!localTrackState.audioTrackMuted){
            await localTracks.audioTrack.setMuted(true);
            localTrackState.audioTrackMuted = true
            document.getElementById('mic-btn').style.backgroundColor ='rgb(255, 80, 80, 0.7)'
        }else{
            await localTracks.audioTrack.setMuted(false)
            localTrackState.audioTrackMuted = false
            document.getElementById('mic-btn').style.backgroundColor ='#1f1f1f8e'
        }
    })

    document.getElementById('camera-btn').addEventListener('click', async () => {
        if(!localTrackState.videoTrackMuted){
            await localTracks.videoTrack.setMuted(true);
            localTrackState.videoTrackMuted = true
            document.getElementById('camera-btn').style.backgroundColor ='rgb(255, 80, 80, 0.7)'
        }else{
            await localTracks.videoTrack.setMuted(false)
            localTrackState.videoTrackMuted = false
            document.getElementById('camera-btn').style.backgroundColor ='#1f1f1f8e'
        }
    })

    document.getElementById('leave-btn').addEventListener('click', async () => {
        for (trackName in localTracks){
            let track = localTracks[trackName]
            if(track){
                track.stop()
                track.close()
                localTracks[trackName] = null
            }
        }
        await client.leave()
        document.getElementById('footer').style.display = 'none'
        document.getElementById('user-streams').innerHTML = ''
        document.getElementById('join-wrapper').style.display = 'block'

        // Show AI Chat Container
        aiChatContainer.style.display = 'block';
    })


    let joinStreams = async () => {
        client.on("user-published", handleUserJoined);
        client.on("user-left", handleUserLeft);

        client.enableAudioVolumeIndicator();
        client.on("volume-indicator", function(evt){
            for (let i = 0; evt.length > i; i++){
                let speaker = evt[i].uid
                let volume = evt[i].level
                if(volume > 0){
                    document.getElementById(`volume-${speaker}`).src = './assets/volume-on.svg'
                }else{
                    document.getElementById(`volume-${speaker}`).src = './assets/volume-off.svg'
                }
            }
        });

        [config.uid, localTracks.audioTrack, localTracks.videoTrack] = await  Promise.all([
            client.join(config.appid, config.channel, config.token ||null, config.uid ||null),
            AgoraRTC.createMicrophoneAudioTrack(),
            AgoraRTC.createCameraVideoTrack()
        ])

        let player = `<div class="video-containers" id="video-wrapper-${config.uid}">
                        <p class="user-uid"><img class="volume-icon" id="volume-${config.uid}" src="./assets/volume-on.svg" /> ${config.uid}</p>
                        <div class="video-player player" id="stream-${config.uid}"></div>
                  </div>`

        document.getElementById('user-streams').insertAdjacentHTML('beforeend', player);
        localTracks.videoTrack.play(`stream-${config.uid}`)

        await client.publish([localTracks.audioTrack, localTracks.videoTrack])
    }


    let handleUserJoined = async (user, mediaType) => {
        console.log('Handle user joined')
        remoteTracks[user.uid] = user
        await client.subscribe(user, mediaType)

        if (mediaType === 'video'){
            let player = document.getElementById(`video-wrapper-${user.uid}`)
            console.log('player:', player)
            if (player != null){
                player.remove()
            }

            player = `<div class="video-containers" id="video-wrapper-${user.uid}">
                            <p class="user-uid"><img class="volume-icon" id="volume-${user.uid}" src="./assets/volume-on.svg" /> ${user.uid}</p>
                            <div  class="video-player player" id="stream-${user.uid}"></div>
                          </div>`
            document.getElementById('user-streams').insertAdjacentHTML('beforeend', player);
            user.videoTrack.play(`stream-${user.uid}`)
        }

        if (mediaType === 'audio') {
            user.audioTrack.play();
        }
    }


    let handleUserLeft = (user) => {
        console.log('Handle user left!')
        delete remoteTracks[user.uid]
        document.getElementById(`video-wrapper-${user.uid}`).remove()
    }
});