// test ArrayNode
var assert = require('assert'),
    approx = require('../../../tools/approx'),
    math = require('../../../index'),
    Node = require('../../../lib/expression/node/Node'),
    ConstantNode = require('../../../lib/expression/node/ConstantNode'),
    SymbolNode = require('../../../lib/expression/node/SymbolNode'),
    RangeNode = require('../../../lib/expression/node/RangeNode'),
    ArrayNode = require('../../../lib/expression/node/ArrayNode');

describe('ArrayNode', function() {

  it ('should create an ArrayNode', function () {
    var c = new ConstantNode(math, 1);
    var a = new ArrayNode(math, [c]);
    var b = new ArrayNode(math, []);
    assert(a instanceof ArrayNode);
    assert(b instanceof ArrayNode);
    assert.equal(a.type, 'ArrayNode');
    assert.equal(b.type, 'ArrayNode');
  });

  it ('should throw an error when calling without new operator', function () {
    assert.throws(function () {ArrayNode(math)}, SyntaxError);
  });

  it ('should throw an error on wrong constructor arguments', function () {
    assert.throws(function () {new ArrayNode(math, 2)}, TypeError);
    assert.throws(function () {new ArrayNode(math, [2, 3])}, TypeError);
  });

  it ('should evaluate an ArrayNode', function () {
    var c = new ConstantNode(math, 1);
    var a = new ArrayNode(math, [c]);
    var b = new ArrayNode(math);

    assert.deepEqual(a.compile().eval(), math.matrix([1]));
    assert.deepEqual(b.compile().eval(), math.matrix([]));
  });

  it ('should compile an ArrayNode', function () {
    var mathArray = math.create({matrix: 'array'});

    var a = new ConstantNode(mathArray, 1);
    var b = new ConstantNode(mathArray, 2);
    var c = new ConstantNode(mathArray, 3);
    var d = new ConstantNode(mathArray, 4);
    var n = new ArrayNode(mathArray, [a, b, c, d]);

    var expr2 = n.compile();
    assert.deepEqual(expr2.eval(), [1,2,3,4]);
  });

  it ('should compile nested ArrayNodes', function () {
    var a = new ConstantNode(math, 1);
    var b = new ConstantNode(math, 2);
    var c = new ConstantNode(math, 3);
    var d = new ConstantNode(math, 4);

    var n2 = new ArrayNode(math, [a, b]);
    var n3 = new ArrayNode(math, [c, d]);
    var n4 = new ArrayNode(math, [n2, n3]);

    var expr = n4.compile();
    assert.deepEqual(expr.eval(), math.matrix([[1,2],[3,4]]));
  });

  it ('should find an ArrayNode', function () {
    var a = new ConstantNode(math, 1);
    var b = new SymbolNode(math, 'x');
    var c = new ConstantNode(math, 2);
    var d = new ArrayNode(math, [a, b, c]);

    assert.deepEqual(d.filter(function (node) {return node instanceof ArrayNode}),     [d]);
    assert.deepEqual(d.filter(function (node) {return node instanceof SymbolNode}),    [b]);
    assert.deepEqual(d.filter(function (node) {return node instanceof RangeNode}),     []);
    assert.deepEqual(d.filter(function (node) {return node instanceof ConstantNode}),  [a, c]);
    assert.deepEqual(d.filter(function (node) {return node instanceof ConstantNode && node.value == '2'}),  [c]);
  });

  it ('should run forEach on an ArrayNode', function () {
    // [x, 2]
    var a = new SymbolNode(math, 'x');
    var b = new ConstantNode(math, 2);
    var c = new ArrayNode(math, [a, b]);

    var d = new ConstantNode(math, 3);
    var nodes = [];
    var paths = [];
    c.forEach(function (node, path, parent) {
      nodes.push(node);
      paths.push(path);
      assert.strictEqual(parent, c);
    });

    assert.deepEqual(paths, ['nodes[0]', 'nodes[1]']);
    assert.equal(nodes.length, 2);
    assert.strictEqual(nodes[0], a);
    assert.strictEqual(nodes[1], b);
  });

  it ('should map an ArrayNode', function () {
    // [x, 2]
    var a = new SymbolNode(math, 'x');
    var b = new ConstantNode(math, 2);
    var c = new ArrayNode(math, [a, b]);

    var d = new ConstantNode(math, 3);
    var nodes = [];
    var paths = [];
    var e = c.map(function (node, path, parent) {
      nodes.push(node);
      paths.push(path);
      assert.strictEqual(parent, c);

      return (node instanceof SymbolNode) && (node.name == 'x') ? d : node;
    });

    assert.deepEqual(paths, ['nodes[0]', 'nodes[1]']);
    assert.equal(nodes.length, 2);
    assert.strictEqual(nodes[0], a);
    assert.strictEqual(nodes[1], b);

    assert.notStrictEqual(e,  c);
    assert.deepEqual(e.nodes[0],  d);
    assert.deepEqual(e.nodes[1],  b);
  });

  it ('should throw an error when the map callback does not return a node', function () {
    var a = new SymbolNode(math, 'x');
    var b = new ConstantNode(math, 2);
    var c = new ArrayNode(math, [a, b]);

    assert.throws(function () {
      c.map(function () {});
    }, /Callback function must return a Node/)
  });

  it ('should transform an ArrayNodes parameters', function () {
    // [x, 2]
    var a = new SymbolNode(math, 'x');
    var b = new ConstantNode(math, 2);
    var c = new ArrayNode(math, [a, b]);

    var d = new ConstantNode(math, 3);
    var e = c.transform(function (node) {
      return (node instanceof SymbolNode) && (node.name == 'x') ? d : node;
    });

    assert.notStrictEqual(e,  c);
    assert.deepEqual(e.nodes[0],  d);
    assert.deepEqual(e.nodes[1],  b);
  });

  it ('should transform an ArrayNode itself', function () {
    // [x, 2]
    var a = new SymbolNode(math, 'x');
    var b = new ConstantNode(math, 2);
    var c = new ArrayNode(math, [a, b]);

    var d = new ConstantNode(math, 3);
    var e = c.transform(function (node) {
      return (node instanceof ArrayNode) ? d : node;
    });
    assert.strictEqual(e, d);
  });

  it ('should traverse an ArrayNode', function () {
    var a = new ConstantNode(math, 1);
    var b = new ConstantNode(math, 2);
    var c = new ArrayNode(math, [a, b]);

    var count = 0;
    c.traverse(function (node, path, parent) {
      count++;

      switch(count) {
        case 1:
          assert.strictEqual(node, c);
          assert.strictEqual(path, null);
          assert.strictEqual(parent, null);
          break;

        case 2:
          assert.strictEqual(node, a);
          assert.strictEqual(path, 'nodes[0]');
          assert.strictEqual(parent, c);
          break;

        case 3:
          assert.strictEqual(node, b);
          assert.strictEqual(path, 'nodes[1]');
          assert.strictEqual(parent, c);
          break;
      }
    });

    assert.equal(count, 3);
  });

  it ('should clone an ArrayNode', function () {
    // [x, 2]
    var a = new SymbolNode(math, 'x');
    var b = new ConstantNode(math, 2);
    var c = new ArrayNode(math, [a, b]);

    var d = c.clone();
    assert(d instanceof ArrayNode);
    assert.deepEqual(c, d);
    assert.notStrictEqual(c, d);
    assert.strictEqual(c.nodes[0], d.nodes[0]);
    assert.strictEqual(c.nodes[1], d.nodes[1]);
  });

  it ('should stringify an ArrayNode', function () {
    var a = new ConstantNode(math, 1);
    var b = new ConstantNode(math, 2);
    var c = new ConstantNode(math, 3);
    var d = new ConstantNode(math, 4);
    var n = new ArrayNode(math, [a, b, c, d]);

    assert.equal(n.toString(), '[1, 2, 3, 4]');
  });

  it ('should LaTeX an ArrayNode', function () {
    var a = new ConstantNode(math, 1);
    var b = new ConstantNode(math, 2);
    var c = new ConstantNode(math, 3);
    var d = new ConstantNode(math, 4);
    var v1 = new ArrayNode(math, [a, b]);
    var v2 = new ArrayNode(math, [c, d]);
    var n = new ArrayNode(math, [v1, v2]);

    assert.equal(n.toTex(), '\\begin{bmatrix}1&2\\\\3&4\\\\\\end{bmatrix}');
  });

});
