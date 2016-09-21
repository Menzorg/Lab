import { Graph } from 'meteor/ancient:graph';
import { factoryPathGraph, factorySpreadGraph, factorySpreaderGraph, GraphSpreading, QueueSpreading as AncientQueueSpreading } from 'ancient-graph-spreading';
import { factoryExistedGraph, factoryNonExistedGraph } from 'ancient-graph-removed';

var ExistedGraph = factoryExistedGraph(Graph);
var NonExistedGraph = factoryNonExistedGraph(Graph);

export { ExistedGraph, NonExistedGraph };