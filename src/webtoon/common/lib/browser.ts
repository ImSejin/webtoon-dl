export const getElementByXpath = (
    xpath: string,
    contextNode: Node = window.document,
): Node | null => {
  const xPathResult = window.document.evaluate(xpath, contextNode, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null);
  return xPathResult.singleNodeValue;
};

export const getElementsByXpathWithIterator = (
    xpath: string,
    contextNode: Node = window.document,
): Node[] | null => {
  const nodes: Node[] = [];
  const xPathResult = window.document.evaluate(xpath, contextNode, null, XPathResult.ORDERED_NODE_ITERATOR_TYPE, null);

  let nextNode;
  while (nextNode = xPathResult.iterateNext()) {
    nodes.push(nextNode);
  }

  return nodes;
};

export const getElementsByXpathWithSnapshot = (
    xpath: string,
    contextNode: Node = window.document,
): Node[] | null => {
  const xPathResult = window.document.evaluate(xpath, contextNode, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
  return Array.from({length: xPathResult.snapshotLength}, (_, i) => xPathResult.snapshotItem(i)) as Node[];
};
