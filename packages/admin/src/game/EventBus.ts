import Phaser from 'phaser';

// EventBus 用于 React 和 Phaser 之间的通信
const EventBus = new Phaser.Events.EventEmitter();

export default EventBus;
