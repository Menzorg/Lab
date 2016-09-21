import { QueueSpreading as AncientQueueSpreading } from 'ancient-graph-spreading';
import { getCollection } from './getCollection';

class QueueSpreading extends AncientQueueSpreading {
  _getGraph(id) {
    return getCollection(id).graph;
  }
}

export { QueueSpreading };