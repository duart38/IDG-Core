var WorkerThread = (function (exports) {
    'use strict';

    /**
     * Copyright 2018 The AMP HTML Authors. All Rights Reserved.
     *
     * Licensed under the Apache License, Version 2.0 (the "License");
     * you may not use this file except in compliance with the License.
     * You may obtain a copy of the License at
     *
     *      http://www.apache.org/licenses/LICENSE-2.0
     *
     * Unless required by applicable law or agreed to in writing, software
     * distributed under the License is distributed on an "AS-IS" BASIS,
     * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
     * See the License for the specific language governing permissions and
     * limitations under the License.
     */
    let count$1 = 0;
    let transfer$2 = [];
    const mapping$1 = new Map();
    /**
     * Stores a string in mapping and returns the index of the location.
     * @param value string to store
     * @return location in map
     */

    function store$1(value) {
      if (mapping$1.has(value)) {
        // Safe to cast since we verified the mapping contains the value
        return mapping$1.get(value);
      }

      mapping$1.set(value, count$1);
      transfer$2.push(value);
      return count$1++;
    }
    /**
     * Returns strings registered but not yet transferred.
     * Side effect: Resets the transfer array to default value, to prevent passing the same values multiple times.
     */

    function consume$1() {
      const strings = transfer$2;
      transfer$2 = [];
      return strings;
    }

    /**
     * Copyright 2018 The AMP HTML Authors. All Rights Reserved.
     *
     * Licensed under the Apache License, Version 2.0 (the "License");
     * you may not use this file except in compliance with the License.
     * You may obtain a copy of the License at
     *
     *      http://www.apache.org/licenses/LICENSE-2.0
     *
     * Unless required by applicable law or agreed to in writing, software
     * distributed under the License is distributed on an "AS-IS" BASIS,
     * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
     * See the License for the specific language governing permissions and
     * limitations under the License.
     */
    let phase = 0
    /* Initializing */
    ;
    const set = newPhase => phase = newPhase;

    /**
     * Copyright 2018 The AMP HTML Authors. All Rights Reserved.
     *
     * Licensed under the Apache License, Version 2.0 (the "License");
     * you may not use this file except in compliance with the License.
     * You may obtain a copy of the License at
     *
     *      http://www.apache.org/licenses/LICENSE-2.0
     *
     * Unless required by applicable law or agreed to in writing, software
     * distributed under the License is distributed on an "AS-IS" BASIS,
     * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
     * See the License for the specific language governing permissions and
     * limitations under the License.
     */
    let count = 0;
    let transfer$1 = [];
    const mapping = new Map();
    /**
     * Override the store for a node during the initialization phase.
     * @param node Node to store and modify with index
     * @param override Override number to use as the identifier.
     *
     * NOTE: THIS IS ONLY TO BE USED DURING INITIALIZATION.
     */

    function storeOverride(node, override) {
      if (phase === 0
      /* Initializing */
      ) {
        mapping.set(node[7
        /* index */
        ] = override, node);
        count = Math.max(count, override);
      }

      return override;
    }
    /**
     * Stores a node in mapping, and makes the index available on the Node directly.
     * @param node Node to store and modify with index
     * @return index Node was stored with in mapping
     */

    function store(node) {
      if (node[7
      /* index */
      ] !== undefined) {
        return node[7
        /* index */
        ];
      }

      mapping.set(node[7
      /* index */
      ] = ++count, node);

      if (phase > 0
      /* Initializing */
      ) {
        // After Initialization, include all future dom node creation into the list for next transfer.
        transfer$1.push(node);
      }

      return count;
    }
    /**
     * Retrieves a node based on an index.
     * @param index location in map to retrieve a Node for
     * @return either the Node represented in index position, or null if not available.
     */

    function get(index) {
      // mapping has a 1 based index, since on first store we ++count before storing.
      return !!index && mapping.get(index) || null;
    }
    /**
     * Returns nodes registered but not yet transferred.
     * Side effect: Resets the transfer array to default value, to prevent passing the same values multiple times.
     */

    function consume() {
      const copy = transfer$1;
      transfer$1 = [];
      return copy;
    }

    /**
     * Copyright 2018 The AMP HTML Authors. All Rights Reserved.
     *
     * Licensed under the Apache License, Version 2.0 (the "License");
     * you may not use this file except in compliance with the License.
     * You may obtain a copy of the License at
     *
     *      http://www.apache.org/licenses/LICENSE-2.0
     *
     * Unless required by applicable law or agreed to in writing, software
     * distributed under the License is distributed on an "AS-IS" BASIS,
     * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
     * See the License for the specific language governing permissions and
     * limitations under the License.
     */
    let pending = false;
    let pendingMutations$1 = []; // TODO(choumx): Change `mutation` to Array<Uint16> to prevent casting errors e.g. integer underflow, precision loss.

    function transfer(document, mutation) {
      if (phase > 0
      /* Initializing */
      && document[58
      /* allowTransfer */
      ]) {
        pending = true;
        pendingMutations$1 = pendingMutations$1.concat(mutation);
        Promise.resolve().then(_ => {
          if (pending) {
            const nodes = new Uint16Array(consume().reduce((acc, node) => acc.concat(node[8
            /* creationFormat */
            ]), [])).buffer;
            const mutations = new Uint16Array(pendingMutations$1).buffer;
            document.postMessage({
              [54
              /* phase */
              ]: phase,
              [12
              /* type */
              ]: phase === 2
              /* Mutating */
              ? 3
              /* MUTATE */
              : 2
              /* HYDRATE */
              ,
              [37
              /* nodes */
              ]: nodes,
              [41
              /* strings */
              ]: consume$1(),
              [36
              /* mutations */
              ]: mutations
            }, [nodes, mutations]);
            pendingMutations$1 = [];
            pending = false;
            set(2
            /* Mutating */
            );
          }
        });
      }
    }

    /**
     * Copyright 2019 The AMP HTML Authors. All Rights Reserved.
     *
     * Licensed under the Apache License, Version 2.0 (the "License");
     * you may not use this file except in compliance with the License.
     * You may obtain a copy of the License at
     *
     *      http://www.apache.org/licenses/LICENSE-2.0
     *
     * Unless required by applicable law or agreed to in writing, software
     * distributed under the License is distributed on an "AS-IS" BASIS,
     * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
     * See the License for the specific language governing permissions and
     * limitations under the License.
     */
    class AMP {
      constructor(document) {
        this.document = void 0;
        this.document = document;
      }
      /**
       * Returns a promise that resolves with the value of `key`.
       * @param key
       */


      getState(key = '') {
        return new Promise(resolve => {
          const messageHandler = event => {
            const message = event.data;

            if (message[12
            /* type */
            ] !== 11
            /* GET_STORAGE */
            ) {
              return;
            } // TODO: There is a race condition here if there are multiple concurrent
            // getState(k) messages in flight, where k is the same value.


            const storageMessage = message;

            if (storageMessage[74
            /* storageKey */
            ] !== key) {
              return;
            }

            this.document.removeGlobalEventListener('message', messageHandler);
            const value = storageMessage[21
            /* value */
            ];
            resolve(value);
          };

          this.document.addGlobalEventListener('message', messageHandler);
          transfer(this.document, [12
          /* STORAGE */
          , 1
          /* GET */
          , 2
          /* AmpState */
          ,
          /* key */
          store$1(key),
          /* value */
          0]);
          setTimeout(resolve, 500, null); // TODO: Why a magical constant, define and explain.
        });
      }
      /**
       * Deep-merges `state` into the existing state.
       * @param state
       */


      setState(state) {
        // Stringify `state` so it can be post-messaged as a transferrable.
        let stringified;

        try {
          stringified = JSON.stringify(state);
        } catch (e) {
          throw new Error(`AMP.setState only accepts valid JSON as input.`);
        }

        transfer(this.document, [12
        /* STORAGE */
        , 2
        /* SET */
        , 2
        /* AmpState */
        ,
        /* key */
        0,
        /* value */
        store$1(stringified)]);
      }

    }

    /**
     * Copyright 2020 The AMP HTML Authors. All Rights Reserved.
     *
     * Licensed under the Apache License, Version 2.0 (the "License");
     * you may not use this file except in compliance with the License.
     * You may obtain a copy of the License at
     *
     *      http://www.apache.org/licenses/LICENSE-2.0
     *
     * Unless required by applicable law or agreed to in writing, software
     * distributed under the License is distributed on an "AS-IS" BASIS,
     * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
     * See the License for the specific language governing permissions and
     * limitations under the License.
     */
    const exportedFunctions = {};
    function callFunctionMessageHandler(event, document) {
      const msg = event.data;

      if (msg[12
      /* type */
      ] !== 12
      /* FUNCTION */
      ) {
        return;
      }

      const functionMessage = msg;
      const fnIdentifier = functionMessage[77
      /* functionIdentifier */
      ];
      const fnArguments = JSON.parse(functionMessage[78
      /* functionArguments */
      ]);
      const index = functionMessage[7
      /* index */
      ];
      const fn = exportedFunctions[fnIdentifier];

      if (!fn) {
        transfer(document, [13
        /* FUNCTION_CALL */
        , 2
        /* REJECT */
        , index, store$1(JSON.stringify(`[worker-dom]: Exported function "${fnIdentifier}" could not be found.`))]);
        return;
      }

      Promise.resolve(fn) // Forcing promise flows allows us to skip a try/catch block.
      .then(f => f.apply(null, fnArguments)).then(value => {
        transfer(document, [13
        /* FUNCTION_CALL */
        , 1
        /* RESOLVE */
        , index, store$1(JSON.stringify(value))]);
      }, err => {
        const errorMessage = JSON.stringify(err.message || err);
        transfer(document, [13
        /* FUNCTION_CALL */
        , 2
        /* REJECT */
        , index, store$1(JSON.stringify(`[worker-dom]: Function "${fnIdentifier}" threw: "${errorMessage}"`))]);
      });
    }
    function exportFunction(name, fn) {
      if (!name || name === '') {
        throw new Error(`[worker-dom]: Attempt to export function was missing an identifier.`);
      }

      if (typeof fn !== 'function') {
        throw new Error(`[worker-dom]: Attempt to export non-function failed: ("${name}", ${typeof fn}).`);
      }

      if (name in exportedFunctions) {
        throw new Error(`[worker-dom]: Attempt to re-export function failed: "${name}".`);
      }

      exportedFunctions[name] = fn;
    }

    /**
     * Copyright 2018 The AMP HTML Authors. All Rights Reserved.
     *
     * Licensed under the Apache License, Version 2.0 (the "License");
     * you may not use this file except in compliance with the License.
     * You may obtain a copy of the License at
     *
     *      http://www.apache.org/licenses/LICENSE-2.0
     *
     * Unless required by applicable law or agreed to in writing, software
     * distributed under the License is distributed on an "AS-IS" BASIS,
     * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
     * See the License for the specific language governing permissions and
     * limitations under the License.
     */
    const toLower = value => value.toLowerCase();
    const toUpper = value => value.toUpperCase();
    const containsIndexOf = pos => pos !== -1;
    const keyValueString = (key, value) => `${key}="${value}"`;

    /**
     * Copyright 2018 The AMP HTML Authors. All Rights Reserved.
     *
     * Licensed under the Apache License, Version 2.0 (the "License");
     * you may not use this file except in compliance with the License.
     * You may obtain a copy of the License at
     *
     *      http://www.apache.org/licenses/LICENSE-2.0
     *
     * Unless required by applicable law or agreed to in writing, software
     * distributed under the License is distributed on an "AS-IS" BASIS,
     * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
     * See the License for the specific language governing permissions and
     * limitations under the License.
     */
    const observers = [];
    let pendingMutations = false;
    /**
     * @param observerTarget
     * @param target
     */

    const matchesIndex = (observerTarget, target) => {
      return !!observerTarget && observerTarget[7
      /* index */
      ] === target[7
      /* index */
      ];
    };
    /**
     * @param observer
     * @param record
     */


    const pushMutation = (observer, record) => {
      observer.pushRecord(record);

      if (!pendingMutations) {
        pendingMutations = true;
        Promise.resolve().then(() => {
          pendingMutations = false;
          observers.forEach(observer => observer.callback(observer.takeRecords()));
        });
      }
    };
    /**
     * @param document
     * @param record
     * @param transferable
     */


    function mutate(document, record, transferable) {
      // Post-message `transferable` to the main thread to apply mutations.
      transfer(document, transferable); // The MutationRecord is only used for external callers of MutationObserver.

      observers.forEach(observer => {
        for (let t = record.target; t; t = t.parentNode) {
          if (matchesIndex(observer.target, t)) {
            pushMutation(observer, record);
            break;
          }
        }
      });
    }
    class MutationObserver {
      constructor(callback) {
        this.callback = void 0;
        this[42
        /* records */
        ] = [];
        this.target = void 0;
        this.options = void 0;
        this.callback = callback;
      }
      /**
       * Register the MutationObserver instance to observe a Nodes mutations.
       * @see https://developer.mozilla.org/en-US/docs/Web/API/MutationObserver
       * @param target Node to observe DOM mutations
       */


      observe(target, options) {
        this.disconnect();
        this.target = target;
        this.options = options || {};
        observers.push(this);
      }
      /**
       * Stop the MutationObserver instance from observing a Nodes mutations.
       * @see https://developer.mozilla.org/en-US/docs/Web/API/MutationObserver
       */


      disconnect() {
        this.target = null;
        const index = observers.indexOf(this);

        if (index >= 0) {
          observers.splice(index, 1);
        }
      }
      /**
       * Empties the MutationObserver instance's record queue and returns what was in there.
       * @see https://developer.mozilla.org/en-US/docs/Web/API/MutationObserver
       * @return Mutation Records stored on this MutationObserver instance.
       */


      takeRecords() {
        const records = this[42
        /* records */
        ];
        return records.splice(0, records.length);
      }
      /**
       * NOTE: This method doesn't exist on native MutationObserver.
       * @param record MutationRecord to store for this instance.
       */


      pushRecord(record) {
        this[42
        /* records */
        ].push(record);
      }

    }

    /**
     * Copyright 2018 The AMP HTML Authors. All Rights Reserved.
     *
     * Licensed under the Apache License, Version 2.0 (the "License");
     * you may not use this file except in compliance with the License.
     * You may obtain a copy of the License at
     *
     *      http://www.apache.org/licenses/LICENSE-2.0
     *
     * Unless required by applicable law or agreed to in writing, software
     * distributed under the License is distributed on an "AS-IS" BASIS,
     * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
     * See the License for the specific language governing permissions and
     * limitations under the License.
     */
    /**
     * Propagates a property change for a Node to itself and all childNodes.
     * @param node Node to start applying change to
     * @param property Property to modify
     * @param value New value to apply
     */

    const propagate$3 = (node, property, value) => {
      node[property] = value;
      node.childNodes.forEach(child => propagate$3(child, property, value));
    }; // https://developer.mozilla.org/en-US/docs/Web/API/Node
    // https://developer.mozilla.org/en-US/docs/Web/API/EventTarget
    //
    // Please note, in this implmentation Node doesn't extend EventTarget.
    // This is intentional to reduce the number of classes.

    class Node {
      // TODO(choumx): Should be a Document.
      // https://drafts.csswg.org/selectors-4/#scoping-root
      constructor(nodeType, nodeName, ownerDocument, overrideIndex) {
        this.ownerDocument = void 0;
        this[45
        /* scopingRoot */
        ] = void 0;
        this.nodeType = void 0;
        this.nodeName = void 0;
        this.childNodes = [];
        this.parentNode = null;
        this.isConnected = false;
        this[7
        /* index */
        ] = void 0;
        this[9
        /* transferredFormat */
        ] = void 0;
        this[8
        /* creationFormat */
        ] = void 0;
        this[10
        /* handlers */
        ] = {};
        this.nodeType = nodeType;
        this.nodeName = nodeName;
        this.ownerDocument = ownerDocument || this;
        this[45
        /* scopingRoot */
        ] = this;
        this[7
        /* index */
        ] = overrideIndex ? storeOverride(this, overrideIndex) : store(this);
        this[9
        /* transferredFormat */
        ] = [this[7
        /* index */
        ]];
      } // Unimplemented Properties
      // Node.baseURI – https://developer.mozilla.org/en-US/docs/Web/API/Node/baseURI
      // Unimplemented Methods
      // Node.compareDocumentPosition() – https://developer.mozilla.org/en-US/docs/Web/API/Node/compareDocumentPosition
      // Node.getRootNode() – https://developer.mozilla.org/en-US/docs/Web/API/Node/getRootNode
      // Node.isDefaultNamespace() – https://developer.mozilla.org/en-US/docs/Web/API/Node/isDefaultNamespace
      // Node.isEqualNode() – https://developer.mozilla.org/en-US/docs/Web/API/Node/isEqualNode
      // Node.isSameNode() – https://developer.mozilla.org/en-US/docs/Web/API/Node/isSameNode
      // Node.lookupPrefix() – https://developer.mozilla.org/en-US/docs/Web/API/Node/lookupPrefix
      // Node.lookupNamespaceURI() – https://developer.mozilla.org/en-US/docs/Web/API/Node/lookupNamespaceURI
      // Node.normalize() – https://developer.mozilla.org/en-US/docs/Web/API/Node/normalize
      // Implemented at Element/Text layer
      // Node.nodeValue – https://developer.mozilla.org/en-US/docs/Web/API/Node/nodeValue
      // Node.cloneNode – https://developer.mozilla.org/en-US/docs/Web/API/Node/cloneNode

      /**
       * Getter returning the text representation of Element.childNodes.
       * @see https://developer.mozilla.org/en-US/docs/Web/API/Node/textContent
       * @return text from all childNodes.
       */


      get textContent() {
        return this.getTextContent();
      }
      /**
       * Use `this.getTextContent()` instead of `super.textContent` to avoid incorrect or expensive ES5 transpilation.
       */


      getTextContent() {
        let textContent = '';
        const childNodes = this.childNodes;

        if (childNodes.length) {
          childNodes.forEach(childNode => textContent += childNode.textContent);
          return textContent;
        }

        return '';
      }
      /**
       * @see https://developer.mozilla.org/en-US/docs/Web/API/Node/firstChild
       * @return Node's first child in the tree, or null if the node has no children.
       */


      get firstChild() {
        return this.childNodes[0] || null;
      }
      /**
       * @see https://developer.mozilla.org/en-US/docs/Web/API/Node/lastChild
       * @return The last child of a node, or null if there are no child elements.
       */


      get lastChild() {
        return this.childNodes[this.childNodes.length - 1] || null;
      }
      /**
       * @see https://developer.mozilla.org/en-US/docs/Web/API/Node/nextSibling
       * @return node immediately following the specified one in it's parent's childNodes, or null if one doesn't exist.
       */


      get nextSibling() {
        if (this.parentNode === null) {
          return null;
        }

        const parentChildNodes = this.parentNode.childNodes;
        return parentChildNodes[parentChildNodes.indexOf(this) + 1] || null;
      }
      /**
       * @see https://developer.mozilla.org/en-US/docs/Web/API/Node/previousSibling
       * @return node immediately preceding the specified one in its parent's childNodes, or null if the specified node is the first in that list.
       */


      get previousSibling() {
        if (this.parentNode === null) {
          return null;
        }

        const parentChildNodes = this.parentNode.childNodes;
        return parentChildNodes[parentChildNodes.indexOf(this) - 1] || null;
      }
      /**
       * @see https://developer.mozilla.org/en-US/docs/Web/API/Node/hasChildNodes
       * @return boolean if the Node has childNodes.
       */


      hasChildNodes() {
        return this.childNodes.length > 0;
      }
      /**
       * @see https://developer.mozilla.org/en-US/docs/Web/API/Node/contains
       * @param otherNode
       * @return whether a Node is a descendant of a given Node
       */


      contains(otherNode) {
        if (otherNode === this) {
          return true;
        }

        if (this.childNodes.length > 0) {
          if (this.childNodes.includes(this)) {
            return true;
          }

          return this.childNodes.some(child => child.contains(otherNode));
        }

        return false;
      }
      /**
       * @see https://developer.mozilla.org/en-US/docs/Web/API/Node/insertBefore
       * @param child
       * @param referenceNode
       * @return child after it has been inserted.
       */


      insertBefore(child, referenceNode) {
        if (child === null || child === this) {
          // The new child cannot contain the parent.
          return child;
        }

        if (child.nodeType === 11
        /* DOCUMENT_FRAGMENT_NODE */
        ) {
          child.childNodes.slice().forEach(node => this.insertBefore(node, referenceNode));
        } else if (referenceNode == null) {
          // When a referenceNode is not valid, appendChild(child).
          return this.appendChild(child);
        } else if (this.childNodes.indexOf(referenceNode) >= 0) {
          // Should only insertBefore direct children of this Node.
          child.remove(); // Removing a child can cause this.childNodes to change, meaning we need to splice from its updated location.

          this.childNodes.splice(this.childNodes.indexOf(referenceNode), 0, child);
          this[56
          /* insertedNode */
          ](child);
          mutate(this.ownerDocument, {
            addedNodes: [child],
            nextSibling: referenceNode,
            type: 2
            /* CHILD_LIST */
            ,
            target: this
          }, [2
          /* CHILD_LIST */
          , this[7
          /* index */
          ], referenceNode[7
          /* index */
          ], 0, 1, 0, child[7
          /* index */
          ]]);
          return child;
        }

        return null;
      }
      /**
       * When a Node is inserted, this method is called (and can be extended by other classes)
       * @param child
       */


      [56
      /* insertedNode */
      ](child) {
        child.parentNode = this;
        propagate$3(child, 'isConnected', this.isConnected);
        propagate$3(child, 45
        /* scopingRoot */
        , this[45
        /* scopingRoot */
        ]);
      }
      /**
       * When a node is removed, this method is called (and can be extended by other classes)
       * @param child
       */


      [57
      /* removedNode */
      ](child) {
        child.parentNode = null;
        propagate$3(child, 'isConnected', false);
        propagate$3(child, 45
        /* scopingRoot */
        , child);
      }
      /**
       * Adds the specified childNode argument as the last child to the current node.
       * @see https://developer.mozilla.org/en-US/docs/Web/API/Node/appendChild
       * @param child Child Node to append to this Node.
       * @return Node the appended node.
       */


      appendChild(child) {
        if (child.nodeType === 11
        /* DOCUMENT_FRAGMENT_NODE */
        ) {
          child.childNodes.slice().forEach(this.appendChild, this);
        } else {
          child.remove();
          this.childNodes.push(child);
          this[56
          /* insertedNode */
          ](child);
          const previousSibling = this.childNodes[this.childNodes.length - 2];
          mutate(this.ownerDocument, {
            addedNodes: [child],
            previousSibling,
            type: 2
            /* CHILD_LIST */
            ,
            target: this
          }, [2
          /* CHILD_LIST */
          , this[7
          /* index */
          ], 0, previousSibling ? previousSibling[7
          /* index */
          ] : 0, 1, 0, child[7
          /* index */
          ]]);
        }

        return child;
      }
      /**
       * Removes a child node from the current element.
       * @see https://developer.mozilla.org/en-US/docs/Web/API/Node/removeChild
       * @param child Child Node to remove from this Node.
       * @return Node removed from the tree or null if the node wasn't attached to this tree.
       */


      removeChild(child) {
        const index = this.childNodes.indexOf(child);
        const exists = index >= 0;

        if (exists) {
          this.childNodes.splice(index, 1);
          this[57
          /* removedNode */
          ](child);
          mutate(this.ownerDocument, {
            removedNodes: [child],
            type: 2
            /* CHILD_LIST */
            ,
            target: this
          }, [2
          /* CHILD_LIST */
          , this[7
          /* index */
          ], 0, 0, 0, 1, child[7
          /* index */
          ]]);
          return child;
        }

        return null;
      }
      /**
       * @param newChild
       * @param oldChild
       * @return child that was replaced.
       * @note `HierarchyRequestError` not handled e.g. newChild is an ancestor of current node.
       * @see https://dom.spec.whatwg.org/#concept-node-replace
       */


      replaceChild(newChild, oldChild) {
        if (newChild === oldChild || // In DOM, this throws DOMException: "The node to be replaced is not a child of this node."
        oldChild.parentNode !== this || // In DOM, this throws DOMException: "The new child element contains the parent."
        newChild.contains(this)) {
          return oldChild;
        } // If newChild already exists in the DOM, it is first removed.
        // TODO: Consider using a mutation-free API here to avoid two mutations
        // per replaceChild() call.


        newChild.remove();
        const index = this.childNodes.indexOf(oldChild);
        this.childNodes.splice(index, 1, newChild);
        this[57
        /* removedNode */
        ](oldChild);
        this[56
        /* insertedNode */
        ](newChild);
        mutate(this.ownerDocument, {
          addedNodes: [newChild],
          removedNodes: [oldChild],
          type: 2
          /* CHILD_LIST */
          ,
          nextSibling: this.childNodes[index + 1],
          target: this
        }, [2
        /* CHILD_LIST */
        , this[7
        /* index */
        ], this.childNodes[index + 1] ? this.childNodes[index + 1][7
        /* index */
        ] : 0, 0, 1, 1, newChild[7
        /* index */
        ], oldChild[7
        /* index */
        ]]);
        return oldChild;
      }
      /**
       * Replaces the current node with the provided Array<node|string>.
       * @param nodes
       * @see https://developer.mozilla.org/en-US/docs/Web/API/ChildNode/replaceWith
       */


      replaceWith(...nodes) {
        const parent = this.parentNode;
        let nodeIterator = nodes.length;
        let currentNode;

        if (!parent) {
          return;
        }

        if (!nodeIterator) {
          parent.removeChild(this);
        }

        while (nodeIterator--) {
          currentNode = nodes[nodeIterator];

          if (typeof currentNode !== 'object') {
            currentNode = this.ownerDocument.createTextNode(currentNode);
          } // TODO: Investigate inserting all new nodes in a single operation.


          if (!nodeIterator) {
            // currentNode is the first argument (currentNode === arguments[0])
            parent.replaceChild(currentNode, this);
          } else {
            parent.insertBefore(currentNode, this.nextSibling);
          }
        }
      }
      /**
       * Removes this Node from the tree it belogs too.
       * @see https://developer.mozilla.org/en-US/docs/Web/API/ChildNode/remove
       */


      remove() {
        if (this.parentNode) {
          this.parentNode.removeChild(this);
        }
      }
      /**
       * Add an event listener to callback when a specific event type is dispatched.
       * @see https://developer.mozilla.org/en-US/docs/Web/API/EventTarget/addEventListener
       * @param type Event Type (i.e 'click')
       * @param handler Function called when event is dispatched.
       */


      addEventListener(type, handler, options = {}) {
        const lowerType = toLower(type);
        const storedType = store$1(lowerType);
        const handlers = this[10
        /* handlers */
        ][lowerType];
        let index = 0;

        if (handlers) {
          index = handlers.push(handler);
        } else {
          this[10
          /* handlers */
          ][lowerType] = [handler];
        }

        transfer(this.ownerDocument, [4
        /* EVENT_SUBSCRIPTION */
        , this[7
        /* index */
        ], 0, 1, storedType, index, Number(Boolean(options.capture)), Number(Boolean(options.once)), Number(Boolean(options.passive)), Number(Boolean(options.workerDOMPreventDefault))]);
      }
      /**
       * Remove a registered event listener for a specific event type.
       * @see https://developer.mozilla.org/en-US/docs/Web/API/EventTarget/removeEventListener
       * @param type Event Type (i.e 'click')
       * @param handler Function to stop calling when event is dispatched.
       */


      removeEventListener(type, handler) {
        const lowerType = toLower(type);
        const handlers = this[10
        /* handlers */
        ][lowerType];
        const index = !!handlers ? handlers.indexOf(handler) : -1;

        if (index >= 0) {
          handlers.splice(index, 1);
          transfer(this.ownerDocument, [4
          /* EVENT_SUBSCRIPTION */
          , this[7
          /* index */
          ], 1, 0, store$1(lowerType), index]);
        }
      }
      /**
       * Dispatch an event for this Node.
       * @see https://developer.mozilla.org/en-US/docs/Web/API/EventTarget/dispatchEvent
       * @param event Event to dispatch to this node and potentially cascade to parents.
       */


      dispatchEvent(event) {
        let target = event.currentTarget = this;
        let handlers;
        let iterator;

        do {
          handlers = target && target[10
          /* handlers */
          ] && target[10
          /* handlers */
          ][toLower(event.type)];

          if (handlers) {
            for (iterator = handlers.length; iterator--;) {
              if ((handlers[iterator].call(target, event) === false || event[51
              /* end */
              ]) && event.cancelable) {
                break;
              }
            }
          }
        } while (event.bubbles && !(event.cancelable && event[50
        /* stop */
        ]) && (target = target && target.parentNode));

        return !event.defaultPrevented;
      }

    }

    /**
     * Copyright 2018 The AMP HTML Authors. All Rights Reserved.
     *
     * Licensed under the Apache License, Version 2.0 (the "License");
     * you may not use this file except in compliance with the License.
     * You may obtain a copy of the License at
     *
     *      http://www.apache.org/licenses/LICENSE-2.0
     *
     * Unless required by applicable law or agreed to in writing, software
     * distributed under the License is distributed on an "AS-IS" BASIS,
     * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
     * See the License for the specific language governing permissions and
     * limitations under the License.
     */

    class CharacterData extends Node {
      constructor(data, nodeType, nodeName, ownerDocument, overrideIndex) {
        super(nodeType, nodeName, ownerDocument, overrideIndex);
        this[38
        /* data */
        ] = void 0;
        this[38
        /* data */
        ] = data;
        this[8
        /* creationFormat */
        ] = [this[7
        /* index */
        ], nodeType, store$1(nodeName), store$1(data), 0];
      } // Unimplemented Methods
      // NonDocumentTypeChildNode.nextElementSibling – https://developer.mozilla.org/en-US/docs/Web/API/NonDocumentTypeChildNode/nextElementSibling
      // NonDocumentTypeChildNode.previousElementSibling – https://developer.mozilla.org/en-US/docs/Web/API/NonDocumentTypeChildNode/previousElementSibling
      // CharacterData.appendData() – https://developer.mozilla.org/en-US/docs/Web/API/NonDocumentTypeChildNode/appendData
      // CharacterData.deleteData() – https://developer.mozilla.org/en-US/docs/Web/API/NonDocumentTypeChildNode/deleteData
      // CharacterData.insertData() – https://developer.mozilla.org/en-US/docs/Web/API/NonDocumentTypeChildNode/insertData
      // CharacterData.replaceData() – https://developer.mozilla.org/en-US/docs/Web/API/NonDocumentTypeChildNode/replaceData
      // CharacterData.substringData() – https://developer.mozilla.org/en-US/docs/Web/API/NonDocumentTypeChildNode/substringData

      /**
       * @return Returns the string contained in private CharacterData.data
       */


      get data() {
        return this[38
        /* data */
        ];
      }
      /**
       * @param value string value to store as CharacterData.data.
       */


      set data(value) {
        const oldValue = this.data;
        this[38
        /* data */
        ] = value;
        mutate(this.ownerDocument, {
          target: this,
          type: 1
          /* CHARACTER_DATA */
          ,
          value,
          oldValue
        }, [1
        /* CHARACTER_DATA */
        , this[7
        /* index */
        ], store$1(value)]);
      }
      /**
       * @return Returns the size of the string contained in CharacterData.data
       */


      get length() {
        return this[38
        /* data */
        ].length;
      }
      /**
       * @return Returns the string contained in CharacterData.data
       */


      get nodeValue() {
        return this[38
        /* data */
        ];
      }
      /**
       * @param value string value to store as CharacterData.data.
       */


      set nodeValue(value) {
        this.data = value;
      }

    }

    /**
     * Copyright 2018 The AMP HTML Authors. All Rights Reserved.
     *
     * Licensed under the Apache License, Version 2.0 (the "License");
     * you may not use this file except in compliance with the License.
     * You may obtain a copy of the License at
     *
     *      http://www.apache.org/licenses/LICENSE-2.0
     *
     * Unless required by applicable law or agreed to in writing, software
     * distributed under the License is distributed on an "AS-IS" BASIS,
     * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
     * See the License for the specific language governing permissions and
     * limitations under the License.
     */

    class Comment extends CharacterData {
      constructor(data, ownerDocument, overrideIndex) {
        super(data, 8
        /* COMMENT_NODE */
        , '#comment', ownerDocument, overrideIndex);
      }
      /**
       * textContent getter, retrieves underlying CharacterData data.
       * This is a different implmentation than DOMv1-4 APIs, but should be transparent to Frameworks.
       */


      get textContent() {
        return this.data;
      }
      /**
       * textContent setter, mutates underlying CharacterData data.
       * This is a different implmentation than DOMv1-4 APIs, but should be transparent to Frameworks.
       * @param value new value
       */


      set textContent(value) {
        // Mutation Observation is performed by CharacterData.
        this.nodeValue = value;
      }
      /**
       * @see https://developer.mozilla.org/en-US/docs/Web/API/Node/cloneNode
       * @return new Comment Node with the same data as the Comment to clone.
       */


      cloneNode() {
        return this.ownerDocument.createComment(this.data);
      }

    }

    /**
     * Copyright 2020 The AMP HTML Authors. All Rights Reserved.
     *
     * Licensed under the Apache License, Version 2.0 (the "License");
     * you may not use this file except in compliance with the License.
     * You may obtain a copy of the License at
     *
     *      http://www.apache.org/licenses/LICENSE-2.0
     *
     * Unless required by applicable law or agreed to in writing, software
     * distributed under the License is distributed on an "AS-IS" BASIS,
     * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
     * See the License for the specific language governing permissions and
     * limitations under the License.
     */
    const ALLOWLISTED_GLOBALS = {
      Array: true,
      ArrayBuffer: true,
      BigInt: true,
      BigInt64Array: true,
      BigUint64Array: true,
      Boolean: true,
      Cache: true,
      CustomEvent: true,
      DataView: true,
      Date: true,
      Error: true,
      EvalError: true,
      Event: true,
      EventTarget: true,
      Float32Array: true,
      Float64Array: true,
      Function: true,
      Infinity: true,
      Int16Array: true,
      Int32Array: true,
      Int8Array: true,
      Intl: true,
      JSON: true,
      Map: true,
      Math: true,
      NaN: true,
      Number: true,
      Object: true,
      Promise: true,
      Proxy: true,
      RangeError: true,
      ReferenceError: true,
      Reflect: true,
      RegExp: true,
      Set: true,
      String: true,
      Symbol: true,
      SyntaxError: true,
      TextDecoder: true,
      TextEncoder: true,
      TypeError: true,
      URIError: true,
      URL: true,
      Uint16Array: true,
      Uint32Array: true,
      Uint8Array: true,
      Uint8ClampedArray: true,
      WeakMap: true,
      WeakSet: true,
      WebAssembly: true,
      WebSocket: true,
      XMLHttpRequest: true,
      atob: true,
      addEventListener: true,
      removeEventListener: true,
      btoa: true,
      caches: true,
      clearInterval: true,
      clearTimeout: true,
      console: true,
      decodeURI: true,
      decodeURIComponent: true,
      document: true,
      encodeURI: true,
      encodeURIComponent: true,
      escape: true,
      fetch: true,
      indexedDB: true,
      isFinite: true,
      isNaN: true,
      location: true,
      navigator: true,
      onerror: true,
      onrejectionhandled: true,
      onunhandledrejection: true,
      parseFloat: true,
      parseInt: true,
      performance: true,
      requestAnimationFrame: true,
      cancelAnimationFrame: true,
      self: true,
      setTimeout: true,
      setInterval: true,
      unescape: true
    }; // Modify global scope by removing disallowed properties.

    function deleteGlobals(global) {
      /**
       * @param object
       * @param property
       * @return True if property was deleted from object. Otherwise, false.
       */
      const deleteUnsafe = (object, property) => {
        if (!ALLOWLISTED_GLOBALS.hasOwnProperty(property)) {
          try {
            delete object[property];
            return true;
          } catch (e) {}
        }

        return false;
      }; // Walk up global's prototype chain and dereference non-allowlisted properties
      // until EventTarget is reached.


      let current = global;

      while (current && current.constructor !== EventTarget) {
        const deleted = [];
        const failedToDelete = [];
        Object.getOwnPropertyNames(current).forEach(prop => {
          if (deleteUnsafe(current, prop)) {
            deleted.push(prop);
          } else {
            failedToDelete.push(prop);
          }
        });
        console.info(`Removed ${deleted.length} references from`, current, ':', deleted);

        if (failedToDelete.length) {
          console.info(`Failed to remove ${failedToDelete.length} references from`, current, ':', failedToDelete);
        }

        current = Object.getPrototypeOf(current);
      }
    }

    /**
     * Copyright 2018 The AMP HTML Authors. All Rights Reserved.
     *
     * Licensed under the Apache License, Version 2.0 (the "License");
     * you may not use this file except in compliance with the License.
     * You may obtain a copy of the License at
     *
     *      http://www.apache.org/licenses/LICENSE-2.0
     *
     * Unless required by applicable law or agreed to in writing, software
     * distributed under the License is distributed on an "AS-IS" BASIS,
     * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
     * See the License for the specific language governing permissions and
     * limitations under the License.
     */

    const tagNameConditionPredicate = tagNames => element => {
      return tagNames.includes(element.tagName);
    };
    const elementPredicate = node => node.nodeType === 1
    /* ELEMENT_NODE */
    ;
    const matchChildrenElements = (node, conditionPredicate) => {
      const matchingElements = [];
      node.childNodes.forEach(child => {
        if (elementPredicate(child)) {
          if (conditionPredicate(child)) {
            matchingElements.push(child);
          }

          matchingElements.push(...matchChildrenElements(child, conditionPredicate));
        }
      });
      return matchingElements;
    };
    const matchChildElement = (element, conditionPredicate) => {
      let returnValue = null;
      element.children.some(child => {
        if (conditionPredicate(child)) {
          returnValue = child;
          return true;
        }

        const grandChildMatch = matchChildElement(child, conditionPredicate);

        if (grandChildMatch !== null) {
          returnValue = grandChildMatch;
          return true;
        }

        return false;
      });
      return returnValue;
    };
    const matchNearestParent = (element, conditionPredicate) => {
      while (element = element.parentNode) {
        if (conditionPredicate(element)) {
          return element;
        }
      }

      return null;
    };
    /**
     * @see https://developer.mozilla.org/en-US/docs/Web/CSS/Attribute_selectors
     * @param attrSelector the selector we are trying to match for.
     * @param element the element being tested.
     * @return boolean for whether we match the condition
     */

    const matchAttrReference = (attrSelector, element) => {
      if (!attrSelector) {
        return false;
      }

      const equalPos = attrSelector.indexOf('=');
      const selectorLength = attrSelector.length;
      const caseInsensitive = attrSelector.charAt(selectorLength - 2) === 'i';
      const endPos = caseInsensitive ? selectorLength - 3 : selectorLength - 1;

      if (equalPos !== -1) {
        const equalSuffix = attrSelector.charAt(equalPos - 1);
        const possibleSuffixes = ['~', '|', '$', '^', '*'];
        const attrString = possibleSuffixes.includes(equalSuffix) ? attrSelector.substring(1, equalPos - 1) : attrSelector.substring(1, equalPos);
        const rawValue = attrSelector.substring(equalPos + 1, endPos);
        const rawAttrValue = element.getAttribute(attrString);

        if (rawAttrValue) {
          const casedValue = caseInsensitive ? toLower(rawValue) : rawValue;
          const casedAttrValue = caseInsensitive ? toLower(rawAttrValue) : rawAttrValue;

          switch (equalSuffix) {
            case '~':
              return casedAttrValue.split(' ').indexOf(casedValue) !== -1;

            case '|':
              return casedAttrValue === casedValue || casedAttrValue === `${casedValue}-`;

            case '^':
              return casedAttrValue.startsWith(casedValue);

            case '$':
              return casedAttrValue.endsWith(casedValue);

            case '*':
              return casedAttrValue.indexOf(casedValue) !== -1;

            default:
              return casedAttrValue === casedValue;
          }
        }

        return false;
      } else {
        return element.hasAttribute(attrSelector.substring(1, endPos));
      }
    };

    /**
     * Copyright 2018 The AMP HTML Authors. All Rights Reserved.
     *
     * Licensed under the Apache License, Version 2.0 (the "License");
     * you may not use this file except in compliance with the License.
     * You may obtain a copy of the License at
     *
     *      http://www.apache.org/licenses/LICENSE-2.0
     *
     * Unless required by applicable law or agreed to in writing, software
     * distributed under the License is distributed on an "AS-IS" BASIS,
     * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
     * See the License for the specific language governing permissions and
     * limitations under the License.
     */
    /*
    Normally ParentNode is implemented as a mixin, but since the Node class is an abstract
    this makes it hard to build a mixin that recieves a base of the representations of Node needing
    the mixed in functionality.

    // Partially implemented Mixin Methods
    // Both Element.querySelector() and Element.querySelector() are only implemented for the following simple selectors:
    // - Element selectors
    // - ID selectors
    // - Class selectors
    // - Attribute selectors
    // Element.querySelector() – https://developer.mozilla.org/en-US/docs/Web/API/Element/querySelector
    // Element.querySelectorAll() – https://developer.mozilla.org/en-US/docs/Web/API/Element/querySelectorAll
    */

    class ParentNode extends Node {
      /**
       * Getter returning children of an Element that are Elements themselves.
       * @see https://developer.mozilla.org/en-US/docs/Web/API/ParentNode/children
       * @return Element objects that are children of this ParentNode, omitting all of its non-element nodes.
       */
      get children() {
        return this.childNodes.filter(elementPredicate);
      }
      /**
       * Getter returning the number of child elements of a Element.
       * @see https://developer.mozilla.org/en-US/docs/Web/API/ParentNode/childElementCount
       * @return number of child elements of the given Element.
       */


      get childElementCount() {
        return this.children.length;
      }
      /**
       * Getter returning the first Element in Element.childNodes.
       * @see https://developer.mozilla.org/en-US/docs/Web/API/ParentNode/firstElementChild
       * @return first childNode that is also an element.
       */


      get firstElementChild() {
        return this.childNodes.find(elementPredicate) || null;
      }
      /**
       * Getter returning the last Element in Element.childNodes.
       * @see https://developer.mozilla.org/en-US/docs/Web/API/ParentNode/lastElementChild
       * @return first childNode that is also an element.
       */


      get lastElementChild() {
        const children = this.children;
        return children[children.length - 1] || null;
      }
      /**
       * @see https://developer.mozilla.org/en-US/docs/Web/API/Element/querySelector
       * @param selector the selector we are trying to match for.
       * @return Element with matching selector.
       */


      querySelector(selector) {
        const matches = querySelectorAll(this, selector);
        return matches ? matches[0] : null;
      }
      /**
       * @see https://developer.mozilla.org/en-US/docs/Web/API/Element/querySelectorAll
       * @param selector the selector we are trying to match for.
       * @return Elements with matching selector.
       */


      querySelectorAll(selector) {
        return querySelectorAll(this, selector);
      }

    }
    /**
     * @see https://developer.mozilla.org/en-US/docs/Web/API/Element/querySelector
     * @param node the node to filter results under.
     * @param selector the selector we are trying to match for.
     * @return Element with matching selector.
     */

    function querySelectorAll(node, selector) {
      // As per spec: https://dom.spec.whatwg.org/#scope-match-a-selectors-string
      // First, parse the selector
      const selectorBracketIndexes = [selector.indexOf('['), selector.indexOf(']')];
      const selectorHasAttr = containsIndexOf(selectorBracketIndexes[0]) && containsIndexOf(selectorBracketIndexes[1]);
      const elementSelector = selectorHasAttr ? selector.substring(0, selectorBracketIndexes[0]) : selector;
      const attrSelector = selectorHasAttr ? selector.substring(selectorBracketIndexes[0], selectorBracketIndexes[1] + 1) : null; // TODO(nainar): Parsing selectors is needed when we add in more complex selectors.
      // Second, find all the matching elements on the Document

      let matcher;

      if (selector[0] === '[') {
        matcher = element => matchAttrReference(selector, element);
      } else if (elementSelector[0] === '#') {
        matcher = selectorHasAttr ? element => element.id === elementSelector.substr(1) && matchAttrReference(attrSelector, element) : element => element.id === elementSelector.substr(1);
      } else if (elementSelector[0] === '.') {
        matcher = selectorHasAttr ? element => element.classList.contains(elementSelector.substr(1)) && matchAttrReference(attrSelector, element) : element => element.classList.contains(elementSelector.substr(1));
      } else {
        matcher = selectorHasAttr ? element => element.localName === toLower(elementSelector) && matchAttrReference(attrSelector, element) : element => element.localName === toLower(elementSelector);
      } // Third, filter to return elements that exist within the querying element's descendants.


      return matcher ? matchChildrenElements(node[45
      /* scopingRoot */
      ], matcher).filter(element => node !== element && node.contains(element)) : [];
    }

    /**
     * Copyright 2018 The AMP HTML Authors. All Rights Reserved.
     *
     * Licensed under the Apache License, Version 2.0 (the "License");
     * you may not use this file except in compliance with the License.
     * You may obtain a copy of the License at
     *
     *      http://www.apache.org/licenses/LICENSE-2.0
     *
     * Unless required by applicable law or agreed to in writing, software
     * distributed under the License is distributed on an "AS-IS" BASIS,
     * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
     * See the License for the specific language governing permissions and
     * limitations under the License.
     */
    const WHITESPACE_REGEX = /\s/;
    /**
     * Synchronizes the string getter/setter with the actual DOMTokenList instance.
     * @param defineOn Element or class extension to define getter/setter pair for token list access.
     * @param accessorKey Key used to access DOMTokenList directly from specific element.
     * @param propertyName Key used to access DOMTokenList as string getter/setter.
     */

    function synchronizedAccessor(defineOn, accessorKey, propertyName) {
      Object.defineProperty(defineOn.prototype, propertyName, {
        enumerable: true,
        configurable: true,

        get() {
          return this[accessorKey].value;
        },

        set(value) {
          this[accessorKey].value = value;
        }

      });
    }
    class DOMTokenList {
      /**
       * The DOMTokenList interface represents a set of space-separated tokens.
       * It is indexed beginning with 0 as with JavaScript Array objects and is case-sensitive.
       * @see https://developer.mozilla.org/en-US/docs/Web/API/DOMTokenList
       * @param target Specific Element instance to modify when value is changed.
       * @param attributeName Name of the attribute used by Element to access DOMTokenList.
       */
      constructor(target, attributeName) {
        this[43
        /* tokens */
        ] = [];
        this[13
        /* target */
        ] = void 0;
        this[18
        /* attributeName */
        ] = void 0;
        this[44
        /* storeAttribute */
        ] = void 0;
        this[13
        /* target */
        ] = target;
        this[18
        /* attributeName */
        ] = attributeName;
        this[44
        /* storeAttribute */
        ] = target[44
        /* storeAttribute */
        ].bind(target);
      }
      /**
       * @see https://developer.mozilla.org/en-US/docs/Web/API/DOMTokenList/value
       * @return string representation of tokens (space delimitted).
       */


      get value() {
        return this[43
        /* tokens */
        ].join(' ');
      }
      /**
       * @see https://developer.mozilla.org/en-US/docs/Web/API/DOMTokenList/length
       * @return integer representing the number of objects stored in the object.
       */


      get length() {
        return this[43
        /* tokens */
        ].length;
      }
      /**
       * @see https://developer.mozilla.org/en-US/docs/Web/API/DOMTokenList/value
       * @param collection String of values space delimited to replace the current DOMTokenList with.
       */


      set value(collection) {
        const oldValue = this.value;
        const newValue = collection.trim(); // Replace current tokens with new tokens.

        this[43
        /* tokens */
        ].splice(0, this[43
        /* tokens */
        ].length, ...(newValue !== '' ? newValue.split(/\s+/) : ''));
        this[67
        /* mutated */
        ](oldValue, newValue);
      }
      /**
       * @see https://developer.mozilla.org/en-US/docs/Web/API/DOMTokenList/item
       * @param index number from DOMTokenList entities to retrieve value of
       * @return value stored at the index requested, or undefined if beyond known range.
       */


      item(index) {
        return this[43
        /* tokens */
        ][index];
      }
      /**
       * @see https://developer.mozilla.org/en-US/docs/Web/API/DOMTokenList/contains
       * @param token value the DOMTokenList is tested for.
       * @return boolean indicating if the token is contained by the DOMTokenList.
       */


      contains(token) {
        return this[43
        /* tokens */
        ].includes(token);
      }
      /**
       * Add a token or tokens to the list.
       * Note: All duplicates are removed, and the first token's position with the value is preserved.
       *
       * @see https://developer.mozilla.org/en-US/docs/Web/API/DOMTokenList/add
       * @param tokens each token is a string to add to a TokenList.
       */


      add(...tokens) {
        const oldValue = this.value;
        this[43
        /* tokens */
        ].splice(0, this[43
        /* tokens */
        ].length, ...new Set(this[43
        /* tokens */
        ].concat(tokens)));
        this[67
        /* mutated */
        ](oldValue, this.value);
      }
      /**
       * Remove a token or tokens from the list.
       * Note: All duplicates are removed, and the first token's position with the value is preserved.
       *
       * @see https://developer.mozilla.org/en-US/docs/Web/API/DOMTokenList/remove
       * @param tokens each token is a string to remove from a TokenList.
       */


      remove(...tokens) {
        const oldValue = this.value;
        this[43
        /* tokens */
        ].splice(0, this[43
        /* tokens */
        ].length, ...new Set(this[43
        /* tokens */
        ].filter(token => !tokens.includes(token))));
        this[67
        /* mutated */
        ](oldValue, this.value);
      }
      /**
       * @see https://developer.mozilla.org/en-US/docs/Web/API/DOMTokenList/replace
       * @param token
       * @param newToken
       */


      replace(token, newToken) {
        if (!this[43
        /* tokens */
        ].includes(token)) {
          return;
        }

        const oldValue = this.value;
        const set = new Set(this[43
        /* tokens */
        ]);

        if (token !== newToken) {
          set.delete(token);

          if (newToken !== '') {
            set.add(newToken);
          }
        }

        this[43
        /* tokens */
        ].splice(0, this[43
        /* tokens */
        ].length, ...set);
        this[67
        /* mutated */
        ](oldValue, this.value);
      }
      /**
       * Adds or removes a token based on its presence in the token list.
       *
       * @see https://developer.mozilla.org/en-US/docs/Web/API/DOMTokenList/toggle
       * @param token string to add or remove from the token list
       * @param force changes toggle into a one way-only operation. true => token added. false => token removed.
       * @return true if the token is in the list following mutation, false if not.
       */


      toggle(token, force) {
        if (WHITESPACE_REGEX.test(token)) {
          throw new TypeError('Uncaught DOMException');
        }

        if (!this[43
        /* tokens */
        ].includes(token)) {
          if (force === undefined || !!force) {
            // Note, this will add the token if force is undefined (not passed into the method), or truthy.
            this.add(token);
          }

          return true;
        } else if (!force) {
          // Note, this will remove the token if force is undefined (not passed into the method), or falsey.
          this.remove(token);
          return false;
        }

        return true;
      }
      /**
       * Report tokenList mutations to MutationObserver.
       * @param oldValue value before mutation
       * @param value value after mutation
       * @private
       */


      [67
      /* mutated */
      ](oldValue, value) {
        this[44
        /* storeAttribute */
        ](this[13
        /* target */
        ].namespaceURI, this[18
        /* attributeName */
        ], value);
        mutate(this[13
        /* target */
        ].ownerDocument, {
          type: 0
          /* ATTRIBUTES */
          ,
          target: this[13
          /* target */
          ],
          attributeName: this[18
          /* attributeName */
          ],
          value,
          oldValue
        }, [0
        /* ATTRIBUTES */
        , this[13
        /* target */
        ][7
        /* index */
        ], store$1(this[18
        /* attributeName */
        ]), 0, value !== null ? store$1(value) + 1 : 0]);
      }

    }

    /**
     * Copyright 2018 The AMP HTML Authors. All Rights Reserved.
     *
     * Licensed under the Apache License, Version 2.0 (the "License");
     * you may not use this file except in compliance with the License.
     * You may obtain a copy of the License at
     *
     *      http://www.apache.org/licenses/LICENSE-2.0
     *
     * Unless required by applicable law or agreed to in writing, software
     * distributed under the License is distributed on an "AS-IS" BASIS,
     * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
     * See the License for the specific language governing permissions and
     * limitations under the License.
     */
    const toString = attributes => attributes.map(attr => keyValueString(attr.name, attr.value)).join(' ');
    const matchPredicate = (namespaceURI, name) => attr => attr.namespaceURI === namespaceURI && attr.name === name;

    /**
     * Copyright 2018 The AMP HTML Authors. All Rights Reserved.
     *
     * Licensed under the Apache License, Version 2.0 (the "License");
     * you may not use this file except in compliance with the License.
     * You may obtain a copy of the License at
     *
     *      http://www.apache.org/licenses/LICENSE-2.0
     *
     * Unless required by applicable law or agreed to in writing, software
     * distributed under the License is distributed on an "AS-IS" BASIS,
     * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
     * See the License for the specific language governing permissions and
     * limitations under the License.
     */

    const hyphenateKey = key => toLower(key.replace(/(webkit|ms|moz|khtml)/g, '-$1').replace(/([a-zA-Z])(?=[A-Z])/g, '$1-'));

    const appendKeys = keys => {
      const keysToAppend = keys.filter(key => isNaN(key) && !CSSStyleDeclaration.prototype.hasOwnProperty(key));

      if (keysToAppend.length <= 0) {
        return;
      }

      const previousPrototypeLength = CSSStyleDeclaration.prototype.length || 0;

      if (previousPrototypeLength !== 0) {
        CSSStyleDeclaration.prototype.length = previousPrototypeLength + keysToAppend.length;
      } else {
        Object.defineProperty(CSSStyleDeclaration.prototype, 'length', {
          configurable: true,
          writable: true,
          value: keysToAppend.length
        });
      }

      keysToAppend.forEach((key, index) => {
        const hyphenatedKey = hyphenateKey(key);
        CSSStyleDeclaration.prototype[index + previousPrototypeLength] = hyphenatedKey;
        Object.defineProperties(CSSStyleDeclaration.prototype, {
          [key]: {
            get() {
              return this.getPropertyValue(hyphenatedKey);
            },

            set(value) {
              this.setProperty(hyphenatedKey, value);
            }

          }
        });
      });
    };
    class CSSStyleDeclaration {
      constructor(target) {
        this[3
        /* properties */
        ] = {};
        this[44
        /* storeAttribute */
        ] = void 0;
        this[13
        /* target */
        ] = void 0;
        this[44
        /* storeAttribute */
        ] = target[44
        /* storeAttribute */
        ].bind(target);
        this[13
        /* target */
        ] = target;
      }
      /**
       * Retrieve the value for a given property key.
       * @see https://developer.mozilla.org/en-US/docs/Web/API/CSSStyleDeclaration/getPropertyValue
       * @param key the name of the property to retrieve the value for.
       * @return value stored for the provided key.
       */


      getPropertyValue(key) {
        return this[3
        /* properties */
        ][key] || '';
      }
      /**
       * Remove a value for a given property key.
       * @see https://developer.mozilla.org/en-US/docs/Web/API/CSSStyleDeclaration/removeProperty
       * @param key the name of the property to retrieve the value for.
       * @return previously stored value for the provided key.
       */


      removeProperty(key) {
        const oldValue = this.getPropertyValue(key);
        this[3
        /* properties */
        ][key] = null;
        this.mutated(this.cssText);
        return oldValue;
      }
      /**
       * Stores a given value for the provided key.
       * @see https://developer.mozilla.org/en-US/docs/Web/API/CSSStyleDeclaration/setProperty
       * @param key modify this key
       * @param value store this value
       */


      setProperty(key, value) {
        this[3
        /* properties */
        ][key] = value;
        this.mutated(this.cssText);
      }
      /**
       * @see https://developer.mozilla.org/en-US/docs/Web/API/CSSStyleDeclaration/cssText
       * @return css text string representing known and valid style declarations.
       */


      get cssText() {
        let value;
        let returnValue = '';

        for (const key in this[3
        /* properties */
        ]) {
          if ((value = this.getPropertyValue(key)) !== '') {
            returnValue += `${key}: ${value}; `;
          }
        }

        return returnValue.trim();
      }
      /**
       * Replace all style declarations with new values parsed from a cssText string.
       * @see https://developer.mozilla.org/en-US/docs/Web/API/CSSStyleDeclaration/cssText
       * @param value css text string to parse and store
       */


      set cssText(value) {
        // value should have an "unknown" type but get/set can't have different types.
        // https://github.com/Microsoft/TypeScript/issues/2521
        const stringValue = typeof value === 'string' ? value : '';
        this[3
        /* properties */
        ] = {};
        const values = stringValue.split(/[:;]/);
        const length = values.length;

        for (let index = 0; index + 1 < length; index += 2) {
          this[3
          /* properties */
          ][toLower(values[index].trim())] = values[index + 1].trim();
        }

        this.mutated(this.cssText);
      }
      /**
       * Report CSSStyleDeclaration mutations to MutationObserver.
       * @param value value after mutation
       * @private
       * // TODO(KB): Write a test to ensure mutations are fired for CSSStyleDeclaration changes.
       */


      mutated(value) {
        const oldValue = this[44
        /* storeAttribute */
        ](this[13
        /* target */
        ].namespaceURI, 'style', value);
        mutate(this[13
        /* target */
        ].ownerDocument, {
          type: 0
          /* ATTRIBUTES */
          ,
          target: this[13
          /* target */
          ],
          attributeName: 'style',
          value,
          oldValue
        }, [0
        /* ATTRIBUTES */
        , this[13
        /* target */
        ][7
        /* index */
        ], store$1('style'), 0, value !== null ? store$1(value) + 1 : 0]);
      }

    }

    /**
     * Copyright 2018 The AMP HTML Authors. All Rights Reserved.
     *
     * Licensed under the Apache License, Version 2.0 (the "License");
     * you may not use this file except in compliance with the License.
     * You may obtain a copy of the License at
     *
     *      http://www.apache.org/licenses/LICENSE-2.0
     *
     * Unless required by applicable law or agreed to in writing, software
     * distributed under the License is distributed on an "AS-IS" BASIS,
     * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
     * See the License for the specific language governing permissions and
     * limitations under the License.
     */
    // TODO: Do enumerated attributes with non-boolean properties exist?

    const reflectProperties = (properties, defineOn) => {
      properties.forEach(pair => {
        for (const property in pair) {
          const {
            0: defaultValue,
            1: attributeName = toLower(property),
            2: keywords
          } = pair[property]; // Boolean attributes only care about presence, not attribute value.
          // https://html.spec.whatwg.org/multipage/common-microsyntaxes.html#boolean-attributes

          const isBooleanAttribute = typeof defaultValue === 'boolean';
          Object.defineProperty(defineOn.prototype, property, {
            enumerable: true,

            get() {
              const element = this;
              const attributeValue = element.getAttribute(attributeName);

              if (keywords) {
                return element.hasAttribute(attributeName) ? attributeValue === keywords[0] : defaultValue;
              }

              if (isBooleanAttribute) {
                return element.hasAttribute(attributeName);
              }

              const castableValue = attributeValue || defaultValue;
              return typeof defaultValue === 'number' ? Number(castableValue) : String(castableValue);
            },

            set(value) {
              const element = this;

              if (keywords) {
                element.setAttribute(attributeName, value ? keywords[0] : keywords[1]);
              } else if (isBooleanAttribute) {
                value ? element.setAttribute(attributeName, '') : element.removeAttribute(attributeName);
              } else {
                element.setAttribute(attributeName, String(value));
              }
            }

          });
        }
      });
    };

    /**
     * Copyright 2018 The AMP HTML Authors. All Rights Reserved.
     *
     * Licensed under the Apache License, Version 2.0 (the "License");
     * you may not use this file except in compliance with the License.
     * You may obtain a copy of the License at
     *
     *      http://www.apache.org/licenses/LICENSE-2.0
     *
     * Unless required by applicable law or agreed to in writing, software
     * distributed under the License is distributed on an "AS-IS" BASIS,
     * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
     * See the License for the specific language governing permissions and
     * limitations under the License.
     */
    const HTML_NAMESPACE = 'http://www.w3.org/1999/xhtml';
    const SVG_NAMESPACE = 'http://www.w3.org/2000/svg';

    function arr_back(arr) {
      return arr[arr.length - 1];
    } // https://html.spec.whatwg.org/multipage/custom-elements.html#valid-custom-element-name


    const kMarkupPattern = /<!--([^]*)-->|<(\/?)([a-z][-.0-9_a-z]*)([^>]*?)(\/?)>/gi; // https://html.spec.whatwg.org/multipage/syntax.html#attributes-2

    const kAttributePattern = /(^|\s)([^\s"'>\/=]+)\s*=\s*("([^"]+)"|'([^']+)'|(\S+))/gi;
    const kSelfClosingElements = {
      AREA: true,
      BASE: true,
      BR: true,
      COL: true,
      HR: true,
      IMG: true,
      INPUT: true,
      LINK: true,
      META: true,
      PARAM: true,
      SOURCE: true,
      TRACK: true,
      WBR: true
    };
    const kElementsClosedByOpening = {
      LI: {
        LI: true
      },
      DT: {
        DT: true,
        DD: true
      },
      DD: {
        DD: true,
        DT: true
      },
      P: {
        ADDRESS: true,
        ARTICLE: true,
        ASIDE: true,
        BLOCKQUOTE: true,
        DETAILS: true,
        DIV: true,
        DL: true,
        FIELDSET: true,
        FIGCAPTION: true,
        FIGURE: true,
        FOOTER: true,
        FORM: true,
        H1: true,
        H2: true,
        H3: true,
        H4: true,
        H5: true,
        H6: true,
        HEADER: true,
        HR: true,
        MAIN: true,
        NAV: true,
        OL: true,
        P: true,
        PRE: true,
        SECTION: true,
        TABLE: true,
        UL: true
      },
      RT: {
        RT: true,
        RP: true
      },
      RP: {
        RT: true,
        RP: true
      },
      OPTGROUP: {
        OPTGROUP: true
      },
      OPTION: {
        OPTION: true,
        OPTGROUP: true
      },
      THEAD: {
        TBODY: true,
        TFOOT: true
      },
      TBODY: {
        TBODY: true,
        TFOOT: true
      },
      TR: {
        TR: true
      },
      TD: {
        TD: true,
        TH: true
      },
      TH: {
        TD: true,
        TH: true
      }
    };
    const kElementsClosedByClosing = {
      LI: {
        UL: true,
        OL: true
      },
      A: {
        DIV: true
      },
      B: {
        DIV: true
      },
      I: {
        DIV: true
      },
      P: {
        DIV: true
      },
      TD: {
        TR: true,
        TABLE: true
      },
      TH: {
        TR: true,
        TABLE: true
      }
    };
    const kBlockTextElements = {
      SCRIPT: true,
      NOSCRIPT: true,
      STYLE: true,
      PRE: true
    };
    /**
     * Parses HTML and returns a root element
     * Parse a chuck of HTML source.
     * @param  {string} data HTML in string format.
     * @param {!Element} root The element to use as root.
     * @return {Element}      root element
     */

    function parse(data, rootElement) {
      const ownerDocument = rootElement.ownerDocument;
      const root = ownerDocument.createElementNS(rootElement.namespaceURI, rootElement.localName);
      let currentParent = root;
      let currentNamespace = root.namespaceURI;
      const stack = [root];
      let lastTextPos = 0;
      let match;
      data = '<q>' + data + '</q>';
      const tagsClosed = [];

      if (currentNamespace !== SVG_NAMESPACE && currentNamespace !== HTML_NAMESPACE) {
        throw new Error('Namespace not supported: ' + currentNamespace);
      }

      while (match = kMarkupPattern.exec(data)) {
        const commentContents = match[1]; // <!--contents-->

        const beginningSlash = match[2]; // ... </ ...

        const tagName = match[3];
        const matchAttributes = match[4];
        const endSlash = match[5]; // ... /> ...

        if (lastTextPos < match.index) {
          // if has content
          const text = data.slice(lastTextPos, match.index);
          currentParent.appendChild(ownerDocument.createTextNode(decodeEntities(text)));
        }

        lastTextPos = kMarkupPattern.lastIndex;

        if (commentContents !== undefined) {
          // this is a comment
          currentParent.appendChild(ownerDocument.createComment(commentContents));
          continue;
        }

        const normalizedTagName = toUpper(tagName);

        if (normalizedTagName === 'SVG') {
          currentNamespace = beginningSlash ? HTML_NAMESPACE : SVG_NAMESPACE;
        }

        if (!beginningSlash) {
          // not </ tags
          if (!endSlash && kElementsClosedByOpening[currentParent.tagName]) {
            if (kElementsClosedByOpening[currentParent.tagName][normalizedTagName]) {
              stack.pop();
              currentParent = arr_back(stack);
            }
          }

          const childToAppend = ownerDocument.createElementNS(currentNamespace, currentNamespace === HTML_NAMESPACE ? toLower(tagName) : tagName);

          for (let attMatch; attMatch = kAttributePattern.exec(matchAttributes);) {
            const attrName = attMatch[2];
            const attrValue = attMatch[4] || attMatch[5] || attMatch[6];
            childToAppend.setAttribute(attrName, attrValue);
          }

          currentParent = currentParent.appendChild(childToAppend);
          stack.push(currentParent);

          if (kBlockTextElements[normalizedTagName]) {
            // a little test to find next </script> or </style> ...
            const closeMarkup = '</' + toLower(normalizedTagName) + '>';
            const index = data.indexOf(closeMarkup, kMarkupPattern.lastIndex);

            if (index == -1) {
              throw new Error('Close markup not found.');
            } else {
              kMarkupPattern.lastIndex = index;
            }
          }
        }

        if (tagName === 'foreignObject') {
          currentNamespace = beginningSlash ? SVG_NAMESPACE : HTML_NAMESPACE;
        }

        if (beginningSlash || endSlash || kSelfClosingElements[normalizedTagName]) {
          // </ or /> or <br> etc.
          while (true) {
            if (stack.length <= 1) {
              break;
            }

            if (toUpper(currentParent.nodeName) == normalizedTagName) {
              stack.pop();
              currentParent = arr_back(stack);
              break;
            } else {
              // Trying to close current tag, and move on
              if (kElementsClosedByClosing[currentParent.tagName]) {
                if (kElementsClosedByClosing[currentParent.tagName][normalizedTagName]) {
                  stack.pop();
                  currentParent = arr_back(stack);
                  continue;
                }
              } // Use aggressive strategy to handle unmatching markups.


              break;
            }
          }
        }
      }

      for (const node of stack) {
        if (tagsClosed[tagsClosed.length - 1] == node.nodeName) {
          stack.pop();
          tagsClosed.pop();
          currentParent = arr_back(stack);
        } else break;
      }

      const valid = stack.length === 1;

      if (!valid) {
        throw new Error('Attempting to parse invalid HTML content.');
      }

      const wrapper = root.firstChild;

      if (wrapper) {
        wrapper.parentNode = null;
        wrapper.childNodes.forEach(node => {
          node.parentNode = null;
        });
        return wrapper;
      }

      throw new Error('Attempting to parse invalid HTML.');
    }
    /**
     * Decodes HTML Entities.
     * Currently only works for numeric entities, as well as the 4 named entities
     * required for encoding HTML: &, ", <, >.
     * See https://developer.mozilla.org/en-US/docs/Glossary/Entity.
     *
     * TODO: create solution for other named entities.
     */

    const RESERVED_CHARACTERS = {
      __proto__: null,
      amp: '&',
      lt: '<',
      gt: '>',
      quot: '"'
    };

    function decodeEntities(html) {
      return html.replace(/&(?:(#x?[\da-f]+)|([\w]+));?/gi, function (s, numericEntity, namedEntity) {
        // Numeric entity
        if (numericEntity) {
          let code = numericEntity.charAt(1).toLowerCase() === 'x' ? parseInt(numericEntity.substr(2), 16) : parseInt(numericEntity.substr(1), 10); // 1114111 is the largest valid unicode codepoint.

          if (isNaN(code) || code > 1114111) {
            return s;
          }

          return String.fromCodePoint(code) || s;
        } // Named entity. Only HTML reserved entities are currently supported.


        if (namedEntity) {
          return RESERVED_CHARACTERS[namedEntity.toLowerCase()] || s;
        }

        return s;
      });
    }

    /**
     * Copyright 2018 The AMP HTML Authors. All Rights Reserved.
     *
     * Licensed under the Apache License, Version 2.0 (the "License");
     * you may not use this file except in compliance with the License.
     * You may obtain a copy of the License at
     *
     *      http://www.apache.org/licenses/LICENSE-2.0
     *
     * Unless required by applicable law or agreed to in writing, software
     * distributed under the License is distributed on an "AS-IS" BASIS,
     * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
     * See the License for the specific language governing permissions and
     * limitations under the License.
     */
    class Event$1 {
      // public srcElement: Element | null;
      // TODO(KB): Restore srcElement.
      constructor(type, opts) {
        this.bubbles = void 0;
        this.cancelable = void 0;
        this.cancelBubble = void 0;
        this.currentTarget = void 0;
        this.defaultPrevented = void 0;
        this.eventPhase = void 0;
        this.isTrusted = void 0;
        this.returnValue = void 0;
        this.target = void 0;
        this.timeStamp = void 0;
        this.type = void 0;
        this.scoped = void 0;
        this[50
        /* stop */
        ] = false;
        this[51
        /* end */
        ] = false;
        this.pageX = void 0;
        this.pageY = void 0;
        this.offsetX = void 0;
        this.offsetY = void 0;
        this.touches = void 0;
        this.changedTouches = void 0;
        this.type = type;
        this.bubbles = !!opts.bubbles;
        this.cancelable = !!opts.cancelable;
      }

      stopPropagation() {
        this[50
        /* stop */
        ] = true;
      }

      stopImmediatePropagation() {
        this[51
        /* end */
        ] = this[50
        /* stop */
        ] = true;
      }

      preventDefault() {
        this.defaultPrevented = true;
      }
      /** Event.initEvent() is deprecated but supported here for legacy usage.  */


      initEvent(type, bubbles, cancelable) {
        this.type = type;
        this.bubbles = bubbles;
        this.cancelable = cancelable;
      }

    }
    /**
     * Determine the target for a TransferrableEvent.
     * @param document Event intended within the scope of this document.
     * @param event
     */

    const targetFromTransfer = (document, event) => {
      if (event[13
      /* target */
      ] !== null) {
        const index = event[13
        /* target */
        ][0]; // If the target was sent as index 0, use the current document.

        return get(index !== 0 ? index : document[7
        /* index */
        ]);
      }

      return null;
    };
    /**
     *
     * @param document
     * @param event
     */


    const touchListFromTransfer = (document, event, key) => {
      if (event[key] !== undefined) {
        const touchListKeys = Object.keys(event[key]);
        const list = {
          length: touchListKeys.length,

          item(index) {
            return this[index] || null;
          }

        };
        touchListKeys.forEach(touchListKey => {
          const numericKey = Number(touchListKey);
          const transferredTouch = event[key][numericKey];
          list[numericKey] = {
            identifier: transferredTouch[0],
            screenX: transferredTouch[1],
            screenY: transferredTouch[2],
            clientX: transferredTouch[3],
            clientY: transferredTouch[4],
            pageX: transferredTouch[5],
            pageY: transferredTouch[6],
            target: get(transferredTouch[7] !== 0 ? transferredTouch[7] : document[7
            /* index */
            ])
          };
        });
        return list;
      }

      return undefined;
    };
    /**
     * When an event is dispatched from the main thread, it needs to be propagated in the worker thread.
     * Propagate adds an event listener to the worker global scope and uses the WorkerDOM Node.dispatchEvent
     * method to dispatch the transfered event in the worker thread.
     */


    function propagate$2(global) {
      const document = global.document;

      if (!document.addGlobalEventListener) {
        return;
      }

      document.addGlobalEventListener('message', ({
        data
      }) => {
        if (data[12
        /* type */
        ] !== 1
        /* EVENT */
        ) {
          return;
        }

        const event = data[39
        /* event */
        ];
        const node = get(event[7
        /* index */
        ]);

        if (node !== null) {
          node.dispatchEvent(Object.assign(new Event$1(event[12
          /* type */
          ], {
            bubbles: event[25
            /* bubbles */
            ],
            cancelable: event[26
            /* cancelable */
            ]
          }), {
            cancelBubble: event[27
            /* cancelBubble */
            ],
            defaultPrevented: event[29
            /* defaultPrevented */
            ],
            eventPhase: event[30
            /* eventPhase */
            ],
            isTrusted: event[31
            /* isTrusted */
            ],
            returnValue: event[32
            /* returnValue */
            ],
            target: targetFromTransfer(global.document, event),
            timeStamp: event[33
            /* timeStamp */
            ],
            scoped: event[34
            /* scoped */
            ],
            keyCode: event[35
            /* keyCode */
            ],
            pageX: event[60
            /* pageX */
            ],
            pageY: event[61
            /* pageY */
            ],
            offsetX: event[65
            /* offsetX */
            ],
            offsetY: event[66
            /* offsetY */
            ],
            touches: touchListFromTransfer(global.document, event, 62
            /* touches */
            ),
            changedTouches: touchListFromTransfer(global.document, event, 63
            /* changedTouches */
            )
          }));
        }
      });
    }

    /**
     * Copyright 2018 The AMP HTML Authors. All Rights Reserved.
     *
     * Licensed under the Apache License, Version 2.0 (the "License");
     * you may not use this file except in compliance with the License.
     * You may obtain a copy of the License at
     *
     *      http://www.apache.org/licenses/LICENSE-2.0
     *
     * Unless required by applicable law or agreed to in writing, software
     * distributed under the License is distributed on an "AS-IS" BASIS,
     * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
     * See the License for the specific language governing permissions and
     * limitations under the License.
     */
    const NS_NAME_TO_CLASS = {};
    const registerSubclass = (localName, subclass, namespace = HTML_NAMESPACE) => NS_NAME_TO_CLASS[`${namespace}:${localName}`] = subclass;
    function definePropertyBackedAttributes(defineOn, attributes) {
      const sub = Object.create(defineOn[46
      /* propertyBackedAttributes */
      ]);
      defineOn[46
      /* propertyBackedAttributes */
      ] = Object.assign(sub, attributes);
    }
    /**
     * There are six kinds of elements, each having different start/close tag semantics.
     * @see https://html.spec.whatwg.org/multipage/syntax.html#elements-2
     */

    var ElementKind;

    (function (ElementKind) {
      ElementKind[ElementKind["NORMAL"] = 0] = "NORMAL";
      ElementKind[ElementKind["VOID"] = 1] = "VOID"; // The following element kinds have no special handling in worker-dom yet
      // and are lumped into the NORMAL kind.

      /*
      FOREIGN,
      TEMPLATE,
      RAW_TEXT,
      ESCAPABLE_RAW,
      */
    })(ElementKind || (ElementKind = {}));
    /**
     * @see https://html.spec.whatwg.org/multipage/syntax.html#void-elements
     */


    const VOID_ELEMENTS = ['AREA', 'BASE', 'BR', 'COL', 'EMBED', 'HR', 'IMG', 'INPUT', 'LINK', 'META', 'PARAM', 'SOURCE', 'TRACK', 'WBR'];
    class Element extends ParentNode {
      /**
       * Element "kind" dictates certain behaviors e.g. start/end tag semantics.
       * @see https://html.spec.whatwg.org/multipage/syntax.html#elements-2
       */
      constructor(nodeType, localName, namespaceURI, ownerDocument, overrideIndex) {
        super(nodeType, toUpper(localName), ownerDocument, overrideIndex);
        this._classList = void 0;
        this.localName = void 0;
        this.attributes = [];
        this.style = new CSSStyleDeclaration(this);
        this.namespaceURI = void 0;
        this.kind = void 0;
        this.namespaceURI = namespaceURI || HTML_NAMESPACE;
        this.localName = localName;
        this.kind = VOID_ELEMENTS.includes(this.tagName) ? ElementKind.VOID : ElementKind.NORMAL;
        this[8
        /* creationFormat */
        ] = [this[7
        /* index */
        ], this.nodeType, store$1(this.localName), 0, this.namespaceURI === null ? 0 : store$1(this.namespaceURI)];
      } // Unimplemented properties
      // Element.clientHeight – https://developer.mozilla.org/en-US/docs/Web/API/Element/clientHeight
      // Element.clientLeft – https://developer.mozilla.org/en-US/docs/Web/API/Element/clientLeft
      // Element.clientTop – https://developer.mozilla.org/en-US/docs/Web/API/Element/clientTop
      // Element.clientWidth – https://developer.mozilla.org/en-US/docs/Web/API/Element/clientWidth
      // set Element.innerHTML – https://developer.mozilla.org/en-US/docs/Web/API/Element/innerHTML
      // NonDocumentTypeChildNode.nextElementSibling – https://developer.mozilla.org/en-US/docs/Web/API/NonDocumentTypeChildNode/nextElementSibling
      // Element.prefix – https://developer.mozilla.org/en-US/docs/Web/API/Element/prefix
      // NonDocummentTypeChildNode.previousElementSibling – https://developer.mozilla.org/en-US/docs/Web/API/NonDocumentTypeChildNode/previousElementSibling
      // Element.scrollHeight – https://developer.mozilla.org/en-US/docs/Web/API/Element/scrollHeight
      // Element.scrollLeft – https://developer.mozilla.org/en-US/docs/Web/API/Element/scrollLeft
      // Element.scrollLeftMax – https://developer.mozilla.org/en-US/docs/Web/API/Element/scrollLeftMax
      // Element.scrollTop – https://developer.mozilla.org/en-US/docs/Web/API/Element/scrollTop
      // Element.scrollTopMax – https://developer.mozilla.org/en-US/docs/Web/API/Element/scrollTopMax
      // Element.scrollWidth – https://developer.mozilla.org/en-US/docs/Web/API/Element/scrollWidth
      // Element.shadowRoot – !! CustomElements – https://developer.mozilla.org/en-US/docs/Web/API/Element/shadowRoot
      // Element.slot – !! CustomElements – https://developer.mozilla.org/en-US/docs/Web/API/Element/slot
      // Element.tabStop – https://developer.mozilla.org/en-US/docs/Web/API/Element/tabStop
      // Element.undoManager – https://developer.mozilla.org/en-US/docs/Web/API/Element/undoManager
      // Element.undoScope – https://developer.mozilla.org/en-US/docs/Web/API/Element/undoScope
      // Unimplemented Methods
      // Element.attachShadow() – !! CustomElements – https://developer.mozilla.org/en-US/docs/Web/API/Element/attachShadow
      // Element.animate() – https://developer.mozilla.org/en-US/docs/Web/API/Element/animate
      // Element.closest() – https://developer.mozilla.org/en-US/docs/Web/API/Element/closest
      // Element.getAttributeNames() – https://developer.mozilla.org/en-US/docs/Web/API/Element/getAttributeNames
      // Element.getBoundingClientRect() – https://developer.mozilla.org/en-US/docs/Web/API/Element/getBoundingClientRect
      // Element.getClientRects() – https://developer.mozilla.org/en-US/docs/Web/API/Element/getClientRects
      // Element.getElementsByTagNameNS() – https://developer.mozilla.org/en-US/docs/Web/API/Element/getElementsByTagNameNS
      // Element.insertAdjacentElement() – https://developer.mozilla.org/en-US/docs/Web/API/Element/insertAdjacentElement
      // Element.insertAdjacentHTML() – https://developer.mozilla.org/en-US/docs/Web/API/Element/insertAdjacentHTML
      // Element.insertAdjacentText() – https://developer.mozilla.org/en-US/docs/Web/API/Element/insertAdjacentText
      // Element.matches() – https://developer.mozilla.org/en-US/docs/Web/API/Element/matches
      // Element.releasePointerCapture() – https://developer.mozilla.org/en-US/docs/Web/API/Element/releasePointerCapture
      // Element.requestFullscreen() – https://developer.mozilla.org/en-US/docs/Web/API/Element/requestFullscreen
      // Element.requestPointerLock() – https://developer.mozilla.org/en-US/docs/Web/API/Element/requestPointerLock
      // Element.scrollIntoView() – https://developer.mozilla.org/en-US/docs/Web/API/Element/scrollIntoView
      // Element.setCapture() – https://developer.mozilla.org/en-US/docs/Web/API/Element/setCapture
      // Element.setPointerCapture() – https://developer.mozilla.org/en-US/docs/Web/API/Element/setPointerCapture
      // Partially implemented Mixin Methods
      // Both Element.querySelector() and Element.querySelector() are only implemented for the following simple selectors:
      // - Element selectors
      // - ID selectors
      // - Class selectors
      // - Attribute selectors
      // Element.querySelector() – https://developer.mozilla.org/en-US/docs/Web/API/Element/querySelector
      // Element.querySelectorAll() – https://developer.mozilla.org/en-US/docs/Web/API/Element/querySelectorAll
      // Mixins not implemented
      // Slotable.assignedSlot – https://developer.mozilla.org/en-US/docs/Web/API/Slotable/assignedSlot

      /**
       * @see https://developer.mozilla.org/en-US/docs/Web/API/Element/outerHTML
       * @return string representation of serialized HTML describing the Element and its descendants.
       */


      get outerHTML() {
        const tag = this.localName || this.tagName;
        const start = `<${[tag, toString(this.attributes)].join(' ').trim()}>`;
        const contents = this.innerHTML;

        if (!contents) {
          if (this.kind === ElementKind.VOID) {
            // Void elements e.g. <input> only have a start tag (unless children are added programmatically).
            // https://html.spec.whatwg.org/multipage/syntax.html#void-elements
            return start;
          }
        }

        return start + contents + `</${tag}>`;
      }
      /**
       * @see https://developer.mozilla.org/en-US/docs/Web/API/Element/innerHTML
       * @return string representation of serialized HTML describing the Element's descendants.
       */


      get innerHTML() {
        const childNodes = this.childNodes;

        if (childNodes.length) {
          return childNodes.map(child => {
            switch (child.nodeType) {
              case 3
              /* TEXT_NODE */
              :
                return child.textContent;

              case 8
              /* COMMENT_NODE */
              :
                return `<!--${child.textContent}-->`;

              default:
                return child.outerHTML;
            }
          }).join('');
        }

        return '';
      }
      /**
       * @see https://developer.mozilla.org/en-US/docs/Web/API/Element/innerHTML
       * @param html The raw html string to parse.
       */


      set innerHTML(html) {
        const root = parse(html, this); // remove previous children

        this.childNodes.forEach(n => {
          propagate$3(n, 'isConnected', false);
          propagate$3(n, 45
          /* scopingRoot */
          , n);
        });
        mutate(this.ownerDocument, {
          removedNodes: this.childNodes,
          type: 2
          /* CHILD_LIST */
          ,
          target: this
        }, [2
        /* CHILD_LIST */
        , this[7
        /* index */
        ], 0, 0, 0, this.childNodes.length, ...this.childNodes.map(node => node[7
        /* index */
        ])]);
        this.childNodes = []; // add new children

        root.childNodes.forEach(child => this.appendChild(child));
      }
      /**
       * @see https://developer.mozilla.org/en-US/docs/Web/API/Node/textContent
       * @param text new text replacing all childNodes content.
       */


      set textContent(text) {
        // TODO(KB): Investigate removing all children in a single .splice to childNodes.
        this.childNodes.slice().forEach(child => child.remove());
        this.appendChild(this.ownerDocument.createTextNode(text));
      }
      /**
       * Getter returning the text representation of Element.childNodes.
       * @see https://developer.mozilla.org/en-US/docs/Web/API/Node/textContent
       * @return text from all childNodes.
       */


      get textContent() {
        return this.getTextContent();
      }
      /**
       * @see https://developer.mozilla.org/en-US/docs/Web/API/Element/tagName
       * @return string tag name (i.e 'div')
       */


      get tagName() {
        return this.nodeName;
      }
      /**
       * Sets the value of an attribute on this element using a null namespace.
       * @see https://developer.mozilla.org/en-US/docs/Web/API/Element/setAttribute
       * @param name attribute name
       * @param value attribute value
       */


      setAttribute(name, value) {
        this.setAttributeNS(HTML_NAMESPACE, name, value);
      }
      /**
       * Get the value of an attribute on this Element with the null namespace.
       *
       * @see https://developer.mozilla.org/en-US/docs/Web/API/Element/getAttribute
       * @param name attribute name
       * @return value of a specified attribute on the element, or null if the attribute doesn't exist.
       */


      getAttribute(name) {
        return this.getAttributeNS(HTML_NAMESPACE, name);
      }
      /**
       * Remove an attribute from this element in the null namespace.
       *
       * Method returns void, so it is not chainable.
       * @see https://developer.mozilla.org/en-US/docs/Web/API/Element/removeAttribute
       * @param name attribute name
       */


      removeAttribute(name) {
        this.removeAttributeNS(HTML_NAMESPACE, name);
      }
      /**
       * @see https://developer.mozilla.org/en-US/docs/Web/API/Element/hasAttribute
       * @param name attribute name
       * @return Boolean indicating if the element has the specified attribute.
       */


      hasAttribute(name) {
        return this.hasAttributeNS(HTML_NAMESPACE, name);
      }
      /**
       * @see https://developer.mozilla.org/en-US/docs/Web/API/Element/hasAttributes
       * @return Boolean indicating if the element has any attributes.
       */


      hasAttributes() {
        return this.attributes.length > 0;
      }
      /**
       * Sets the value of an attribute on this Element with the provided namespace.
       *
       * If the attribute already exists, the value is updated; otherwise a new attribute is added with the specified name and value.
       * @see https://developer.mozilla.org/en-US/docs/Web/API/Element/setAttributeNS
       * @param namespaceURI
       * @param name attribute name
       * @param value attribute value
       */


      setAttributeNS(namespaceURI, name, value) {
        const valueAsString = String(value);
        const propertyBacked = this.constructor[46
        /* propertyBackedAttributes */
        ][name];

        if (propertyBacked !== undefined) {
          if (!this.attributes.find(matchPredicate(namespaceURI, name))) {
            this.attributes.push({
              namespaceURI,
              name,
              value: valueAsString
            });
          }

          propertyBacked[1](this, valueAsString);
          return;
        }

        const oldValue = this[44
        /* storeAttribute */
        ](namespaceURI, name, valueAsString);
        mutate(this.ownerDocument, {
          type: 0
          /* ATTRIBUTES */
          ,
          target: this,
          attributeName: name,
          attributeNamespace: namespaceURI,
          value: valueAsString,
          oldValue
        }, [0
        /* ATTRIBUTES */
        , this[7
        /* index */
        ], store$1(name), store$1(namespaceURI), value !== null ? store$1(valueAsString) + 1 : 0]);
      }

      [44
      /* storeAttribute */
      ](namespaceURI, name, value) {
        const attr = this.attributes.find(matchPredicate(namespaceURI, name));
        const oldValue = attr && attr.value || '';

        if (attr) {
          attr.value = value;
        } else {
          this.attributes.push({
            namespaceURI,
            name,
            value
          });
        }

        return oldValue;
      }
      /**
       * Get the value of an attribute on this Element with the specified namespace.
       *
       * @see https://developer.mozilla.org/en-US/docs/Web/API/Element/getAttributeNS
       * @param namespaceURI attribute namespace
       * @param name attribute name
       * @return value of a specified attribute on the element, or null if the attribute doesn't exist.
       */


      getAttributeNS(namespaceURI, name) {
        const attr = this.attributes.find(matchPredicate(namespaceURI, name));

        if (attr) {
          const propertyBacked = this.constructor[46
          /* propertyBackedAttributes */
          ][name];
          return propertyBacked !== undefined ? propertyBacked[0](this) : attr.value;
        }

        return null;
      }
      /**
       * Remove an attribute from this element in the specified namespace.
       *
       * Method returns void, so it is not chainable.
       * @see https://developer.mozilla.org/en-US/docs/Web/API/Element/removeAttribute
       * @param namespaceURI attribute namespace
       * @param name attribute name
       */


      removeAttributeNS(namespaceURI, name) {
        const index = this.attributes.findIndex(matchPredicate(namespaceURI, name));

        if (index >= 0) {
          const oldValue = this.attributes[index].value;
          this.attributes.splice(index, 1);
          mutate(this.ownerDocument, {
            type: 0
            /* ATTRIBUTES */
            ,
            target: this,
            attributeName: name,
            attributeNamespace: namespaceURI,
            oldValue
          }, [0
          /* ATTRIBUTES */
          , this[7
          /* index */
          ], store$1(name), store$1(namespaceURI), 0 // 0 means no value
          ]);
        }
      }
      /**
       * @see https://developer.mozilla.org/en-US/docs/Web/API/Element/hasAttributeNS
       * @param namespaceURI attribute namespace
       * @param name attribute name
       * @return Boolean indicating if the element has the specified attribute.
       */


      hasAttributeNS(namespaceURI, name) {
        return this.attributes.some(matchPredicate(namespaceURI, name));
      }
      /**
       * @see https://developer.mozilla.org/en-US/docs/Web/API/Element/getElementsByClassName
       * @param names contains one more more classnames to match on. Multiples are space seperated, indicating an AND operation.
       * @return Element array with matching classnames
       */


      getElementsByClassName(names) {
        const inputClassList = names.split(' '); // TODO(KB) – Compare performance of [].some(value => DOMTokenList.contains(value)) and regex.
        // const classRegex = new RegExp(classNames.split(' ').map(name => `(?=.*${name})`).join(''));

        return matchChildrenElements(this, element => inputClassList.some(inputClassName => element.classList.contains(inputClassName)));
      }
      /**
       * @see https://developer.mozilla.org/en-US/docs/Web/API/Element/getElementsByTagName
       * @param tagName the qualified name to look for. The special string "*" represents all elements.
       * @return Element array with matching tagnames
       */


      getElementsByTagName(tagName) {
        const lowerTagName = toLower(tagName);
        return matchChildrenElements(this, tagName === '*' ? _ => true : element => element.namespaceURI === HTML_NAMESPACE ? element.localName === lowerTagName : element.tagName === tagName);
      }
      /**
       * @see https://developer.mozilla.org/en-US/docs/Web/API/Document/getElementsByName
       * @param name value of name attribute elements must have to be returned
       * @return Element array with matching name attributes
       */


      getElementsByName(name) {
        const stringName = '' + name;
        return matchChildrenElements(this, element => element.getAttribute('name') === stringName);
      }
      /**
       * @see https://developer.mozilla.org/en-US/docs/Web/API/Node/cloneNode
       * @param deep boolean determines if the clone should include a recursive copy of all childNodes.
       * @return Element containing all current attributes and potentially childNode clones of the Element requested to be cloned.
       */


      cloneNode(deep = false) {
        const clone = this.ownerDocument.createElementNS(this.namespaceURI, this.namespaceURI === HTML_NAMESPACE ? toLower(this.tagName) : this.tagName);
        this.attributes.forEach(attr => clone.setAttribute(attr.name, attr.value));

        if (deep) {
          this.childNodes.forEach(child => clone.appendChild(child.cloneNode(deep)));
        }

        return clone;
      }
      /**
       * Return the ClientRect for an Element once determined by the main thread.
       * @see https://developer.mozilla.org/en-US/docs/Web/API/Element/getBoundingClientRect
       * @return Promise<ClientRect>
       *
       * Note: Edge and IE11 do not return the x/y value, but top/left are equivalent. Normalize the values here.
       */


      getBoundingClientRectAsync() {
        const defaultValue = {
          left: 0,
          top: 0,
          right: 0,
          bottom: 0,
          x: 0,
          y: 0,
          width: 0,
          height: 0
        };
        return new Promise(resolve => {
          const messageHandler = ({
            data
          }) => {
            if (data[12
            /* type */
            ] === 6
            /* GET_BOUNDING_CLIENT_RECT */
            && data[13
            /* target */
            ][0] === this[7
            /* index */
            ]) {
              this.ownerDocument.removeGlobalEventListener('message', messageHandler);
              const transferredBoundingClientRect = data[38
              /* data */
              ];
              resolve({
                top: transferredBoundingClientRect[0],
                right: transferredBoundingClientRect[1],
                bottom: transferredBoundingClientRect[2],
                left: transferredBoundingClientRect[3],
                width: transferredBoundingClientRect[4],
                height: transferredBoundingClientRect[5],
                x: transferredBoundingClientRect[0],
                y: transferredBoundingClientRect[3]
              });
            }
          };

          if (!this.ownerDocument.addGlobalEventListener || !this.isConnected) {
            // Elements run within Node runtimes are missing addEventListener as a global.
            // In this case, treat the return value the same as a disconnected node.
            resolve(defaultValue);
          } else {
            this.ownerDocument.addGlobalEventListener('message', messageHandler);
            transfer(this.ownerDocument, [5
            /* GET_BOUNDING_CLIENT_RECT */
            , this[7
            /* index */
            ]]);
            setTimeout(resolve, 500, defaultValue); // TODO: Why a magical constant, define and explain.
          }
        });
      } // https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement/click


      click() {
        const event = new Event$1('click', {});
        event.target = this;
        this.dispatchEvent(event);
      } // https://developer.mozilla.org/en-US/docs/Web/API/Element/scrollIntoView


      scrollIntoView() {
        if (this.isConnected) {
          transfer(this.ownerDocument, [14
          /* SCROLL_INTO_VIEW */
          , this[7
          /* index */
          ]]);
        }
      }

      get classList() {
        return this._classList || (this._classList = new DOMTokenList(this, 'class'));
      }

    }
    Element[46
    /* propertyBackedAttributes */
    ] = {
      class: [el => el.classList.value, (el, value) => el.classList.value = value],
      style: [el => el.cssText, (el, value) => el.cssText = value]
    };
    synchronizedAccessor(Element, 'classList', 'className');
    reflectProperties([{
      id: ['']
    }], Element);

    /**
     * Copyright 2018 The AMP HTML Authors. All Rights Reserved.
     *
     * Licensed under the Apache License, Version 2.0 (the "License");
     * you may not use this file except in compliance with the License.
     * You may obtain a copy of the License at
     *
     *      http://www.apache.org/licenses/LICENSE-2.0
     *
     * Unless required by applicable law or agreed to in writing, software
     * distributed under the License is distributed on an "AS-IS" BASIS,
     * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
     * See the License for the specific language governing permissions and
     * limitations under the License.
     */
    const appendGlobalEventProperties = keys => {
      const keysToAppend = keys.filter(key => !HTMLElement.prototype.hasOwnProperty(key));

      if (keysToAppend.length <= 0) {
        return;
      }

      keysToAppend.forEach(key => {
        const normalizedKey = key.replace(/on/, '');
        Object.defineProperty(HTMLElement.prototype, key, {
          enumerable: true,

          get() {
            return this[76
            /* propertyEventHandlers */
            ][normalizedKey] || null;
          },

          set(value) {
            const stored = this[76
            /* propertyEventHandlers */
            ][normalizedKey];

            if (stored) {
              this.removeEventListener(normalizedKey, stored);
            }

            this.addEventListener(normalizedKey, value);
            this[76
            /* propertyEventHandlers */
            ][normalizedKey] = value;
          }

        });
      });
    };
    class HTMLElement extends Element {
      constructor(...args) {
        super(...args);
        this[76
        /* propertyEventHandlers */
        ] = {};
      }

      /**
       * Find the nearest parent form element.
       * Implemented in HTMLElement since so many extensions of HTMLElement repeat this functionality. This is not to spec.
       * @see https://developer.mozilla.org/en-US/docs/Web/API/HTMLFieldSetElement
       * @return nearest parent form element.
       */
      get form() {
        return matchNearestParent(this, tagNameConditionPredicate(['FORM']));
      }

      [68
      /* serializeAsTransferrableObject */
      ]() {
        return [7
        /* HTMLElement */
        , this[7
        /* index */
        ]];
      }

    } // Reflected properties
    // HTMLElement.accessKey => string, reflected attribute
    // HTMLElement.contentEditable => string, reflected attribute
    // HTMLElement.dir => string, reflected attribute
    // HTMLElement.lang => string, reflected attribute
    // HTMLElement.title => string, reflected attribute
    // HTMLElement.draggable => boolean, reflected attribute
    // HTMLElement.hidden => boolean, reflected attribute
    // HTMLElement.noModule => boolean, reflected attribute
    // HTMLElement.spellcheck => boolean, reflected attribute
    // HTMLElement.translate => boolean, reflected attribute

    reflectProperties([{
      accessKey: ['']
    }, {
      contentEditable: ['inherit']
    }, {
      dir: ['']
    }, {
      lang: ['']
    }, {
      title: ['']
    }, {
      draggable: [false,
      /* attr */
      undefined,
      /* keywords */
      ['true', 'false']]
    }, {
      hidden: [false,
      /* attr */
      undefined]
    }, {
      noModule: [false]
    }, {
      spellcheck: [true,
      /* attr */
      undefined,
      /* keywords */
      ['true', 'false']]
    }, {
      translate: [true,
      /* attr */
      undefined,
      /* keywords */
      ['yes', 'no']]
    }], HTMLElement); // Properties
    // HTMLElement.accessKeyLabel => string, readonly value of "accessKey"
    // HTMLElement.isContentEditable => boolean, readonly value of contentEditable
    // HTMLElement.nonce => string, NOT REFLECTED
    // HTMLElement.tabIndex => number, reflected attribute
    // Layout Properties (TBD)
    // HTMLElement.offsetHeight => double, readonly
    // HTMLElement.offsetLeft => double, readonly
    // HTMLElement.offsetParent => Element
    // HTMLElement.offsetTop => double, readonly
    // HTMLElement.offsetWidth => double, readonly
    // Unimplemented Properties
    // HTMLElement.contextMenu => HTMLElement
    // HTMLElement.dataset => Map<string (get/set), string>
    // HTMLElement.dropzone => DOMSettableTokenList (DOMTokenList)
    // HTMLElement.inert => boolean, reflected
    // HTMLElement.itemScope => boolean
    // HTMLElement.itemType => DOMSettableTokenList (DOMTokenList)
    // HTMLElement.itemId => string
    // HTMLElement.itemRef => DOMSettableTokenList (DOMTokenList)
    // HTMLElement.itemProp => DOMSettableTokenList (DOMTokenList)
    // HTMLElement.itemValue => object
    // HTMLElement.properties => HTMLPropertiesCollection, readonly

    /**
     * Copyright 2018 The AMP HTML Authors. All Rights Reserved.
     *
     * Licensed under the Apache License, Version 2.0 (the "License");
     * you may not use this file except in compliance with the License.
     * You may obtain a copy of the License at
     *
     *      http://www.apache.org/licenses/LICENSE-2.0
     *
     * Unless required by applicable law or agreed to in writing, software
     * distributed under the License is distributed on an "AS-IS" BASIS,
     * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
     * See the License for the specific language governing permissions and
     * limitations under the License.
     */
    class HTMLAnchorElement extends HTMLElement {
      constructor(...args) {
        super(...args);
        this._relList = void 0;
      }

      get relList() {
        return this._relList || (this._relList = new DOMTokenList(this, 'rel'));
      }
      /**
       * Returns the href property/attribute value
       * @see https://developer.mozilla.org/en-US/docs/Web/API/HTMLHyperlinkElementUtils/toString
       * @return string href attached to HTMLAnchorElement
       */


      toString() {
        return this.href;
      }
      /**
       * A Synonym for the Node.textContent property getter.
       * @see https://developer.mozilla.org/en-US/docs/Web/API/HTMLAnchorElement
       * @return value of text node direct child of this Element.
       */


      get text() {
        return this.textContent;
      }
      /**
       * A Synonym for the Node.textContent property setter.
       * @see https://developer.mozilla.org/en-US/docs/Web/API/HTMLAnchorElement
       * @param text replacement for all current childNodes.
       */


      set text(text) {
        this.textContent = text;
      }

    }
    registerSubclass('a', HTMLAnchorElement);
    definePropertyBackedAttributes(HTMLAnchorElement, {
      rel: [el => el.relList.value, (el, value) => el.relList.value = value]
    });
    synchronizedAccessor(HTMLAnchorElement, 'relList', 'rel'); // Reflected properties, strings.
    // HTMLAnchorElement.href => string, reflected attribute
    // HTMLAnchorElement.hreflang => string, reflected attribute
    // HTMLAnchorElement.media => string, reflected attribute
    // HTMLAnchorElement.target => string, reflected attribute
    // HTMLAnchorElement.type => string, reflected attribute

    reflectProperties([{
      href: ['']
    }, {
      hreflang: ['']
    }, {
      media: ['']
    }, {
      target: ['']
    }, {
      type: ['']
    }], HTMLAnchorElement); // Unimplemented
    // HTMLAnchorElement.download => string, reflected attribute
    // HTMLAnchorElement.type => Is a DOMString that reflects the type HTML attribute, indicating the MIME type of the linked resource.
    // Unimplemented URL parse of href attribute due to IE11 compatibility and low usage.
    // Note: Implementation doable using a private url property

    /*
      class {
        private url: URL | null = null;

        constructor(...) {
          // Element.getAttribute('href') => Element.href.
          Object.assign(this[TransferrableKeys.propertyBackedAttributes], {
            href: this.href,
          });
        }

        get href(): string {
          return this.url ? this.url.href : '';
        }
        set href(url: string) {
          this.url = new URL(url);
          this.setAttribute('href', this.url.href);
        }
      }
    */
    // HTMLAnchorElement.host => string
    // HTMLAnchorElement.hostname => string
    // HTMLAnchorElement.protocol => string
    // HTMLAnchorElement.pathname => string
    // HTMLAnchorElement.search => string
    // HTMLAnchorElement.hash => string
    // HTMLAnchorElement.username => string
    // HTMLAnchorElement.password => string
    // HTMLAnchorElement.origin => string, readonly (getter no setter)

    /**
     * Copyright 2018 The AMP HTML Authors. All Rights Reserved.
     *
     * Licensed under the Apache License, Version 2.0 (the "License");
     * you may not use this file except in compliance with the License.
     * You may obtain a copy of the License at
     *
     *      http://www.apache.org/licenses/LICENSE-2.0
     *
     * Unless required by applicable law or agreed to in writing, software
     * distributed under the License is distributed on an "AS-IS" BASIS,
     * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
     * See the License for the specific language governing permissions and
     * limitations under the License.
     */
    class HTMLButtonElement extends HTMLElement {}
    registerSubclass('button', HTMLButtonElement); // Reflected properties, strings.
    // HTMLButtonElement.formAction => string, reflected attribute
    // HTMLButtonElement.formEnctype => string, reflected attribute
    // HTMLButtonElement.formMethod => string, reflected attribute
    // HTMLButtonElement.formTarget => string, reflected attribute
    // HTMLButtonElement.name => string, reflected attribute
    // HTMLButtonElement.type => string, reflected attribute (default submit)
    // HTMLButtonElement.value => string, reflected attribute
    // HTMLButtonElement.autofocus => boolean, reflected attribute
    // HTMLButtonElement.disabled => boolean, reflected attribute

    reflectProperties([{
      formAction: ['']
    }, {
      formEnctype: ['']
    }, {
      formMethod: ['']
    }, {
      formTarget: ['']
    }, {
      name: ['']
    }, {
      type: ['submit']
    }, {
      value: ['']
    }, {
      autofocus: [false]
    }, {
      disabled: [false]
    }], HTMLButtonElement); // Not reflected
    // HTMLButtonElement.formNoValidate => boolean
    // HTMLButtonElement.validity => ValidityState, readonly
    // Unimplemented
    // HTMLButtonElement.form => HTMLFormElement | null, readonly
    // HTMLButtonElement.labels => Array<HTMLLabelElement>, readonly
    // HTMLButtonElement.menu => HTMLMenuElement
    // HTMLButtonElement.willValidate => boolean, readonly
    // HTMLButtonElement.validationMessage => string, readonly

    /**
     * Copyright 2019 The AMP HTML Authors. All Rights Reserved.
     *
     * Licensed under the Apache License, Version 2.0 (the "License");
     * you may not use this file except in compliance with the License.
     * You may obtain a copy of the License at
     *
     *      http://www.apache.org/licenses/LICENSE-2.0
     *
     * Unless required by applicable law or agreed to in writing, software
     * distributed under the License is distributed on an "AS-IS" BASIS,
     * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
     * See the License for the specific language governing permissions and
     * limitations under the License.
     */
    const f32 = new Float32Array(1);
    const u16 = new Uint16Array(f32.buffer);

    function isSmallInt(num) {
      u16[0] = num; // If the Uint16Array doesn't coerce it to another value, that means it fits
      // into a Uint16Array.

      return u16[0] === num;
    }
    /**
     * Serializes arguments into a Uint16 compatible format.
     *
     * The serialization format uses a variable length tuple, with the first item
     * being the encoded representation's type and any number of values afterwards.
     *
     * @param args The arguments to serialize
     */


    function serializeTransferrableObject(args) {
      const serialized = [];

      for (let i = 0; i < args.length; i++) {
        const arg = args[i];

        if (typeof arg === 'number') {
          if (isSmallInt(arg)) {
            serialized.push(1
            /* SmallInt */
            , arg);
          } else {
            f32[0] = arg;
            serialized.push(2
            /* Float */
            , u16[0], u16[1]);
          }

          continue;
        }

        if (typeof arg === 'string') {
          serialized.push(3
          /* String */
          , store$1(arg));
          continue;
        }

        if (Array.isArray(arg)) {
          serialized.push(4
          /* Array */
          , arg.length);
          const serializedArray = serializeTransferrableObject(arg);

          for (let _i = 0; _i < serializedArray.length; _i++) {
            serialized.push(serializedArray[_i]);
          }

          continue;
        }

        if (typeof arg === 'object') {
          const serializedObject = arg[68
          /* serializeAsTransferrableObject */
          ]();

          for (let _i2 = 0; _i2 < serializedObject.length; _i2++) {
            serialized.push(serializedObject[_i2]);
          }

          continue;
        }

        throw new Error('Cannot serialize argument.');
      }

      return serialized;
    }

    /**
     * Copyright 2019 The AMP HTML Authors. All Rights Reserved.
     *
     * Licensed under the Apache License, Version 2.0 (the "License");
     * you may not use this file except in compliance with the License.
     * You may obtain a copy of the License at
     *
     *      http://www.apache.org/licenses/LICENSE-2.0
     *
     * Unless required by applicable law or agreed to in writing, software
     * distributed under the License is distributed on an "AS-IS" BASIS,
     * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
     * See the License for the specific language governing permissions and
     * limitations under the License.
     */
    /**
     * Wrapper class for CanvasGradient. The user will be able to manipulate as a regular CanvasGradient object.
     */

    class CanvasGradient {
      constructor(id, document) {
        this.id = void 0;
        this.document = void 0;
        this.document = document;
        this.id = id;
      }

      addColorStop(offset, color) {
        transfer(this.document, [9
        /* OBJECT_MUTATION */
        , store$1('addColorStop'), 2, ...this[68
        /* serializeAsTransferrableObject */
        ](), ...serializeTransferrableObject([...arguments])]);
      }

      [68
      /* serializeAsTransferrableObject */
      ]() {
        return [5
        /* TransferObject */
        , this.id];
      }

    }

    /**
     * Copyright 2019 The AMP HTML Authors. All Rights Reserved.
     *
     * Licensed under the Apache License, Version 2.0 (the "License");
     * you may not use this file except in compliance with the License.
     * You may obtain a copy of the License at
     *
     *      http://www.apache.org/licenses/LICENSE-2.0
     *
     * Unless required by applicable law or agreed to in writing, software
     * distributed under the License is distributed on an "AS-IS" BASIS,
     * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
     * See the License for the specific language governing permissions and
     * limitations under the License.
     */

    /**
     * Wrapper class for CanvasPattern. The user will be able to manipulate as a regular CanvasPattern object.
     * This class will be used when the CanvasRenderingContext is using an OffscreenCanvas polyfill.
     */
    class CanvasPattern {
      constructor(id) {
        this.id = void 0;
        this.id = id;
      }
      /**
       * This is an experimental method.
       */


      setTransform() {}

      [68
      /* serializeAsTransferrableObject */
      ]() {
        return [5
        /* TransferObject */
        , this.id];
      }

    }

    /**
     * Copyright 2019 The AMP HTML Authors. All Rights Reserved.
     *
     * Licensed under the Apache License, Version 2.0 (the "License");
     * you may not use this file except in compliance with the License.
     * You may obtain a copy of the License at
     *
     *      http://www.apache.org/licenses/LICENSE-2.0
     *
     * Unless required by applicable law or agreed to in writing, software
     * distributed under the License is distributed on an "AS-IS" BASIS,
     * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
     * See the License for the specific language governing permissions and
     * limitations under the License.
     */
    /**
     * Handles calls to a CanvasRenderingContext2D object in cases where the user's environment does not
     * support native OffscreenCanvas.
     */

    class OffscreenCanvasPolyfill {
      constructor(canvas) {
        this.canvas = void 0;
        this.context = void 0;
        this.canvas = canvas;
      }

      getContext(contextType) {
        if (!this.context) {
          if (toLower(contextType) === '2d') {
            this.context = new OffscreenCanvasRenderingContext2DPolyfill(this.canvas);
          } else {
            throw new Error('Context type not supported.');
          }
        }

        return this.context;
      }

    }

    class OffscreenCanvasRenderingContext2DPolyfill {
      constructor(canvas) {
        this.canvasElement = void 0;
        this.lineDash = void 0;
        this.objectIndex = 0;
        this.canvasElement = canvas;
        this.lineDash = [];
      }

      [67
      /* mutated */
      ](fnName, args) {
        transfer(this.canvasElement.ownerDocument, [9
        /* OBJECT_MUTATION */
        , store$1(fnName), args.length, ...this[68
        /* serializeAsTransferrableObject */
        ](), ...serializeTransferrableObject(args)]);
      }

      [68
      /* serializeAsTransferrableObject */
      ]() {
        return [6
        /* CanvasRenderingContext2D */
        , this.canvasElement[7
        /* index */
        ]];
      }
      /**
       * Creates object in the main thread, and associates it with the id provided.
       * @param objectId ID to associate the created object with.
       * @param creationMethod Method to use for object creation.
       * @param creationArgs Arguments to pass into the creation method.
       */


      createObjectReference(objectId, creationMethod, creationArgs) {
        transfer(this.canvasElement.ownerDocument, [10
        /* OBJECT_CREATION */
        , store$1(creationMethod), objectId, creationArgs.length, ...this[68
        /* serializeAsTransferrableObject */
        ](), ...serializeTransferrableObject(creationArgs)]);
      }

      get canvas() {
        return this.canvasElement;
      }

      clearRect(x, y, w, h) {
        this[67
        /* mutated */
        ]('clearRect', [...arguments]);
      }

      fillRect(x, y, w, h) {
        this[67
        /* mutated */
        ]('fillRect', [...arguments]);
      }

      strokeRect(x, y, w, h) {
        this[67
        /* mutated */
        ]('strokeRect', [...arguments]);
      }

      set lineWidth(value) {
        this[67
        /* mutated */
        ]('lineWidth', [...arguments]);
      }

      fillText(text, x, y, maxWidth) {
        this[67
        /* mutated */
        ]('fillText', [...arguments]);
      }

      moveTo(x, y) {
        this[67
        /* mutated */
        ]('moveTo', [...arguments]);
      }

      lineTo(x, y) {
        this[67
        /* mutated */
        ]('lineTo', [...arguments]);
      }

      closePath() {
        this[67
        /* mutated */
        ]('closePath', []);
      }

      stroke() {
        this[67
        /* mutated */
        ]('stroke', []);
      }

      restore() {
        this[67
        /* mutated */
        ]('restore', []);
      }

      save() {
        this[67
        /* mutated */
        ]('save', []);
      }

      resetTransform() {
        this[67
        /* mutated */
        ]('resetTransform', []);
      }

      rotate(angle) {
        this[67
        /* mutated */
        ]('rotate', [...arguments]);
      }

      transform(a, b, c, d, e, f) {
        this[67
        /* mutated */
        ]('transform', [...arguments]);
      }

      translate(x, y) {
        this[67
        /* mutated */
        ]('translate', [...arguments]);
      }

      scale(x, y) {
        this[67
        /* mutated */
        ]('scale', [...arguments]);
      }

      set globalAlpha(value) {
        this[67
        /* mutated */
        ]('globalAlpha', [...arguments]);
      }

      set globalCompositeOperation(value) {
        this[67
        /* mutated */
        ]('globalCompositeOperation', [...arguments]);
      }

      set imageSmoothingQuality(value) {
        this[67
        /* mutated */
        ]('imageSmoothingQuality', [...arguments]);
      }

      set fillStyle(value) {
        this[67
        /* mutated */
        ]('fillStyle', [...arguments]);
      }

      set strokeStyle(value) {
        this[67
        /* mutated */
        ]('strokeStyle', [...arguments]);
      }

      set shadowBlur(value) {
        this[67
        /* mutated */
        ]('shadowBlur', [...arguments]);
      }

      set shadowColor(value) {
        this[67
        /* mutated */
        ]('shadowColor', [...arguments]);
      }

      set shadowOffsetX(value) {
        this[67
        /* mutated */
        ]('shadowOffsetX', [...arguments]);
      }

      set shadowOffsetY(value) {
        this[67
        /* mutated */
        ]('shadowOffsetY', [...arguments]);
      }

      set filter(value) {
        this[67
        /* mutated */
        ]('filter', [...arguments]);
      }

      beginPath() {
        this[67
        /* mutated */
        ]('beginPath', []);
      }

      strokeText(text, x, y, maxWidth) {
        this[67
        /* mutated */
        ]('strokeText', [...arguments]);
      }

      set textAlign(value) {
        this[67
        /* mutated */
        ]('textAlign', [...arguments]);
      }

      set textBaseline(value) {
        this[67
        /* mutated */
        ]('textBaseline', [...arguments]);
      }

      set lineCap(value) {
        this[67
        /* mutated */
        ]('lineCap', [...arguments]);
      }

      set lineDashOffset(value) {
        this[67
        /* mutated */
        ]('lineDashOffset', [...arguments]);
      }

      set lineJoin(value) {
        this[67
        /* mutated */
        ]('lineJoin', [...arguments]);
      }

      set miterLimit(value) {
        this[67
        /* mutated */
        ]('miterLimit', [...arguments]);
      }

      arc(x, y, radius, startAngle, endAngle, anticlockwise) {
        this[67
        /* mutated */
        ]('arc', [...arguments]);
      }

      arcTo(x1, y1, x2, y2, radius) {
        this[67
        /* mutated */
        ]('arcTo', [...arguments]);
      }

      set direction(value) {
        this[67
        /* mutated */
        ]('direction', [...arguments]);
      }

      set font(value) {
        this[67
        /* mutated */
        ]('font', [...arguments]);
      }

      ellipse(x, y, radiusX, radiusY, rotation, startAngle, endAngle, anticlockwise) {
        this[67
        /* mutated */
        ]('ellipse', [...arguments]);
      }

      bezierCurveTo(cp1x, cp1y, cp2x, cp2y, x, y) {
        this[67
        /* mutated */
        ]('bezierCurveTo', [...arguments]);
      }

      rect(x, y, width, height) {
        this[67
        /* mutated */
        ]('rect', [...arguments]);
      }

      quadraticCurveTo(cpx, cpy, x, y) {
        this[67
        /* mutated */
        ]('quadraticCurveTo', [...arguments]);
      }

      set imageSmoothingEnabled(value) {
        this[67
        /* mutated */
        ]('imageSmoothingEnabled', [...arguments]);
      }

      setLineDash(lineDash) {
        lineDash = [...lineDash];

        if (lineDash.length % 2 !== 0) {
          lineDash = lineDash.concat(lineDash);
        }

        this.lineDash = lineDash;
        this[67
        /* mutated */
        ]('setLineDash', [...arguments]);
      }

      getLineDash() {
        return [...this.lineDash];
      }

      clip(pathOrFillRule, fillRule) {
        if (typeof pathOrFillRule === 'object') {
          throw new Error('clip(Path2D) is currently not supported!');
        }

        this[67
        /* mutated */
        ]('clip', [...arguments]);
      }

      fill(pathOrFillRule, fillRule) {
        if (typeof pathOrFillRule === 'object') {
          throw new Error('fill(Path2D) is currently not supported!');
        }

        this[67
        /* mutated */
        ]('fill', [...arguments]);
      } // Method has a different signature in MDN than it does in HTML spec


      setTransform(transformOrA, bOrC, cOrD, dOrE, eOrF, f) {
        if (typeof transformOrA === 'object') {
          throw new Error('setTransform(DOMMatrix2DInit) is currently not supported!');
        }

        this[67
        /* mutated */
        ]('setTransform', [...arguments]);
      }

      createLinearGradient(x0, y0, x1, y1) {
        const gradientId = this.objectIndex++;
        this.createObjectReference(gradientId, 'createLinearGradient', [...arguments]);
        return new CanvasGradient(gradientId, this.canvasElement.ownerDocument);
      }

      createRadialGradient(x0, y0, r0, x1, y1, r1) {
        const gradientId = this.objectIndex++;
        this.createObjectReference(gradientId, 'createRadialGradient', [...arguments]);
        return new CanvasGradient(gradientId, this.canvasElement.ownerDocument);
      }

      createPattern(image, repetition) {
        const patternId = this.objectIndex++;
        this.createObjectReference(patternId, 'createPattern', [...arguments]);
        return new CanvasPattern(patternId);
      }

      drawImage(image, dx, dy) {
        this[67
        /* mutated */
        ]('drawImage', [...arguments]);
      }

      createImageData() {
        return {};
      }

      getImageData() {
        return {};
      }

      putImageData() {}

      isPointInPath() {
        throw new Error('isPointInPath is not implemented.');
      }

      isPointInStroke() {
        throw new Error('isPointInStroke is not implemented.');
      }

      measureText() {
        throw new Error('measureText is not implemented.');
      }

    }

    /**
     * Copyright 2019 The AMP HTML Authors. All Rights Reserved.
     *
     * Licensed under the Apache License, Version 2.0 (the "License");
     * you may not use this file except in compliance with the License.
     * You may obtain a copy of the License at
     *
     *      http://www.apache.org/licenses/LICENSE-2.0
     *
     * Unless required by applicable law or agreed to in writing, software
     * distributed under the License is distributed on an "AS-IS" BASIS,
     * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
     * See the License for the specific language governing permissions and
     * limitations under the License.
     */
    let indexTracker = 0;
    function retrieveImageBitmap(image, canvas) {
      const callIndex = indexTracker++;
      const document = canvas.ownerDocument;
      return new Promise(resolve => {
        const messageHandler = ({
          data
        }) => {
          if (data[12
          /* type */
          ] === 10
          /* IMAGE_BITMAP_INSTANCE */
          && data[73
          /* callIndex */
          ] === callIndex) {
            document.removeGlobalEventListener('message', messageHandler);
            const transferredImageBitmap = data[38
            /* data */
            ];
            resolve(transferredImageBitmap);
          }
        };

        if (!document.addGlobalEventListener) {
          throw new Error('addGlobalEventListener is not defined.');
        } else {
          document.addGlobalEventListener('message', messageHandler);
          transfer(canvas.ownerDocument, [11
          /* IMAGE_BITMAP_INSTANCE */
          , image[7
          /* index */
          ], callIndex]);
        }
      });
    }

    /**
     * Copyright 2019 The AMP HTML Authors. All Rights Reserved.
     *
     * Licensed under the Apache License, Version 2.0 (the "License");
     * you may not use this file except in compliance with the License.
     * You may obtain a copy of the License at
     *
     *      http://www.apache.org/licenses/LICENSE-2.0
     *
     * Unless required by applicable law or agreed to in writing, software
     * distributed under the License is distributed on an "AS-IS" BASIS,
     * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
     * See the License for the specific language governing permissions and
     * limitations under the License.
     */
    /**
     * Wraps CanvasPattern for usage in a native OffscreenCanvas case.
     */

    class FakeNativeCanvasPattern {
      constructor() {
        this[70
        /* patternImplementation */
        ] = {};
        this[71
        /* patternUpgraded */
        ] = false;
        this[72
        /* patternUpgradePromise */
        ] = void 0;
      }

      /**
       * Retrieves ImageBitmap object from main-thread, which replicates the input image. Upon
       * retrieval, uses it to create a real CanvasPattern and upgrade the implementation property.
       * @param canvas Canvas element used to create the pattern.
       * @param image Image to be used as the pattern's image
       * @param repetition DOMStrings indicating how to repeat the pattern's image.
       */
      [69
      /* retrieveCanvasPattern */
      ](canvas, image, repetition) {
        this[72
        /* patternUpgradePromise */
        ] = retrieveImageBitmap(image, canvas) // Create new pattern with retrieved ImageBitmap
        .then(instance => {
          const pattern = canvas.getContext('2d').createPattern(instance, repetition);

          if (!pattern) {
            throw new Error('Pattern is null!');
          }

          this[70
          /* patternImplementation */
          ] = pattern;
          this[71
          /* patternUpgraded */
          ] = true;
        });
        return this[72
        /* patternUpgradePromise */
        ];
      } // This method is experimental.
      // Takes an SVGMatrix as an argument, which is a deprecated API.


      setTransform() {}

    }

    /**
     * Copyright 2019 The AMP HTML Authors. All Rights Reserved.
     *
     * Licensed under the Apache License, Version 2.0 (the "License");
     * you may not use this file except in compliance with the License.
     * You may obtain a copy of the License at
     *
     *      http://www.apache.org/licenses/LICENSE-2.0
     *
     * Unless required by applicable law or agreed to in writing, software
     * distributed under the License is distributed on an "AS-IS" BASIS,
     * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
     * See the License for the specific language governing permissions and
     * limitations under the License.
     */
    const deferredUpgrades = new WeakMap();
    /**
     * Delegates all CanvasRenderingContext2D calls, either to an OffscreenCanvas or a polyfill
     * (depending on whether it is supported).
     */

    class CanvasRenderingContext2DShim {
      // createPattern calls need to retrieve an ImageBitmap from the main-thread. Since those can
      // happen subsequently, we must keep track of these to avoid reentrancy problems.
      constructor(canvas) {
        this.queue = [];
        this.implementation = void 0;
        this.upgraded = false;
        this.canvasElement = void 0;
        this.polyfillUsed = void 0;
        this.unresolvedCalls = 0;
        this.goodImplementation = void 0;
        this.canvasElement = canvas;
        const OffscreenCanvas = canvas.ownerDocument.defaultView.OffscreenCanvas; // If the browser does not support OffscreenCanvas, use polyfill

        if (typeof OffscreenCanvas === 'undefined') {
          this.implementation = new OffscreenCanvasPolyfill(canvas).getContext('2d');
          this.upgraded = true;
          this.polyfillUsed = true;
        } // If the browser supports OffscreenCanvas:
        // 1. Use un-upgraded (not auto-synchronized) version for all calls performed immediately after
        // creation. All calls will be queued to call on upgraded version after.
        // 2. Retrieve an auto-synchronized OffscreenCanvas from the main-thread and call all methods
        // in the queue.
        else {
          this.implementation = new OffscreenCanvas(0, 0).getContext('2d');
          this.getOffscreenCanvasAsync(this.canvasElement);
          this.polyfillUsed = false;
        }
      }
      /**
       * Retrieves auto-synchronized version of an OffscreenCanvas from the main-thread.
       * @param canvas HTMLCanvasElement associated with this context.
       */


      getOffscreenCanvasAsync(canvas) {
        this.unresolvedCalls++;
        const deferred = {};
        const document = this.canvasElement.ownerDocument;
        const isTestMode = !document.addGlobalEventListener;
        const upgradePromise = new Promise(resolve => {
          const messageHandler = ({
            data
          }) => {
            if (data[12
            /* type */
            ] === 9
            /* OFFSCREEN_CANVAS_INSTANCE */
            && data[13
            /* target */
            ][0] === canvas[7
            /* index */
            ]) {
              document.removeGlobalEventListener('message', messageHandler);
              const transferredOffscreenCanvas = data[38
              /* data */
              ];
              resolve(transferredOffscreenCanvas);
            }
          };

          if (!document.addGlobalEventListener) {
            if (isTestMode) {
              deferred.resolve = resolve;
            } else {
              throw new Error('addGlobalEventListener is not defined.');
            }
          } else {
            document.addGlobalEventListener('message', messageHandler);
            transfer(canvas.ownerDocument, [8
            /* OFFSCREEN_CANVAS_INSTANCE */
            , canvas[7
            /* index */
            ]]);
          }
        }).then(instance => {
          this.goodImplementation = instance.getContext('2d');
          this.maybeUpgradeImplementation();
        });

        if (isTestMode) {
          deferred.upgradePromise = upgradePromise;
          deferredUpgrades.set(canvas, deferred);
        }

        return upgradePromise;
      }
      /**
       * Degrades the underlying context implementation and adds to the unresolved call count.
       */


      degradeImplementation() {
        this.upgraded = false;
        const OffscreenCanvas = this.canvasElement.ownerDocument.defaultView.OffscreenCanvas;
        this.implementation = new OffscreenCanvas(0, 0).getContext('2d');
        this.unresolvedCalls++;
      }
      /**
       * Will upgrade the underlying context implementation if no more unresolved calls remain.
       */


      maybeUpgradeImplementation() {
        this.unresolvedCalls--;

        if (this.unresolvedCalls === 0) {
          this.implementation = this.goodImplementation;
          this.upgraded = true;
          this.flushQueue();
        }
      }

      flushQueue() {
        for (const call of this.queue) {
          if (call.isSetter) {
            this[call.fnName] = call.args[0];
          } else {
            this[call.fnName](...call.args);
          }
        }

        this.queue.length = 0;
      }

      delegateFunc(name, args) {
        const returnValue = this.implementation[name](...args);

        if (!this.upgraded) {
          this.queue.push({
            fnName: name,
            args,
            isSetter: false
          });
        }

        return returnValue;
      }

      delegateSetter(name, args) {
        this.implementation[name] = args[0];

        if (!this.upgraded) {
          this.queue.push({
            fnName: name,
            args,
            isSetter: true
          });
        }
      }

      delegateGetter(name) {
        return this.implementation[name];
      }
      /* DRAWING RECTANGLES */


      clearRect(x, y, width, height) {
        this.delegateFunc('clearRect', [...arguments]);
      }

      fillRect(x, y, width, height) {
        this.delegateFunc('fillRect', [...arguments]);
      }

      strokeRect(x, y, width, height) {
        this.delegateFunc('strokeRect', [...arguments]);
      }
      /* DRAWING TEXT */


      fillText(text, x, y, maxWidth) {
        this.delegateFunc('fillText', [...arguments]);
      }

      strokeText(text, x, y, maxWidth) {
        this.delegateFunc('strokeText', [...arguments]);
      }

      measureText(text) {
        return this.delegateFunc('measureText', [...arguments]);
      }
      /* LINE STYLES */


      set lineWidth(value) {
        this.delegateSetter('lineWidth', [...arguments]);
      }

      get lineWidth() {
        return this.delegateGetter('lineWidth');
      }

      set lineCap(value) {
        this.delegateSetter('lineCap', [...arguments]);
      }

      get lineCap() {
        return this.delegateGetter('lineCap');
      }

      set lineJoin(value) {
        this.delegateSetter('lineJoin', [...arguments]);
      }

      get lineJoin() {
        return this.delegateGetter('lineJoin');
      }

      set miterLimit(value) {
        this.delegateSetter('miterLimit', [...arguments]);
      }

      get miterLimit() {
        return this.delegateGetter('miterLimit');
      }

      getLineDash() {
        return this.delegateFunc('getLineDash', [...arguments]);
      }

      setLineDash(segments) {
        this.delegateFunc('setLineDash', [...arguments]);
      }

      set lineDashOffset(value) {
        this.delegateSetter('lineDashOffset', [...arguments]);
      }

      get lineDashOffset() {
        return this.delegateGetter('lineDashOffset');
      }
      /* TEXT STYLES */


      set font(value) {
        this.delegateSetter('font', [...arguments]);
      }

      get font() {
        return this.delegateGetter('font');
      }

      set textAlign(value) {
        this.delegateSetter('textAlign', [...arguments]);
      }

      get textAlign() {
        return this.delegateGetter('textAlign');
      }

      set textBaseline(value) {
        this.delegateSetter('textBaseline', [...arguments]);
      }

      get textBaseline() {
        return this.delegateGetter('textBaseline');
      }

      set direction(value) {
        this.delegateSetter('direction', [...arguments]);
      }

      get direction() {
        return this.delegateGetter('direction');
      }
      /* FILL AND STROKE STYLES */


      set fillStyle(value) {
        // 1. Native pattern instances given to the user hold the 'real' pattern as their implementation prop.
        // 2. Pattern must be upgraded, otherwise an undefined 'implementation' will be queued instead of the wrapper object.
        if (value instanceof FakeNativeCanvasPattern && this.upgraded) {
          // This case occurs only when an un-upgraded pattern is passed into a different (already
          // upgraded) canvas context.
          if (!value[71
          /* patternUpgraded */
          ]) {
            this.queue.push({
              fnName: 'fillStyle',
              args: [value],
              isSetter: true
            });
            this.degradeImplementation();
            value[72
            /* patternUpgradePromise */
            ].then(() => {
              this.maybeUpgradeImplementation();
            });
          } else {
            this.delegateSetter('fillStyle', [value[70
            /* patternImplementation */
            ]]);
          } // Any other case does not require special handling.

        } else {
          this.delegateSetter('fillStyle', [...arguments]);
        }
      }

      get fillStyle() {
        return this.delegateGetter('fillStyle');
      }

      set strokeStyle(value) {
        // 1. Native pattern instances given to the user hold the 'real' pattern as their implementation prop.
        // 2. Pattern must be upgraded, otherwise an undefined 'implementation' could be queued instead of the wrapper object.
        if (value instanceof FakeNativeCanvasPattern && this.upgraded) {
          // This case occurs only when an un-upgraded pattern is passed into a different (already
          // upgraded) canvas context.
          if (!value[71
          /* patternUpgraded */
          ]) {
            this.queue.push({
              fnName: 'strokeStyle',
              args: [value],
              isSetter: true
            });
            this.degradeImplementation();
            value[72
            /* patternUpgradePromise */
            ].then(() => {
              this.maybeUpgradeImplementation();
            });
          } else {
            this.delegateSetter('strokeStyle', [value[70
            /* patternImplementation */
            ]]);
          } // Any other case does not require special handling.

        } else {
          this.delegateSetter('strokeStyle', [...arguments]);
        }
      }

      get strokeStyle() {
        return this.delegateGetter('strokeStyle');
      }
      /* GRADIENTS AND PATTERNS */


      createLinearGradient(x0, y0, x1, y1) {
        return this.delegateFunc('createLinearGradient', [...arguments]);
      }

      createRadialGradient(x0, y0, r0, x1, y1, r1) {
        return this.delegateFunc('createRadialGradient', [...arguments]);
      }

      createPattern(image, repetition) {
        const ImageBitmap = this.canvasElement.ownerDocument.defaultView.ImageBitmap; // Only HTMLElement image sources require special handling. ImageBitmap is OK to use.

        if (this.polyfillUsed || image instanceof ImageBitmap) {
          return this.delegateFunc('createPattern', [...arguments]);
        } else {
          // Degrade the underlying implementation because we don't want calls on the real one until
          // after pattern is retrieved
          this.degradeImplementation();
          const fakePattern = new FakeNativeCanvasPattern();
          fakePattern[69
          /* retrieveCanvasPattern */
          ](this.canvas, image, repetition).then(() => {
            this.maybeUpgradeImplementation();
          });
          return fakePattern;
        }
      }
      /* DRAWING IMAGES */


      drawImage(image, dx, dy) {
        const ImageBitmap = this.canvasElement.ownerDocument.defaultView.ImageBitmap; // Only HTMLElement image sources require special handling. ImageBitmap is OK to use.

        if (this.polyfillUsed || image instanceof ImageBitmap) {
          this.delegateFunc('drawImage', [...arguments]);
        } else {
          // Queue the drawImage call to make sure it gets called in correct order
          const args = [];
          this.queue.push({
            fnName: 'drawImage',
            args,
            isSetter: false
          }); // Degrade the underlying implementation because we don't want calls on the real one
          // until after the ImageBitmap is received.

          this.degradeImplementation(); // Retrieve an ImageBitmap from the main-thread with the same image as the input image

          retrieveImageBitmap(image, this.canvas) // Then call the actual method with the retrieved ImageBitmap
          .then(instance => {
            args.push(instance, dx, dy);
            this.maybeUpgradeImplementation();
          });
        }
      }
      /* SHADOWS */


      set shadowBlur(value) {
        this.delegateSetter('shadowBlur', [...arguments]);
      }

      get shadowBlur() {
        return this.delegateGetter('shadowBlur');
      }

      set shadowColor(value) {
        this.delegateSetter('shadowColor', [...arguments]);
      }

      get shadowColor() {
        return this.delegateGetter('shadowColor');
      }

      set shadowOffsetX(value) {
        this.delegateSetter('shadowOffsetX', [...arguments]);
      }

      get shadowOffsetX() {
        return this.delegateGetter('shadowOffsetX');
      }

      set shadowOffsetY(value) {
        this.delegateSetter('shadowOffsetY', [...arguments]);
      }

      get shadowOffsetY() {
        return this.delegateGetter('shadowOffsetY');
      }
      /* PATHS */


      beginPath() {
        this.delegateFunc('beginPath', [...arguments]);
      }

      closePath() {
        this.delegateFunc('closePath', [...arguments]);
      }

      moveTo(x, y) {
        this.delegateFunc('moveTo', [...arguments]);
      }

      lineTo(x, y) {
        this.delegateFunc('lineTo', [...arguments]);
      }

      bezierCurveTo(cp1x, cp1y, cp2x, cp2y, x, y) {
        this.delegateFunc('bezierCurveTo', [...arguments]);
      }

      quadraticCurveTo(cpx, cpy, x, y) {
        this.delegateFunc('quadraticCurveTo', [...arguments]);
      }

      arc(x, y, radius, startAngle, endAngle, antiClockwise) {
        this.delegateFunc('arc', [...arguments]);
      }

      arcTo(x1, y1, x2, y2, radius) {
        this.delegateFunc('arcTo', [...arguments]);
      }

      ellipse(x, y, radiusX, radiusY, rotation, startAngle, endAngle, antiClockwise) {
        this.delegateFunc('ellipse', [...arguments]);
      }

      rect(x, y, width, height) {
        this.delegateFunc('rect', [...arguments]);
      }
      /* DRAWING PATHS */


      fill(pathOrFillRule, fillRule) {
        const args = [...arguments];
        this.delegateFunc('fill', args);
      }

      stroke(path) {
        const args = [...arguments];
        this.delegateFunc('stroke', args);
      }

      clip(pathOrFillRule, fillRule) {
        const args = [...arguments];
        this.delegateFunc('clip', args);
      }

      isPointInPath(pathOrX, xOrY, yOrFillRule, fillRule) {
        const args = [...arguments];
        return this.delegateFunc('isPointInPath', args);
      }

      isPointInStroke(pathOrX, xOrY, y) {
        const args = [...arguments];
        return this.delegateFunc('isPointInStroke', args);
      }
      /* TRANSFORMATIONS */


      rotate(angle) {
        this.delegateFunc('rotate', [...arguments]);
      }

      scale(x, y) {
        this.delegateFunc('scale', [...arguments]);
      }

      translate(x, y) {
        this.delegateFunc('translate', [...arguments]);
      }

      transform(a, b, c, d, e, f) {
        this.delegateFunc('transform', [...arguments]);
      }

      setTransform(transformOrA, bOrC, cOrD, dOrE, eOrF, f) {
        const args = [...arguments];
        this.delegateFunc('setTransform', args);
      }
      /* experimental */


      resetTransform() {
        this.delegateFunc('resetTransform', [...arguments]);
      }
      /* COMPOSITING */


      set globalAlpha(value) {
        this.delegateSetter('globalAlpha', [...arguments]);
      }

      get globalAlpha() {
        return this.delegateGetter('globalAlpha');
      }

      set globalCompositeOperation(value) {
        this.delegateSetter('globalCompositeOperation', [...arguments]);
      }

      get globalCompositeOperation() {
        return this.delegateGetter('globalCompositeOperation');
      }
      /* PIXEL MANIPULATION */


      createImageData(imagedataOrWidth, height) {
        const args = [...arguments];
        return this.delegateFunc('createImageData', args);
      }

      getImageData(sx, sy, sw, sh) {
        return this.delegateFunc('getImageData', [...arguments]);
      }

      putImageData(imageData, dx, dy, dirtyX, dirtyY, dirtyWidth, dirtyHeight) {
        this.delegateFunc('putImageData', [...arguments]);
      }
      /* IMAGE SMOOTHING */

      /* experimental */


      set imageSmoothingEnabled(value) {
        this.delegateSetter('imageSmoothingEnabled', [...arguments]);
      }
      /* experimental */


      get imageSmoothingEnabled() {
        return this.delegateGetter('imageSmoothingEnabled');
      }
      /* experimental */


      set imageSmoothingQuality(value) {
        this.delegateSetter('imageSmoothingQuality', [...arguments]);
      }
      /* experimental */


      get imageSmoothingQuality() {
        return this.delegateGetter('imageSmoothingQuality');
      }
      /* THE CANVAS STATE */


      save() {
        this.delegateFunc('save', [...arguments]);
      }

      restore() {
        this.delegateFunc('restore', [...arguments]);
      } // canvas property is readonly. We don't want to implement getters, but this must be here
      // in order for TypeScript to not complain (for now)


      get canvas() {
        return this.canvasElement;
      }
      /* FILTERS */

      /* experimental */


      set filter(value) {
        this.delegateSetter('filter', [...arguments]);
      }
      /* experimental */


      get filter() {
        return this.delegateGetter('filter');
      }

    }

    /**
     * Copyright 2018 The AMP HTML Authors. All Rights Reserved.
     *
     * Licensed under the Apache License, Version 2.0 (the "License");
     * you may not use this file except in compliance with the License.
     * You may obtain a copy of the License at
     *
     *      http://www.apache.org/licenses/LICENSE-2.0
     *
     * Unless required by applicable law or agreed to in writing, software
     * distributed under the License is distributed on an "AS-IS" BASIS,
     * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
     * See the License for the specific language governing permissions and
     * limitations under the License.
     */
    class HTMLCanvasElement extends HTMLElement {
      constructor(...args) {
        super(...args);
        this.context = void 0;
      }

      getContext(contextType) {
        if (!this.context) {
          if (contextType === '2D' || contextType === '2d') {
            this.context = new CanvasRenderingContext2DShim(this);
          } else {
            throw new Error('Context type not supported.');
          }
        }

        return this.context;
      }

    }
    registerSubclass('canvas', HTMLCanvasElement); // Reflected Properties
    // HTMLCanvasElement.height => number, reflected attribute
    // HTMLCanvasElement.width => number, reflected attribute

    reflectProperties([{
      height: [0]
    }, {
      width: [0]
    }], HTMLCanvasElement); // Unimplemented Properties
    // HTMLCanvasElement.mozOpaque => boolean
    // HTMLCanvasElement.mozPrintCallback => function
    // Unimplemented Methods
    // HTMLCanvasElement.captureStream()
    // HTMLCanvasElement.toDataURL()
    // HTMLCanvasElement.toBlob()
    // HTMLCanvasElement.transferControlToOffscreen()
    // HTMLCanvasElement.mozGetAsFile()

    /**
     * Copyright 2018 The AMP HTML Authors. All Rights Reserved.
     *
     * Licensed under the Apache License, Version 2.0 (the "License");
     * you may not use this file except in compliance with the License.
     * You may obtain a copy of the License at
     *
     *      http://www.apache.org/licenses/LICENSE-2.0
     *
     * Unless required by applicable law or agreed to in writing, software
     * distributed under the License is distributed on an "AS-IS" BASIS,
     * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
     * See the License for the specific language governing permissions and
     * limitations under the License.
     */
    class HTMLDataElement extends HTMLElement {}
    registerSubclass('data', HTMLDataElement); // Reflected properties, strings.
    // HTMLEmbedElement.value => string, reflected attribute

    reflectProperties([{
      value: ['']
    }], HTMLDataElement);

    /**
     * Copyright 2018 The AMP HTML Authors. All Rights Reserved.
     *
     * Licensed under the Apache License, Version 2.0 (the "License");
     * you may not use this file except in compliance with the License.
     * You may obtain a copy of the License at
     *
     *      http://www.apache.org/licenses/LICENSE-2.0
     *
     * Unless required by applicable law or agreed to in writing, software
     * distributed under the License is distributed on an "AS-IS" BASIS,
     * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
     * See the License for the specific language governing permissions and
     * limitations under the License.
     */
    class HTMLDataListElement extends HTMLElement {
      /**
       * Getter returning option elements that are direct children of a HTMLDataListElement
       * @see https://developer.mozilla.org/en-US/docs/Web/API/HTMLDataListElement
       * @return Element "options" objects that are direct children.
       */
      get options() {
        return this.childNodes.filter(node => node.nodeName === 'OPTION');
      }

    }
    registerSubclass('datalist', HTMLDataListElement);
    /**
     * HTMLDataListElement.options Read only
     * Is a HTMLCollection representing a collection of the contained option elements.
     */

    /**
     * <label for="myBrowser">Choose a browser from this list:</label>
     * <input list="browsers" id="myBrowser" name="myBrowser" />
     * <datalist id="browsers">
     *   <option value="Chrome">
     *   <option value="Firefox">
     *   <option value="Internet Explorer">
     *   <option value="Opera">
     *   <option value="Safari">
     *   <option value="Microsoft Edge">
     * </datalist>
     */

    /**
     * Copyright 2018 The AMP HTML Authors. All Rights Reserved.
     *
     * Licensed under the Apache License, Version 2.0 (the "License");
     * you may not use this file except in compliance with the License.
     * You may obtain a copy of the License at
     *
     *      http://www.apache.org/licenses/LICENSE-2.0
     *
     * Unless required by applicable law or agreed to in writing, software
     * distributed under the License is distributed on an "AS-IS" BASIS,
     * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
     * See the License for the specific language governing permissions and
     * limitations under the License.
     */
    class HTMLEmbedElement extends HTMLElement {}
    registerSubclass('embed', HTMLEmbedElement); // Reflected properties, strings.
    // HTMLEmbedElement.height => string, reflected attribute
    // HTMLEmbedElement.src => string, reflected attribute
    // HTMLEmbedElement.type => string, reflected attribute
    // HTMLEmbedElement.width => string, reflected attribute

    reflectProperties([{
      height: ['']
    }, {
      src: ['']
    }, {
      type: ['']
    }, {
      width: ['']
    }], HTMLEmbedElement); // Unimplemented
    // HTMLEmbedElement.align => string, not reflected
    // HTMLEmbedElement.name => string, not reflected

    /**
     * Copyright 2018 The AMP HTML Authors. All Rights Reserved.
     *
     * Licensed under the Apache License, Version 2.0 (the "License");
     * you may not use this file except in compliance with the License.
     * You may obtain a copy of the License at
     *
     *      http://www.apache.org/licenses/LICENSE-2.0
     *
     * Unless required by applicable law or agreed to in writing, software
     * distributed under the License is distributed on an "AS-IS" BASIS,
     * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
     * See the License for the specific language governing permissions and
     * limitations under the License.
     */
    const MATCHING_CHILD_ELEMENT_TAGNAMES = 'BUTTON FIELDSET INPUT OBJECT OUTPUT SELECT TEXTAREA'.split(' ');
    /**
     * The HTMLFormControlsCollection interface represents a collection of HTML form control elements.
     * It is mixedin to both HTMLFormElement and HTMLFieldSetElement.
     */

    const HTMLFormControlsCollectionMixin = defineOn => {
      Object.defineProperty(defineOn.prototype, 'elements', {
        /**
         * @see https://developer.mozilla.org/en-US/docs/Web/API/HTMLFormControlsCollection
         * @return Element array matching children of specific tagnames.
         */
        get() {
          return matchChildrenElements(this, tagNameConditionPredicate(MATCHING_CHILD_ELEMENT_TAGNAMES));
        }

      });
    };

    /**
     * Copyright 2018 The AMP HTML Authors. All Rights Reserved.
     *
     * Licensed under the Apache License, Version 2.0 (the "License");
     * you may not use this file except in compliance with the License.
     * You may obtain a copy of the License at
     *
     *      http://www.apache.org/licenses/LICENSE-2.0
     *
     * Unless required by applicable law or agreed to in writing, software
     * distributed under the License is distributed on an "AS-IS" BASIS,
     * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
     * See the License for the specific language governing permissions and
     * limitations under the License.
     */
    class HTMLFieldSetElement extends HTMLElement {
      /**
       * @see https://developer.mozilla.org/en-US/docs/Web/API/HTMLFieldSetElement
       * @return hardcoded string 'fieldset'
       */
      get type() {
        return toLower(this.tagName);
      }

    }
    registerSubclass('fieldset', HTMLFieldSetElement);
    HTMLFormControlsCollectionMixin(HTMLFieldSetElement); // Reflected properties
    // HTMLFieldSetElement.name => string, reflected attribute
    // HTMLFieldSetElement.disabled => boolean, reflected attribute

    reflectProperties([{
      name: ['']
    }, {
      disabled: [false]
    }], HTMLFieldSetElement); // Unimplemented properties
    // HTMLFieldSetElement.validity
    // HTMLFieldSetElement.willValidate
    // HTMLFieldSetElement.validationMessage

    /**
     * Copyright 2018 The AMP HTML Authors. All Rights Reserved.
     *
     * Licensed under the Apache License, Version 2.0 (the "License");
     * you may not use this file except in compliance with the License.
     * You may obtain a copy of the License at
     *
     *      http://www.apache.org/licenses/LICENSE-2.0
     *
     * Unless required by applicable law or agreed to in writing, software
     * distributed under the License is distributed on an "AS-IS" BASIS,
     * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
     * See the License for the specific language governing permissions and
     * limitations under the License.
     */
    class HTMLFormElement extends HTMLElement {
      /**
       * @see https://developer.mozilla.org/en-US/docs/Web/API/HTMLFormElement/length
       * @return number of controls in the form
       */
      get length() {
        return this.elements.length;
      }

    }
    registerSubclass('form', HTMLFormElement);
    HTMLFormControlsCollectionMixin(HTMLFormElement); // Reflected properties
    // HTMLFormElement.name => string, reflected attribute
    // HTMLFormElement.method => string, reflected attribute
    // HTMLFormElement.target => string, reflected attribute
    // HTMLFormElement.action => string, reflected attribute
    // HTMLFormElement.enctype => string, reflected attribute
    // HTMLFormElement.acceptCharset => string, reflected attribute
    // HTMLFormElement.autocomplete => string, reflected attribute
    // HTMLFormElement.autocapitalize => string, reflected attribute

    reflectProperties([{
      name: ['']
    }, {
      method: ['get']
    }, {
      target: ['']
    }, {
      action: ['']
    }, {
      enctype: ['application/x-www-form-urlencoded']
    }, {
      acceptCharset: ['',
      /* attr */
      'accept-charset']
    }, {
      autocomplete: ['on']
    }, {
      autocapitalize: ['sentences']
    }], HTMLFormElement); // Unimplemented properties
    // HTMLFormElement.encoding => string, reflected attribute
    // HTMLFormElement.noValidate => boolean, reflected attribute

    /*
    Unimplemented, TBD:

    Named inputs are added to their owner form instance as properties, and can overwrite native properties
    if they share the same name (eg a form with an input named action will have its action property return
    that input instead of the form's action HTML attribute).
    */

    /**
     * Copyright 2018 The AMP HTML Authors. All Rights Reserved.
     *
     * Licensed under the Apache License, Version 2.0 (the "License");
     * you may not use this file except in compliance with the License.
     * You may obtain a copy of the License at
     *
     *      http://www.apache.org/licenses/LICENSE-2.0
     *
     * Unless required by applicable law or agreed to in writing, software
     * distributed under the License is distributed on an "AS-IS" BASIS,
     * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
     * See the License for the specific language governing permissions and
     * limitations under the License.
     */
    class HTMLIFrameElement extends HTMLElement {
      constructor(...args) {
        super(...args);
        this._sandbox = void 0;
      }

      // HTMLIFrameElement.sandbox, DOMTokenList, reflected attribute
      get sandbox() {
        return this._sandbox || (this._sandbox = new DOMTokenList(this, 'sandbox'));
      }

    }
    registerSubclass('iframe', HTMLIFrameElement);
    definePropertyBackedAttributes(HTMLIFrameElement, {
      sandbox: [el => el.sandbox.value, (el, value) => el.sandbox.value = value]
    }); // Reflected properties
    // HTMLIFrameElement.allow => string, reflected attribute
    // HTMLIFrameElement.allowFullscreen => boolean, reflected attribute
    // HTMLIFrameElement.csp => string, reflected attribute
    // HTMLIFrameElement.height => string, reflected attribute
    // HTMLIFrameElement.name => string, reflected attribute
    // HTMLIFrameElement.referrerPolicy => string, reflected attribute
    // HTMLIFrameElement.src => string, reflected attribute
    // HTMLIFrameElement.srcdoc => string, reflected attribute
    // HTMLIFrameElement.width => string, reflected attribute

    reflectProperties([{
      allow: ['']
    }, {
      allowFullscreen: [false]
    }, {
      csp: ['']
    }, {
      height: ['']
    }, {
      name: ['']
    }, {
      referrerPolicy: ['']
    }, {
      src: ['']
    }, {
      srcdoc: ['']
    }, {
      width: ['']
    }], HTMLIFrameElement); // Unimplemented Properties
    // HTMLIFrameElement.allowPaymentRequest => boolean, reflected attribute
    // HTMLIFrameElement.contentDocument => Document, read only (active document in the inline frame's nested browsing context)
    // HTMLIFrameElement.contentWindow => WindowProxy, read only (window proxy for the nested browsing context)

    /**
     * Copyright 2018 The AMP HTML Authors. All Rights Reserved.
     *
     * Licensed under the Apache License, Version 2.0 (the "License");
     * you may not use this file except in compliance with the License.
     * You may obtain a copy of the License at
     *
     *      http://www.apache.org/licenses/LICENSE-2.0
     *
     * Unless required by applicable law or agreed to in writing, software
     * distributed under the License is distributed on an "AS-IS" BASIS,
     * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
     * See the License for the specific language governing permissions and
     * limitations under the License.
     */
    class HTMLImageElement extends HTMLElement {}
    registerSubclass('img', HTMLImageElement); // Reflected Properties
    // HTMLImageElement.alt => string, reflected attribute
    // HTMLImageElement.crossOrigin => string, reflected attribute
    // HTMLImageElement.height => number, reflected attribute
    // HTMLImageElement.isMap => boolean, reflected attribute
    // HTMLImageElement.referrerPolicy => string, reflected attribute
    // HTMLImageElement.src => string, reflected attribute
    // HTMLImageElement.sizes => string, reflected attribute
    // HTMLImageElement.srcset => string, reflected attribute
    // HTMLImageElement.useMap => string, reflected attribute
    // HTMLImageElement.width => number, reflected attribute

    reflectProperties([{
      alt: ['']
    }, {
      crossOrigin: ['']
    }, {
      height: [0]
    }, {
      isMap: [false]
    }, {
      referrerPolicy: ['']
    }, {
      src: ['']
    }, {
      sizes: ['']
    }, {
      srcset: ['']
    }, {
      useMap: ['']
    }, {
      width: [0]
    }], HTMLImageElement); // Unimplmented Properties
    // HTMLImageElement.complete Read only
    // Returns a Boolean that is true if the browser has finished fetching the image, whether successful or not. It also shows true, if the image has no src value.
    // HTMLImageElement.currentSrc Read only
    // Returns a DOMString representing the URL to the currently displayed image (which may change, for example in response to media queries).
    // HTMLImageElement.naturalHeight Read only
    // Returns a unsigned long representing the intrinsic height of the image in CSS pixels, if it is available; else, it shows 0.
    // HTMLImageElement.naturalWidth Read only
    // Returns a unsigned long representing the intrinsic width of the image in CSS pixels, if it is available; otherwise, it will show 0.

    /**
     * Copyright 2018 The AMP HTML Authors. All Rights Reserved.
     *
     * Licensed under the Apache License, Version 2.0 (the "License");
     * you may not use this file except in compliance with the License.
     * You may obtain a copy of the License at
     *
     *      http://www.apache.org/licenses/LICENSE-2.0
     *
     * Unless required by applicable law or agreed to in writing, software
     * distributed under the License is distributed on an "AS-IS" BASIS,
     * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
     * See the License for the specific language governing permissions and
     * limitations under the License.
     */
    /**
     * The HTMLInputLabels interface represents a collection of input getters for their related label Elements.
     * It is mixedin to both HTMLInputElement, HTMLMeterElement, and HTMLProgressElement.
     */

    const HTMLInputLabelsMixin = defineOn => {
      Object.defineProperty(defineOn.prototype, 'labels', {
        /**
         * Getter returning label elements associated to this meter.
         * @see https://developer.mozilla.org/en-US/docs/Web/API/HTMLProgressElement/labels
         * @return label elements associated to this meter.
         */
        get() {
          return matchChildrenElements(this.ownerDocument || this, element => element.tagName === 'LABEL' && element.for && element.for === this.id);
        }

      });
    };

    /**
     * Copyright 2018 The AMP HTML Authors. All Rights Reserved.
     *
     * Licensed under the Apache License, Version 2.0 (the "License");
     * you may not use this file except in compliance with the License.
     * You may obtain a copy of the License at
     *
     *      http://www.apache.org/licenses/LICENSE-2.0
     *
     * Unless required by applicable law or agreed to in writing, software
     * distributed under the License is distributed on an "AS-IS" BASIS,
     * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
     * See the License for the specific language governing permissions and
     * limitations under the License.
     */
    class HTMLInputElement extends HTMLElement {
      constructor(...args) {
        super(...args);
        this[21
        /* value */
        ] = '';
        this.dirtyValue = false;
        this[47
        /* checked */
        ] = false;
      }

      // TODO(willchou): There are a few interrelated issues with `value` property.
      //   1. "Dirtiness" caveat above.
      //   2. Duplicate SYNC events. Sent by every event fired from elements with a `value`, plus the default 'change' listener.
      //   3. Duplicate MUTATE events. Caused by stale `value` in worker due to no default 'input' listener (see below).
      get value() {
        return !this.dirtyValue ? this.getAttribute('value') || '' : this[21
        /* value */
        ];
      }

      set value(value) {
        // Don't early-out if value doesn't appear to have changed.
        // The worker may have a stale value since 'input' events aren't being forwarded.
        this[21
        /* value */
        ] = String(value);
        this.dirtyValue = true;
        transfer(this.ownerDocument, [3
        /* PROPERTIES */
        , this[7
        /* index */
        ], store$1('value'), 0
        /* FALSE */
        , store$1(value)]);
      }

      get valueAsDate() {
        // Don't use Date constructor or Date.parse() since ISO 8601 (yyyy-mm-dd) parsing is inconsistent.
        const date = this.stringToDate(this.value);
        const invalid = !date || isNaN(date.getTime());
        return invalid ? null : date;
      }
      /** Unlike browsers, does not throw if this input[type] doesn't support dates. */


      set valueAsDate(value) {
        if (!(value instanceof Date)) {
          throw new TypeError('The provided value is not a Date.');
        }

        this.value = this.dateToString(value);
      }

      get valueAsNumber() {
        if (this.value.length === 0) {
          return NaN;
        }

        return Number(this.value);
      }
      /** Unlike browsers, does not throw if this input[type] doesn't support numbers. */


      set valueAsNumber(value) {
        if (typeof value === 'number') {
          this.value = String(value);
        } else {
          this.value = '';
        }
      }

      get checked() {
        return this[47
        /* checked */
        ];
      }

      set checked(value) {
        if (this[47
        /* checked */
        ] === value) {
          return;
        }

        this[47
        /* checked */
        ] = !!value;
        transfer(this.ownerDocument, [3
        /* PROPERTIES */
        , this[7
        /* index */
        ], store$1('checked'), 1
        /* TRUE */
        , value === true ? 1
        /* TRUE */
        : 0
        /* FALSE */
        ]);
      }
      /**
       * Returns a date in 'yyyy-mm-dd' format.
       * @param date
       */


      dateToString(date) {
        const y = date.getFullYear();
        const m = date.getMonth() + 1; // getMonth() is 0-index.

        const d = date.getDate();
        return `${y}-${m > 9 ? '' : '0'}${m}-${d > 9 ? '' : '0'}${d}`;
      }
      /**
       * Returns a Date from a 'yyyy-mm-dd' format.
       * @param s
       */


      stringToDate(str) {
        const components = str.split('-');

        if (components.length !== 3) {
          return null;
        }

        const [y, m, d] = components; // Month is 0-index.

        return new Date(parseInt(y, 10), parseInt(m, 10) - 1, parseInt(d, 10));
      }

    }
    registerSubclass('input', HTMLInputElement);
    HTMLInputLabelsMixin(HTMLInputElement); // Reflected Properties
    // HTMLInputElement.formAction => string, reflected attribute
    // HTMLInputElement.formEncType	=> string, reflected attribute
    // HTMLInputElement.formMethod => string, reflected attribute
    // HTMLInputElement.formTarget => string, reflected attribute
    // HTMLInputElement.name => string, reflected attribute
    // HTMLInputElement.type => string, reflected attribute
    // HTMLInputElement.disabled => boolean, reflected attribute
    // HTMLInputElement.autofocus => boolean, reflected attribute
    // HTMLInputElement.required => boolean, reflected attribute
    // HTMLInputElement.defaultChecked => boolean, reflected attribute ("checked")
    // HTMLInputElement.alt => string, reflected attribute
    // HTMLInputElement.height => number, reflected attribute
    // HTMLInputElement.src => string, reflected attribute
    // HTMLInputElement.width => number, reflected attribute
    // HTMLInputElement.accept => string, reflected attribute
    // HTMLInputElement.autocomplete => string, reflected attribute
    // HTMLInputElement.maxLength => number, reflected attribute
    // HTMLInputElement.size => number, reflected attribute
    // HTMLInputElement.pattern => string, reflected attribute
    // HTMLInputElement.placeholder => string, reflected attribute
    // HTMLInputElement.readOnly => boolean, reflected attribute
    // HTMLInputElement.min => string, reflected attribute
    // HTMLInputElement.max => string, reflected attribute
    // HTMLInputElement.defaultValue => string, reflected attribute
    // HTMLInputElement.dirname => string, reflected attribute
    // HTMLInputElement.multiple => boolean, reflected attribute
    // HTMLInputElement.step => string, reflected attribute
    // HTMLInputElement.autocapitalize => string, reflected attribute

    reflectProperties([{
      accept: ['']
    }, {
      alt: ['']
    }, {
      autocapitalize: ['']
    }, {
      autocomplete: ['']
    }, {
      autofocus: [false]
    }, {
      defaultChecked: [false,
      /* attr */
      'checked']
    }, {
      defaultValue: ['',
      /* attr */
      'value']
    }, {
      dirName: ['']
    }, {
      disabled: [false]
    }, {
      formAction: ['']
    }, {
      formEncType: ['']
    }, {
      formMethod: ['']
    }, {
      formTarget: ['']
    }, {
      height: [0]
    }, {
      max: ['']
    }, {
      maxLength: [0]
    }, {
      min: ['']
    }, {
      multiple: [false]
    }, {
      name: ['']
    }, {
      pattern: ['']
    }, {
      placeholder: ['']
    }, {
      readOnly: [false]
    }, {
      required: [false]
    }, {
      size: [0]
    }, {
      src: ['']
    }, {
      step: ['']
    }, {
      type: ['text']
    }, {
      width: [0]
    }], HTMLInputElement); // TODO(KB) Not Reflected Properties
    // HTMLInputElement.indeterminate => boolean
    // Unimplemented Properties
    // HTMLInputElement.formNoValidate => string, reflected attribute
    // HTMLInputElement.validity => ValidityState, readonly
    // HTMLInputElement.validationMessage => string, readonly
    // HTMLInputElement.willValidate => boolean, readonly
    // HTMLInputElement.allowdirs => boolean
    // HTMLInputElement.files	=> Array<File>
    // HTMLInputElement.webkitdirectory	=> boolean, reflected attribute
    // HTMLInputElement.webkitEntries => Array<FileSystemEntry>
    // HTMLInputElement.selectionStart => number
    // HTMLInputElement.selectionEnd => number
    // HTMLInputElement.selectionDirection => string
    // HTMLInputElement.list => Element, read only (element pointed by list attribute)
    // Unimplemented Methods
    // HTMLInputElement.setSelectionRange()
    // HTMLInputElement.setRangeText()
    // HTMLInputElement.setCustomValidity()
    // HTMLInputElement.checkValidity()
    // HTMLInputElement.stepDown()
    // HTMLInputElement.stepUp()

    /**
     * Copyright 2018 The AMP HTML Authors. All Rights Reserved.
     *
     * Licensed under the Apache License, Version 2.0 (the "License");
     * you may not use this file except in compliance with the License.
     * You may obtain a copy of the License at
     *
     *      http://www.apache.org/licenses/LICENSE-2.0
     *
     * Unless required by applicable law or agreed to in writing, software
     * distributed under the License is distributed on an "AS-IS" BASIS,
     * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
     * See the License for the specific language governing permissions and
     * limitations under the License.
     */
    class HTMLLabelElement extends HTMLElement {
      /**
       * @see https://developer.mozilla.org/en-US/docs/Web/API/HTMLLabelElement/control
       * @return input element
       */
      get control() {
        const htmlFor = this.getAttribute('for');

        if (htmlFor !== null) {
          return this.ownerDocument && this.ownerDocument.getElementById(htmlFor);
        }

        return matchChildElement(this, tagNameConditionPredicate(['INPUT']));
      }

    }
    registerSubclass('label', HTMLLabelElement); // Reflected Properties
    // HTMLLabelElement.htmlFor => string, reflected attribute 'for'

    reflectProperties([{
      htmlFor: ['', 'for']
    }], HTMLLabelElement);

    /**
     * Copyright 2018 The AMP HTML Authors. All Rights Reserved.
     *
     * Licensed under the Apache License, Version 2.0 (the "License");
     * you may not use this file except in compliance with the License.
     * You may obtain a copy of the License at
     *
     *      http://www.apache.org/licenses/LICENSE-2.0
     *
     * Unless required by applicable law or agreed to in writing, software
     * distributed under the License is distributed on an "AS-IS" BASIS,
     * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
     * See the License for the specific language governing permissions and
     * limitations under the License.
     */
    class HTMLLinkElement extends HTMLElement {
      constructor(...args) {
        super(...args);
        this._relList = void 0;
      }

      get relList() {
        return this._relList || (this._relList = new DOMTokenList(this, 'rel'));
      }

    }
    registerSubclass('link', HTMLLinkElement);
    definePropertyBackedAttributes(HTMLLinkElement, {
      rel: [el => el.relList.value, (el, value) => el.relList.value = value]
    });
    synchronizedAccessor(HTMLLinkElement, 'relList', 'rel'); // Reflected Properties
    // HTMLLinkElement.as => string, reflected attribute
    // HTMLLinkElement.crossOrigin => string, reflected attribute
    // HTMLLinkElement.disabled => boolean, reflected attribute
    // HTMLLinkElement.href => string, reflected attribute
    // HTMLLinkElement.hreflang => string, reflected attribute
    // HTMLLinkElement.media => string, reflected attribute
    // HTMLLinkElement.referrerPolicy => string, reflected attribute
    // HTMLLinkElement.sizes => string, reflected attribute
    // HTMLLinkElement.type => string, reflected attribute

    reflectProperties([{
      as: ['']
    }, {
      crossOrigin: ['']
    }, {
      disabled: [false]
    }, {
      href: ['']
    }, {
      hreflang: ['']
    }, {
      media: ['']
    }, {
      referrerPolicy: ['']
    }, {
      sizes: ['']
    }, {
      type: ['']
    }], HTMLLinkElement); // Unimplemented Properties
    // LinkStyle.sheet Read only
    // Returns the StyleSheet object associated with the given element, or null if there is none.

    /**
     * Copyright 2018 The AMP HTML Authors. All Rights Reserved.
     *
     * Licensed under the Apache License, Version 2.0 (the "License");
     * you may not use this file except in compliance with the License.
     * You may obtain a copy of the License at
     *
     *      http://www.apache.org/licenses/LICENSE-2.0
     *
     * Unless required by applicable law or agreed to in writing, software
     * distributed under the License is distributed on an "AS-IS" BASIS,
     * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
     * See the License for the specific language governing permissions and
     * limitations under the License.
     */
    class HTMLMapElement extends HTMLElement {
      /**
       * Getter returning area elements associated to this map.
       * @see https://developer.mozilla.org/en-US/docs/Web/API/HTMLMapElement
       * @return area elements associated to this map.
       */
      get areas() {
        return matchChildrenElements(this, element => element.tagName === 'AREA');
      }

    }
    registerSubclass('map', HTMLMapElement); // Reflected Properties
    // HTMLMapElement.name => string, reflected attribute

    reflectProperties([{
      name: ['']
    }], HTMLMapElement);

    /**
     * Copyright 2018 The AMP HTML Authors. All Rights Reserved.
     *
     * Licensed under the Apache License, Version 2.0 (the "License");
     * you may not use this file except in compliance with the License.
     * You may obtain a copy of the License at
     *
     *      http://www.apache.org/licenses/LICENSE-2.0
     *
     * Unless required by applicable law or agreed to in writing, software
     * distributed under the License is distributed on an "AS-IS" BASIS,
     * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
     * See the License for the specific language governing permissions and
     * limitations under the License.
     */
    class HTMLMeterElement extends HTMLElement {}
    registerSubclass('meter', HTMLMeterElement);
    HTMLInputLabelsMixin(HTMLMeterElement); // Reflected Properties
    // HTMLMeterElement.high => number, reflected attribute
    // HTMLMeterElement.low => number, reflected attribute
    // HTMLMeterElement.max => number, reflected attribute
    // HTMLMeterElement.min => number, reflected attribute
    // HTMLMeterElement.optimum => number, reflected attribute
    // HTMLMeterElement.value => number, reflected attribute

    reflectProperties([{
      high: [0]
    }, {
      low: [0]
    }, {
      max: [1]
    }, {
      min: [0]
    }, {
      optimum: [0]
    }, {
      value: [0]
    }], HTMLMeterElement);

    /**
     * Copyright 2018 The AMP HTML Authors. All Rights Reserved.
     *
     * Licensed under the Apache License, Version 2.0 (the "License");
     * you may not use this file except in compliance with the License.
     * You may obtain a copy of the License at
     *
     *      http://www.apache.org/licenses/LICENSE-2.0
     *
     * Unless required by applicable law or agreed to in writing, software
     * distributed under the License is distributed on an "AS-IS" BASIS,
     * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
     * See the License for the specific language governing permissions and
     * limitations under the License.
     */
    class HTMLModElement extends HTMLElement {}
    registerSubclass('del', HTMLModElement);
    registerSubclass('ins', HTMLModElement); // Reflected Properties
    // HTMLModElement.cite => string, reflected attribute
    // HTMLModElement.datetime => string, reflected attribute

    reflectProperties([{
      cite: ['']
    }, {
      datetime: ['']
    }], HTMLModElement);

    /**
     * Copyright 2018 The AMP HTML Authors. All Rights Reserved.
     *
     * Licensed under the Apache License, Version 2.0 (the "License");
     * you may not use this file except in compliance with the License.
     * You may obtain a copy of the License at
     *
     *      http://www.apache.org/licenses/LICENSE-2.0
     *
     * Unless required by applicable law or agreed to in writing, software
     * distributed under the License is distributed on an "AS-IS" BASIS,
     * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
     * See the License for the specific language governing permissions and
     * limitations under the License.
     */
    class HTMLOListElement extends HTMLElement {}
    registerSubclass('ol', HTMLOListElement); // Reflected Properties
    // HTMLModElement.reversed => boolean, reflected attribute
    // HTMLModElement.start => number, reflected attribute
    // HTMLOListElement.type => string, reflected attribute

    reflectProperties([{
      reversed: [false]
    }, {
      start: [1]
    }, {
      type: ['']
    }], HTMLOListElement);

    /**
     * Copyright 2018 The AMP HTML Authors. All Rights Reserved.
     *
     * Licensed under the Apache License, Version 2.0 (the "License");
     * you may not use this file except in compliance with the License.
     * You may obtain a copy of the License at
     *
     *      http://www.apache.org/licenses/LICENSE-2.0
     *
     * Unless required by applicable law or agreed to in writing, software
     * distributed under the License is distributed on an "AS-IS" BASIS,
     * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
     * See the License for the specific language governing permissions and
     * limitations under the License.
     */
    class HTMLOptionElement extends HTMLElement {
      constructor(...args) {
        super(...args);
        this[52
        /* selected */
        ] = false;
      }

      /**
       * @see https://developer.mozilla.org/en-US/docs/Web/API/HTMLOptionElement
       * @return position of the option within the list of options it's within, or zero if there is no valid parent.
       */
      get index() {
        return this.parentNode && this.parentNode.children.indexOf(this) || 0;
      }
      /**
       * @see https://developer.mozilla.org/en-US/docs/Web/API/HTMLOptionElement
       * @return label attribute value or text content if there is no attribute.
       */


      get label() {
        return this.getAttribute('label') || this.textContent;
      }
      /**
       * @see https://developer.mozilla.org/en-US/docs/Web/API/HTMLOptionElement
       * @param label new label value to store as an attribute.
       */


      set label(label) {
        this.setAttribute('label', label);
      }
      /**
       * @see https://developer.mozilla.org/en-US/docs/Web/API/HTMLOptionElement
       * @return boolean based on if the option element is selected.
       */


      get selected() {
        return this[52
        /* selected */
        ];
      }
      /**
       * @see https://developer.mozilla.org/en-US/docs/Web/API/HTMLOptionElement
       * @param value new selected boolean value.
       */


      set selected(value) {
        this[52
        /* selected */
        ] = !!value;
        transfer(this.ownerDocument, [3
        /* PROPERTIES */
        , this[7
        /* index */
        ], store$1('selected'), 1
        /* TRUE */
        , this[52
        /* selected */
        ] ? 1
        /* TRUE */
        : 0
        /* FALSE */
        ]);
      }
      /**
       * A Synonym for the Node.textContent property getter.
       * @see https://developer.mozilla.org/en-US/docs/Web/API/HTMLOptionElement
       * @return value of text node direct child of this Element.
       */


      get text() {
        return this.textContent;
      }
      /**
       * @see https://developer.mozilla.org/en-US/docs/Web/API/HTMLOptionElement
       * @param text new text content to store for this Element.
       */


      set text(text) {
        this.textContent = text;
      }
      /**
       * @see https://developer.mozilla.org/en-US/docs/Web/API/HTMLOptionElement
       * @return value attribute value or text content if there is no attribute.
       */


      get value() {
        return this.getAttribute('value') || this.textContent;
      }
      /**
       * @see https://developer.mozilla.org/en-US/docs/Web/API/HTMLOptionElement
       * @param value new value for an option element.
       */


      set value(value) {
        this.setAttribute('value', value);
      }

    }
    registerSubclass('option', HTMLOptionElement);
    definePropertyBackedAttributes(HTMLOptionElement, {
      selected: [el => String(el[52
      /* selected */
      ]), (el, value) => el.selected = value === 'true']
    }); // Reflected Properties
    // HTMLOptionElement.defaultSelected => boolean, reflected attribute
    // HTMLOptionElement.disabled => boolean, reflected attribute
    // HTMLOptionElement.type => string, reflected attribute

    reflectProperties([{
      defaultSelected: [false,
      /* attr */
      'selected']
    }, {
      disabled: [false]
    }, {
      type: ['']
    }], HTMLOptionElement); // Implemented at HTMLElement
    // HTMLOptionElement.form, Read only	=> HTMLFormElement

    /**
     * Copyright 2018 The AMP HTML Authors. All Rights Reserved.
     *
     * Licensed under the Apache License, Version 2.0 (the "License");
     * you may not use this file except in compliance with the License.
     * You may obtain a copy of the License at
     *
     *      http://www.apache.org/licenses/LICENSE-2.0
     *
     * Unless required by applicable law or agreed to in writing, software
     * distributed under the License is distributed on an "AS-IS" BASIS,
     * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
     * See the License for the specific language governing permissions and
     * limitations under the License.
     */
    class HTMLProgressElement extends HTMLElement {
      constructor(...args) {
        super(...args);
        this[48
        /* indeterminate */
        ] = true;
        this[21
        /* value */
        ] = 0;
        this.dirtyValue = false;
      }

      get position() {
        return this[48
        /* indeterminate */
        ] ? -1 : this.value / this.max;
      }

      get value() {
        return !this.dirtyValue ? Number(this.getAttribute('value')) || 0 : this[21
        /* value */
        ];
      }

      set value(value) {
        this[48
        /* indeterminate */
        ] = false;
        this[21
        /* value */
        ] = value;
        this.dirtyValue = true; // TODO(KB) This is a property mutation needing tracked.
      }

    }
    registerSubclass('progress', HTMLProgressElement);
    HTMLInputLabelsMixin(HTMLProgressElement); // Reflected Properties
    // HTMLModElement.max => number, reflected attribute

    reflectProperties([{
      max: [1]
    }], HTMLProgressElement);

    /**
     * Copyright 2018 The AMP HTML Authors. All Rights Reserved.
     *
     * Licensed under the Apache License, Version 2.0 (the "License");
     * you may not use this file except in compliance with the License.
     * You may obtain a copy of the License at
     *
     *      http://www.apache.org/licenses/LICENSE-2.0
     *
     * Unless required by applicable law or agreed to in writing, software
     * distributed under the License is distributed on an "AS-IS" BASIS,
     * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
     * See the License for the specific language governing permissions and
     * limitations under the License.
     */
    class HTMLQuoteElement extends HTMLElement {}
    registerSubclass('blockquote', HTMLQuoteElement);
    registerSubclass('q', HTMLQuoteElement); // Reflected Properties
    // HTMLModElement.cite => string, reflected attribute

    reflectProperties([{
      cite: ['']
    }], HTMLQuoteElement);

    /**
     * Copyright 2018 The AMP HTML Authors. All Rights Reserved.
     *
     * Licensed under the Apache License, Version 2.0 (the "License");
     * you may not use this file except in compliance with the License.
     * You may obtain a copy of the License at
     *
     *      http://www.apache.org/licenses/LICENSE-2.0
     *
     * Unless required by applicable law or agreed to in writing, software
     * distributed under the License is distributed on an "AS-IS" BASIS,
     * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
     * See the License for the specific language governing permissions and
     * limitations under the License.
     */
    class HTMLScriptElement extends HTMLElement {
      /**
       * A Synonym for the Node.textContent property getter.
       * @see https://developer.mozilla.org/en-US/docs/Web/API/HTMLScriptElement
       * @return value of text node direct child of this Element.
       */
      get text() {
        return this.textContent;
      }
      /**
       * @see https://developer.mozilla.org/en-US/docs/Web/API/HTMLScriptElement
       * @param text new text content to store for this Element.
       */


      set text(text) {
        this.textContent = text;
      }

    }
    registerSubclass('script', HTMLScriptElement); // Reflected Properties
    // HTMLScriptElement.type => string, reflected attribute
    // HTMLScriptElement.src => string, reflected attribute
    // HTMLScriptElement.charset => string, reflected attribute
    // HTMLScriptElement.async => boolean, reflected attribute
    // HTMLScriptElement.defer => boolean, reflected attribute
    // HTMLScriptElement.crossOrigin => string, reflected attribute
    // HTMLScriptElement.noModule => boolean, reflected attribute

    reflectProperties([{
      type: ['']
    }, {
      src: ['']
    }, {
      charset: ['']
    }, {
      async: [false]
    }, {
      defer: [false]
    }, {
      crossOrigin: ['']
    }, {
      noModule: [false]
    }], HTMLScriptElement);

    /**
     * Copyright 2018 The AMP HTML Authors. All Rights Reserved.
     *
     * Licensed under the Apache License, Version 2.0 (the "License");
     * you may not use this file except in compliance with the License.
     * You may obtain a copy of the License at
     *
     *      http://www.apache.org/licenses/LICENSE-2.0
     *
     * Unless required by applicable law or agreed to in writing, software
     * distributed under the License is distributed on an "AS-IS" BASIS,
     * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
     * See the License for the specific language governing permissions and
     * limitations under the License.
     */
    const isOptionPredicate = tagNameConditionPredicate(['OPTION']);

    const isSelectedOptionPredicate = element => isOptionPredicate(element) && element.selected === true;

    class HTMLSelectElement extends HTMLElement {
      constructor(...args) {
        super(...args);
        this[49
        /* size */
        ] = -1
        /* UNMODIFIED */
        ;
      }

      /**
       * Extend functionality after child insertion to make sure the correct option is selected.
       * @param child
       */
      [56
      /* insertedNode */
      ](child) {
        super[56
        /* insertedNode */
        ](child); // When this singular value select is appending a child, set the value property for two cases.
        // 1. The inserted child is already selected.
        // 2. The current value of the select is the default ('').

        if (!this.multiple && isOptionPredicate(child) && child.selected || this.value === '') {
          this.value = child.value;
        }
      }
      /**
       * Extend functionality after child insertion to make sure the correct option is selected.
       * @param child
       */


      [57
      /* removedNode */
      ](child) {
        super[57
        /* removedNode */
        ](child); // When this singular value select is removing a selected child
        // ... set the value property to the first valid option.

        if (!this.multiple && child.selected) {
          const options = this.options;

          if (options.length > 0) {
            this.value = options[0].value;
          }
        }
      }
      /**
       * @see https://developer.mozilla.org/en-US/docs/Web/API/HTMLSelectElement/length
       * @return number of controls in the form
       */


      get length() {
        return this.options.length;
      }
      /**
       * Getter returning option elements that are direct children of a HTMLSelectElement
       * @see https://developer.mozilla.org/en-US/docs/Web/API/HTMLSelectElement
       * @return Element "options" objects that are direct children.
       */


      get options() {
        return this.children.filter(isOptionPredicate);
      }
      /**
       * Getter returning the index of the first selected <option> element.
       * @see https://developer.mozilla.org/en-US/docs/Web/API/HTMLSelectElement/selectedIndex
       * @return the index of the first selected option element, or -1 if no element is selected.
       */


      get selectedIndex() {
        const firstSelectedChild = matchChildElement(this, isSelectedOptionPredicate);
        return firstSelectedChild ? this.children.indexOf(firstSelectedChild) : -1;
      }
      /**
       * Setter making the <option> element at the passed index selected.
       * @see https://developer.mozilla.org/en-US/docs/Web/API/HTMLSelectElement/selectedIndex
       * @param selectedIndex index number to make selected.
       */


      set selectedIndex(selectedIndex) {
        this.children.forEach((element, index) => element.selected = index === selectedIndex);
      }
      /**
       * Getter returning the <option> elements selected.
       * @see https://developer.mozilla.org/en-US/docs/Web/API/HTMLSelectElement/selectedOptions
       * @return array of Elements currently selected.
       */


      get selectedOptions() {
        return matchChildrenElements(this, isSelectedOptionPredicate);
      }
      /**
       * Getter returning the size of the select element (by default 1 for single and 4 for multiple)
       * @see https://developer.mozilla.org/en-US/docs/Web/API/HTMLSelectElement
       * @return size of the select element.
       */


      get size() {
        return this[49
        /* size */
        ] === -1
        /* UNMODIFIED */
        ? this.multiple ? 4
        /* MULTIPLE */
        : 1
        /* SINGLE */
        : this[49
        /* size */
        ];
      }
      /**
       * Override the size of this element (each positive unit is the height of a single option)
       * @see https://developer.mozilla.org/en-US/docs/Web/API/HTMLSelectElement
       * @param size number to set the size to.
       */


      set size(size) {
        this[49
        /* size */
        ] = size > 0 ? size : this.multiple ? 4
        /* MULTIPLE */
        : 1
        /* SINGLE */
        ;
      }
      /**
       * @see https://developer.mozilla.org/en-US/docs/Web/API/HTMLSelectElement
       * @return string representing the select element type.
       */


      get type() {
        return this.multiple ? "select-one"
        /* MULTIPLE */
        : "select-multiple"
        /* SINGLE */
        ;
      }
      /**
       * @see https://developer.mozilla.org/en-US/docs/Web/API/HTMLSelectElement
       * @return the value of the first selected option
       */


      get value() {
        const firstSelectedChild = matchChildElement(this, isSelectedOptionPredicate);
        return firstSelectedChild ? firstSelectedChild.value : '';
      }
      /**
       * @see https://developer.mozilla.org/en-US/docs/Web/API/HTMLSelectElement
       * @set value
       */


      set value(value) {
        const stringValue = String(value);
        this.children.forEach(element => isOptionPredicate(element) && (element.selected = element.value === stringValue));
      }

    }
    registerSubclass('select', HTMLSelectElement);
    HTMLInputLabelsMixin(HTMLSelectElement); // Reflected Properties
    // HTMLSelectElement.multiple => boolean, reflected attribute
    // HTMLSelectElement.name => string, reflected attribute
    // HTMLSelectElement.required => boolean, reflected attribute

    reflectProperties([{
      multiple: [false]
    }, {
      name: ['']
    }, {
      required: [false]
    }], HTMLSelectElement); // Implemented on HTMLElement
    // HTMLSelectElement.form => HTMLFormElement, readonly
    // Unimplemented Properties
    // HTMLSelectElement.validation => string
    // HTMLSelectElement.validity => ValidityState
    // HTMLSelectElement.willValidate => boolean

    /**
     * Copyright 2018 The AMP HTML Authors. All Rights Reserved.
     *
     * Licensed under the Apache License, Version 2.0 (the "License");
     * you may not use this file except in compliance with the License.
     * You may obtain a copy of the License at
     *
     *      http://www.apache.org/licenses/LICENSE-2.0
     *
     * Unless required by applicable law or agreed to in writing, software
     * distributed under the License is distributed on an "AS-IS" BASIS,
     * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
     * See the License for the specific language governing permissions and
     * limitations under the License.
     */
    class HTMLSourceElement extends HTMLElement {}
    registerSubclass('source', HTMLSourceElement); // Reflected Properties
    // HTMLSourceElement.media => string, reflected attribute
    // HTMLSourceElement.sizes => string, reflected attribute
    // HTMLSourceElement.src => string, reflected attribute
    // HTMLSourceElement.srcset => string, reflected attribute
    // HTMLSourceElement.type => string, reflected attribute

    reflectProperties([{
      media: ['']
    }, {
      sizes: ['']
    }, {
      src: ['']
    }, {
      srcset: ['']
    }, {
      type: ['']
    }], HTMLSourceElement); // Unimplemented Properties
    // HTMLSourceElement.keySystem => string

    /**
     * Copyright 2018 The AMP HTML Authors. All Rights Reserved.
     *
     * Licensed under the Apache License, Version 2.0 (the "License");
     * you may not use this file except in compliance with the License.
     * You may obtain a copy of the License at
     *
     *      http://www.apache.org/licenses/LICENSE-2.0
     *
     * Unless required by applicable law or agreed to in writing, software
     * distributed under the License is distributed on an "AS-IS" BASIS,
     * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
     * See the License for the specific language governing permissions and
     * limitations under the License.
     */
    class HTMLStyleElement extends HTMLElement {}
    registerSubclass('style', HTMLStyleElement); // Reflected Properties
    // HTMLStyleElement.media => string, reflected attribute
    // HTMLStyleElement.type => string, reflected attribute

    reflectProperties([{
      media: ['']
    }, {
      type: ['']
    }], HTMLStyleElement); // Unimplemented Properties
    // HTMLStyleElement.disabled => boolean
    // HTMLStyleElement.scoped => boolean, reflected attribute
    // HTMLStyleElement.sheet => StyleSheet, read only

    /**
     * Copyright 2018 The AMP HTML Authors. All Rights Reserved.
     *
     * Licensed under the Apache License, Version 2.0 (the "License");
     * you may not use this file except in compliance with the License.
     * You may obtain a copy of the License at
     *
     *      http://www.apache.org/licenses/LICENSE-2.0
     *
     * Unless required by applicable law or agreed to in writing, software
     * distributed under the License is distributed on an "AS-IS" BASIS,
     * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
     * See the License for the specific language governing permissions and
     * limitations under the License.
     */
    class HTMLTableCellElement extends HTMLElement {
      constructor(...args) {
        super(...args);
        this._headers = void 0;
      }

      get headers() {
        return this._headers || (this._headers = new DOMTokenList(this, 'headers'));
      }
      /**
       * @see https://developer.mozilla.org/en-US/docs/Web/API/HTMLTableCellElement
       * @return position of the cell within the parent tr, if not nested in a tr the value is -1.
       */


      get cellIndex() {
        const parent = matchNearestParent(this, tagNameConditionPredicate(['TR']));
        return parent !== null ? matchChildrenElements(parent, tagNameConditionPredicate(['TH', 'TD'])).indexOf(this) : -1;
      }

    }
    registerSubclass('th', HTMLTableCellElement);
    registerSubclass('td', HTMLTableCellElement);
    definePropertyBackedAttributes(HTMLTableCellElement, {
      headers: [el => el.headers.value, (el, value) => el.headers.value = value]
    }); // Reflected Properties
    // HTMLTableCellElement.abbr => string, reflected attribute
    // HTMLTableCellElement.colSpan => number, reflected attribute
    // HTMLTableCellElement.rowSpan => number, reflected attribute
    // HTMLTableCellElement.scope => string, reflected attribute

    reflectProperties([{
      abbr: ['']
    }, {
      colSpan: [1]
    }, {
      rowSpan: [1]
    }, {
      scope: ['']
    }], HTMLTableCellElement);

    /**
     * Copyright 2018 The AMP HTML Authors. All Rights Reserved.
     *
     * Licensed under the Apache License, Version 2.0 (the "License");
     * you may not use this file except in compliance with the License.
     * You may obtain a copy of the License at
     *
     *      http://www.apache.org/licenses/LICENSE-2.0
     *
     * Unless required by applicable law or agreed to in writing, software
     * distributed under the License is distributed on an "AS-IS" BASIS,
     * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
     * See the License for the specific language governing permissions and
     * limitations under the License.
     */
    class HTMLTableColElement extends HTMLElement {}
    registerSubclass('col', HTMLTableColElement); // Reflected Properties
    // HTMLTableColElement.span => number, reflected attribute

    reflectProperties([{
      span: [1]
    }], HTMLTableColElement);

    /**
     * Copyright 2018 The AMP HTML Authors. All Rights Reserved.
     *
     * Licensed under the Apache License, Version 2.0 (the "License");
     * you may not use this file except in compliance with the License.
     * You may obtain a copy of the License at
     *
     *      http://www.apache.org/licenses/LICENSE-2.0
     *
     * Unless required by applicable law or agreed to in writing, software
     * distributed under the License is distributed on an "AS-IS" BASIS,
     * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
     * See the License for the specific language governing permissions and
     * limitations under the License.
     */

    const removeElement = element => element && element.remove();

    const insertBeforeElementsWithTagName = (parent, element, tagNames) => {
      const insertBeforeElement = matchChildElement(parent, element => !tagNames.includes(element.tagName));

      if (insertBeforeElement) {
        parent.insertBefore(element, insertBeforeElement);
      } else {
        parent.appendChild(element);
      }
    };

    class HTMLTableElement extends HTMLElement {
      /**
       * @see https://developer.mozilla.org/en-US/docs/Web/API/HTMLTableElement/caption
       * @return first matching caption Element or null if none exists.
       */
      get caption() {
        return matchChildElement(this, tagNameConditionPredicate(['CAPTION']));
      }
      /**
       * @see https://developer.mozilla.org/en-US/docs/Web/API/HTMLTableElement/caption
       * @param element new caption element to replace the existing, or become the first element child.
       */


      set caption(newElement) {
        if (newElement && newElement.tagName === 'CAPTION') {
          // If a correct object is given,
          // it is inserted in the tree as the first child of this element and the first <caption>
          // that is a child of this element is removed from the tree, if any.
          removeElement(this.caption);
          this.insertBefore(newElement, this.firstElementChild);
        }
      }
      /**
       * @see https://developer.mozilla.org/en-US/docs/Web/API/HTMLTableElement/tHead
       * @return first matching thead Element or null if none exists.
       */


      get tHead() {
        return matchChildElement(this, tagNameConditionPredicate(['THEAD']));
      }
      /**
       * @see https://developer.mozilla.org/en-US/docs/Web/API/HTMLTableElement/tHead
       * @param newElement new thead element to insert in this table.
       */


      set tHead(newElement) {
        if (newElement && newElement.tagName === 'THEAD') {
          // If a correct object is given,
          // it is inserted in the tree immediately before the first element that is
          // neither a <caption>, nor a <colgroup>, or as the last child if there is no such element.
          // Additionally, the first <thead> that is a child of this element is removed from the tree, if any.
          removeElement(this.tHead);
          insertBeforeElementsWithTagName(this, newElement, ['CAPTION', 'COLGROUP']);
        }
      }
      /**
       * @see https://developer.mozilla.org/en-US/docs/Web/API/HTMLTableElement/tHead
       * @return first matching thead Element or null if none exists.
       */


      get tFoot() {
        return matchChildElement(this, tagNameConditionPredicate(['TFOOT']));
      }
      /**
       * @see https://developer.mozilla.org/en-US/docs/Web/API/HTMLTableElement/tHead
       * @param newElement new tfoot element to insert in this table.
       */


      set tFoot(newElement) {
        if (newElement && newElement.tagName === 'TFOOT') {
          // If a correct object is given,
          // it is inserted in the tree immediately before the first element that is neither a <caption>,
          // a <colgroup>, nor a <thead>, or as the last child if there is no such element, and the first <tfoot> that is a child of
          // this element is removed from the tree, if any.
          removeElement(this.tFoot);
          insertBeforeElementsWithTagName(this, newElement, ['CAPTION', 'COLGROUP', 'THEAD']);
        }
      }
      /**
       * @see https://developer.mozilla.org/en-US/docs/Web/API/HTMLTableElement
       * @return array of 'tr' tagname elements
       */


      get rows() {
        return matchChildrenElements(this, tagNameConditionPredicate(['TR']));
      }
      /**
       * @see https://developer.mozilla.org/en-US/docs/Web/API/HTMLTableElement
       * @return array of 'tbody' tagname elements
       */


      get tBodies() {
        return matchChildrenElements(this, tagNameConditionPredicate(['TBODY']));
      }

    }
    registerSubclass('table', HTMLTableElement); // Unimplemented Properties
    // HTMLTableElement.sortable => boolean
    // Unimplemented Methods
    // HTMLTableElement.createTHead()
    // HTMLTableElement.deleteTHead()
    // HTMLTableElement.createTFoot()
    // HTMLTableElement.deleteTFoot()
    // HTMLTableElement.createCaption()
    // HTMLTableElement.deleteCaption()
    // HTMLTableElement.insertRow()
    // HTMLTableElement.deleteRow()

    /**
     * Copyright 2018 The AMP HTML Authors. All Rights Reserved.
     *
     * Licensed under the Apache License, Version 2.0 (the "License");
     * you may not use this file except in compliance with the License.
     * You may obtain a copy of the License at
     *
     *      http://www.apache.org/licenses/LICENSE-2.0
     *
     * Unless required by applicable law or agreed to in writing, software
     * distributed under the License is distributed on an "AS-IS" BASIS,
     * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
     * See the License for the specific language governing permissions and
     * limitations under the License.
     */
    const TABLE_SECTION_TAGNAMES = 'TABLE TBODY THEAD TFOOT'.split(' ');

    const indexInAncestor = (element, isValidAncestor) => {
      const parent = matchNearestParent(element, isValidAncestor); // TODO(KB): This is either a HTMLTableElement or HTMLTableSectionElement.

      return parent === null ? -1 : parent.rows.indexOf(element);
    };

    class HTMLTableRowElement extends HTMLElement {
      /**
       * @see https://developer.mozilla.org/en-US/docs/Web/API/HTMLTableRowElement
       * @return td and th elements that are children of this row.
       */
      get cells() {
        return matchChildrenElements(this, tagNameConditionPredicate(['TD', 'TH']));
      }
      /**
       * @see https://developer.mozilla.org/en-US/docs/Web/API/HTMLTableRowElement
       * @return position of the row within a table, if not nested within in a table the value is -1.
       */


      get rowIndex() {
        return indexInAncestor(this, tagNameConditionPredicate(['TABLE']));
      }
      /**
       * @see https://developer.mozilla.org/en-US/docs/Web/API/HTMLTableRowElement
       * @return position of the row within a parent section, if not nested directly in a section the value is -1.
       */


      get sectionRowIndex() {
        return indexInAncestor(this, tagNameConditionPredicate(TABLE_SECTION_TAGNAMES));
      }
      /**
       * Removes the cell in provided position of this row.
       * @see https://developer.mozilla.org/en-US/docs/Web/API/HTMLTableRowElement
       * @param index position of the cell in the row to remove.
       */


      deleteCell(index) {
        const cell = this.cells[index];

        if (cell) {
          cell.remove();
        }
      }
      /**
       * Insert a new cell ('td') in the row at a specified position.
       * @param index position in the children to insert before.
       * @return newly inserted td element.
       */


      insertCell(index) {
        const cells = this.cells;
        const td = this.ownerDocument.createElement('td');

        if (index < 0 || index >= cells.length) {
          this.appendChild(td);
        } else {
          this.insertBefore(td, this.children[index]);
        }

        return td;
      }

    }
    registerSubclass('tr', HTMLTableRowElement);

    /**
     * Copyright 2018 The AMP HTML Authors. All Rights Reserved.
     *
     * Licensed under the Apache License, Version 2.0 (the "License");
     * you may not use this file except in compliance with the License.
     * You may obtain a copy of the License at
     *
     *      http://www.apache.org/licenses/LICENSE-2.0
     *
     * Unless required by applicable law or agreed to in writing, software
     * distributed under the License is distributed on an "AS-IS" BASIS,
     * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
     * See the License for the specific language governing permissions and
     * limitations under the License.
     */
    class HTMLTableSectionElement extends HTMLElement {
      /**
       * @see https://developer.mozilla.org/en-US/docs/Web/API/HTMLTableSectionElement
       * @return All rows (tr elements) within the table section.
       */
      get rows() {
        return matchChildrenElements(this, tagNameConditionPredicate(['TR']));
      }
      /**
       * Remove a node in a specified position from the section.
       * @see https://developer.mozilla.org/en-US/docs/Web/API/HTMLTableSectionElement
       * @param index position in the section to remove the node of.
       */


      deleteRow(index) {
        const rows = this.rows;

        if (index >= 0 || index <= rows.length) {
          rows[index].remove();
        }
      }
      /**
       * Insert a new row ('tr') in the row at a specified position.
       * @see https://developer.mozilla.org/en-US/docs/Web/API/HTMLTableSectionElement
       * @param index position in the children to insert before.
       * @return newly inserted tr element.
       */


      insertRow(index) {
        const rows = this.rows;
        const tr = this.ownerDocument.createElement('tr');

        if (index < 0 || index >= rows.length) {
          this.appendChild(tr);
        } else {
          this.insertBefore(tr, this.children[index]);
        }

        return tr;
      }

    }
    registerSubclass('thead', HTMLTableSectionElement);
    registerSubclass('tfoot', HTMLTableSectionElement);
    registerSubclass('tbody', HTMLTableSectionElement);

    // <blockquote> and <q>
    class HTMLTimeElement extends HTMLElement {}
    registerSubclass('time', HTMLTimeElement); // Reflected Properties
    // HTMLTimeElement.dateTime => string, reflected attribute

    reflectProperties([{
      dateTime: ['']
    }], HTMLTimeElement);

    /**
     * Copyright 2018 The AMP HTML Authors. All Rights Reserved.
     *
     * Licensed under the Apache License, Version 2.0 (the "License");
     * you may not use this file except in compliance with the License.
     * You may obtain a copy of the License at
     *
     *      http://www.apache.org/licenses/LICENSE-2.0
     *
     * Unless required by applicable law or agreed to in writing, software
     * distributed under the License is distributed on an "AS-IS" BASIS,
     * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
     * See the License for the specific language governing permissions and
     * limitations under the License.
     */

    class Text extends CharacterData {
      constructor(data, ownerDocument, overrideIndex) {
        super(data, 3
        /* TEXT_NODE */
        , '#text', ownerDocument, overrideIndex);
      } // Unimplemented Properties
      // Text.isElementContentWhitespace – https://developer.mozilla.org/en-US/docs/Web/API/Text/isElementContentWhitespace
      // Text.wholeText – https://developer.mozilla.org/en-US/docs/Web/API/Text/wholeText
      // Text.assignedSlot – https://developer.mozilla.org/en-US/docs/Web/API/Text/assignedSlot

      /**
       * textContent getter, retrieves underlying CharacterData data.
       * This is a different implmentation than DOMv1-4 APIs, but should be transparent to Frameworks.
       */


      get textContent() {
        return this.data;
      }
      /**
       * textContent setter, mutates underlying CharacterData data.
       * This is a different implmentation than DOMv1-4 APIs, but should be transparent to Frameworks.
       * @param value new value
       */


      set textContent(value) {
        // Mutation Observation is performed by CharacterData.
        this.nodeValue = value;
      }
      /**
       * @see https://developer.mozilla.org/en-US/docs/Web/API/Node/cloneNode
       * @return new Text Node with the same data as the Text to clone.
       */


      cloneNode() {
        return this.ownerDocument.createTextNode(this.data);
      }
      /**
       * Breaks Text node into two nodes at the specified offset, keeping both nodes in the tree as siblings.
       * @see https://developer.mozilla.org/en-US/docs/Web/API/Text/splitText
       * @param offset number position to split text at.
       * @return Text Node after the offset.
       */


      splitText(offset) {
        const remainderTextNode = new Text(this.data.slice(offset, this.data.length), this.ownerDocument);
        const parentNode = this.parentNode;
        this.nodeValue = this.data.slice(0, offset);

        if (parentNode !== null) {
          // When this node is attached to the DOM, the remainder text needs to be inserted directly after.
          const parentChildNodes = parentNode.childNodes;
          const insertBeforePosition = parentChildNodes.indexOf(this) + 1;
          const insertBeforeNode = parentChildNodes.length >= insertBeforePosition ? parentChildNodes[insertBeforePosition] : null;
          return parentNode.insertBefore(remainderTextNode, insertBeforeNode);
        }

        return remainderTextNode;
      }

    }

    /**
     * Copyright 2018 The AMP HTML Authors. All Rights Reserved.
     *
     * Licensed under the Apache License, Version 2.0 (the "License");
     * you may not use this file except in compliance with the License.
     * You may obtain a copy of the License at
     *
     *      http://www.apache.org/licenses/LICENSE-2.0
     *
     * Unless required by applicable law or agreed to in writing, software
     * distributed under the License is distributed on an "AS-IS" BASIS,
     * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
     * See the License for the specific language governing permissions and
     * limitations under the License.
     */
    class DocumentFragment extends ParentNode {
      constructor(ownerDocument, overrideIndex) {
        super(11
        /* DOCUMENT_FRAGMENT_NODE */
        , '#document-fragment', ownerDocument, overrideIndex);
        this[8
        /* creationFormat */
        ] = [this[7
        /* index */
        ], 11
        /* DOCUMENT_FRAGMENT_NODE */
        , store$1(this.nodeName), 0, 0];
      }
      /**
       * @param deep boolean determines if the clone should include a recursive copy of all childNodes.
       * @return DocumentFragment containing childNode clones of the DocumentFragment requested to be cloned.
       */


      cloneNode(deep = false) {
        const clone = this.ownerDocument.createDocumentFragment();

        if (deep) {
          this.childNodes.forEach(child => clone.appendChild(child.cloneNode(deep)));
        }

        return clone;
      }

    }

    /**
     * Copyright 2018 The AMP HTML Authors. All Rights Reserved.
     *
     * Licensed under the Apache License, Version 2.0 (the "License");
     * you may not use this file except in compliance with the License.
     * You may obtain a copy of the License at
     *
     *      http://www.apache.org/licenses/LICENSE-2.0
     *
     * Unless required by applicable law or agreed to in writing, software
     * distributed under the License is distributed on an "AS-IS" BASIS,
     * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
     * See the License for the specific language governing permissions and
     * limitations under the License.
     */
    /**
     * When an event is dispatched from the main thread, it needs to be propagated in the worker thread.
     * Propagate adds an event listener to the worker global scope and uses the WorkerDOM Node.dispatchEvent
     * method to dispatch the transfered event in the worker thread.
     */

    function propagate$1(global) {
      const document = global.document;

      if (!document.addGlobalEventListener) {
        return;
      }

      document.addGlobalEventListener('message', ({
        data
      }) => {
        if (data[12
        /* type */
        ] !== 4
        /* SYNC */
        ) {
          return;
        }

        const sync = data[40
        /* sync */
        ];
        const node = get(sync[7
        /* index */
        ]);

        if (node) {
          node.ownerDocument[58
          /* allowTransfer */
          ] = false; // Modify the private backing ivar of `value` property to avoid mutation/sync cycle.

          node.value = sync[21
          /* value */
          ];
          node.ownerDocument[58
          /* allowTransfer */
          ] = true;
        }
      });
    }

    /**
     * Copyright 2018 The AMP HTML Authors. All Rights Reserved.
     *
     * Licensed under the Apache License, Version 2.0 (the "License");
     * you may not use this file except in compliance with the License.
     * You may obtain a copy of the License at
     *
     *      http://www.apache.org/licenses/LICENSE-2.0
     *
     * Unless required by applicable law or agreed to in writing, software
     * distributed under the License is distributed on an "AS-IS" BASIS,
     * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
     * See the License for the specific language governing permissions and
     * limitations under the License.
     */
    function propagate(global) {
      const document = global.document;

      if (!document.addGlobalEventListener) {
        return;
      }

      document.addGlobalEventListener('message', ({
        data
      }) => {
        if (data[12
        /* type */
        ] !== 5
        /* RESIZE */
        ) {
          return;
        }

        const sync = data[40
        /* sync */
        ];

        if (sync) {
          global.innerWidth = sync[0];
          global.innerHeight = sync[1];
        }
      });
    }

    /**
     * Copyright 2018 The AMP HTML Authors. All Rights Reserved.
     *
     * Licensed under the Apache License, Version 2.0 (the "License");
     * you may not use this file except in compliance with the License.
     * You may obtain a copy of the License at
     *
     *      http://www.apache.org/licenses/LICENSE-2.0
     *
     * Unless required by applicable law or agreed to in writing, software
     * distributed under the License is distributed on an "AS-IS" BASIS,
     * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
     * See the License for the specific language governing permissions and
     * limitations under the License.
     */
    const DOCUMENT_NAME = '#document';
    class Document extends Element {
      // Internal variables.
      constructor(global) {
        super(9
        /* DOCUMENT_NODE */
        , DOCUMENT_NAME, HTML_NAMESPACE, null); // Element uppercases its nodeName, but Document doesn't.

        this.defaultView = void 0;
        this.documentElement = void 0;
        this.body = void 0;
        this.postMessage = void 0;
        this.addGlobalEventListener = void 0;
        this.removeGlobalEventListener = void 0;
        this[58
        /* allowTransfer */
        ] = true;
        this.nodeName = DOCUMENT_NAME;
        this.documentElement = this; // TODO(choumx): Should be the <html> element.

        this.defaultView = Object.assign(global, {
          document: this,
          addEventListener: this.addEventListener.bind(this),
          removeEventListener: this.removeEventListener.bind(this)
        });
      }
      /**
       * Observing the Document indicates it's attached to a main thread
       * version of the document.
       *
       * Each mutation needs to be transferred, synced values need to propagate.
       */


      [59
      /* observe */
      ]() {
        set(1
        /* Hydrating */
        );
        propagate$2(this.defaultView);
        propagate$1(this.defaultView);
        propagate(this.defaultView);
      }
      /**
       * Hydrate
       * @param strings
       * @param skeleton
       */


      [64
      /* hydrateNode */
      ](strings, skeleton) {
        switch (skeleton[0
        /* nodeType */
        ]) {
          case 3
          /* TEXT_NODE */
          :
            return new Text(strings[skeleton[5
            /* textContent */
            ]], this, skeleton[7
            /* index */
            ]);

          case 8
          /* COMMENT_NODE */
          :
            return new Comment(strings[skeleton[5
            /* textContent */
            ]], this, skeleton[7
            /* index */
            ]);

          default:
            const namespaceURI = strings[skeleton[6
            /* namespaceURI */
            ]] || HTML_NAMESPACE;
            const localName = strings[skeleton[1
            /* localOrNodeName */
            ]];
            const constructor = NS_NAME_TO_CLASS[`${namespaceURI}:${localName}`] || HTMLElement;
            const node = new constructor(1
            /* ELEMENT_NODE */
            , localName, namespaceURI, this, skeleton[7
            /* index */
            ]);
            (skeleton[2
            /* attributes */
            ] || []).forEach(attribute => // AttributeNamespaceURI = strings[attribute[0]] !== 'null' ? strings[attribute[0]] : HTML_NAMESPACE
            node.setAttributeNS(strings[attribute[0]] !== 'null' ? strings[attribute[0]] : HTML_NAMESPACE, strings[attribute[1]], strings[attribute[2]]));
            (skeleton[4
            /* childNodes */
            ] || []).forEach(child => node.appendChild(this[64
            /* hydrateNode */
            ](strings, child)));
            return node;
        }
      }

      createElement(name) {
        return this.createElementNS(HTML_NAMESPACE, toLower(name));
      }

      createElementNS(namespaceURI, localName) {
        const constructor = NS_NAME_TO_CLASS[`${namespaceURI}:${localName}`] || HTMLElement;
        return new constructor(1
        /* ELEMENT_NODE */
        , localName, namespaceURI, this);
      }
      /**
       * Note: Unlike DOM, Event subclasses (e.g. MouseEvent) are not instantiated based on `type`.
       * @param type
       */


      createEvent(type) {
        return new Event(type, {
          bubbles: false,
          cancelable: false
        });
      }

      createTextNode(text) {
        return new Text(text, this);
      }

      createComment(text) {
        return new Comment(text, this);
      }

      createDocumentFragment() {
        return new DocumentFragment(this);
      }
      /**
       * @see https://developer.mozilla.org/en-US/docs/Web/API/Document/getElementById
       * @return Element with matching id attribute.
       */


      getElementById(id) {
        return matchChildElement(this.body, element => element.id === id);
      }

    }

    /**
     * Copyright 2019 The AMP HTML Authors. All Rights Reserved.
     *
     * Licensed under the Apache License, Version 2.0 (the "License");
     * you may not use this file except in compliance with the License.
     * You may obtain a copy of the License at
     *
     *      http://www.apache.org/licenses/LICENSE-2.0
     *
     * Unless required by applicable law or agreed to in writing, software
     * distributed under the License is distributed on an "AS-IS" BASIS,
     * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
     * See the License for the specific language governing permissions and
     * limitations under the License.
     */
    /**
     * @param document
     * @param location
     * @param data
     */

    function createStorage(document, location, data) {
      const storage = Object.assign(Object.create(null), data); // Define properties on a prototype-less object instead of a class so that
      // it behaves more like normal objects, e.g. bracket notation and JSON.stringify.

      const define = Object.defineProperty;
      define(storage, 'length', {
        get() {
          return Object.keys(this).length;
        }

      });
      define(storage, 'key', {
        value(n) {
          const keys = Object.keys(this);
          return n >= 0 && n < keys.length ? keys[n] : null;
        }

      });
      define(storage, 'getItem', {
        value(key) {
          const value = this[key];
          return value ? value : null;
        }

      });
      define(storage, 'setItem', {
        value(key, value) {
          const stringValue = String(value);
          this[key] = stringValue;
          transfer(document, [12
          /* STORAGE */
          , 2
          /* SET */
          , location, store$1(key), store$1(stringValue)]);
        }

      });
      define(storage, 'removeItem', {
        value(key) {
          delete this[key];
          transfer(document, [12
          /* STORAGE */
          , 2
          /* SET */
          , location, store$1(key), 0 // value == 0 represents deletion.
          ]);
        }

      });
      define(storage, 'clear', {
        value() {
          Object.keys(this).forEach(key => {
            delete this[key];
          });
          transfer(document, [12
          /* STORAGE */
          , 2
          /* SET */
          , location, 0, 0 // value == 0 represents deletion.
          ]);
        }

      });
      return storage;
    }

    /**
     * Copyright 2021 The AMP HTML Authors. All Rights Reserved.
     *
     * Licensed under the Apache License, Version 2.0 (the "License");
     * you may not use this file except in compliance with the License.
     * You may obtain a copy of the License at
     *
     *      http://www.apache.org/licenses/LICENSE-2.0
     *
     * Unless required by applicable law or agreed to in writing, software
     * distributed under the License is distributed on an "AS-IS" BASIS,
     * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
     * See the License for the specific language governing permissions and
     * limitations under the License.
     */
    function initializeStorage(document, localStorageInit, sessionStorageInit) {
      const window = document.defaultView;

      if (localStorageInit.storage) {
        window.localStorage = createStorage(document, 0
        /* Local */
        , localStorageInit.storage);
      } else {
        console.warn(localStorageInit.errorMsg);
      }

      if (sessionStorageInit.storage) {
        window.sessionStorage = createStorage(document, 1
        /* Session */
        , sessionStorageInit.storage);
      } else {
        console.warn(sessionStorageInit.errorMsg);
      }
    }

    /**
     * Copyright 2018 The AMP HTML Authors. All Rights Reserved.
     *
     * Licensed under the Apache License, Version 2.0 (the "License");
     * you may not use this file except in compliance with the License.
     * You may obtain a copy of the License at
     *
     *      http://www.apache.org/licenses/LICENSE-2.0
     *
     * Unless required by applicable law or agreed to in writing, software
     * distributed under the License is distributed on an "AS-IS" BASIS,
     * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
     * See the License for the specific language governing permissions and
     * limitations under the License.
     */
    function initialize(document, strings, hydrateableNode, cssKeys, globalEventHandlerKeys, [innerWidth, innerHeight], localStorageInit, sessionStorageInit) {
      appendKeys(cssKeys);
      appendGlobalEventProperties(globalEventHandlerKeys);
      strings.forEach(store$1);
      (hydrateableNode[4
      /* childNodes */
      ] || []).forEach(child => document.body.appendChild(document[64
      /* hydrateNode */
      ](strings, child)));
      const window = document.defaultView;
      window.innerWidth = innerWidth;
      window.innerHeight = innerHeight;
      initializeStorage(document, localStorageInit, sessionStorageInit);
    }

    /**
     * Copyright 2020 The AMP HTML Authors. All Rights Reserved.
     *
     * Licensed under the Apache License, Version 2.0 (the "License");
     * you may not use this file except in compliance with the License.
     * You may obtain a copy of the License at
     *
     *      http://www.apache.org/licenses/LICENSE-2.0
     *
     * Unless required by applicable law or agreed to in writing, software
     * distributed under the License is distributed on an "AS-IS" BASIS,
     * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
     * See the License for the specific language governing permissions and
     * limitations under the License.
     */
    const frameDuration = 1000 / 60;
    let last = 0;
    let id = 0;
    let queue = [];
    /**
     * Schedules the accumulated callbacks to be fired 16ms after the last round.
     */

    function scheduleNext() {
      const now = Date.now();
      const next = Math.round(Math.max(0, frameDuration - (Date.now() - last)));
      last = now + next;
      setTimeout(function () {
        var cp = queue.slice(0); // Clear queue here to prevent
        // callbacks from appending listeners
        // to the current frame's queue

        queue.length = 0;

        for (var i = 0; i < cp.length; i++) {
          if (cp[i].cancelled) {
            continue;
          }

          try {
            cp[i].callback(last);
          } catch (e) {
            setTimeout(function () {
              throw e;
            }, 0);
          }
        }
      }, next);
    }

    function rafPolyfill(callback) {
      if (queue.length === 0) {
        scheduleNext();
      }

      if (id === Number.MAX_SAFE_INTEGER) {
        id = 0;
      }

      queue.push({
        handle: ++id,
        callback,
        cancelled: false
      });
      return id;
    }
    function cafPolyfill(handle) {
      for (let i = 0; i < queue.length; i++) {
        if (queue[i].handle === handle) {
          queue[i].cancelled = true;
          return;
        }
      }
    }

    /**
     * Copyright 2018 The AMP HTML Authors. All Rights Reserved.
     *
     * Licensed under the Apache License, Version 2.0 (the "License");
     * you may not use this file except in compliance with the License.
     * You may obtain a copy of the License at
     *
     *      http://www.apache.org/licenses/LICENSE-2.0
     *
     * Unless required by applicable law or agreed to in writing, software
     * distributed under the License is distributed on an "AS-IS" BASIS,
     * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
     * See the License for the specific language governing permissions and
     * limitations under the License.
     */
    class SVGElement extends Element {
      constructor(nodeType, localName, namespaceURI, ownerDocument) {
        super(nodeType, localName, SVG_NAMESPACE, ownerDocument); // Element uppercases its nodeName, but SVG elements don't.

        this.nodeName = localName;
      }

    }
    registerSubclass('svg', SVGElement, SVG_NAMESPACE);

    /**
     * Copyright 2019 The AMP HTML Authors. All Rights Reserved.
     *
     * Licensed under the Apache License, Version 2.0 (the "License");
     * you may not use this file except in compliance with the License.
     * You may obtain a copy of the License at
     *
     *      http://www.apache.org/licenses/LICENSE-2.0
     *
     * Unless required by applicable law or agreed to in writing, software
     * distributed under the License is distributed on an "AS-IS" BASIS,
     * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
     * See the License for the specific language governing permissions and
     * limitations under the License.
     */
    function wrap(target, func) {
      return function () {
        return execute(target, Promise.resolve(func.apply(null, arguments)));
      };
    }

    function execute(target, promise) {
      // Start the task.
      transfer(target.ownerDocument, [6
      /* LONG_TASK_START */
      , target[7
      /* index */
      ]]);
      return promise.then(result => {
        // Complete the task.
        transfer(target.ownerDocument, [7
        /* LONG_TASK_END */
        , target[7
        /* index */
        ]]);
        return result;
      }, reason => {
        // Complete the task.
        transfer(target.ownerDocument, [7
        /* LONG_TASK_END */
        , target[7
        /* index */
        ]]);
        throw reason;
      });
    }

    /**
     * Copyright 2018 The AMP HTML Authors. All Rights Reserved.
     *
     * Licensed under the Apache License, Version 2.0 (the "License");
     * you may not use this file except in compliance with the License.
     * You may obtain a copy of the License at
     *
     *      http://www.apache.org/licenses/LICENSE-2.0
     *
     * Unless required by applicable law or agreed to in writing, software
     * distributed under the License is distributed on an "AS-IS" BASIS,
     * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
     * See the License for the specific language governing permissions and
     * limitations under the License.
     */
    const globalScope = {
      innerWidth: 0,
      innerHeight: 0,
      CharacterData,
      Comment,
      Document,
      DocumentFragment,
      DOMTokenList,
      Element,
      HTMLAnchorElement,
      HTMLButtonElement,
      HTMLCanvasElement,
      HTMLDataElement,
      HTMLDataListElement,
      HTMLElement,
      HTMLEmbedElement,
      HTMLFieldSetElement,
      HTMLFormElement,
      HTMLIFrameElement,
      HTMLImageElement,
      HTMLInputElement,
      HTMLLabelElement,
      HTMLLinkElement,
      HTMLMapElement,
      HTMLMeterElement,
      HTMLModElement,
      HTMLOListElement,
      HTMLOptionElement,
      HTMLProgressElement,
      HTMLQuoteElement,
      HTMLScriptElement,
      HTMLSelectElement,
      HTMLSourceElement,
      HTMLStyleElement,
      HTMLTableCellElement,
      HTMLTableColElement,
      HTMLTableElement,
      HTMLTableRowElement,
      HTMLTableSectionElement,
      HTMLTimeElement,
      SVGElement,
      Text,
      Event: Event$1,
      MutationObserver,
      requestAnimationFrame: self.requestAnimationFrame || rafPolyfill,
      cancelAnimationFrame: self.cancelAnimationFrame || cafPolyfill
    };

    const noop = () => void 0; // WorkerDOM.Document.defaultView ends up being the window object.
    // React requires the classes to exist off the window object for instanceof checks.


    const workerDOM = function (postMessage, addEventListener, removeEventListener) {
      const document = new Document(globalScope); // TODO(choumx): Avoid polluting Document's public API.

      document.postMessage = postMessage;
      document.addGlobalEventListener = addEventListener;
      document.removeGlobalEventListener = removeEventListener;
      document.isConnected = true;
      document.appendChild(document.body = document.createElement('body')); // TODO(choumx): Remove once defaultView contains all native worker globals.
      // Canvas's use of native OffscreenCanvas checks the existence of the property
      // on the WorkerDOMGlobalScope.

      globalScope.OffscreenCanvas = self['OffscreenCanvas'];
      globalScope.ImageBitmap = self['ImageBitmap'];
      return document.defaultView;
    }(postMessage.bind(self) || noop, addEventListener.bind(self) || noop, removeEventListener.bind(self) || noop); // Modify global scope by removing disallowed properties and wrapping `fetch()`.

    (function (global) {
      deleteGlobals(global); // Wrap global.fetch() with our longTask API.

      const originalFetch = global['fetch'];

      if (originalFetch) {
        try {
          Object.defineProperty(global, 'fetch', {
            enumerable: true,
            writable: true,
            configurable: true,
            value: wrap(workerDOM.document, originalFetch.bind(global))
          });
        } catch (e) {
          console.warn(e);
        }
      }
    })(self); // Offer APIs like AMP.setState() on the global scope.


    self.AMP = new AMP(workerDOM.document); // Allows for function invocation

    self.exportFunction = exportFunction;
    addEventListener('message', evt => callFunctionMessageHandler(evt, workerDOM.document));
    const hydrate = initialize;

    exports.hydrate = hydrate;
    exports.workerDOM = workerDOM;

    Object.defineProperty(exports, '__esModule', { value: true });

    return exports;

}({}));
//# sourceMappingURL=worker.mjs.map
