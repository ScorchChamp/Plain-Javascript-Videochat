
// Set up the WebRTC connection
const localVideo = document.querySelector('.local-video');
const remoteVideo = document.querySelector('.remote-video');
let pc;

// Set up the signaling server
const socket = new WebSocket('ws://localhost:8080');
socket.onmessage = function (event) {
    const message = JSON.parse(event.data);
    if (message.sdp) {
        pc.setRemoteDescription(new RTCSessionDescription(message.sdp)).then(() => {
            // Only create answers in response to offers
            if (message.sdp.type === 'offer') {
                pc.createAnswer().then(localDescCreated).catch(onError);
            }
        }).catch(onError);
    } else if (message.candidate) {
        pc.addIceCandidate(new RTCIceCandidate(message.candidate)).catch(onError);
    }
};

function localDescCreated(desc) {
    pc.setLocalDescription(
        desc,
        () => socket.send(JSON.stringify({ sdp: pc.localDescription })),
        onError
    );
}

// Set up the local video stream
navigator.mediaDevices.getUserMedia({
    audio: true,
    video: true
}).then(stream => {
    // Show the local video stream in the local video element
    localVideo.srcObject = stream;

    // Set up the peer connection
    pc = new RTCPeerConnection();
    pc.onicecandidate = function (event) {
        if (event.candidate) {
            socket.send(JSON.stringify({ candidate: event.candidate }));
        }
    };
    pc.onaddstream = function (event) {
        // Show the remote video stream in the remote video element
        remoteVideo.srcObject = event.stream;
    };

    // Add the local stream to the peer connection
    pc.addStream(stream);

    // Send an offer to the other client
    pc.createOffer().then(localDescCreated).catch(onError);
}).catch(onError);

function onError(error) {
    console.error(error);
}