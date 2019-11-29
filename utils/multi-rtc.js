var RTC = require("./rtc");

function MultiRTC(options) {
  this.events = {};
  this.peers = {};
  this.pending = {};
  this.responses = {};
  this.data = {};
  this.chunks = {};
  this.DATA_LIMIT = 6144;
  this.CHUNK_SIZE = 4096;

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
    this.peers[id] = new RTC({ dataChannel: true, offerer: !signal, wrtc: this.wrtc });
    this.peers[id].metadata = metadata;
    this.peers[id].on("signal", this.onSignal.bind(this, id));
    this.peers[id].on("channel-open", this.onOpen.bind(this, id));
    this.peers[id].on("channel-message", this.onMessage.bind(this, id));
    this.peers[id].on("channel-close", this.onClose.bind(this, id));
  }

  if (signal) {
    this.peers[id].addSignal(signal);
  }
};

MultiRTC.prototype.send = function(data, id, onResponse) {
  // If a response is expected, register its id before sending it
  var randomString = null;
  if (onResponse) {
    randomString = Math.random().toString(32);
    data.__request_id__ = randomString;
    this.responses[randomString] = onResponse;
  }

  // Use a single id, if it is provided
  var ids = id ? [id] : Object.keys(this.peers);
  data = JSON.stringify(data);

  // If the data is more than the limit (6144 bytes), send chunks
  // of data.
  if (data.length > this.DATA_LIMIT) {
    var dataId = Math.random()
      .toString(32)
      .split(".")[1];
    this.data[dataId] = data;
    data = JSON.stringify({
      __id__: dataId,
      __length__: data.length,
      chunk: data.slice(0, this.CHUNK_SIZE),
    });
  }

  ids.forEach(function(key) {
    // If the peer channel is open and available, send the message right away
    var channel = this.peers[key] && this.peers[key].channel;
    if (channel && channel.readyState === "open") {
      return channel.send(data);
    }

    // If the peer channel is not yet available, add it to the pending queue
    // and send it as soon as the given peer is connected.
    this.pending[key] = this.pending[key] || [];
    this.pending[key].push(data);
  }, this);

  return randomString;
};

MultiRTC.prototype.cancel = function(responseId) {
  delete this.responses[responseId];
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
  this.signaller.emit("signal", {
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
  pending &&
    pending.forEach(function(data) {
      this.peers[id].channel.send(data);
    }, this);
  delete this.pending[id];

  // The alert the application that the a peer has been connected
  this.trigger("connect", [id]);
};

/* Data has been received from a peer
 *
 * @param {String} id The peer whose data was received
 * @param {Object} event The MessageEvent received from the peer
 */
MultiRTC.prototype.onMessage = function(id, event) {
  var data = JSON.parse(event.data);

  if (data.__type__ === "destroy") {
    delete this.data[data.__id__];
    return;
  }

  // Send the remaining chunks
  if (data.__offset__) {
    var dataId = data.__id__;
    var offset = data.__offset__;
    return this.send(
      {
        __id__: dataId,
        chunk: this.data[dataId].slice(offset, offset + this.CHUNK_SIZE),
      },
      id
    );
  }

  // Receive a chunk of data
  if (data.__id__) {
    var chunk = this.chunks[data.__id__] || {
      length: data.__length__,
      content: "",
    };
    this.chunks[data.__id__] = chunk;
    chunk.content += data.chunk;

    // Requesting more chunks of data
    if (chunk.content.length < chunk.length) {
      return this.send(
        {
          __id__: data.__id__,
          __offset__: chunk.content.length,
        },
        id
      );
    }

    // Gathering the data and destroying the requests
    data = JSON.parse(chunk.content);
    delete this.chunks[data.__id__];
    this.send({
      __id__: id,
      __type__: "destroy",
    });
  }

  // When receiving a message that has a __response_id__ respond only to it,
  // without ever triggering the `data` callback.
  if (data.__response_id__) {
    var onResponse = this.responses[data.__response_id__];
    delete this.responses[data.__response_id__];
    return onResponse && onResponse(data);
  }

  this.trigger("data", [id, data]);
};

/* A WebRTC connection has been closed
 *
 * @param {String} id The peer whose connection was closed
 */
MultiRTC.prototype.onClose = function(id) {
  delete this.peers[id];
  this.trigger("disconnect", [id]);
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

  if (callback) {
    var index = this.events[action].indexOf(callback);
    index !== -1 && this.events[action].splice(index, 1);
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
