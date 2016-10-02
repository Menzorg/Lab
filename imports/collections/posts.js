import { Meteor } from 'meteor/meteor';

Posts = new Mongo.Collection('posts');

if (Meteor.isServer) Meteor.publish('posts', function() {
  this.autorun((computation) => {
    return Posts.find({});
  });
});

if (Meteor.isClient) Meteor.subscribe('posts');

/**
 * TODO:
 * 
 * Где и как хранить методы-компиляторы на основе сторонних пакетов?
 * Как отслеживать изменения, что в документе будет значить "откомпелируй меня"?
 * При реакции компилировать и уберать пометку о потребности компиляции.
 * 
 * PS isg
 * Я храню задачки для транзакций в поле launched
 * В файле attach лежат дополнения для коллекций которые при опр изменениях встраивают в создание/изменение/удаление это поле с определенным ключем добавленным в массив. Потом ключ из массива удаляется.
 * 
 * { $addToSet: { launched: 'compile' } } // добавить в массив
 * { $pull: { launched: 'compile' } } // удалить из массива
 * 
 * Структура документа:
 * {
 * 	name: string,
 * 	datetime: number,
 * 	type: string,
 * 	source: object,
 * 	_source: object,
 * 	compile: boolean
 * }
 * 
 */