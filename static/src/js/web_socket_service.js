
/** @odoo-module **/

import { registry } from "@web/core/registry";

export const webSocketService = {
  dependencies: ["notification", "dialog"],
  start(env, { notification, dialog }) {
    let websocket;
    let checkInterval;
    let checkTimeout;
    let messageCallback;
    let isDisconnect = false;

    function connect() {
      if (isDisconnect) return;
      const wsUri = "ws://127.0.0.1:62536";
      try {
        websocket = new WebSocket(wsUri);
      } catch (error) {
        setTimeout(connect, 1000);
        return;
      }

      websocket.onopen = function () {
        // websocket.send("GetConnect");
        // startPeriodicCheck();
        if (messageCallback) {
          websocket.onmessage = messageCallback;
        }
      };

      websocket.onclose = function (e) {
        // if (checkInterval) {
        //   clearInterval(checkInterval);
        // }
        checkTimeout = setTimeout(connect, 1000);
      };
    }

    return {
      connect: () => {
        isDisconnect = false;
        connect();
      },
      disconnect: () => {
        if (checkTimeout) clearTimeout(checkTimeout);
        isDisconnect = true;
      },
      send: (message) => {
        if (websocket && websocket.readyState === WebSocket.OPEN) {
          websocket.send(message);
        } else {
        }
      },
      onMessage: (callback) => {
        messageCallback = callback;
        if (websocket) {
          websocket.onmessage = callback;
        }
      },
      isConnect: () => {
        return websocket ? websocket.readyState : WebSocket.CLOSED;
      },
    };
  },
};

registry.category("services").add("webSocket", webSocketService);
