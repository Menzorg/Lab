function getCollection(id) {
  var splited = id.split('/');
  return Shuttler.collection(splited[0]);
}

export { getCollection };