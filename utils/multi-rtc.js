var RTC = require('./rtc');

function MultiRTC(options) {
  this.events = {};
  this.peers = {};
  this.pending = {};
  this.signaller = options.signaller;
  this.metadata = options.metadata;
  this.wrtc = options.wrtc;
}

/* Add a peer to this pool
 *
 * @param {String} id A unique identifier to a given peer
 * @param {Object=undefined} signal The signal object
 */
MultiRTC.prototype.add = function(id, signal, metadata) {
  if (!this.peers[id]) {
    this.peers[id] = new RTC({dataChannel: true, offerer: !signal, wrtc: this.wrtc});
    this.peers[id].metadata = metadata;
    this.peers[id].on('signal', this.onSignal.bind(this, id));
    this.peers[id].on('channel-open', this.onOpen.bind(this, id));
    this.peers[id].on('channel-message', this.onMessage.bind(this, id));
    this.peers[id].on('channel-close', this.onClose.bind(this, id));
  }

  if (signal) {
    this.peers[id].addSignal(signal);
  }
};

MultiRTC.prototype.send = function(data, id) {
  // Use a single id, if it is provided
  var ids = id ? [id] : Object.keys(this.peers);
  data = JSON.stringify(data);

  ids.forEach(function(key) {
    // If the peer channel is open and available, send the message right away
    var channel = this.peers[key].channel;
    if (channel && channel.readyState === 'open') {
      return channel.send(data);
    }

    // If the peer channel is not yet available, add it to the pending queue
    // and send it as soon as the given peer is connected.
    this.pending[key] = this.pending[key] || [];
    this.pending[key].push(data);
  }, this);
};

/*
 * RTC Hooks
 */

/* One of our RTCPeerConnections has generated a signal
 *
 * @param {String} id Who should be send this signal to?
 * @param {RTCSessionDescription|RTCIceCandidate} signal The signalling data
 */
MultiRTC.prototype.onSignal = function(id, signal) {
  this.signaller.emit('signal', {
    dest: id,
    signal: signal,
    metadata: this.metadata,
  });
};

/* A WebRTC connection has been established
 *
 * @param {String} id The peer whose connection was established
 */
MultiRTC.prototype.onOpen = function(id) {
  // Flush any pending messages to the given peer
  var pending = this.pending[id];
  pending && pending.forEach(function(data) {
    this.peers[id].channel.send(data);
  }, this);
  delete this.pending[id];

  // The alert the application that the a peer has been connected
  this.trigger('connect', [id]);
};

/* Data has been received from a peer
 *
 * @param {String} id The peer whose data was received
 * @param {Object} event The MessageEvent received from the peer
 */
MultiRTC.prototype.onMessage = function(id, event) {
  this.trigger('data', [id, JSON.parse(event.data)]);
};

/* A WebRTC connection has been closed
 *
 * @param {String} id The peer whose connection was closed
 */
MultiRTC.prototype.onClose = function(id) {
  this.trigger('disconnect', [id]);
};

/*
 * Event System
 */

MultiRTC.prototype.on = function(action, callback) {
  this.events[action] = this.events[action] || [];
  this.events[action].push(callback);
};

MultiRTC.prototype.off = function(action, callback) {
  this.events[action] = this.events[action] || [];

  if(callback) {
    var index = this.events[action].indexOf(callback);
    (index !== -1) && this.events[action].splice(index, 1);
    return index !== -1;
  }

  this.events[action] = [];
};

MultiRTC.prototype.trigger = function(action, args) {
  this.events[action] = this.events[action] || [];

  args = args || [];
  this.events[action].forEach(function(callback) {
    callback.apply(null, args);
  });
};

module.exports = MultiRTC;
