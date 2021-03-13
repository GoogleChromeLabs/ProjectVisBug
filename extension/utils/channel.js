export default class Channel {
  constructor({name, model}) {
    this._port      = chrome.runtime.connect({ name })
    this._message   = chrome.runtime
    this._model     = model

    this.post({action: 'register'})
  }

  post(data) {
    this._port.postMessage(
      Object.assign(this._model, { data }))
  }

  message(data) {
    this._message.postMessage(
      Object.assign(this._model, { data }))
  }

  get port() {
    return this._port
  }

  get message() {
    return this._message
  }
}