import { Graph as AncientGraph } from 'meteor/ancient:graph';
import { factoryPathGraph, factorySpreadGraph, factorySpreaderGraph, GraphSpreading, QueueSpreading as AncientQueueSpreading } from 'ancient-graph-spreading';
import { factoryExistedGraph, factoryNonExistedGraph } from 'ancient-graph-removed';

import { refs } from './refs';

class Graph extends AncientGraph {
  query(selector) {
    if (typeof(selector) == 'string') {
      return super.query(refs.parse(selector)[1]);
    } else {
      if (selector.id) {
        selector.id = refs.parse(selector.id)[1];
      }
      return super.query(selector);
    }
  }
  _generateLink(document) {
    var link = super._generateLink(document);
    link.id = refs.generate(this.collection._ref, link.id);
    return link;
  }
}

var ExistedGraph = factoryExistedGraph(Graph);
var NonExistedGraph = factoryNonExistedGraph(Graph);

export { ExistedGraph, NonExistedGraph };